import { supabase } from "./supabase";

const PHOTO_BUCKET = "report-photos";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const PHOTO_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const REPORT_COLUMNS =
  "id, title, category, location, description, status, created_at, photo_path";

// Create a temporary viewing link.
// A photo error must not hide an otherwise valid report.
export async function getReportPhoto(photoPath) {
  if (!photoPath) {
    return { photoUrl: null, photoError: null };
  }

  try {
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(photoPath, 3600);

    if (error) throw error;

    return {
      photoUrl: data.signedUrl,
      photoError: null,
    };
  } catch {
    return {
      photoUrl: null,
      photoError: "Photo unavailable. Refresh to try again.",
    };
  }
}

async function formatReport(report) {
  const photo = await getReportPhoto(report.photo_path);

  return {
    id: report.id,
    title: report.title,
    category: report.category,
    location: report.location,
    description: report.description,
    status: report.status,
    createdAt: report.created_at,
    photoPath: report.photo_path,
    ...photo,
  };
}

export async function getReports(userId) {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(data.map(formatReport));
}

export async function createReport(userId, form, photo = null) {
  let photoPath = null;

  if (photo) {
    const extension = PHOTO_EXTENSIONS[photo.type];

    if (!extension) {
      throw new Error("Choose a JPG, PNG, or WebP image.");
    }

    if (photo.size === 0 || photo.size > MAX_PHOTO_SIZE) {
      throw new Error("Choose a non-empty photo no larger than 5 MB.");
    }

    photoPath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }
  }

  let savedReport;

  try {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        title: form.title,
        category: form.category,
        location: form.location,
        description: form.description,
        photo_path: photoPath,
      })
      .select(REPORT_COLUMNS)
      .single();

    if (error) throw error;

    savedReport = data;
  } catch (error) {
    // Uploads and database inserts are separate operations.
    // Try to remove an unattached image if saving fails.
    if (photoPath) {
      try {
        const { error: cleanupError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove([photoPath]);

        if (cleanupError) {
          console.warn("Could not clean up the unattached photo.");
        }
      } catch {
        console.warn("Could not clean up the unattached photo.");
      }
    }

    throw error;
  }

  return formatReport(savedReport);
}