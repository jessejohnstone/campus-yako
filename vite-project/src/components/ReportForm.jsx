import { categories } from "../data/Categories.js";



export default function ReportForm({
  form,
  message,
  onChange,
  onSubmit,
  submitting,
  reportsLoading,
}) {
  return (
    <section className="section report-section" id="report">
      <div className="container report-layout">
        <div className="report-intro">
          <span className="eyebrow">LET’S IMPROVE CAMPUS LIFE</span>

          <h2>Something needs fixing?</h2>

          <p>
            Tell us what happened and where. A clear report makes
            the problem easier to understand.
          </p>

            <div className="info-note">
        <strong>Your reports</strong>
           <p>
         Reports are saved to your account so you can access them
          when you sign in on another device.
         </p>
</div>
        </div>

        <form className="report-form" onSubmit={onSubmit}>
          <h3>Report an issue</h3>

          <label htmlFor="title">Issue title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Broken lights in Lecture Hall B"
            maxLength={120}
            required
          />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={onChange}
            required
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option key={category.title} value={category.title}>
                {category.title}
              </option>
            ))}

            <option value="Other">Other</option>
          </select>

          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="e.g. Science Block, second floor"
            maxLength={160}
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
            required
          />

         <button
  type="submit"
  className="button"
  disabled={submitting || reportsLoading}
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