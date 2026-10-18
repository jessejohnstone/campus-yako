const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <a href="#home" className="logo">
          UNI<span>FIX</span>
        </a>

        <p>Better campus. Better experience.</p>

        <p>© {currentYear} UNIFIX</p>
      </div>
    </footer>
  );
}