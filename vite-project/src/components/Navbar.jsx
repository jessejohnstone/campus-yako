
export default function Navbar({ onLogout }) {
  return (
    <header className="header">
      <nav className="navbar container" aria-label="Main navigation">
        <a href="#home" className="logo">
          UNI<span>FIX</span>
        </a>

        <div className="nav-links">
          <a href="#categories">Categories</a>
          <a href="#how-it-works">How it works</a>
          <a href="#reports">Reports</a>
        </div>

        <button
          type="button"
          className="button button-small"
          onClick={onLogout}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}