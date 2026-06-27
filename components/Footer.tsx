export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footerInner">
        <div className="footerBrand">
  <h2>NM Creative</h2>

  <span>STRATEGY · DESIGN · MARKETING</span>

  <p>
    Helping ambitious businesses grow through strategy, design, and
    marketing that delivers measurable results.
  </p>

  <div className="footerSocial">
    <a href="#">◎</a>
    <a href="#">in</a>
    <a href="#">𝕏</a>
    <a href="#">✉</a>
  </div>
</div>
        <div className="footerColumn">
          <h4>Navigate</h4>
          <a href="/">Home</a>
          <a href="#services">Services</a>
          <a href="#framework">The Growth Framework</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footerColumn">
          <h4>Services</h4>
          <a href="#services">Brand Strategy</a>
          <a href="#services">Web Design</a>
          <a href="#services">SEO</a>
          <a href="#services">Paid Advertising</a>
          <a href="#services">Digital Marketing</a>
        </div>

        <div className="footerColumn">
          <h4>Let’s Connect</h4>
          <p>hello@nmcreative.co</p>
          <p>(555) 123-4567</p>

          <h4 className="footerMiniTitle">Based In</h4>
          <p>Your City, Your Country</p>
        </div>

        <div className="footerColumn">
          <h4>Stay Inspired</h4>
          <p>Get insights on growth, strategy, design, and marketing.</p>

          <form className="footerNewsletter">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">→</button>
          </form>
        </div>
      </div>

      <div className="footerBottom">
        © 2026 NM Creative. All rights reserved.
      </div>
    </footer>
  );
}