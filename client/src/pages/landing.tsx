import { useState, type CSSProperties, type MouseEvent } from "react";
import dino from "@assets/requisor-dino.png";

const ACCENT = "#0F766E";
const ACCENT_DEEP = "#0B4F4A";
const TILT = 10;

const css = `
@keyframes dFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes dFloat2{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
@keyframes dRise{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
.d-float{animation:dFloat 6s ease-in-out infinite}
.d-float2{animation:dFloat2 7s ease-in-out infinite}
.d-enter{animation:dRise .9s cubic-bezier(.2,.7,.2,1) both}
.d-press{transition:transform .12s ease, box-shadow .12s ease;cursor:pointer;text-decoration:none}
.d-press:hover{transform:translateY(2px)}
.d-press:active{transform:translateY(5px)}
.d-card{transition:transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease}
.d-card:hover{transform:perspective(900px) rotateX(6deg) rotateY(-6deg) translateY(-6px)}
.d-link{color:#475467;text-decoration:none}
.d-link:hover{color:#115E59}
@media (prefers-reduced-motion: reduce){.d-float,.d-float2,.d-enter{animation:none}.d-card:hover{transform:none}}
`;

const login = () => {
  window.location.href = "/api/login";
};

const card = (c: string): CSSProperties => ({
  height: 34,
  borderRadius: 10,
  background: "#FFFFFF",
  boxShadow: "0 3px 0 #DCE3EA",
  borderLeft: `4px solid ${c}`,
});

const cols = [
  { name: "Qualified", color: "#94A3B8", n: 3 },
  { name: "Proposal", color: "#3B82F6", n: 2 },
  { name: "Negotiation", color: "#F59E0B", n: 2 },
  { name: "Won", color: "#10B981", n: 1 },
];

