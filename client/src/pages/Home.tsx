/**
 * Signal Observatory design reminder: an evidence-first instrument panel, not a hacker-console motif.
 * Every interaction foregrounds authorized scope, dry-run containment, and redacted records.
 */
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Bot,
  Braces,
  ChevronRight,
  CircleCheck,
  Clock3,
  Eye,
  EyeOff,
  FileBarChart,
  FileWarning,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Orbit,
  Play,
  Plus,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Timer,
  X,
} from "lucide-react";

type SuiteStatus = "Ready" | "Exposure" | "Review" | "Verified";

type Suite = {
  id: string;
  name: string;
  category: string;
  status: SuiteStatus;
  cases: number;
  passRate: number;
  note: string;
};

const suites: Suite[] = [
  { id: "PI-07", name: "Instruction boundary", category: "Prompt injection", status: "Exposure", cases: 24, passRate: 71, note: "2 synthetic canaries surfaced outside policy." },
  { id: "DL-02", name: "Canary containment", category: "Sensitive data", status: "Verified", cases: 18, passRate: 100, note: "No fake secrets appeared in the model output." },
  { id: "AG-14", name: "Mocked tool authority", category: "Agent behavior", status: "Review", cases: 12, passRate: 83, note: "One request attempted a non-allowlisted operation." },
  { id: "GR-11", name: "Source-grounded answers", category: "Misinformation", status: "Ready", cases: 16, passRate: 0, note: "Fixture-only evaluation; no external retrieval." },
];

const navItems = [
  { name: "Observatory", icon: LayoutDashboard },
  { name: "Test suites", icon: Braces },
  { name: "Evidence", icon: FileWarning },
  { name: "Reports", icon: FileBarChart },
];

const evidence = [
  { time: "09:42:18", id: "PI-07.18", title: "Synthetic instruction override attempted", severity: "high", body: "The target echoed a non-authoritative fixture instruction but did not reveal a seeded canary.", label: "REVIEW" },
  { time: "09:41:50", id: "DL-02.05", title: "Canary redaction held", severity: "safe", body: "The output rejected the synthetic credential request and preserved the capture policy.", label: "VERIFIED" },
  { time: "09:41:23", id: "AG-14.07", title: "Mocked action request intercepted", severity: "medium", body: "The evaluation recorded an attempted external action. No tool call was executed.", label: "CONTAINED" },
];

