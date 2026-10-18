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
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
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

  // Track login destination and account changes.
  const loginDestination = useRef("student");
  const activeUserId = useRef(null);
  const accountVersion = useRef(0);
  const savingReport = useRef(false);

  const studentId = student?.id;

  // Listen for login, logout, and restored sessions.
  useEffect(() => {
    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextStudent = session?.user ?? null;
      const nextId = nextStudent?.id ?? null;

      if (activeUserId.current !== nextId) {
        activeUserId.current = nextId;
        accountVersion.current += 1;

        // Open the selected page after login.
        setShowAdmin(
          Boolean(nextId) && loginDestination.current === "admin"
        );

        loginDestination.current = "student";

        // Clear data from the previous account.
        setReports([]);
        setReportsLoading(Boolean(nextId));
        setReportsError("");
        setForm({ ...emptyForm });
        setMessage("");
        setSubmitting(false);

        savingReport.current = false;
      }

      setStudent(nextStudent);
      setAuthLoading(false);
      setAuthError("");
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load the student's reports on the homepage.
  useEffect(() => {
    if (!studentId || showAdmin) return;

    let cancelled = false;
    const requestVersion = accountVersion.current;

    async function loadStudentReports() {
      setReportsLoading(true);
      setReportsError("");

      try {
        const savedReports = await getReports(studentId);

        if (
          !cancelled &&
          activeUserId.current === studentId &&
          accountVersion.current === requestVersion
        ) {
          setReports(savedReports);
        }
      } catch (error) {
        if (
          !cancelled &&
          activeUserId.current === studentId &&
          accountVersion.current === requestVersion
        ) {
          setReportsError(
            error.message || "Could not load your reports."
          );
        }
      } finally {
        if (
          !cancelled &&
          activeUserId.current === studentId &&
          accountVersion.current === requestVersion
        ) {
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
    setAuthError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // The auth listener clears the account and shows Login.
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!studentId || savingReport.current || reportsLoading) {
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

    savingReport.current = true;
    setSubmitting(true);
    setMessage("");

    try {
      const savedReport = await createReport(
        submittingUserId,
        cleanedForm
      );

      if (
        activeUserId.current !== submittingUserId ||
        accountVersion.current !== submittingVersion
      ) {
        return;
      }

      setReports((previous) => [
        savedReport,
        ...previous.filter((report) => report.id !== savedReport.id),
      ]);

      setForm({ ...emptyForm });
      setMessage("Your report has been saved successfully.");
    } catch (error) {
      if (
        activeUserId.current === submittingUserId &&
        accountVersion.current === submittingVersion
      ) {
        setMessage(
          error.message || "Could not save your report."
        );
      }
    } finally {
      if (
        activeUserId.current === submittingUserId &&
        accountVersion.current === submittingVersion
      ) {
        savingReport.current = false;
        setSubmitting(false);
      }
    }
  }

  // Check the saved authentication session first.
  if (authLoading) {
    return (
      <main className="login-page">
        <p role="status">Loading your account...</p>
      </main>
    );
  }

  // Display Student Login and Admin Login options.
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

  // AdminDashboard checks whether the account has admin access.
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