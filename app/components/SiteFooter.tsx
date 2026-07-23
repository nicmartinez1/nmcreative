export default function SiteFooter() {
  return (
    <footer className="ws-footer">
      <span className="ws-footer-brand">
        <span className="ws-logo-crop ws-logo-crop-sm">
          <img src="/assets/webskilletlogo.png" alt="" className="ws-logo-full" />
        </span>
        © {new Date().getFullYear()} Web Skillet
      </span>
      <span>Web design · Social Media · Ads · SEO</span>
      <a href="mailto:webskillet.net@gmail.com">webskillet.net@gmail.com</a>
    </footer>
  );
}
