import React from "react";
import { Plane, CheckCircle, Zap, Users, ArrowRight, AlertCircle, Eye } from "lucide-react";

export function Landing() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <style>{`
        :root {
          --ink: #141414;
          --ink-soft: #666666;
          --line: #dcdcdc;
          --bg: #ffffff;
          --bg-soft: #f6f6f6;
          --black: #0d0d0d;
          --white: #ffffff;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
        h1, h2, h3 { font-family: 'Oswald', 'Arial Narrow', sans-serif; margin: 0; }
      `}</style>

      <nav style={{ background: "var(--black)", color: "var(--white)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "20px", fontWeight: "700", textTransform: "uppercase" }}>
          <Plane size={24} /> PackRight
        </div>
        <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
          <a href="#how-it-works" style={{ color: "var(--white)", textDecoration: "none" }}>How it works</a>
          <a href="#why" style={{ color: "var(--white)", textDecoration: "none" }}>Why PackRight</a>
          <a href="#faq" style={{ color: "var(--white)", textDecoration: "none" }}>FAQ</a>
          <button onClick={() => window.location.href = "/"} style={{ background: "var(--white)", color: "var(--black)", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Open App</button>
        </div>
      </nav>

      <section style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #242424 100%)", color: "var(--white)", padding: "80px 40px", textAlign: "center", minHeight: "600px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <Plane size={64} style={{ marginBottom: "24px" }} />
        <h1 style={{ fontSize: "48px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pack Right, Every Time</h1>
        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", maxWidth: "600px", lineHeight: "1.6", marginBottom: "32px" }}>
          Your trips, your bags, packed right. Get personalized packing guides, save your favorite bag configurations, and travel with confidence.
        </p>
        <button onClick={() => window.location.href = "/"} style={{ background: "var(--white)", color: "var(--black)", border: "none", padding: "14px 28px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          Start Packing <ArrowRight size={20} />
        </button>
      </section>

      <section id="why" style={{ padding: "80px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "48px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>Why PackRight?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          <div>
            <CheckCircle size={40} style={{ marginBottom: "16px", color: "var(--black)" }} />
            <h3 style={{ fontSize: "18px", marginBottom: "12px", textTransform: "uppercase" }}>Never Forget Again</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: "1.6" }}>Our intelligent packing checklists ensure you never miss an essential item. Save your configurations and reuse them for similar trips.</p>
          </div>
          <div>
            <Zap size={40} style={{ marginBottom: "16px", color: "var(--black)" }} />
            <h3 style={{ fontSize: "18px", marginBottom: "12px", textTransform: "uppercase" }}>Save Time & Space</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: "1.6" }}>Organize your items by bag with drag-and-drop simplicity. See weight limits at a glance and pack efficiently every time.</p>
          </div>
          <div>
            <Eye size={40} style={{ marginBottom: "16px", color: "var(--black)" }} />
            <h3 style={{ fontSize: "18px", marginBottom: "12px", textTransform: "uppercase" }}>Weather-Smart Guidance</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: "1.6" }}>Tell us where and when you're traveling. We check the forecast and recommend exactly what you need based on climate.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ background: "var(--bg-soft)", padding: "80px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "48px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "var(--black)", color: "var(--white)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", margin: "0 auto 16px" }}>1</div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", textTransform: "uppercase" }}>Plan Your Trip</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>Enter your destination, dates, and trip details. We'll fetch the weather forecast for your location.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "var(--black)", color: "var(--white)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", margin: "0 auto 16px" }}>2</div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", textTransform: "uppercase" }}>Get Recommendations</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>Based on the weather, we suggest clothing and gear perfect for your destination's climate.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "var(--black)", color: "var(--white)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", margin: "0 auto 16px" }}>3</div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", textTransform: "uppercase" }}>Organize & Pack</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>Drag items into your bags, manage weight limits, and check them off as you pack.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "var(--black)", color: "var(--white)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", margin: "0 auto 16px" }}>4</div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", textTransform: "uppercase" }}>Save for Later</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>Save your bag configuration as a template. Reuse it for future trips to similar destinations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "48px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>Frequently Asked Questions</h2>
          <div style={{ display: "grid", gap: "24px" }}>
            <FAQItem question="Is my data saved?" answer="Yes! All your trips, bags, and configurations are saved locally in your browser. Your data never leaves your device — everything is stored securely on your computer." />
            <FAQItem question="Can I use this offline?" answer="PackRight works best online for weather data. However, you can still access and manage saved trips offline if they were previously loaded." />
            <FAQItem question="How accurate are the packing recommendations?" answer="Our recommendations are based on real-time weather data from the Open-Meteo API, covering temperature, precipitation, and wind. We also factor in trip duration to suggest appropriate clothing." />
            <FAQItem question="Can I customize the packing lists?" answer="Absolutely. You can add, remove, and edit any item. You can also adjust quantities and move items between bags using drag-and-drop." />
            <FAQItem question="Do you support different airlines?" answer="Yes! We have presets for major US and Canadian airlines, including American, Delta, Southwest, Air Canada, and WestJet. You can also set custom weight limits." />
            <FAQItem question="Can I share packing lists with others?" answer="Currently, packing lists are stored locally in your browser. You can take screenshots or manually share recommendations with travel companions." />
          </div>
        </div>
      </section>

      <footer style={{ background: "var(--black)", color: "var(--white)", padding: "40px", textAlign: "center", fontSize: "13px" }}>
        <p>Made with care for travelers everywhere. © 2026 PackRight</p>
        <p style={{ marginTop: "12px", color: "rgba(255,255,255,0.6)" }}>Weather data provided by Open-Meteo. Always check official airline policies for current baggage requirements.</p>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          width: "100%",
          textAlign: "left",
          padding: "12px 0",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "15px",
          fontWeight: "600",
          color: "var(--ink)",
        }}
      >
        {question}
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
      </button>
      {open && <p style={{ marginTop: "12px", color: "var(--ink-soft)", lineHeight: "1.6", margin: "12px 0 0" }}>{answer}</p>}
    </div>
  );
}
