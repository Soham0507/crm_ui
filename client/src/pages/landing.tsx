import { useRef, type MouseEvent, type RefObject } from "react";
import { Check } from "lucide-react";
import mascot from "@assets/requisor-mascot.png";
import "./landing.css";

const SIGN_IN_URL = "/api/login";

// Resting angle of the 3D scene, and how far the pointer can tilt it (degrees).
const REST = { x: 14, y: -18 };
const TILT = 10;

const sceneTransform = (mx: number, my: number) =>
  `rotateX(${REST.x - my * TILT}deg) rotateY(${REST.y + mx * TILT * 1.6}deg)`;

// Illustrative board shown in the hero, not live data.
const pipelineColumns = [
  { name: "Qualified", cards: 3, color: "#94A3B8" },
  { name: "Proposal", cards: 2, color: "#3B82F6" },
  { name: "Negotiation", cards: 2, color: "#F59E0B" },
  { name: "Won", cards: 1, color: "#10B981" },
];

const features = [
  {
    title: "Contact management",
    body: "One structured record for every person and company, with a full activity timeline.",
    tile: "bg-[linear-gradient(145deg,#2DD4BF,#0F766E)] shadow-[0_6px_0_#0B4F4A,inset_0_2px_0_rgba(255,255,255,0.35)]",
  },
  {
    title: "Visual pipeline",
    body: "Drag deals through custom stages. Values and forecasts update as you go.",
    tile: "bg-[linear-gradient(145deg,#60A5FA,#1D4ED8)] shadow-[0_6px_0_#1E3A8A,inset_0_2px_0_rgba(255,255,255,0.35)]",
  },
  {
    title: "Reporting",
    body: "Win rate, pipeline value and rep activity on live dashboards.",
    tile: "bg-[linear-gradient(145deg,#FBBF24,#D97706)] shadow-[0_6px_0_#92400E,inset_0_2px_0_rgba(255,255,255,0.35)]",
  },
];

const steps = [
  { title: "Import your contacts", body: "Upload a CSV or spreadsheet and map columns automatically." },
  { title: "Set up your pipeline", body: "Name your stages, invite your team and assign owners." },
  { title: "Track and close", body: "Move deals forward and watch the dashboard update live." },
];

// TODO: replace [PRICE] with real prices before this page goes public.
const plans = [
  { name: "Starter", price: "[PRICE]", unit: "per user / month", button: "Start free trial", featured: false },
  { name: "Growth", price: "[PRICE]", unit: "per user / month", button: "Start free trial", featured: true },
  { name: "Enterprise", price: "Custom", unit: "Talk to us", button: "Talk to sales", featured: false },
];

const sectionHeading = "text-[clamp(2rem,3.4vw,2.75rem)] font-extrabold tracking-[-0.03em]";
const panelHeading = "text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em]";
const heroButton =
  "depth-press inline-flex min-h-[50px] items-center rounded-[14px] px-[26px] py-[15px] text-base font-bold";
const accentButton = "bg-[var(--accent-brand)] text-white";

