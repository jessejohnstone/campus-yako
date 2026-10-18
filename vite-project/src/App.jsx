import { useEffect, useRef, useState } from "react";

import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { getReports, createReport } from "./lib/reports";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import HowItWorks from "./components/howItWork";
import ReportForm from "./components/ReportForm";
import Reports from "./components/Reports";
import Footer from "./components/Footer";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";

import "./App.css";

const emptyForm = {
  title: "",
  category: "",
  location: "",
  description: "",
};

export default function App() {
  // Authentication
  const [student, setStudent] = useState(null);
  const [authLoading, setAuthLoading] = useState(
    Boolean(isSupabaseConfigured && supabase)
  );
  const [authError, setAuthError] = useState("");

  // Dashboard navigation
  const [showAdmin, setShowAdmin] = useState(false);

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [reportsRefresh, setReportsRefresh] = useState(0);

  // Report form
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Changing this value resets the photo picker after saving.
  const [reportFormVersion, setReportFormVersion] = useState(0);

  // Track login destination and account changes.
  const loginDestination = useRef("student");
  const activeUserId = useRef(null);
  const accountVersion = useRef(0);
  const savingReport = useRef(false);

  const studentId = student?.id;

  // Listen for login, logout, and restored sessions.
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextStudent = session?.user ?? null;
      const nextId = nextStudent?.id ?? null;

      if (activeUserId.current !== nextId) {
        activeUserId.current = nextId;
        accountVersion.current += 1;

        setShowAdmin(
          Boolean(nextId) && loginDestination.current === "admin"
        );

        loginDestination.current = "student";

        // Clear information belonging to the previous account.
        setReports([]);
        setReportsLoading(Boolean(nextId));
        setReportsError("");
        setForm({ ...emptyForm });
        setMessage("");
        setSubmitting(false);
        setReportFormVersion((previous) => previous + 1);

        savingReport.current = false;
      }

      setStudent(nextStudent);
      setAuthLoading(false);
      setAuthError("");
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load the student's reports when displaying the homepage.
  useEffect(() => {
    if (!supabase || !studentId || showAdmin) return;

    let cancelled = false;
    const requestVersion = accountVersion.current;

    function isCurrentRequest() {
      return (
        !cancelled &&
        activeUserId.current === studentId &&
        accountVersion.current === requestVersion
      );
    }

    async function loadStudentReports() {
      setReportsLoading(true);
      setReportsError("");

      try {
        const savedReports = await getReports(studentId);

        if (isCurrentRequest()) {
          setReports(savedReports);
        }
      } catch (error) {
        if (isCurrentRequest()) {
          setReportsError(
            error.message || "Could not load your reports."
          );
        }
      } finally {
        if (isCurrentRequest()) {
          setReportsLoading(false);
        }
      }
    }

    loadStudentReports();

    return () => {
      cancelled = true;
    };
  }, [studentId, showAdmin, reportsRefresh]);

  async function handleLogout() {
    if (!supabase) return;

    setAuthError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // The authentication listener clears the account.
    } catch (error) {
      setAuthError(
        error.message || "Could not log out. Please try again."
      );
    }
  }

  function handleOpenAdmin() {
    setAuthError("");
    setShowAdmin(true);
  }

  function handleBackToHomepage() {
    setAuthError("");
    setReportsLoading(true);
    setShowAdmin(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleSelectCategory(category) {
    setForm((previous) => ({
      ...previous,
      category,
    }));

    setMessage("");
  }

  // Receive the optional photo from ReportForm.
  async function handleSubmit(event, photo = null) {
    event.preventDefault();

    if (
      !supabase ||
      !studentId ||
      savingReport.current ||
      reportsLoading
    ) {
      return;
    }

    const cleanedForm = {
      title: form.title.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
    };

    if (Object.values(cleanedForm).some((value) => !value)) {
      setMessage("Please complete every field.");
      return;
    }

    const submittingUserId = studentId;
    const submittingVersion = accountVersion.current;

    function isCurrentSession() {
      return (
        activeUserId.current === submittingUserId &&
        accountVersion.current === submittingVersion
      );
    }

    savingReport.current = true;
    setSubmitting(true);
    setMessage("");

    try {
      // Upload the photo and save the report.
      const savedReport = await createReport(
        submittingUserId,
        cleanedForm,
        photo
      );

      if (!isCurrentSession()) return;

      setReports((previous) => [
        savedReport,
        ...previous.filter(
          (report) => report.id !== savedReport.id
        ),
      ]);

      // Reset text fields and the photo picker after success.
      setForm({ ...emptyForm });
      setReportFormVersion((previous) => previous + 1);

      setMessage(
        savedReport.photoError
          ? "Report saved, but its photo preview is unavailable. Refresh to try again."
          : "Your report has been saved successfully."
      );
    } catch (error) {
      if (isCurrentSession()) {
        // Keep the form and photo available for retry.
        setMessage(
          error.message || "Could not save your report."
        );
      }
    } finally {
      if (isCurrentSession()) {
        savingReport.current = false;
        setSubmitting(false);
      }
    }
  }

  // Show a clear message instead of crashing when config is missing.
  if (!isSupabaseConfigured || !supabase) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="logo">
            UNI<span>FIX</span>
          </div>

          <h1>Configuration required</h1>

          <p role="alert">
            Supabase is not configured. Add VITE_SUPABASE_URL
            and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.
          </p>

          <p>
            For local development, restart Vite after saving
            .env.local. For Vercel, save the variables in the
            project settings and redeploy.
          </p>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="login-page">
        <p role="status">Loading your account...</p>
      </main>
    );
  }

  // Student and admin login options.
  if (!student) {
    return (
      <Login
        isSupabaseConfigured={isSupabaseConfigured}
        onLoginStart={(type) => {
          loginDestination.current = type;
        }}
        onLoginFailed={() => {
          loginDestination.current = "student";
        }}
      />
    );
  }

  // AdminDashboard checks staff membership.
  if (showAdmin) {
    return (
      <>
        {authError && (
          <p className="container" role="alert">
            {authError}
          </p>
        )}

        <AdminDashboard
          key={student.id}
          student={student}
          onBack={handleBackToHomepage}
          onLogout={handleLogout}
        />
      </>
    );
  }

  const fullName = student.user_metadata?.full_name;

  const studentName =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim()
      : "Student";

  return (
    <>
      <Navbar onLogout={handleLogout} />

      <main>
        {authError && (
          <p className="container" role="alert">
            {authError}
          </p>
        )}

        <section className="welcome-banner container">
          <span className="eyebrow">STUDENT HOMEPAGE</span>

          <h2>Welcome, {studentName}! 👋</h2>

          <p>What can we help you fix on campus today?</p>

          <button
            type="button"
            className="button button-outline"
            onClick={handleOpenAdmin}
            disabled={submitting}
          >
            Staff Dashboard →
          </button>
        </section>

        <Hero />

        <Categories onSelectCategory={handleSelectCategory} />

        <HowItWorks />

        <ReportForm
          key={`${student.id}-${reportFormVersion}`}
          form={form}
          message={message}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          reportsLoading={reportsLoading}
        />

        {reportsLoading ? (
          <section className="section container" id="reports">
            <p role="status">Loading your reports...</p>
          </section>
        ) : reportsError ? (
          <section className="section container" id="reports">
            <p role="alert">{reportsError}</p>

            <button
              type="button"
              className="button"
              onClick={() =>
                setReportsRefresh((previous) => previous + 1)
              }
            >
              Try Again
            </button>
          </section>
        ) : (
          <Reports reports={reports} />
        )}
      </main>

      <Footer />
    </>
  );
}