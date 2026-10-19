import { useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabase";
import { getReportPhoto } from "../lib/reports";

const statuses = ["Pending", "In Progress", "Resolved"];
const PAGE_SIZE = 6;

export default function AdminDashboard({ student, onBack, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  const savingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      setLoadFailed(false);
      setMessage("");
      setIsAdmin(false);
      setReports([]);

      try {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const { data: membership, error: membershipError } =
          await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", student.id)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (cancelled || !membership) return;

        setIsAdmin(true);

        const { data, error: reportsError } = await supabase
          .from("reports")
          .select(
            "id, title, category, location, description, status, created_at, photo_path"
          )
          .order("created_at", { ascending: false });

        if (reportsError) throw reportsError;
        if (cancelled) return;

        const reportsWithPhotos = await Promise.all(
          data.map(async (report) => ({
            ...report,
            ...(await getReportPhoto(report.photo_path)),
          }))
        );

        if (!cancelled) {
          setReports(reportsWithPhotos);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadFailed(true);
          setError(error.message || "Could not load the dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [student.id, reload]);

  async function updateStatus(reportId, status) {
    if (
      !supabase ||
      !isAdmin ||
      savingRef.current ||
      !statuses.includes(status)
    ) {
      return;
    }

    savingRef.current = true;
    setSavingId(reportId);
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", reportId)
        .select("id, status")
        .single();

      if (error) throw error;
      if (!mountedRef.current) return;

      setReports((previous) =>
        previous.map((report) =>
          report.id === data.id
            ? { ...report, status: data.status }
            : report
        )
      );

      setMessage("Report status updated successfully.");
    } catch (error) {
      if (mountedRef.current) {
        setError(error.message || "Could not update the report.");
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSavingId(null);
      }
    }
  }

  function refreshReports() {
    if (savingRef.current) return;

    setReload((previous) => previous + 1);
  }

  function handlePhotoError(reportId) {
    setReports((previous) =>
      previous.map((report) =>
        report.id === reportId
          ? {
              ...report,
              photoUrl: null,
              photoError:
                "Photo unavailable. Click Refresh Reports to try again.",
            }
          : report
      )
    );
  }

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSort("newest");
    setPage(1);
  }

  const categoryOptions = [
    ...new Set(reports.map((report) => report.category)),
  ].filter(Boolean).sort();

  const query = search.trim().toLowerCase();

  const filteredReports = reports
    .filter((report) => {
      const text = [
        report.title,
        report.description,
        report.location,
        report.category,
      ]
        .join(" ")
        .toLowerCase();

      return (
        text.includes(query) &&
        (statusFilter === "All" || report.status === statusFilter) &&
        (categoryFilter === "All" ||
          report.category === categoryFilter)
      );
    })
    .sort((first, second) => {
      const difference =
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime();

      return sort === "newest" ? difference : -difference;
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visibleReports = filteredReports.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <main className="section container">
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">UNIFIX STAFF AREA</span>
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={onBack}
            disabled={Boolean(savingId)}
          >
            Back to Homepage
          </button>

          <button
            type="button"
            className="button"
            onClick={onLogout}
            disabled={Boolean(savingId)}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p role="status">Checking access and loading reports...</p>
      ) : loadFailed ? (
        <button
          type="button"
          className="button"
          onClick={refreshReports}
        >
          Try Again
        </button>
      ) : !isAdmin ? (
        <div className="empty-state">
          <h2>Staff access required</h2>
          <p>Your account has not been assigned admin access.</p>
        </div>
      ) : (
        <>
          <div className="admin-stats">
            {["All", ...statuses].map((status) => (
              <div className="saved-report" key={status}>
                <p>{status === "All" ? "Total Reports" : status}</p>
                <strong>
                  {status === "All"
                    ? reports.length
                    : reports.filter(
                        (report) => report.status === status
                      ).length}
                </strong>
              </div>
            ))}
          </div>

          <div className="report-filters">
            <div className="report-filter-field">
              <label htmlFor="admin-search">Search reports</label>
              <input
                id="admin-search"
                type="search"
                placeholder="Search title, location, or description..."
                value={search}
                onChange={(event) =>
                  changeFilter(setSearch, event.target.value)
                }
              />
            </div>

            <div className="report-filter-field">
              <label htmlFor="admin-category">Category</label>
              <select
                id="admin-category"
                value={categoryFilter}
                onChange={(event) =>
                  changeFilter(setCategoryFilter, event.target.value)
                }
              >
                <option value="All">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-filter-field">
              <label htmlFor="admin-status">Status</label>
              <select
                id="admin-status"
                value={statusFilter}
                onChange={(event) =>
                  changeFilter(setStatusFilter, event.target.value)
                }
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-filter-field">
              <label htmlFor="admin-sort">Sort by</label>
              <select
                id="admin-sort"
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

          <div className="admin-toolbar admin-results-toolbar">
            <p className="report-results-count" role="status">
              {filteredReports.length === 0
                ? "No matching reports."
                : `Showing ${startIndex + 1}–${
                    startIndex + visibleReports.length
                  } of ${filteredReports.length} matching reports`}
            </p>

            <button
              type="button"
              className="button button-outline"
              disabled={Boolean(savingId)}
              onClick={refreshReports}
            >
              Refresh Reports
            </button>
          </div>

          {visibleReports.length === 0 ? (
            <div className="empty-state">
              <h3>
                {reports.length === 0
                  ? "No reports yet"
                  : "No matching reports"}
              </h3>

              <p>
                {reports.length === 0
                  ? "Submitted student reports will appear here."
                  : "Try another search or clear your filters."}
              </p>

              {reports.length > 0 && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={resetFilters}
                >
                  Clear Filters
                </button>
              )}
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
                      <figure className="admin-report-photo">
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
                            onError={() => handlePhotoError(report.id)}
                          />
                        </a>

                        <figcaption>
                          Click the photo to open the full image.
                        </figcaption>
                      </figure>
                    )}

                    {report.photoError && (
                      <p className="photo-error" role="status">
                        {report.photoError}
                      </p>
                    )}

                    <div className="report-meta">
                      <span>📍 {report.location}</span>
                      <time dateTime={report.created_at}>
                        {new Date(
                          report.created_at
                        ).toLocaleDateString()}
                      </time>
                    </div>

                    <div className="admin-status-control">
                      <label htmlFor={`status-${report.id}`}>
                        Update status
                      </label>

                      <select
                        id={`status-${report.id}`}
                        value={report.status}
                        disabled={Boolean(savingId)}
                        onChange={(event) =>
                          updateStatus(report.id, event.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {savingId === report.id && (
                        <small role="status">Saving...</small>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="report-pagination"
                  aria-label="Admin report pages"
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
        </>
      )}
    </main>
  );
}