function HeroScene({ sceneRef }: { sceneRef: RefObject<HTMLDivElement> }) {
  return (
    <div
      className="depth-enter depth-stage flex min-w-0 flex-[1_1_500px] items-center justify-center"
      style={{ animationDelay: ".3s" }}
      aria-hidden="true"
    >
      <div className="depth-scale">
        <div
          ref={sceneRef}
          className="relative h-[460px] w-[520px] [transform-style:preserve-3d] [transition:transform_.25s_ease-out]"
          style={{ transform: sceneTransform(0, 0) }}
        >
          {/* base board */}
          <div className="absolute left-10 top-[60px] flex h-[360px] w-[440px] flex-col gap-3.5 rounded-[26px] bg-white p-[22px] shadow-[inset_0_2px_0_#FFFFFF,0_14px_0_#DCE3EA,0_50px_80px_-30px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold">Q4 Pipeline</span>
              <span className="rounded-full bg-[#E6F4F1] px-2.5 py-1 text-xs font-bold text-[#0F766E]">$412.6K</span>
            </div>
            <div className="grid flex-1 grid-cols-4 gap-2.5">
              {pipelineColumns.map((column) => (
                <div key={column.name} className="flex flex-col gap-2 rounded-[14px] bg-[#F2F5F9] p-2">
                  <span className="text-[11px] font-bold text-[#475467]">{column.name}</span>
                  {Array.from({ length: column.cards }, (_, index) => (
                    <div
                      key={index}
                      className="h-[34px] rounded-[10px] border-l-4 bg-white shadow-[0_3px_0_#DCE3EA]"
                      style={{ borderLeftColor: column.color }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* floating stat cards */}
          <div className="depth-float absolute -left-2.5 top-0 [transform-style:preserve-3d]">
            <div className="flex w-[190px] flex-col gap-1 rounded-[20px] bg-white px-[18px] py-4 shadow-[0_10px_0_#DCE3EA,0_30px_50px_-20px_rgba(15,23,42,0.4)] [transform:translateZ(90px)]">
              <span className="text-xs text-[#5B6474]">Win rate</span>
              <span className="text-3xl font-extrabold tracking-[-0.02em]">34%</span>
              <div className="h-2 rounded-full bg-[#EEF2F6]">
                <div className="h-full w-[34%] rounded-full bg-[var(--accent-brand)]" />
              </div>
            </div>
          </div>
          <div className="depth-float-down absolute -right-2.5 bottom-10 [transform-style:preserve-3d]">
            <div className="flex w-[220px] items-center gap-3 rounded-[20px] bg-[#0F172A] px-[18px] py-4 text-white shadow-[0_10px_0_#020617,0_30px_50px_-20px_rgba(15,23,42,0.6)] [transform:translateZ(130px)]">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#2DD4BF] text-[#0F172A]">
                <Check size={18} strokeWidth={2.6} />
              </span>
              <div>
                <div className="text-[13px] font-bold">Deal won</div>
                <div className="text-xs text-[#B8C1CF]">Atlas Logistics · $40,500</div>
              </div>
            </div>
          </div>

          {/* mascot */}
          <div
            className="depth-float absolute -top-[30px] right-2.5 [transform-style:preserve-3d]"
            style={{ animationDelay: "-2s" }}
          >
            <img
              src={mascot}
              alt=""
              className="block h-[150px] w-[150px] [filter:drop-shadow(0_24px_24px_rgba(15,23,42,0.30))] [transform:translateZ(170px)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const sceneRef = useRef<HTMLDivElement>(null);

  const tiltScene = (event: MouseEvent<HTMLElement>) => {
    if (!sceneRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const mx = (event.clientX - box.left) / box.width - 0.5;
    const my = (event.clientY - box.top) / box.height - 0.5;
    sceneRef.current.style.transform = sceneTransform(mx, my);
  };

  const resetScene = () => {
    if (sceneRef.current) sceneRef.current.style.transform = sceneTransform(0, 0);
  };

  return (
    <div className="landing w-full overflow-x-clip bg-[linear-gradient(180deg,#EAF4F2_0%,#F4F6FA_40%,#F4F6FA_100%)] text-[#0F172A]">
      {/* Navigation */}
      <header className="mx-auto max-w-[1200px] px-6 py-5">
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-white py-2.5 pl-3.5 pr-3 shadow-[inset_0_1px_0_#FFFFFF,0_10px_30px_-12px_rgba(15,23,42,0.18),0_2px_0_#DCE3EA]"
        >
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src={mascot}
              alt="Requisor dino logo"
              className="block h-[42px] w-[42px] rounded-full shadow-[0_6px_14px_-4px_rgba(15,118,110,0.45)]"
            />
            <span className="text-[17px] font-extrabold tracking-[-0.01em]">Requisor CRM</span>
          </a>
          <div className="flex flex-wrap gap-[26px] text-[15px] font-medium text-[#475467]">
            <a href="#features" className="hover:text-[#115E59]">Product</a>
            <a href="#how" className="hover:text-[#115E59]">How it works</a>
            <a href="#pricing" className="hover:text-[#115E59]">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={SIGN_IN_URL} className="px-3.5 py-2.5 text-[15px] font-semibold text-[#344054] hover:text-[#115E59]">
              Sign in
            </a>
            <a
              href={SIGN_IN_URL}
              className={`depth-press inline-flex min-h-[44px] items-center rounded-xl px-[18px] py-2.5 text-[15px] font-bold shadow-[0_5px_0_var(--accent-deep),0_12px_20px_-8px_rgba(15,118,110,0.5)] ${accentButton}`}
            >
              Start free trial
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section
          id="top"
          onMouseMove={tiltScene}
          onMouseLeave={resetScene}
          className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-24 pt-14"
        >
          <div className="flex flex-[1_1_440px] flex-col gap-6">
            <span
              className="depth-enter self-start rounded-full bg-white px-3.5 py-[7px] text-[13px] font-bold text-[#0F766E] shadow-[0_3px_0_#D3E3E0,0_8px_16px_-8px_rgba(15,23,42,0.2)]"
              style={{ animationDelay: ".05s" }}
            >
              The CRM for growing sales teams
            </span>
            <h1
              className="depth-enter text-[clamp(2.6rem,5vw,4.2rem)] font-extrabold leading-[1.04] tracking-[-0.04em]"
              style={{ animationDelay: ".15s" }}
            >
              Sales, with a little more depth.
            </h1>
            <p
              className="depth-enter max-w-[500px] text-[19px] leading-[1.6] text-[#475467]"
              style={{ animationDelay: ".25s" }}
            >
              Contacts, deals and next steps stacked into one workspace your whole team can see into.
            </p>
            <div className="depth-enter flex flex-wrap gap-3.5" style={{ animationDelay: ".35s" }}>
              <a
                href={SIGN_IN_URL}
                className={`${heroButton} shadow-[0_6px_0_var(--accent-deep),0_18px_30px_-12px_rgba(15,118,110,0.55)] ${accentButton}`}
              >
                Start free trial
              </a>
              {/* No booking page exists yet, so this scrolls to "How it works". */}
              <a href="#how" className={`${heroButton} bg-white shadow-[0_6px_0_#D5DCE4,0_18px_30px_-14px_rgba(15,23,42,0.25)]`}>
                Book a demo
              </a>
            </div>
            <p className="depth-enter text-sm text-[#5B6474]" style={{ animationDelay: ".45s" }}>
              14-day free trial · No credit card required
            </p>
          </div>

          <HeroScene sceneRef={sceneRef} />
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
          <h2 className={`mb-3 text-center ${sectionHeading}`}>Built in layers.</h2>
          <p className="mx-auto mb-12 max-w-[560px] text-center text-lg leading-[1.6] text-[#475467]">
            Your data, your pipeline and your reports, stacked so each one feeds the next.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-7">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="depth-card flex flex-col gap-3.5 rounded-3xl bg-white p-[30px] shadow-[inset_0_2px_0_#FFFFFF,0_10px_0_#DCE3EA,0_30px_50px_-24px_rgba(15,23,42,0.30)]"
              >
                <div className={`flex h-[54px] w-[54px] items-center justify-center rounded-2xl ${feature.tile}`}>
                  <span className="text-lg font-extrabold text-white">0{index + 1}</span>
                </div>
                <h3 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.01em]">{feature.title}</h3>
                <p className="text-base leading-[1.6] text-[#475467]">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1200px] px-6 pb-24">
          <div className="rounded-[32px] bg-[#0F172A] px-6 py-14 text-white shadow-[0_14px_0_#020617,0_50px_80px_-30px_rgba(15,23,42,0.6)] sm:px-10">
            <h2 className={`mb-10 ${panelHeading}`}>Up and running in an afternoon.</h2>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2.5 rounded-[20px] bg-[#1E293B] p-6 shadow-[0_6px_0_#020617]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DD4BF] font-extrabold text-[#0F172A] shadow-[0_4px_0_#0F766E]">
                    {index + 1}
                  </span>
                  <span className="text-[19px] font-bold">{step.title}</span>
                  <span className="text-[15px] leading-[1.6] text-[#B8C1CF]">{step.body}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-[1200px] px-6 pb-24">
          <h2 className={`mb-10 text-center ${sectionHeading}`}>Simple pricing.</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-end gap-7">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`depth-card flex flex-col gap-2 rounded-3xl bg-white px-[30px] ${
                  plan.featured
                    ? "py-11 shadow-[0_0_0_3px_var(--accent-brand),0_16px_0_#DCE3EA,0_40px_60px_-24px_rgba(15,23,42,0.35)]"
                    : "py-[30px] shadow-[0_10px_0_#DCE3EA,0_30px_50px_-24px_rgba(15,23,42,0.28)]"
                }`}
              >
                <span className="text-lg font-extrabold">{plan.name}</span>
                <span className="text-[38px] font-extrabold tracking-[-0.02em]">{plan.price}</span>
                <span className="text-sm text-[#5B6474]">{plan.unit}</span>
                {/* No sales contact page exists yet; the design points this at the final call to action. */}
                <a
                  href={plan.button === "Talk to sales" ? "#trial" : SIGN_IN_URL}
                  className={`depth-press mt-3.5 flex min-h-[48px] items-center justify-center rounded-xl px-[18px] py-[13px] text-[15px] font-bold ${
                    plan.featured
                      ? `shadow-[0_5px_0_var(--accent-deep)] ${accentButton}`
                      : "bg-[#F2F5F9] shadow-[0_5px_0_#D5DCE4]"
                  }`}
                >
                  {plan.button}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section id="trial" className="mx-auto max-w-[1200px] px-6 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-7 rounded-[32px] bg-[var(--accent-brand)] px-6 py-14 text-white shadow-[0_14px_0_var(--accent-deep),0_50px_80px_-30px_rgba(15,118,110,0.6)] sm:px-10">
            <div className="flex flex-[1_1_400px] flex-col gap-2.5">
              <h2 className={panelHeading}>Give your pipeline some depth.</h2>
              <p className="text-lg text-[#D7F5F0]">Import contacts, set your stages, start closing.</p>
            </div>
            <a href={SIGN_IN_URL} className={`${heroButton} !font-extrabold bg-white text-[#0F172A] shadow-[0_6px_0_#B7D9D3]`}>
              Start free trial
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-[#DCE3EA] px-6 pb-10 pt-6 text-[13px] text-[#5B6474]">
        <span className="flex items-center gap-2.5">
          <img src={mascot} alt="" className="h-7 w-7 rounded-full" />
          © 2026 Requisor CRM. A Citrus Innovations company.
        </span>
        <span>Privacy · Terms</span>
      </footer>
    </div>
  );
}