const tile = (from: string, to: string, deep: string): CSSProperties => ({
  width: 54,
  height: 54,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${from}, ${to})`,
  boxShadow: `0 6px 0 ${deep}, inset 0 2px 0 rgba(255,255,255,0.35)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const features = [
  { n: "01", title: "Contact management", body: "One structured record for every person and company, with a full activity timeline.", tile: tile("#2DD4BF", "#0F766E", "#0B4F4A") },
  { n: "02", title: "Visual pipeline", body: "Drag deals through custom stages. Values and forecasts update as you go.", tile: tile("#60A5FA", "#1D4ED8", "#1E3A8A") },
  { n: "03", title: "Reporting", body: "Win rate, pipeline value and rep activity on live dashboards.", tile: tile("#FBBF24", "#D97706", "#92400E") },
];

const steps = [
  { n: "1", title: "Import your contacts", body: "Upload a CSV or spreadsheet and map columns automatically." },
  { n: "2", title: "Set up your pipeline", body: "Name your stages, invite your team and assign owners." },
  { n: "3", title: "Track and close", body: "Move deals forward and watch the dashboard update live." },
];

const plans = [
  { name: "Starter", price: "TBD", unit: "per user / month", button: "Start free trial", hot: false },
  { name: "Growth", price: "TBD", unit: "per user / month", button: "Start free trial", hot: true },
  { name: "Enterprise", price: "Custom", unit: "Talk to us", button: "Talk to sales", hot: false },
];

const section: CSSProperties = { maxWidth: 1200, margin: "0 auto" };

export default function Landing() {
  const [m, setM] = useState({ x: 0, y: 0 });

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setM({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };

  const rx = 14 - m.y * TILT;
  const ry = -18 + m.x * TILT * 1.6;
  const sceneStyle: CSSProperties = {
    position: "relative",
    width: 520,
    height: 460,
    transformStyle: "preserve-3d",
    transition: "transform .25s ease-out",
    transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`,
  };

  const primaryBtn: CSSProperties = {
    fontWeight: 700, color: "#FFFFFF", background: ACCENT, display: "inline-flex", alignItems: "center",
    boxSizing: "border-box", border: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#0F172A",
        background: "linear-gradient(180deg, #EAF4F2 0%, #F4F6FA 40%, #F4F6FA 100%)",
        WebkitFontSmoothing: "antialiased",
        overflowX: "clip",
      }}
    >
      <style>{css}</style>

      {/* NAV */}
      <header style={{ ...section, padding: "20px 24px" }}>
        <nav
          aria-label="Main"
          style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
            padding: "10px 12px 10px 14px", borderRadius: 20, background: "#FFFFFF",
            boxShadow: "0 1px 0 #FFFFFF inset, 0 10px 30px -12px rgba(15,23,42,0.18), 0 2px 0 #DCE3EA",
          }}
        >
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, color: "#0F172A", textDecoration: "none" }}>
            <img src={dino} alt="Requisor dino logo" style={{ width: 42, height: 42, borderRadius: "50%", display: "block", boxShadow: "0 6px 14px -4px rgba(15,118,110,0.45)" }} />
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Requisor CRM</span>
          </a>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 26, fontSize: 15, fontWeight: 500 }}>
            <a className="d-link" href="#features">Product</a>
            <a className="d-link" href="#how">How it works</a>
            <a className="d-link" href="#pricing">Pricing</a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={login} style={{ fontSize: 15, fontWeight: 600, color: "#344054", padding: "10px 14px", background: "none", border: 0, cursor: "pointer" }}>
              Sign in
            </button>
            <button
              onClick={login}
              className="d-press"
              style={{ ...primaryBtn, fontSize: 15, padding: "10px 18px", borderRadius: 12, minHeight: 44, boxShadow: `0 5px 0 ${ACCENT_DEEP}, 0 12px 20px -8px rgba(15,118,110,0.5)` }}
            >
              Start free trial
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="top"
        onMouseMove={onMove}
        onMouseLeave={() => setM({ x: 0, y: 0 })}
        style={{ ...section, padding: "56px 24px 96px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 48 }}
      >
        <div style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 24 }}>
          <span className="d-enter" style={{ animationDelay: ".05s", alignSelf: "flex-start", fontSize: 13, fontWeight: 700, color: "#0F766E", background: "#FFFFFF", padding: "7px 14px", borderRadius: 999, boxShadow: "0 3px 0 #D3E3E0, 0 8px 16px -8px rgba(15,23,42,0.2)" }}>
            The CRM for growing sales teams
          </span>
          <h1 className="d-enter" style={{ animationDelay: ".15s", margin: 0, fontSize: "clamp(2.6rem, 5vw, 4.2rem)", lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.04em" }}>
            Sales, with a little more depth.
          </h1>
          <p className="d-enter" style={{ animationDelay: ".25s", margin: 0, maxWidth: 500, fontSize: 19, lineHeight: 1.6, color: "#475467" }}>
            Contacts, deals and next steps stacked into one workspace your whole team can see into.
          </p>
          <div className="d-enter" style={{ animationDelay: ".35s", display: "flex", flexWrap: "wrap", gap: 14 }}>
            <button onClick={login} className="d-press" style={{ ...primaryBtn, fontSize: 16, padding: "15px 26px", borderRadius: 14, minHeight: 50, boxShadow: `0 6px 0 ${ACCENT_DEEP}, 0 18px 30px -12px rgba(15,118,110,0.55)` }}>
              Start free trial
            </button>
            <a href="#pricing" className="d-press" style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", background: "#FFFFFF", padding: "15px 26px", borderRadius: 14, minHeight: 50, boxSizing: "border-box", display: "inline-flex", alignItems: "center", boxShadow: "0 6px 0 #D5DCE4, 0 18px 30px -14px rgba(15,23,42,0.25)" }}>
              Book a demo
            </a>
          </div>
          <p className="d-enter" style={{ animationDelay: ".45s", margin: 0, fontSize: 14, color: "#5B6474" }}>
            14-day free trial · No credit card required
          </p>
        </div>

        {/* 3D scene */}
        <div className="d-enter" style={{ animationDelay: ".3s", flex: "1 1 500px", height: 520, perspective: 1400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={sceneStyle}>
            <div style={{ position: "absolute", left: 40, top: 60, width: 440, height: 360, borderRadius: 26, background: "#FFFFFF", boxShadow: "0 2px 0 #FFFFFF inset, 0 14px 0 #DCE3EA, 0 50px 80px -30px rgba(15,23,42,0.45)", transform: "translateZ(0)", padding: 22, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Q4 Pipeline</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F766E", background: "#E6F4F1", padding: "4px 10px", borderRadius: 999 }}>$412.6K</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, flex: 1 }}>
                {cols.map((c) => (
                  <div key={c.name} style={{ borderRadius: 14, background: "#F2F5F9", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475467" }}>{c.name}</span>
                    {Array.from({ length: c.n }).map((_, i) => (
                      <div key={i} style={card(c.color)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="d-float" style={{ position: "absolute", left: -10, top: 0, transformStyle: "preserve-3d" }}>
              <div style={{ transform: "translateZ(90px)", width: 190, borderRadius: 20, background: "#FFFFFF", padding: "16px 18px", boxShadow: "0 10px 0 #DCE3EA, 0 30px 50px -20px rgba(15,23,42,0.4)", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#5B6474" }}>Win rate</span>
                <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>34%</span>
                <div style={{ height: 8, borderRadius: 999, background: "#EEF2F6" }}>
                  <div style={{ width: "34%", height: "100%", borderRadius: 999, background: ACCENT }} />
                </div>
              </div>
            </div>

            <div className="d-float2" style={{ position: "absolute", right: -10, bottom: 40, transformStyle: "preserve-3d" }}>
              <div style={{ transform: "translateZ(130px)", width: 220, borderRadius: 20, background: "#0F172A", color: "#FFFFFF", padding: "16px 18px", boxShadow: "0 10px 0 #020617, 0 30px 50px -20px rgba(15,23,42,0.6)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: "#2DD4BF", color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Deal won</div>
                  <div style={{ fontSize: 12, color: "#B8C1CF" }}>Atlas Logistics · $40,500</div>
                </div>
              </div>
            </div>

            <div className="d-float" style={{ position: "absolute", right: 10, top: -30, transformStyle: "preserve-3d", animationDelay: "-2s" }}>
              <img src={dino} alt="" style={{ transform: "translateZ(170px)", width: 150, height: 150, display: "block", filter: "drop-shadow(0 24px 24px rgba(15,23,42,0.30))" }} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ ...section, padding: "24px 24px 96px" }}>
        <h2 style={{ margin: "0 0 12px", textAlign: "center", fontSize: "clamp(2rem, 3.4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Built in layers.</h2>
        <p style={{ margin: "0 auto 48px", maxWidth: 560, textAlign: "center", fontSize: 18, lineHeight: 1.6, color: "#475467" }}>
          Your data, your pipeline and your reports, stacked so each one feeds the next.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
          {features.map((f) => (
            <article key={f.n} className="d-card" style={{ padding: 30, borderRadius: 24, background: "#FFFFFF", boxShadow: "0 2px 0 #FFFFFF inset, 0 10px 0 #DCE3EA, 0 30px 50px -24px rgba(15,23,42,0.30)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={f.tile}><span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{f.n}</span></div>
              <h3 style={{ margin: "6px 0 0", fontSize: 21, fontWeight: 800, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#475467" }}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{ ...section, padding: "0 24px 96px" }}>
        <div style={{ borderRadius: 32, padding: "56px 40px", background: "#0F172A", color: "#FFFFFF", boxShadow: "0 14px 0 #020617, 0 50px 80px -30px rgba(15,23,42,0.6)" }}>
          <h2 style={{ margin: "0 0 40px", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Up and running in an afternoon.</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {steps.map((s) => (
              <li key={s.n} style={{ padding: 24, borderRadius: 20, background: "#1E293B", boxShadow: "0 6px 0 #020617", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "#2DD4BF", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 #0F766E" }}>{s.n}</span>
                <span style={{ fontSize: 19, fontWeight: 700 }}>{s.title}</span>
                <span style={{ fontSize: 15, lineHeight: 1.6, color: "#B8C1CF" }}>{s.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ ...section, padding: "0 24px 96px" }}>
        <h2 style={{ margin: "0 0 40px", textAlign: "center", fontSize: "clamp(2rem, 3.4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Simple pricing.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, alignItems: "end" }}>
          {plans.map((p) => (
            <div
              key={p.name}
              className="d-card"
              style={{
                padding: p.hot ? "44px 30px" : 30,
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "#FFFFFF",
                boxShadow: p.hot
                  ? `0 0 0 3px ${ACCENT}, 0 16px 0 #DCE3EA, 0 40px 60px -24px rgba(15,23,42,0.35)`
                  : "0 10px 0 #DCE3EA, 0 30px 50px -24px rgba(15,23,42,0.28)",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</span>
              <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.price}</span>
              <span style={{ fontSize: 14, color: "#5B6474" }}>{p.unit}</span>
              <button
                onClick={login}
                className="d-press"
                style={{
                  marginTop: 14, fontSize: 15, fontWeight: 700, padding: "13px 18px", borderRadius: 12, minHeight: 48,
                  boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", border: 0,
                  color: p.hot ? "#FFFFFF" : "#0F172A",
                  background: p.hot ? ACCENT : "#F2F5F9",
                  boxShadow: p.hot ? `0 5px 0 ${ACCENT_DEEP}` : "0 5px 0 #D5DCE4",
                }}
              >
                {p.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="trial" style={{ ...section, padding: "0 24px 80px" }}>
        <div style={{ borderRadius: 32, padding: "56px 40px", background: ACCENT, color: "#FFFFFF", boxShadow: `0 14px 0 ${ACCENT_DEEP}, 0 50px 80px -30px rgba(15,118,110,0.6)`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Give your pipeline some depth.</h2>
            <p style={{ margin: 0, fontSize: 18, color: "#D7F5F0" }}>Import contacts, set your stages, start closing.</p>
          </div>
          <button onClick={login} className="d-press" style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", background: "#FFFFFF", padding: "15px 26px", borderRadius: 14, minHeight: 50, boxSizing: "border-box", display: "inline-flex", alignItems: "center", border: 0, boxShadow: "0 6px 0 #B7D9D3" }}>
            Start free trial
          </button>
        </div>
      </section>

      <footer style={{ ...section, padding: "24px 24px 40px", borderTop: "1px solid #DCE3EA", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, fontSize: 13, color: "#5B6474" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={dino} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          © 2026 Requisor CRM. A Citrus Innovations company.
        </span>
        <span>Privacy · Terms</span>
      </footer>
    </div>
  );
}
