import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({
  isSupabaseConfigured,
  onLoginStart,
  onLoginFailed,
}) {
  const [loginType, setLoginType] = useState("student");
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdminLogin = loginType === "admin";

  function changeLoginType(type) {
    setLoginType(type);
    setIsSignup(false);
    setPassword("");
    setError("");
    setMessage("");
  }

  function toggleSignup() {
    setIsSignup((previous) => !previous);
    setPassword("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setError(
        "Sign-in is unavailable. Add the Supabase URL and publishable key to your deployment environment variables."
      );
      return;
    }

    if (isSignup && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // Tell App which page to open when authentication succeeds.
    onLoginStart(loginType);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          onLoginFailed();

          setMessage(
            "Check your email for a confirmation link, then return to log in."
          );

          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      onLoginFailed();

      setError(
        error.message || "Could not sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">
          UNI<span>FIX</span>
        </div>

        <div className="login-tabs" aria-label="Choose login type">
          <button
            type="button"
            className={loginType === "student" ? "active" : ""}
            aria-pressed={loginType === "student"}
            disabled={loading}
            onClick={() => changeLoginType("student")}
          >
            Student Login
          </button>

          <button
            type="button"
            className={isAdminLogin ? "active" : ""}
            aria-pressed={isAdminLogin}
            disabled={loading}
            onClick={() => changeLoginType("admin")}
          >
            Admin Login
          </button>
        </div>

        <h1>
          {isAdminLogin
            ? "Admin Login"
            : isSignup
              ? "Create Student Account"
              : "Student Login"}
        </h1>

        <p>
          {isAdminLogin
            ? "Sign in with your authorized staff account."
            : isSignup
              ? "Join UNIFIX and help improve your campus."
              : "Welcome back! Sign in to report campus issues."}
        </p>

        {!isSupabaseConfigured && (
          <p className="form-message" role="status">
            Supabase is not configured for this deployment. Add
            VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the hosting
            provider settings, then redeploy.
          </p>
        )}

        {isSignup && (
          <>
            <label htmlFor="student-name">Full name</label>

            <input
              id="student-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Johnstone Oroni"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              disabled={loading}
              required
            />
          </>
        )}

        <label htmlFor="login-email">Email address</label>

        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder={
            isAdminLogin ? "Enter your staff email" : "Enter your email"
          }
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          required
        />

        <label htmlFor="login-password">Password</label>

        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={isSignup ? 8 : undefined}
          disabled={loading}
          required
        />

        {isSignup && (
          <small>Use at least 8 characters for your password.</small>
        )}

        {error && <p role="alert">{error}</p>}

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="button"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : isAdminLogin
              ? "Login as Admin →"
              : isSignup
                ? "Create Account"
                : "Login as Student →"}
        </button>

        {!isAdminLogin && (
          <button
            type="button"
            className="auth-toggle"
            onClick={toggleSignup}
            disabled={loading}
          >
            {isSignup
              ? "Already have an account? Login"
              : "No account yet? Create one"}
          </button>
        )}

        {isAdminLogin && (
          <small>
            Admin access must be assigned by the project administrator.
          </small>
        )}
      </form>
    </main>
  );
}