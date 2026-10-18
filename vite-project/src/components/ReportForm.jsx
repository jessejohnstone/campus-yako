import { useEffect, useRef, useState } from "react";
import { categories } from "../data/Categories.js";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ReportForm({
  form,
  message,
  onChange,
  onSubmit,
  submitting,
  reportsLoading,
}) {
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");

  // React hooks must be inside the component.
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const disabled = submitting || reportsLoading;

  // Create a preview and clean it up when the photo changes.
  useEffect(() => {
    if (!photo) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    // Keep the existing photo if the picker was cancelled.
    if (!file) return;

    setPhotoError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError(
        "This image format is not supported. Choose a JPG, PNG, or WebP photo."
      );
      return;
    }

    if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
      setPhotoError(
        "Choose a non-empty photo that is 5 MB or smaller."
      );
      return;
    }

    setPhoto(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (disabled || photoError) return;

    // Send the report and optional photo to App.jsx.
    onSubmit(event, photo);
  }

  return (
    <section className="section report-section" id="report">
      <div className="container report-layout">
        <div className="report-intro">
          <span className="eyebrow">
            LET’S IMPROVE CAMPUS LIFE
          </span>

          <h2>Something needs fixing?</h2>

          <p>
            Tell us what happened and where. A clear report makes
            the problem easier to understand.
          </p>

          <div className="info-note">
            <strong>Your reports</strong>

            <p>
              Reports are saved to your account so you can access
              them when you sign in on another device.
            </p>
          </div>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <h3>Report an issue</h3>

          <label htmlFor="title">Issue title</label>

          <input
            id="title"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Broken lights in Lecture Hall B"
            maxLength={120}
            disabled={disabled}
            required
          />

          <label htmlFor="category">Category</label>

          <select
            id="category"
            name="category"
            value={form.category}
            onChange={onChange}
            disabled={disabled}
            required
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option
                key={category.title}
                value={category.title}
              >
                {category.title}
              </option>
            ))}
          </select>

          <label htmlFor="location">Location</label>

          <input
            id="location"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="e.g. Science Block, second floor"
            maxLength={160}
            disabled={disabled}
            required
          />

          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Describe the problem..."
            rows={4}
            maxLength={2000}
            disabled={disabled}
            required
          />

          <div
            className="photo-upload"
            role="group"
            aria-labelledby="photo-label"
            aria-describedby="photo-help"
          >
            <span id="photo-label" className="photo-label">
              Add a photo of the damage (optional)
            </span>

            <p id="photo-help" className="photo-help">
              Take a picture or choose an existing photo.
              JPG, PNG, or WebP, up to 5 MB.
            </p>

            <div className="photo-actions">
              <button
                type="button"
                className="button"
                disabled={disabled}
                onClick={() =>
                  cameraInputRef.current?.click()
                }
              >
                📷 Take Photo
              </button>

              <button
                type="button"
                className="button button-outline"
                disabled={disabled}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                🖼️ Choose Photo
              </button>
            </div>

            {/* Request the rear camera on supported phones. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              disabled={disabled}
              aria-label="Take a photo of the damage"
              hidden
            />

            {/* Choose an image from the device. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={disabled}
              aria-label="Choose a photo of the damage"
              hidden
            />

            {photoError && (
              <div>
                <p className="photo-error" role="alert">
                  {photoError}
                </p>

                <button
                  type="button"
                  className="auth-toggle"
                  disabled={disabled}
                  onClick={() => setPhotoError("")}
                >
                  {photo
                    ? "Keep previous photo"
                    : "Continue without a photo"}
                </button>
              </div>
            )}

            {photo && previewUrl && (
              <figure className="photo-preview">
                <img
                  src={previewUrl}
                  alt="Preview of the campus damage"
                />

                <figcaption>
                  {photo.name} ·{" "}
                  {(photo.size / 1024 / 1024).toFixed(2)} MB
                </figcaption>

                <button
                  type="button"
                  className="button button-outline"
                  onClick={removePhoto}
                  disabled={disabled}
                >
                  Remove Photo
                </button>
              </figure>
            )}
          </div>

          <button
            type="submit"
            className="button"
            disabled={disabled || Boolean(photoError)}
          >
            {submitting
              ? "Saving Report..."
              : reportsLoading
                ? "Loading your reports..."
                : "Submit Report →"}
          </button>

          <p className="form-message" role="status">
            {message}
          </p>
        </form>
      </div>
    </section>
  );
}