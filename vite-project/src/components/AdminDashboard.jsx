import { useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabase";
import { getReportPhoto } from "../lib/reports";

const statuses = ["Pending", "In Progress", "Resolved"];

export default function AdminDashboard({
  student,
  onBack,
  onLogout,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [filter, setFilter] = useState("All");
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
      setMessage("");
      setIsAdmin(false);
      setReports([]);

      try {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        // Check whether the signed-in account is an admin.
        const { data: membership, error: membershipError } =
          await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", student.id)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (cancelled) return;

        if (!membership) return;

        setIsAdmin(true);

        // Include the stored image path.
        const { data, error: reportsError } = await supabase
          .from("reports")
          .select(
            "id, title, category, location, description, status, created_at, photo_path"
          )
          .order("created_at", { ascending: false });

        if (reportsError) throw reportsError;
        if (cancelled) return;

        // Generate temporary viewing links for private images.
        const reportsWithPhotos = await Promise.all(
          data.map(async (report) => {
            const photo = await getReportPhoto(report.photo_path);

            return {
              ...report,
              ...photo,
            };
          })
        );

        if (!cancelled) {
          setReports(reportsWithPhotos);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error.message || "Could not load the dashboard."
          );
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
        setError(
          error.message || "Could not update the report."
        );
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
                "Photo could not load. Click Refresh Reports to try again.",
            }
          : report
      )
    );
  }

  const visibleReports = reports.filter(
    (report) => filter === "All" || report.status === filter
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
        <p role="status">
          Checking access and loading reports...
        </p>
      ) : error && !isAdmin ? (
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
                <p>
                  {status === "All" ? "Total Reports" : status}
                </p>

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

          <div className="admin-toolbar">
            <div>
              <label htmlFor="status-filter">
                Filter by status:{" "}
              </label>

              <select
                id="status-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                {["All", ...statuses].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

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
              <p>
                {error
                  ? "Reports could not be loaded. Click Refresh Reports to retry."
                  : "No reports match this filter."}
              </p>
            </div>
          ) : (
            <div className="reports-grid">
              {visibleReports.map((report) => (
                <article
                  className="saved-report"
                  key={report.id}
                >
                  <div className="report-top">
                    <span className="report-category">
                      {report.category}
                    </span>

                    <span className="status">
                      {report.status}
                    </span>
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
                          onError={() =>
                            handlePhotoError(report.id)
                          }
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
                        updateStatus(
                          report.id,
                          event.target.value
                        )
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
          )}
        </>
      )}
    </main>
  );
}