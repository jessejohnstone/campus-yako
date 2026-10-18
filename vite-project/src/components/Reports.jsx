export default function Reports({ reports }) {
  return (
    <section className="section container" id="reports">
      <div className="section-heading">
        <span className="eyebrow">YOUR CAMPUS REPORTS</span>
        <h2>My Reports</h2>
<p>Track the issues you have reported on campus.</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">📋</span>
          <h3>No reports yet</h3>
          <p>Be the first to highlight something that needs fixing.</p>

          <a href="#report" className="text-link">
            Create your first report →
          </a>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <article className="saved-report" key={report.id}>
              <div className="report-top">
                <span className="report-category">{report.category}</span>
                <span className="status">{report.status}</span>
              </div>

              <h3>{report.title}</h3>
              <p>{report.description}</p>

              <div className="report-meta">
                <span>📍 {report.location}</span>

                <time dateTime={report.createdAt}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}