import { MoonIcon, SunIcon } from "../components/icons";

export default function LandingPage({ onLogin, onRegister, darkMode = true, onToggleDarkMode }) {
  const theme = darkMode ? DARK : LIGHT;

  return (
    <div style={{ ...styles.page, background: theme.pageBg, color: theme.text }}>
      <nav style={{ ...styles.nav, borderBottomColor: theme.border }}>
        <div style={{ ...styles.wordmark, color: theme.text }}>Fleet<span style={styles.logoAccent}>Flow</span></div>
        <div style={styles.navLinks}>
          <a href="#platform" style={{ color: theme.muted }}>Platform</a>
          <a href="#workflow" style={{ color: theme.muted }}>Workflow</a>
          <button style={{ ...styles.modeButton, color: theme.muted }} onClick={onToggleDarkMode}>
            {darkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
          <button style={{ ...styles.login, color: theme.text }} onClick={onLogin}>Sign in</button>
          <button style={styles.navCta} onClick={onRegister}>Start operating</button>
        </div>
      </nav>

      <main>
        <section style={styles.hero}>
          <div style={{ ...styles.eyebrow, color: theme.accent }}>
            <span style={styles.liveDot} /> THE OPERATING SYSTEM FOR MODERN FLEETS
          </div>
          <h1 style={{ ...styles.heading, color: theme.heading }}>
            Move freight with <span style={styles.gradientText}>confidence.</span>
          </h1>
          <p style={{ ...styles.subtitle, color: theme.muted }}>
            FleetFlow brings shipments, people, vehicles, and decisions into one
            calm command center built for the pace of logistics.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.primaryCta} onClick={onRegister}>Build your workspace</button>
            <button style={{ ...styles.secondaryCta, color: theme.text, borderColor: theme.border }} onClick={onLogin}>
              Explore the console
            </button>
          </div>
          <div id="platform" style={styles.trustLine}><span>BUILT FOR TEAMS THAT RUN THE ROAD</span><i /> Real-time visibility · Less busywork · Faster handoffs</div>
        </section>

        <section id="workflow" style={styles.previewWrap}>
          <div style={{ ...styles.preview, borderColor: theme.border, background: theme.panel }}>
            <div style={styles.previewTop}>
              <div><span style={styles.previewKicker}>TODAY / OPERATIONS</span><h2 style={{ color: theme.heading }}>Good morning, operator.</h2></div>
              <div style={styles.statusPill}><span style={styles.liveDot} /> All systems live</div>
            </div>
            <div style={styles.previewGrid}>
              {[
                ["ACTIVE SHIPMENTS", "128", "+12.4%", "#38BDF8"],
                ["IN TRANSIT", "46", "+8.1%", "#A78BFA"],
                ["ON-TIME RATE", "94.8%", "+2.6%", "#34D399"],
              ].map(([label, value, change, color]) => (
                <div key={label} style={{ ...styles.metric, borderColor: theme.border }}>
                  <span style={{ ...styles.metricLabel, color: theme.muted }}>{label}</span>
                  <strong style={{ color: theme.heading }}>{value}</strong>
                  <span style={{ color }}>{change}</span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.previewBottom, borderColor: theme.border }}>
              <div style={styles.routeList}>
                <div style={{ ...styles.previewKicker, color: theme.muted }}>LIVE DISPATCH BOARD</div>
                {["NV-204  ·  Oakland to Reno", "TR-118  ·  Dallas to Austin", "FL-092  ·  Miami to Atlanta"].map((route, index) => (
                  <div key={route} style={{ ...styles.route, borderColor: theme.border }}>
                    <span style={{ ...styles.routeBadge, color: ["#34D399", "#38BDF8", "#FBBF24"][index] }}>0{index + 1}</span>
                    <span style={{ color: theme.text }}>{route}</span>
                    <span style={{ color: theme.muted, marginLeft: "auto" }}>{["Arriving", "In transit", "Loading"][index]}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.chart, borderColor: theme.border }}>
                <div style={{ ...styles.previewKicker, color: theme.muted }}>THROUGHPUT / 7 DAYS</div>
                <div style={styles.bars}>{[32, 48, 42, 68, 58, 84, 76].map((height, index) => <i key={index} style={{ height: `${height}%`, background: index === 5 ? "#38BDF8" : theme.border }} />)}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer style={{ ...styles.footer, color: theme.muted }}>FLEETFLOW <span>•</span> THE CLEARER WAY TO MOVE</footer>
    </div>
  );
}

const LIGHT = { pageBg: "#F7F9FC", panel: "#FFFFFF", border: "#DCE3EF", text: "#334155", heading: "#0F172A", muted: "#64748B", accent: "#2563EB" };
const DARK = { pageBg: "#080B12", panel: "#0E1524", border: "#1E293B", text: "#CBD5E1", heading: "#F8FAFC", muted: "#8290A5", accent: "#38BDF8" };

const styles = {
  page: { minHeight: "100vh", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden" },
  nav: { maxWidth: "1240px", width: "100%", margin: "0 auto", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "flex-end", borderBottom: "1px solid", position: "relative", zIndex: 2 },
  wordmark: { marginRight: "auto", fontSize: "19px", fontWeight: "800", letterSpacing: "-.7px" },
  logo: { display: "flex", alignItems: "center", gap: "10px", fontSize: "19px", fontWeight: "800", letterSpacing: "-.7px" },
  logoMark: { width: "32px", height: "32px", display: "grid", placeItems: "center", borderRadius: "10px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", color: "#fff", fontSize: "16px" },
  logoAccent: { color: "#38BDF8" },
  navLinks: { display: "flex", alignItems: "center", gap: "22px", fontSize: "13px" },
  modeButton: { border: "none", padding: "7px", display: "grid", placeItems: "center" },
  login: { border: "none", fontWeight: "600", padding: "9px 2px" },
  navCta: { border: "none", borderRadius: "8px", padding: "10px 14px", background: "#1D4ED8", color: "#fff", fontWeight: "700", fontSize: "12px" },
  hero: { maxWidth: "920px", margin: "0 auto", padding: "104px 24px 70px", textAlign: "center" },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "10px", fontWeight: "800", letterSpacing: "1.8px", marginBottom: "24px" },
  liveDot: { display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#34D399", boxShadow: "0 0 0 4px rgba(52,211,153,.12)" },
  heading: { fontSize: "clamp(48px, 8vw, 88px)", lineHeight: ".98", letterSpacing: "-5px", margin: "0 auto 26px", maxWidth: "850px" },
  gradientText: { background: "linear-gradient(100deg,#60A5FA,#22D3EE 55%,#A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { maxWidth: "550px", margin: "0 auto", fontSize: "16px", lineHeight: "1.7" },
  heroActions: { display: "flex", justifyContent: "center", gap: "12px", marginTop: "34px", flexWrap: "wrap" },
  primaryCta: { border: "none", borderRadius: "9px", padding: "14px 20px", background: "linear-gradient(135deg,#2563EB,#0891B2)", color: "#fff", fontWeight: "700", fontSize: "13px" },
  secondaryCta: { border: "1px solid", borderRadius: "9px", padding: "13px 18px", background: "transparent", fontWeight: "700", fontSize: "13px" },
  trustLine: { marginTop: "54px", display: "flex", justifyContent: "center", gap: "12px", alignItems: "center", fontSize: "10px", letterSpacing: ".6px", opacity: .8 },
  previewWrap: { maxWidth: "1120px", margin: "0 auto", padding: "0 24px 56px" },
  preview: { border: "1px solid", borderRadius: "16px", padding: "25px", boxShadow: "0 30px 100px rgba(0,0,0,.24)", backgroundImage: "linear-gradient(135deg,rgba(56,189,248,.04),transparent 45%)" },
  previewTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "22px" },
  previewKicker: { fontSize: "9px", fontWeight: "800", letterSpacing: "1.4px", color: "#8290A5" },
  previewTopH2: { margin: "7px 0 0", fontSize: "22px" },
  statusPill: { display: "flex", gap: "8px", alignItems: "center", border: "1px solid #1E3A4B", borderRadius: "99px", padding: "7px 10px", color: "#7DD3FC", fontSize: "10px", fontWeight: "700" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" },
  metric: { border: "1px solid", borderRadius: "10px", padding: "15px", display: "grid", gap: "8px" },
  metricLabel: { fontSize: "9px", fontWeight: "800", letterSpacing: "1px" },
  metricValue: { fontSize: "27px", letterSpacing: "-1px" },
  previewBottom: { marginTop: "10px", borderTop: "1px solid", paddingTop: "22px", display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "22px" },
  routeList: { display: "grid", gap: "2px" },
  route: { display: "flex", alignItems: "center", gap: "10px", padding: "13px 0", borderBottom: "1px solid", fontSize: "12px" },
  routeBadge: { fontSize: "10px", fontWeight: "800" },
  chart: { minHeight: "150px", borderLeft: "1px solid", paddingLeft: "22px" },
  bars: { height: "110px", display: "flex", alignItems: "end", gap: "9px", paddingTop: "20px" },
  barsI: { display: "block", flex: 1, borderRadius: "4px 4px 0 0" },
  footer: { textAlign: "center", padding: "0 24px 30px", fontSize: "9px", letterSpacing: "1.8px", fontWeight: "800" },
};
