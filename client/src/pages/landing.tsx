import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import dino from "@assets/requisor-dino.png";

const ACCENT = "#0F766E";
const ACCENT_DEEP = "#0B4F4A";
const TILT = 10;

const css = `
.lp{--bg:linear-gradient(180deg,#EAF4F2 0%,#F4F6FA 40%,#F4F6FA 100%);--surface:#FFFFFF;--hi:#FFFFFF;--text:#0F172A;--text2:#344054;--muted:#475467;--muted2:#5B6474;--edge:#DCE3EA;--edge2:#D5DCE4;--chip:#F2F5F9;--chip2:#EEF2F6;--chipAccent:#E6F4F1;--accentText:#0F766E;--dark:#0F172A;--dark2:#1E293B;--darkEdge:#020617;--blob1:rgba(45,212,191,.30);--blob2:rgba(96,165,250,.22);color-scheme:light}
.lp[data-theme=dark]{--bg:linear-gradient(180deg,#0A1220 0%,#0B1424 45%,#0B1424 100%);--surface:#162033;--hi:rgba(255,255,255,.06);--text:#F1F5F9;--text2:#CBD5E1;--muted:#A3B0C2;--muted2:#8A98AD;--edge:#0A101C;--edge2:#0A101C;--chip:#1E2B42;--chip2:#223049;--chipAccent:rgba(45,212,191,.15);--accentText:#5EEAD4;--dark:#0F1A2E;--dark2:#18263D;--darkEdge:#050A14;--blob1:rgba(45,212,191,.16);--blob2:rgba(96,165,250,.14);color-scheme:dark}
.lp,.lp *{transition-property:background-color,border-color,color,box-shadow;transition-duration:.35s}
.lp .d-float,.lp .d-float2,.lp .d-enter,.lp .d-card,.lp .d-press,.lp .rv,.lp .par{transition-property:transform,opacity,box-shadow,background-color,color}
.rv{opacity:0;transform:translate3d(0,56px,0) scale(.96);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s);will-change:opacity,transform}
.rv.rv-in{opacity:1;transform:none}
.rv.rv-up{opacity:0;transform:translate3d(0,-48px,0) scale(.96);transition-delay:0s}
.par{transform:translate3d(0,calc(var(--sy,0px) * var(--ps,0)),0);will-change:transform}
@media (prefers-reduced-motion: reduce){.rv,.rv.rv-up{opacity:1;transform:none;transition:none}.par{transform:none}}
`+`
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
.d-link{color:var(--muted);text-decoration:none}
.d-link:hover{color:#115E59}
@media (prefers-reduced-motion: reduce){.d-float,.d-float2,.d-enter{animation:none}.d-card:hover{transform:none}}
`;

const login = () => {
  window.location.href = "/api/login";
};

