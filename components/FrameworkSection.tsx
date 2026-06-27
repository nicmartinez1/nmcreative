export default function FrameworkSection() {
  return (
    <section className="engineSection" id="framework">
      <p className="sectionEyebrow">Our Approach</p>
      <h2>Your Growth Engine</h2>

      <p className="sectionIntro">
        Growth doesn’t happen by chance. It happens when every piece of your business works together.
      </p>

      <div className="engineGrid">
        <div className="engineStep">
          <div className="engineIcon">🧲</div>
          <span>01</span>
          <h3>Attract</h3>
          <p>SEO<br />Paid Advertising<br />Social Media<br />Content Marketing</p>
        </div>

        <div className="engineStep">
          <div className="engineIcon">🛡</div>
          <span>02</span>
          <h3>Build Trust</h3>
          <p>Brand Identity<br />Messaging<br />Creative Direction<br />Professional Design</p>
        </div>

        <div className="engineStep">
          <div className="engineIcon">➤</div>
          <span>03</span>
          <h3>Convert</h3>
          <p>Website Design<br />Landing Pages<br />Conversion Optimization<br />User Experience</p>
        </div>

        <div className="engineStep">
          <div className="engineIcon">📈</div>
          <span>04</span>
          <h3>Scale</h3>
          <p>Analytics<br />Marketing Strategy<br />Continuous Optimization<br />Business Growth</p>
        </div>
      </div>
    </section>
  );
}