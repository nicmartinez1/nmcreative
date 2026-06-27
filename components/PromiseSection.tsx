export default function PromiseSection() {
  return (
    <section className="promiseSection" id="services">
      <p className="sectionEyebrow">Our Promise</p>
      <h2>No fluff. No guesswork. Just growth.</h2>

      <div className="promiseGrid">
        <div className="promiseCard">
          <div className="promiseIcon">◎</div>
          <h3>Strategy Before Design</h3>
          <p>Every successful project begins with understanding your business, audience, and goals.</p>
        </div>

        <div className="promiseCard">
          <div className="promiseIcon">↗</div>
          <h3>Built to Perform</h3>
          <p>From websites to marketing campaigns, everything is designed with measurable growth in mind.</p>
        </div>

        <div className="promiseCard">
          <div className="promiseIcon">👥</div>
          <h3>Your Growth Partner</h3>
          <p>We’re invested in long-term success, not just delivering a finished project.</p>
        </div>

        <div className="promiseCard">
          <div className="promiseIcon">◔</div>
          <h3>Data Over Opinions</h3>
          <p>We rely on strategy, testing, and real insights — not assumptions.</p>
        </div>
      </div>
    </section>
  );
}