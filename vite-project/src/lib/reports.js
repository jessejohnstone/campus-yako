import { supabase } from "./supabase";

// Convert database fields to the format Reports.jsx already uses.
function formatReport(report) {
  return {
    id: report.id,
    title: report.title,
    category: report.category,
    location: report.location,
    description: report.description,
    status: report.status,
    createdAt: report.created_at,
  };
}

export async function getReports(userId) {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, title, category, location, description, status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(formatReport);
}

export async function createReport(userId, form) {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      title: form.title,
      category: form.category,
      location: form.location,
      description: form.description,
    })
    .select(
      "id, title, category, location, description, status, created_at"
    )
    .single();

  if (error) throw error;

  return formatReport(data);
}