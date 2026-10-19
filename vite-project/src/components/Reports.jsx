import { useState } from "react";
import { categories } from "../data/Categories.js";

const PAGE_SIZE = 6;
const statuses = ["Pending", "In Progress", "Resolved"];

export default function Reports({ reports }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Include categories from older reports too.
  const categoryOptions = [
    ...new Set([
      ...categories.map((item) => item.title),
      ...reports.map((report) => report.category),
    ]),
  ].filter(Boolean);

  const query = search.trim().toLowerCase();

  const filteredReports = reports
    .filter((report) => {
      const searchableText = [
        report.title,
        report.description,
        report.location,
        report.category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesCategory =
        category === "All" || report.category === category;
      const matchesStatus =
        status === "All" || report.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((first, second) => {
      const difference =
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime();

      return sort === "newest" ? difference : -difference;
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / PAGE_SIZE)
  );

  // Keep the displayed page valid when the report list changes.
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visibleReports = filteredReports.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSort("newest");
    setPage(1);
  }

  return (
    <section className="section container" id="reports">
      <div className="section-heading">
        <span className="eyebrow">YOUR CAMPUS REPORTS</span>
        <h2>My Reports</h2>
        <p>Search your reports and follow their progress.</p>
      </div>

      <div className="report-filters">
        <div className="report-filter-field">
          <label htmlFor="report-search">Search reports</label>
          <input
            id="report-search"
            type="search"
            placeholder="Search title, location, or description..."
            value={search}
            onChange={(event) =>
              changeFilter(setSearch, event.target.value)
            }
          />
        </div>

        <div className="report-filter-field">
          <label htmlFor="report-category-filter">Category</label>
          <select
            id="report-category-filter"
            value={category}
            onChange={(event) =>
              changeFilter(setCategory, event.target.value)
            }
          >
            <option value="All">All categories</option>

            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="report-filter-field">
          <label htmlFor="report-status-filter">Status</label>
          <select
            id="report-status-filter"
            value={status}
            onChange={(event) =>
              changeFilter(setStatus, event.target.value)
            }
          >
            <option value="All">All statuses</option>

            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="report-filter-field">
          <label htmlFor="report-sort">Sort by</label>
          <select
            id="report-sort"
            value={sort}
            onChange={(event) =>
              changeFilter(setSort, event.target.value)
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <button
          type="button"
          className="button button-outline"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      <p className="report-results-count" role="status">
        {filteredReports.length === 0
          ? "No matching reports."
          : `Showing ${startIndex + 1}–${
              startIndex + visibleReports.length
            } of ${filteredReports.length} reports`}
      </p>

      {reports.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">📋</span>
          <h3>No reports yet</h3>
          <p>Report something on campus that needs fixing.</p>

          <a href="#report" className="text-link">
            Create your first report →
          </a>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state">
          <h3>No matching reports</h3>
          <p>Try another search or clear your filters.</p>

          <button
            type="button"
            className="button button-outline"
            onClick={resetFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="reports-grid">
            {visibleReports.map((report) => (
              <article className="saved-report" key={report.id}>
                <div className="report-top">
                  <span className="report-category">
                    {report.category}
                  </span>

                  <span className="status">{report.status}</span>
                </div>

                <h3>{report.title}</h3>
                <p>{report.description}</p>

                {report.photoUrl && (
                  <a
                    href={report.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open attached photo for ${report.title}`}
                  >
                    <img
                      className="report-photo"
                      src={report.photoUrl}
                      alt={`Attached photo for ${report.title}`}
                      loading="lazy"
                    />
                  </a>
                )}

                {report.photoError && (
                  <p className="photo-error" role="status">
                    {report.photoError}
                  </p>
                )}

                <div className="report-meta">
                  <span>📍 {report.location}</span>

                  <time dateTime={report.createdAt}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="report-pagination"
              aria-label="My Reports pages"
            >
              <button
                type="button"
                className="button button-outline"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ← Previous
              </button>

              <span aria-live="polite">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="button button-outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}