const card = (c: string): CSSProperties => ({
  height: 34,
  borderRadius: 10,
  background: "var(--surface)",
  boxShadow: "0 3px 0 var(--edge)",
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

/** Scroll-linked reveal: animates in when entering the viewport and out when leaving (up or down). */
function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"in" | "up" | "down">("down");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setState("in");
        else setState(e.boundingClientRect.top < 0 ? "up" : "down");
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cls = state === "in" ? "rv rv-in" : state === "up" ? "rv rv-up" : "rv";
  return (
    <div ref={ref} className={cls} style={{ ["--d" as string]: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/** Parallax layer: moves at `speed` x scroll offset (negative = drifts up faster). */
function Par({ speed, children, style, className = "" }: { speed: number; children?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={`par ${className}`} style={{ ["--ps" as string]: speed, ...style }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const [m, setM] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("lp-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const toggleTheme = () =>
    setTheme((t) => {
      const n = t === "dark" ? "light" : "dark";
      localStorage.setItem("lp-theme", n);
      return n;
    });

  // Drive parallax: one rAF-throttled scroll listener sets --sy on the root.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      rootRef.current?.style.setProperty("--sy", `${window.scrollY}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
      ref={rootRef}
      className="lp"
      data-theme={theme}
      style={{
        width: "100%",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--text)",
        background: "var(--bg)",
        minHeight: "100vh",
        position: "relative",
        WebkitFontSmoothing: "antialiased",
        overflowX: "clip",
      }}
    >
      <style>{css}</style>

      {/* parallax background blobs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <Par speed={0.25} style={{ position: "absolute", top: 80, left: -160, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, var(--blob1), transparent 68%)" }} />
        <Par speed={0.12} style={{ position: "absolute", top: 520, right: -200, width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, var(--blob2), transparent 68%)" }} />
        <Par speed={0.3} style={{ position: "absolute", top: 1500, left: -120, width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, var(--blob1), transparent 68%)" }} />
        <Par speed={0.18} style={{ position: "absolute", top: 2300, right: -160, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, var(--blob2), transparent 68%)" }} />
      </div>

      {/* NAV */}
      <header style={{ ...section, padding: "20px 24px", position: "relative", zIndex: 2 }}>
        <nav
          aria-label="Main"
          style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
            padding: "10px 12px 10px 14px", borderRadius: 20, background: "var(--surface)",
            boxShadow: "0 1px 0 var(--hi) inset, 0 10px 30px -12px rgba(15,23,42,0.18), 0 2px 0 var(--edge)",
          }}
        >
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none" }}>
            <img src={dino} alt="Requisor dino logo" style={{ width: 42, height: 42, borderRadius: "50%", display: "block", boxShadow: "0 6px 14px -4px rgba(15,118,110,0.45)" }} />
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Requisor CRM</span>
          </a>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 26, fontSize: 15, fontWeight: 500 }}>
            <a className="d-link" href="#features">Product</a>
            <a className="d-link" href="#how">How it works</a>
            <a className="d-link" href="#pricing">Pricing</a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              style={{ width: 44, height: 44, borderRadius: 12, border: 0, cursor: "pointer", background: "var(--chip)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 var(--edge2)" }}
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <button onClick={login} style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)", padding: "10px 14px", background: "none", border: 0, cursor: "pointer" }}>
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
        <Par speed={-0.06} style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 24 }}>
          <span className="d-enter" style={{ animationDelay: ".05s", alignSelf: "flex-start", fontSize: 13, fontWeight: 700, color: "var(--accentText)", background: "var(--surface)", padding: "7px 14px", borderRadius: 999, boxShadow: "0 3px 0 var(--edge), 0 8px 16px -8px rgba(15,23,42,0.2)" }}>
            The CRM for growing sales teams
          </span>
          <h1 className="d-enter" style={{ animationDelay: ".15s", margin: 0, fontSize: "clamp(2.6rem, 5vw, 4.2rem)", lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.04em" }}>
            Sales, with a little more depth.
          </h1>
          <p className="d-enter" style={{ animationDelay: ".25s", margin: 0, maxWidth: 500, fontSize: 19, lineHeight: 1.6, color: "var(--muted)" }}>
            Contacts, deals and next steps stacked into one workspace your whole team can see into.
          </p>
          <div className="d-enter" style={{ animationDelay: ".35s", display: "flex", flexWrap: "wrap", gap: 14 }}>
            <button onClick={login} className="d-press" style={{ ...primaryBtn, fontSize: 16, padding: "15px 26px", borderRadius: 14, minHeight: 50, boxShadow: `0 6px 0 ${ACCENT_DEEP}, 0 18px 30px -12px rgba(15,118,110,0.55)` }}>
              Start free trial
            </button>
            <a href="#pricing" className="d-press" style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", background: "var(--surface)", padding: "15px 26px", borderRadius: 14, minHeight: 50, boxSizing: "border-box", display: "inline-flex", alignItems: "center", boxShadow: "0 6px 0 var(--edge2), 0 18px 30px -14px rgba(15,23,42,0.25)" }}>
              Book a demo
            </a>
          </div>
          <p className="d-enter" style={{ animationDelay: ".45s", margin: 0, fontSize: 14, color: "var(--muted2)" }}>
            14-day free trial · No credit card required
          </p>
        </Par>

        {/* 3D scene */}
        <Par speed={0.08} style={{ flex: "1 1 500px", height: 520 }}><div className="d-enter" style={{ animationDelay: ".3s", height: "100%", perspective: 1400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={sceneStyle}>
            <div style={{ position: "absolute", left: 40, top: 60, width: 440, height: 360, borderRadius: 26, background: "var(--surface)", boxShadow: "0 2px 0 var(--hi) inset, 0 14px 0 var(--edge), 0 50px 80px -30px rgba(15,23,42,0.45)", transform: "translateZ(0)", padding: 22, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Q4 Pipeline</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accentText)", background: "var(--chipAccent)", padding: "4px 10px", borderRadius: 999 }}>$412.6K</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, flex: 1 }}>
                {cols.map((c) => (
                  <div key={c.name} style={{ borderRadius: 14, background: "var(--chip)", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{c.name}</span>
                    {Array.from({ length: c.n }).map((_, i) => (
                      <div key={i} style={card(c.color)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="d-float" style={{ position: "absolute", left: -10, top: 0, transformStyle: "preserve-3d" }}>
              <div style={{ transform: "translateZ(90px)", width: 190, borderRadius: 20, background: "var(--surface)", padding: "16px 18px", boxShadow: "0 10px 0 var(--edge), 0 30px 50px -20px rgba(15,23,42,0.4)", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: "var(--muted2)" }}>Win rate</span>
                <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>34%</span>
                <div style={{ height: 8, borderRadius: 999, background: "var(--chip2)" }}>
                  <div style={{ width: "34%", height: "100%", borderRadius: 999, background: ACCENT }} />
                </div>
              </div>
            </div>

            <div className="d-float2" style={{ position: "absolute", right: -10, bottom: 40, transformStyle: "preserve-3d" }}>
              <div style={{ transform: "translateZ(130px)", width: 220, borderRadius: 20, background: "var(--dark)", color: "#FFFFFF", padding: "16px 18px", boxShadow: "0 10px 0 #020617, 0 30px 50px -20px rgba(15,23,42,0.6)", display: "flex", alignItems: "center", gap: 12 }}>
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
        </div></Par>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ ...section, position: "relative", zIndex: 1, padding: "24px 24px 96px" }}>
        <Reveal><h2 style={{ margin: "0 0 12px", textAlign: "center", fontSize: "clamp(2rem, 3.4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Built in layers.</h2>
        <p style={{ margin: "0 auto 48px", maxWidth: 560, textAlign: "center", fontSize: 18, lineHeight: 1.6, color: "var(--muted)" }}>
          Your data, your pipeline and your reports, stacked so each one feeds the next.
        </p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
          {features.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.12}>
            <article className="d-card" style={{ padding: 30, borderRadius: 24, background: "var(--surface)", boxShadow: "0 2px 0 var(--hi) inset, 0 10px 0 var(--edge), 0 30px 50px -24px rgba(15,23,42,0.30)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={f.tile}><span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{f.n}</span></div>
              <h3 style={{ margin: "6px 0 0", fontSize: 21, fontWeight: 800, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--muted)" }}>{f.body}</p>
            </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{ ...section, position: "relative", zIndex: 1, padding: "0 24px 96px" }}>
        <Reveal><div style={{ borderRadius: 32, padding: "56px 40px", background: "var(--dark)", color: "#FFFFFF", boxShadow: "0 14px 0 var(--darkEdge), 0 50px 80px -30px rgba(15,23,42,0.6)" }}>
          <h2 style={{ margin: "0 0 40px", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Up and running in an afternoon.</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {steps.map((s, i) => (
              <li key={s.n} style={{ padding: 24, borderRadius: 20, background: "var(--dark2)", boxShadow: "0 6px 0 #020617", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "#2DD4BF", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 #0F766E" }}>{s.n}</span>
                <span style={{ fontSize: 19, fontWeight: 700 }}>{s.title}</span>
                <span style={{ fontSize: 15, lineHeight: 1.6, color: "#B8C1CF" }}>{s.body}</span>
              </li>
            ))}
          </ol>
        </div></Reveal>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ ...section, position: "relative", zIndex: 1, padding: "0 24px 96px" }}>
        <Reveal><h2 style={{ margin: "0 0 40px", textAlign: "center", fontSize: "clamp(2rem, 3.4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Simple pricing.</h2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, alignItems: "end" }}>
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12}>
            <div
              className="d-card"
              style={{
                padding: p.hot ? "44px 30px" : 30,
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "var(--surface)",
                boxShadow: p.hot
                  ? `0 0 0 3px ${ACCENT}, 0 16px 0 var(--edge), 0 40px 60px -24px rgba(15,23,42,0.35)`
                  : "0 10px 0 var(--edge), 0 30px 50px -24px rgba(15,23,42,0.28)",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</span>
              <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.price}</span>
              <span style={{ fontSize: 14, color: "var(--muted2)" }}>{p.unit}</span>
              <button
                onClick={login}
                className="d-press"
                style={{
                  marginTop: 14, fontSize: 15, fontWeight: 700, padding: "13px 18px", borderRadius: 12, minHeight: 48,
                  boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", border: 0,
                  color: p.hot ? "#FFFFFF" : "var(--text)",
                  background: p.hot ? ACCENT : "var(--chip)",
                  boxShadow: p.hot ? `0 5px 0 ${ACCENT_DEEP}` : "0 5px 0 var(--edge2)",
                }}
              >
                {p.button}
              </button>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="trial" style={{ ...section, position: "relative", zIndex: 1, padding: "0 24px 80px" }}>
        <Reveal><div style={{ borderRadius: 32, padding: "56px 40px", background: ACCENT, color: "#FFFFFF", boxShadow: `0 14px 0 ${ACCENT_DEEP}, 0 50px 80px -30px rgba(15,118,110,0.6)`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Give your pipeline some depth.</h2>
            <p style={{ margin: 0, fontSize: 18, color: "#D7F5F0" }}>Import contacts, set your stages, start closing.</p>
          </div>
          <button onClick={login} className="d-press" style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", background: "#FFFFFF", padding: "15px 26px", borderRadius: 14, minHeight: 50, boxSizing: "border-box", display: "inline-flex", alignItems: "center", border: 0, boxShadow: "0 6px 0 #B7D9D3" }}>
            Start free trial
          </button>
        </div></Reveal>
      </section>

      <footer style={{ ...section, position: "relative", zIndex: 1, padding: "24px 24px 40px", borderTop: "1px solid var(--edge)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, fontSize: 13, color: "var(--muted2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={dino} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          © 2026 Requisor CRM. A Citrus Innovations company.
        </span>
        <span>Privacy · Terms</span>
      </footer>
    </div>
  );
}
