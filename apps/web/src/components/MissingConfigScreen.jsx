export default function MissingConfigScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#F8FAFC",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          width: "100%",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: "20px", color: "#0F172A" }}>App Configuration Missing</h1>
        <p style={{ margin: "0 0 10px", color: "#334155", fontSize: "14px" }}>
          Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in apps/web/.env and restart the dev server.
        </p>
        <pre
          style={{
            margin: 0,
            padding: "12px",
            borderRadius: "8px",
            background: "#F1F5F9",
            color: "#0F172A",
            fontSize: "13px",
            overflowX: "auto",
          }}
        >
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
      </div>
    </div>
  );
}