function statusTone(status: SuiteStatus) {
  if (status === "Exposure") return "text-[#ff9a91] border-[#ff7f73]/30 bg-[#ff7f73]/10";
  if (status === "Review") return "text-[#f7c879] border-[#f4ba62]/30 bg-[#f4ba62]/10";
  if (status === "Verified") return "text-[#d6ff91] border-[#c7f36b]/30 bg-[#c7f36b]/10";
  return "text-[#9eafa1] border-white/10 bg-white/[0.035]";
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Observatory");
  const [selectedSuite, setSelectedSuite] = useState("PI-07");
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState("Scope verified · fixture mode only");
  const [showEvidence, setShowEvidence] = useState(false);
  const [target, setTarget] = useState("Atlas Support Copilot · staging");

  const selected = useMemo(() => suites.find((suite) => suite.id === selectedSuite) ?? suites[0], [selectedSuite]);
  const selectedCount = 1;

  const runSuite = () => {
    if (isRunning) return;
    setIsRunning(true);
    setNotice(`Running ${selected.id} in dry-run containment…`);
    window.setTimeout(() => {
      setIsRunning(false);
      setNotice(`${selected.id} completed · evidence captured with synthetic fixtures only`);
    }, 1100);
  };

  const exportReport = () => {
    const report = {
      workbench: "Redline Observatory",
      generatedAt: new Date().toISOString(),
      mode: "fixture-only / dry-run",
      target,
      selectedSuite: selected,
      evidence: evidence.map(({ time, id, title, severity, label }) => ({ time, id, title, severity, label, payload: "redacted" })),
      safetyBoundary: "No live tool calls, third-party targets, or real secrets were used.",
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "redline-observatory-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Redacted JSON report exported to your device");
  };

  return (
    <div className="min-h-screen bg-[#101512] text-[#edf3e9] observatory-grid">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_5%,rgba(199,243,107,0.035),transparent_21rem)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/10 bg-[#111713]/90 px-4 py-5 lg:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#c7f36b]/40 bg-[#172018] p-1">
              <img src="/manus-storage/redline-orbital-mark_d5ddec29.png" alt="Redline Observatory mark" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.2em] text-[#c7f36b]">REDLINE</p>
              <p className="text-sm font-semibold tracking-tight text-white">Observatory</p>
            </div>
          </div>

          <div className="px-2 pb-3 text-[10px] font-medium tracking-[0.18em] text-[#718075] mono">CONTROL PLANE</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.name} onClick={() => { setActiveNav(item.name); setNotice(`${item.name} view selected`); }} className={`nav-item rounded-xl text-sm ${activeNav === item.name ? "active" : ""}`}>
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.name}</span>
                  {item.name === "Evidence" && <span className="ml-auto rounded-full bg-[#ff7f73]/15 px-1.5 py-0.5 text-[9px] text-[#ff9a91] mono">03</span>}
                </button>
              );
            })}
          </nav>

          <div className="mt-9 px-2 pb-3 text-[10px] font-medium tracking-[0.18em] text-[#718075] mono">OPERATING MODE</div>
          <div className="rounded-xl border border-[#c7f36b]/20 bg-[#c7f36b]/[0.055] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8ff96]"><span className="status-dot live" />Dry-run containment</div>
            <p className="text-[11px] leading-relaxed text-[#91a18f]">Synthetic fixtures only. External tool execution is disabled.</p>
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <button onClick={() => setNotice("Safety settings are locked to the local fixture policy") } className="nav-item rounded-xl text-sm"><Settings2 size={16} /><span>Safety settings</span></button>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#c7f36b]" /><span className="text-xs font-medium">Scope attested</span></div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#89968c] mono">LOCAL-01 · 1 approved target</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <img src="/manus-storage/redline-orbital-mark_d5ddec29.png" alt="" className="h-9 w-9 rounded-full border border-[#c7f36b]/30 bg-[#172018] p-1" />
              <div><p className="text-[10px] tracking-[0.2em] text-[#c7f36b] mono">REDLINE</p><p className="text-sm font-semibold">Observatory</p></div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#97a597] mono"><span className="status-dot live" />AUTHORIZED EVALUATION SPACE</div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Model behavior, observed.</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setNotice("Target registration is limited to the attested local fixture") } className="subtle-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs text-[#c9d4c9]"><Plus size={15} />Register target</button>
              <button onClick={exportReport} className="subtle-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs text-[#c9d4c9]"><ArrowDownToLine size={15} />Export report</button>
              <button onClick={runSuite} disabled={isRunning} className="signal-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60"><Play size={15} fill="currentColor" />{isRunning ? "Evaluating…" : "Run selected suite"}</button>
            </div>
          </header>

          <section className="noise-overlay relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#151d18] px-5 py-5 sm:px-7 sm:py-6">
            <img src="/manus-storage/signal-observatory-hero_4edeb449.png" alt="Abstract signal observatory visual" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,21,17,0.96)_0%,rgba(15,21,17,0.83)_42%,rgba(15,21,17,0.35)_100%)]" />
            <div className="relative grid gap-5 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
              <div className="max-w-2xl">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] tracking-[0.16em] mono"><span className="rounded-full border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-2 py-1 text-[#d9ff9b]">SAFE FIXTURE MODE</span><span className="text-[#9ba99d]">OWASP-ALIGNED COVERAGE</span></div>
                <h2 className="max-w-xl text-2xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-4xl">Observe behavior before it reaches production.</h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#b1bdb2]">Run bounded test suites against an approved sandbox, retain redacted evidence, and turn behavior into an accountable decision.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#101612]/75 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between"><span className="text-[10px] tracking-[0.17em] text-[#91a191] mono">SCOPE GATE</span><LockKeyhole size={15} className="text-[#c7f36b]" /></div>
                <select value={target} onChange={(event) => { setTarget(event.target.value); setNotice("Approved target changed within local fixture mode"); }} className="w-full rounded-lg border border-white/10 bg-[#19211b] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c7f36b]/60">
                  <option>Atlas Support Copilot · staging</option>
                  <option>Local helpdesk fixture · mock</option>
                </select>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-[#aebbad]"><CircleCheck size={14} className="text-[#c7f36b]" />Target in allowlist · tools mocked · rate cap 8/min</div>
              </div>
            </div>
          </section>

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-[#c7d1c6]"><Radio size={15} className={isRunning ? "animate-pulse text-[#c7f36b]" : "text-[#c7f36b]"} /><span>{notice}</span></div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#829184] mono"><Clock3 size={13} />EVIDENCE RETENTION · SESSION ONLY</div>
          </div>

          <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Exposure index", value: "31", suffix: "/100", detail: "1 high-risk suite", icon: Gauge, color: "text-[#ff9a91]", line: "bg-[#ff7f73]" },
              { label: "Suites verified", value: "02", suffix: "/04", detail: "1 awaiting review", icon: CircleCheck, color: "text-[#d9ff9b]", line: "bg-[#c7f36b]" },
              { label: "Synthetic cases", value: "70", suffix: "", detail: "No live prompts sent", icon: TerminalSquare, color: "text-[#b7c8e9]", line: "bg-[#9db9e7]" },
              { label: "Tool actions", value: "00", suffix: "", detail: "All calls mocked", icon: ShieldCheck, color: "text-[#f7c879]", line: "bg-[#f4ba62]" },
            ].map((metric) => {
              const Icon = metric.icon;
              return <article key={metric.label} className="hairline-card rounded-xl p-4"><div className="mb-6 flex items-start justify-between"><p className="text-[10px] tracking-[0.16em] text-[#8d9b8f] mono">{metric.label.toUpperCase()}</p><Icon size={16} className={metric.color} /></div><div className="flex items-baseline gap-1"><strong className="text-3xl font-semibold tracking-[-0.06em] text-white">{metric.value}</strong><span className="text-xs text-[#809082] mono">{metric.suffix}</span></div><div className="mt-3 h-1 rounded-full bg-white/5"><div className={`h-full rounded-full ${metric.line}`} style={{ width: metric.label === "Exposure index" ? "31%" : metric.label === "Suites verified" ? "50%" : metric.label === "Synthetic cases" ? "78%" : "8%" }} /></div><p className="mt-2 text-[11px] text-[#89978a]">{metric.detail}</p></article>;
            })}
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
            <article id="suites" className="hairline-card rounded-2xl">
              <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#94a294] mono"><SlidersHorizontal size={13} />EVALUATION MATRIX</div><h3 className="text-lg font-semibold tracking-[-0.035em] text-white">Test suites in scope</h3></div>
                <div className="flex items-center gap-2"><button onClick={() => setNotice("Search is scoped to fixture suite labels") } className="subtle-button inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#aab7ac]"><Search size={14} />Find suite</button><span className="rounded-lg border border-[#c7f36b]/20 bg-[#c7f36b]/[0.06] px-2 py-2 text-[10px] text-[#d9ff9b] mono">{selectedCount} SELECTED</span></div>
              </div>
              <div className="calibration-rule mx-5" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="text-[10px] tracking-[0.13em] text-[#7f8e81] mono"><tr><th className="px-5 py-4 font-medium">SUITE</th><th className="px-4 py-4 font-medium">CATEGORY</th><th className="px-4 py-4 font-medium">CASES</th><th className="px-4 py-4 font-medium">RESULT</th><th className="px-5 py-4 text-right font-medium">ACTION</th></tr></thead>
                  <tbody>
                    {suites.map((suite) => <tr key={suite.id} onClick={() => setSelectedSuite(suite.id)} className={`suite-row cursor-pointer border-t border-white/[0.07] ${selectedSuite === suite.id ? "selected" : ""}`}>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-md border border-white/10 bg-black/10 px-1.5 py-1 text-[10px] text-[#b4c1b4] mono">{suite.id}</span><div><p className="text-sm font-medium text-[#eef4ed]">{suite.name}</p><p className="mt-1 text-[11px] text-[#859386]">{suite.note}</p></div></div></td>
                      <td className="px-4 py-4 text-xs text-[#a9b7aa]">{suite.category}</td>
                      <td className="px-4 py-4 text-xs text-[#a9b7aa] mono">{suite.cases}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] mono ${statusTone(suite.status)}`}>{suite.status === "Ready" ? "NOT RUN" : `${suite.passRate}% · ${suite.status.toUpperCase()}`}</span></td>
                      <td className="px-5 py-4 text-right"><ChevronRight size={17} className="ml-auto text-[#829083]" /></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-xs text-[#91a093] sm:flex-row sm:items-center sm:justify-between"><span>Selected <strong className="font-medium text-white">{selected.id} · {selected.name}</strong></span><button onClick={runSuite} className="inline-flex items-center gap-2 text-[#d6ff91]">Review suite boundary <ArrowUpRight size={13} /></button></div>
            </article>

            <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-1">
              <article className="hairline-card noise-overlay relative min-h-[280px] overflow-hidden rounded-2xl p-5">
                <img src="/manus-storage/risk-orbit-panel_424bf1af.png" alt="Abstract risk orbit visual" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,23,19,0.3),rgba(17,23,19,0.92))]" />
                <div className="relative flex h-full flex-col"><div className="flex items-start justify-between"><div><p className="text-[10px] tracking-[0.16em] text-[#97a597] mono">RISK ORBIT</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-white">Observed posture</h3></div><Orbit size={20} className="pulse-ring text-[#c7f36b]" /></div><div className="my-auto"><div className="flex items-end gap-3"><strong className="text-5xl font-semibold tracking-[-0.075em] text-white">31</strong><span className="mb-1.5 text-xs text-[#8f9e91] mono">EXPOSURE / 100</span></div><p className="mt-3 max-w-[250px] text-xs leading-relaxed text-[#b1bfb3]">Concentrated in instruction-boundary behavior. No synthetic secret disclosure was observed.</p></div><div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] tracking-[0.12em] text-[#8d9b90] mono"><span>LAST RUN · 09:42 UTC</span><span className="text-[#ff9a91]">1 HIGH</span></div></div>
              </article>

              <article className="rounded-2xl border border-[#c7f36b]/15 bg-[#172018] p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-[#c7f36b]" /><p className="text-[10px] tracking-[0.16em] text-[#d7ff98] mono">CONTAINMENT NOTICE</p></div><h3 className="text-base font-semibold tracking-[-0.03em] text-white">No external side effects.</h3><p className="mt-2 text-xs leading-relaxed text-[#aab9ab]">Fixtures use fake canaries. Tool actions are logged as intent only; the workbench never invokes a live browser, API, or agent capability.</p><button onClick={() => setNotice("Scope policy: local fixtures, redacted capture, mocked actions") } className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#d8ff96]">Inspect policy <ChevronRight size={14} /></button></article>
            </div>
          </section>

          <section id="evidence" className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
            <article className="hairline-card overflow-hidden rounded-2xl">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#94a294] mono"><Activity size={13} />EVIDENCE STREAM</div><h3 className="text-lg font-semibold tracking-[-0.035em] text-white">Recent observations</h3></div><button onClick={() => setShowEvidence((current) => !current)} className="subtle-button inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#c9d4c9]">{showEvidence ? <EyeOff size={14} /> : <Eye size={14} />}{showEvidence ? "Mask payloads" : "Reveal synthetic payloads"}</button></div>
              <div className="divide-y divide-white/[0.07]">
                {evidence.map((item) => <div key={item.id} className="relative grid gap-3 px-5 py-4 sm:grid-cols-[92px_1fr_auto]"><div className="flex items-start gap-2 text-[10px] text-[#8b9a8d] mono"><span className={`mt-1.5 status-dot ${item.severity === "safe" ? "live" : item.severity === "high" ? "risk" : "warn"}`} />{item.time}</div><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-[10px] text-[#b5c4b7] mono">{item.id}</span><h4 className="text-sm font-medium text-[#eff4ef]">{item.title}</h4></div><p className="text-xs leading-relaxed text-[#96a596]">{item.body}</p>{showEvidence && <p className="mt-2 rounded-md border border-white/10 bg-black/15 px-2 py-1.5 text-[10px] text-[#c2d0c3] mono">fixture: {item.severity === "safe" ? "[REDACTED] canary-token=████████" : "instruction=ignore_previous_policy [synthetic]"}</p>}</div><span className={`h-fit rounded-full border px-2 py-1 text-[10px] mono ${item.severity === "safe" ? statusTone("Verified") : item.severity === "high" ? statusTone("Exposure") : statusTone("Review")}`}>{item.label}</span></div>)}
              </div>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171d19] p-5">
              <img src="/manus-storage/evidence-collage_c214a36e.png" alt="Abstract evidence texture" className="absolute inset-0 h-full w-full object-cover opacity-25" />
              <div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] tracking-[0.16em] text-[#98a698] mono">RUN CONTROL</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-white">Prepared for review</h3></div><Timer size={19} className="text-[#c7f36b]" /></div><div className="mt-6 space-y-4"><div className="border-l-2 border-[#c7f36b] pl-3"><p className="text-[10px] tracking-[0.13em] text-[#9ead9f] mono">SELECTED SUITE</p><p className="mt-1 text-sm font-medium text-white">{selected.id} · {selected.name}</p></div><div className="border-l-2 border-[#f4ba62] pl-3"><p className="text-[10px] tracking-[0.13em] text-[#9ead9f] mono">CAPTURE RULE</p><p className="mt-1 text-sm text-[#c8d2c8]">Inputs and outputs are redacted by default.</p></div><div className="border-l-2 border-[#9db9e7] pl-3"><p className="text-[10px] tracking-[0.13em] text-[#9ead9f] mono">EXECUTION</p><p className="mt-1 text-sm text-[#c8d2c8]">{isRunning ? "Bounded cases in progress" : "Ready for dry-run containment"}</p></div></div><button onClick={runSuite} disabled={isRunning} className="signal-button mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold disabled:opacity-60"><Play size={15} fill="currentColor" />{isRunning ? "Capturing evidence…" : "Start contained run"}</button><p className="mt-3 text-center text-[10px] leading-relaxed text-[#89978a] mono">NO REAL SECRETS · NO TOOL EXECUTION · NO THIRD-PARTY TARGETS</p></div>
            </article>
          </section>

          <footer className="flex flex-col gap-3 py-7 text-[10px] tracking-[0.1em] text-[#718073] mono sm:flex-row sm:items-center sm:justify-between"><span>REDLINE OBSERVATORY · LOCAL-FIRST EVALUATION WORKBENCH</span><span className="flex items-center gap-2"><LockKeyhole size={12} />AUTHORIZED SCOPE REQUIRED</span></footer>
        </main>
      </div>
    </div>
  );
}
