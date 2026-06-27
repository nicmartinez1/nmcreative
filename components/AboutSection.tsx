export default function AboutSection() {
  return (
    <section className="aboutSection" id="about">
      <div className="aboutWrap">
        <div className="aboutContent">
          <p className="sectionEyebrow left">Why NM Creative</p>

          <h2>
            Strategy. Creativity.
            <br />
            Results that <span className="aboutTitleAccent">matter.</span>
          </h2>

          <p>
            Too many businesses invest in websites, branding, or marketing that
            look great — but don’t actually help create results. NM Creative
            brings strategy, design, and performance together so your brand can
            attract better customers and grow with purpose.
          </p>

          <a href="#contact" className="aboutButton">
            Let’s Build Your Growth →
          </a>
        </div>

        <div className="aboutCards">
          <div className="aboutCard">
            <div className="aboutIcon">💡</div>
            <div>
              <h3>Clear Strategy</h3>
              <p>We start with clarity so every decision moves you forward.</p>
            </div>
          </div>

          <div className="aboutCard">
            <div className="aboutIcon">◇</div>
            <div>
              <h3>Modern Design</h3>
              <p>Beautiful, user-focused design that builds trust.</p>
            </div>
          </div>

          <div className="aboutCard">
            <div className="aboutIcon">◎</div>
            <div>
              <h3>Measurable Results</h3>
              <p>We track what matters and optimize for real growth.</p>
            </div>
          </div>

          <div className="aboutCard">
            <div className="aboutIcon">🤝</div>
            <div>
              <h3>Long-Term Partnership</h3>
              <p>We grow with you, not just for you.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}