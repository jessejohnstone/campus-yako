export default function Hero() {
  return (
    <section className="hero container" id="home">
      <div className="hero-content">
        <span className="eyebrow">
          A BETTER CAMPUS STARTS WITH YOU
        </span>

        <h1>
          See a problem?
          <br />
          <span>Let’s fix it.</span>
        </h1>

        <p>
          From broken classroom chairs to unreliable hostel Wi-Fi,
          UNIFIX gives campus problems a place to be heard.
          Report an issue and keep track of it in one place.
        </p>

        <div className="hero-actions">
          <a href="#report" className="button">
            Report a Problem ↗
          </a>

          <a href="#how-it-works" className="button button-outline">
            How it works
          </a>
        </div>

        <p className="hero-note">
          Built for students. Focused on a better campus.
        </p>
      </div>

      <div className="hero-panel">
        <div className="panel-heading">
          <span className="live-dot" />
          EVERY REPORT IS A FIRST STEP
        </div>

        <div className="illustration" aria-hidden="true">
          🏫
        </div>

        <h2>Your campus. Your voice.</h2>

        <p>
          Help identify the everyday issues that affect learning,
          comfort, and campus life.
        </p>

        <div className="panel-tags">
          <span>📍 Add a location</span>
          <span>📝 Describe the issue</span>
          <span>👀 View your reports</span>
        </div>
      </div>
    </section>
  );
}