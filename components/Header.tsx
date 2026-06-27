export default function Header() {
  return (
    <header className="siteHeader">
      <nav className="headerNav">
        <a href="/">Home</a>
        <a href="#services">Services</a>
        <a href="#framework">Growth Framework</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>

      <a href="#contact" className="headerCta">
        <span>Start Your Project</span>
        <span>→</span>
      </a>
    </header>
  );
}