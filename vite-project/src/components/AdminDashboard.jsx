import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const statuses = ["Pending", "In Progress", "Resolved"];

export default function AdminDashboard({ student, onBack, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      setMessage("");
      setIsAdmin(false);
      setReports([]);

      try {
        // Check membership before requesting reports.
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

        const { data, error: reportsError } = await supabase
          .from("reports")
          .select(
            "id, title, category, location, description, status, created_at"
          )
          .order("created_at", { ascending: false });

        if (reportsError) throw reportsError;

        if (!cancelled) {
          setReports(data);
        }
      } catch (error) {
        if (!cancelled) {
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
    if (savingId || !statuses.includes(status)) return;

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

      setReports((previous) =>
        previous.map((report) =>
          report.id === data.id
            ? { ...report, status: data.status }
            : report
        )
      );

      setMessage("Report status updated.");
    } catch (error) {
      setError(error.message || "Could not update the report.");
    } finally {
      setSavingId(null);
    }
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
          >
            Back to Homepage
          </button>

          <button
            type="button"
            className="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {loading ? (
        <p role="status">Checking access and loading reports...</p>
      ) : error && !isAdmin ? (
        <button
          type="button"
          className="button"
          onClick={() => setReload((value) => value + 1)}
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

          <div className="admin-toolbar">
            <div>
              <label htmlFor="status-filter">Filter by status: </label>

              <select
                id="status-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
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
              onClick={() => setReload((value) => value + 1)}
            >
              Refresh Reports
            </button>
          </div>

          {visibleReports.length === 0 ? (
            <div className="empty-state">
              <p>No reports to display.</p>
            </div>
          ) : (
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

                  <div className="report-meta">
                    <span>📍 {report.location}</span>

                    <time dateTime={report.created_at}>
                      {new Date(report.created_at).toLocaleDateString()}
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
          )}
        </>
      )}
    </main>
  );
}