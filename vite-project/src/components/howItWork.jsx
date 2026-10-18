export default function HowItWorks() {
  return (
    <section className="section container" id="how-it-works">
      <div className="section-heading">
        <span className="eyebrow">SIMPLE BY DESIGN</span>
        <h2>Make your voice count in three steps.</h2>
      </div>

      <div className="steps-grid">
        <article className="step">
          <span className="step-number">01</span>
          <h3>Spot the problem</h3>
          <p>Identify something on campus that needs attention.</p>
        </article>

        <article className="step">
          <span className="step-number">02</span>
          <h3>Share the details</h3>
          <p>Add a clear description, category, and location.</p>
        </article>

        <article className="step">
          <span className="step-number">03</span>
          <h3>View your report</h3>
          <p>Find your saved reports in the list below.</p>
        </article>
      </div>
    </section>
  );
}