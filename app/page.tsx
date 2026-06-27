export default function Home() {
  const offerPillars = [
    {
      number: "01",
      title: "Build",
      subtitle: "Custom websites",
      text: "Premium websites designed to make your business look professional, communicate clearly, and turn visitors into leads.",
      items: ["Custom design", "Responsive development", "SEO-ready foundation"],
    },
    {
      number: "02",
      title: "Rank",
      subtitle: "Local SEO",
      text: "Improve your visibility on Google so local customers can find your business when they are ready to buy.",
      items: ["Google Business Profile", "Local keywords", "On-page SEO"],
    },
    {
      number: "03",
      title: "Grow",
      subtitle: "Digital marketing",
      text: "Campaigns, content, ads, and landing pages built to generate attention, traffic, and qualified leads.",
      items: ["Paid ads", "Social media", "Landing pages"],
    },
    {
      number: "04",
      title: "Support",
      subtitle: "Website care",
      text: "Keep your website secure, updated, backed up, and running smoothly after launch.",
      items: ["Hosting support", "Security updates", "Content edits"],
    },
  ];

  const services = [
    {
      icon: "⌘",
      title: "Custom Websites",
      price: "Starting at $2,500",
      text: "Premium websites designed around your brand, your goals, and the customers you want to attract.",
      items: ["Custom design", "Responsive development", "SEO-ready foundation", "Lead capture forms", "Performance optimized"],
      button: "Build My Website →",
      tone: "blue",
    },
    {
      icon: "↗",
      title: "Marketing & Growth",
      price: "Custom Strategy",
      text: "SEO, paid ads, social media, landing pages, and campaigns built to generate measurable growth.",
      items: ["Local SEO", "Paid advertising", "Social media management", "Landing pages", "Analytics & reporting"],
      button: "Grow My Business →",
      tone: "purple",
    },
    {
      icon: "◎",
      title: "Ongoing Partnership",
      price: "Optional Support",
      text: "Long-term support for businesses that want their website and marketing to keep improving after launch.",
      items: ["Website updates", "Hosting support", "Security checks", "Monthly optimization", "Strategy calls"],
      button: "Work With Us →",
      tone: "teal",
    },
  ];

  const pricing = [
    {
      title: "Custom Website",
      price: "$2,500",
      text: "Perfect for businesses that need a polished, professional website built to make a strong first impression.",
      items: ["5–8 pages", "Mobile responsive", "Contact forms", "Basic SEO setup", "Analytics", "Launch support"],
      button: "Request Quote →",
    },
    {
      title: "Business Website",
      price: "$4,500",
      text: "For businesses that need a stronger sales tool with better structure, more pages, and conversion-focused features.",
      items: ["10–20 pages", "CMS or blog", "Booking integration", "Advanced SEO setup", "Landing pages", "Conversion optimization"],
      button: "Build My Website →",
      featured: true,
    },
    {
      title: "Enterprise Platform",
      price: "Quote",
      text: "For businesses that need custom functionality, ecommerce, portals, integrations, or more advanced systems.",
      items: ["Ecommerce", "Client portals", "Memberships", "Automations", "API integrations", "Ongoing consulting"],
      button: "Let’s Talk →",
    },
  ];

  const growth = [
    ["Local SEO", "Improve Google visibility and get found by local customers.", "$750/mo"],
    ["Social Media", "Content planning, posting, brand building, and audience growth.", "$750/mo"],
    ["Paid Advertising", "Google and Meta ads designed to generate qualified leads.", "$1,200/mo"],
    ["Website Care", "Hosting, updates, backups, security, and technical support.", "$250/mo"],
  ];

  const seo = [
    ["Your Website", "We optimize your pages, structure, speed, and content."],
    ["Google Search", "Customers search for the services you offer."],
    ["Higher Rankings", "Your business appears higher for valuable search terms."],
    ["More Traffic", "More qualified people visit your website."],
    ["More Leads", "More calls, forms, bookings, and customers."],
  ];

  const process = [
    ["Discovery", "We learn your business, goals, audience, and what needs to improve."],
    ["Strategy", "We create the plan for your website, content, SEO, or campaign."],
    ["Design", "We turn the strategy into a polished visual direction and user experience."],
    ["Build", "We develop the website, landing pages, and systems behind the scenes."],
    ["Launch", "We launch cleanly with tracking, SEO foundations, and support."],
    ["Grow", "We optimize, improve, and help your business keep moving forward."],
  ];

  return (
    <main className="nmSite">
      <header className="nmHeader">
        <a href="#home" className="nmHeaderLogo">
          <img src="/assets/nm-logo-mark.png" alt="NM Creative" />
          <span>NM Creative</span>
        </a>

        <nav className="nmNav">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#seo">SEO</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </nav>

        <a href="#contact" className="nmHeaderCta">
          Start Project →
        </a>
      </header>

      <section className="nmHero" id="home">
        <img
          src="/assets/hero-full.png"
          alt="NM Creative glowing 3D logo"
          className="heroBackground"
        />

        <div className="nmHeroContent">
          <span className="eyebrow">Strategy. Design. Marketing.</span>

          <h1>
            Growth isn’t luck.
            <br />
            It’s <em>designed.</em>
          </h1>

          <p>
            We build premium websites and marketing systems that help businesses
            attract better customers, increase revenue, and scale with confidence.
          </p>

          <div className="heroButtons">
            <a href="#contact" className="primaryButton">Start Your Project →</a>
            <a href="#pricing" className="secondaryButton">View Pricing</a>
          </div>

          <div className="trustStrip">
            <div>
              <b>✣</b>
              <span>Free Consultation<small>No obligation</small></span>
            </div>
            <div>
              <b>◎</b>
              <span>Custom Strategy<small>Tailored to you</small></span>
            </div>
            <div>
              <b>↗</b>
              <span>Built for Growth<small>Results that scale</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="offerSection">
        <div className="offerPanel">
          <div className="offerIntro">
            <span className="eyebrow">What NM Creative Offers</span>
            <h2>
              A complete digital foundation for businesses that want to <em>look better, get found, and grow.</em>
            </h2>
            
          </div>

          <div className="offerGrid">
            {offerPillars.map((pillar) => (
              <article className="offerCard" key={pillar.title}>
                <span>{pillar.number}</span>
                <h3>{pillar.title}</h3>
                <strong>{pillar.subtitle}</strong>
                <p>{pillar.text}</p>
                <ul>
                  {pillar.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nmSection servicesSection" id="services">
        <div className="sectionTitle">
          <span className="eyebrow">What We Do</span>
          <h2>Complete solutions. <em>Real results.</em></h2>
        </div>

        <div className="servicesGrid">
          {services.map((service) => (
            <article className={`serviceCard ${service.tone}`} key={service.title}>
              <div className="cardHeader">
                <div className="cardIcon">{service.icon}</div>
                <button type="button">+</button>
              </div>

              <h3>{service.title}</h3>
              <strong>{service.price}</strong>
              <p>{service.text}</p>

              <ul>
                {service.items.map((item) => <li key={item}>{item}</li>)}
              </ul>

              <a href="#contact">{service.button}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="nmSection pricingSection" id="pricing">
        <div className="sectionTitle">
          <span className="eyebrow">Website Investment</span>
          <h2>Choose the right website for your business.</h2>
        </div>

        <div className="pricingGrid">
          {pricing.map((plan) => (
            <article className={`priceCard ${plan.featured ? "featured" : ""}`} key={plan.title}>
              {plan.featured && <span className="popularBadge">Most Popular</span>}
              <button className="miniButton" type="button">+</button>

              <h3>{plan.title}</h3>
              <small>Starting at</small>
              <strong>{plan.price}</strong>
              <p>{plan.text}</p>

              <ul>
                {plan.items.map((item) => <li key={item}>{item}</li>)}
              </ul>

              <a href="#contact">{plan.button}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="seoSection" id="seo">
        <div className="seoPanel">
          <div className="seoIntro">
            <div className="seoOrb">SEO</div>

            <div>
              <span className="eyebrow">How SEO Works</span>
              <h2>More visibility. More traffic. More customers.</h2>
              <p>
                SEO helps your business show up when customers search on Google.
                We improve your website, local presence, page structure, and
                content so more qualified people can find and contact you.
              </p>
            </div>
          </div>

          <div className="seoFlow">
            {seo.map(([title, text], index) => (
              <article className="seoStep" key={title}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="growthSection">
        <div className="sectionTitle">
          <span className="eyebrow">Keep Growing After Launch</span>
          <h2>Ongoing <em>growth services.</em></h2>
        </div>

        <div className="growthGrid">
          {growth.map(([title, text, price], index) => (
            <article className={`growthCard tone${index + 1}`} key={title}>
              <button type="button">+</button>
              <h3>{title}</h3>
              <p>{text}</p>
              <span>Starting at</span>
              <strong>{price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="processSection" id="process">
        <div className="sectionTitle">
          <span className="eyebrow">Our Process</span>
          <h2>A proven process for predictable results.</h2>
        </div>

        <div className="processTrack">
          {process.map(([title, text], index) => (
            <article className="processStep" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ctaSection" id="contact">
        <div className="ctaPanel">
          <div>
            <h2>Ready to grow your business?</h2>
            <p>Let’s build something amazing together.</p>
          </div>

          <div className="ctaButtons">
            <a href="mailto:hello@nmcreative.co" className="ctaWhite">Start Your Project →</a>
            <a href="mailto:hello@nmcreative.co" className="ctaOutline">Schedule a Call</a>
          </div>
        </div>
      </section>

      <footer className="nmFooter">
        <div>
          <img src="/assets/nm-logo-mark.png" alt="NM Creative" />
          <p>
            We build premium websites and marketing systems that help businesses
            grow with confidence.
          </p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#process">Our Process</a>
          <a href="#contact">Contact</a>
        </div>

        <div>
          <h3>Services</h3>
          <a href="#services">Custom Websites</a>
          <a href="#seo">Local SEO</a>
          <a href="#services">Digital Marketing</a>
          <a href="#services">Website Care</a>
        </div>

        <div>
          <h3>Contact</h3>
          <a href="mailto:hello@nmcreative.co">hello@nmcreative.co</a>
          <a href="tel:5551234567">(555) 123-4567</a>
          <p>Los Angeles, CA</p>
        </div>

        <div>
          <h3>Stay Updated</h3>
          <p>Get tips, insights, and updates delivered to your inbox.</p>
          <form>
            <input placeholder="Your email" />
            <button type="button">→</button>
          </form>
        </div>
      </footer>
    </main>
  );
}
