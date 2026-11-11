import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { KeyIcon, MailIcon, WarningIcon } from "../components/icons";

export default function ForgotPassword({ onResetReady, onBackToLogin }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const { isLoaded, signIn } = useSignIn();

  const handleSend = async () => {
    setError("");
    if (!email.trim())         return setError("Please enter your email.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!isLoaded)             return setError("Auth is loading, please wait...");

    setLoading(true);
    try {
      
      await signIn.create({
        strategy:   "reset_password_email_code",
        identifier: email.trim().toLowerCase(),
      });

      setSent(true);
     
      setTimeout(() => onResetReady?.(email.trim().toLowerCase()), 2000);

    } catch (err) {
      const clerkError = err?.errors?.[0];
      if (clerkError?.code === "form_identifier_not_found") {
        setError("No account found with this email.");
      } else {
        setError(clerkError?.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ marginBottom: "12px" }}>
              <MailIcon size={44} color="#4F46E5" />
            </div>
            <div style={s.heading}>Check your inbox!</div>
            <div style={s.subheading}>
              Reset code sent to{" "}
              <strong style={{ color: "#4F46E5" }}>{email}</strong>
              <br />Redirecting to reset page...
            </div>
          </div>
        ) : (
          <>
            <div style={{ ...s.heading, display: "flex", alignItems: "center", gap: "8px" }}>
              Forgot Password? <KeyIcon size={18} color="#4F46E5" />
            </div>
            <div style={s.subheading}>
              Enter your registered email. We'll send you a reset code.
            </div>

            {error && (
              <div style={s.errorBox}>
                <WarningIcon size={14} color="#DC2626" /> {error}
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={s.label}>Registered Email</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                autoFocus
              />
            </div>

            <button
              style={{ ...s.primaryBtn, opacity: loading || !isLoaded ? 0.75 : 1 }}
              onClick={handleSend}
              disabled={loading || !isLoaded}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button style={s.linkBtn} onClick={onBackToLogin}>
            ← Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", width: "100%", background: "radial-gradient(circle at 15% 10%, rgba(37,99,235,.22), transparent 28rem), #080B12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", padding: "20px", boxSizing: "border-box" },
  card:      { background: "#0E1524", borderRadius: "20px", padding: "40px 44px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 80px rgba(0,0,0,.35)", border: "1px solid #1E293B", boxSizing: "border-box" },
  logoRow:   { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" },
  logoIcon:  { width: "36px", height: "36px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "18px" },
  logoText:  { fontSize: "22px", fontWeight: "800", color: "#F8FAFC", letterSpacing: "-0.5px" },
  logoAccent:{ color: "#38BDF8" },
  heading:   { fontSize: "22px", fontWeight: "700", color: "#F8FAFC", marginBottom: "6px" },
  subheading:{ fontSize: "14px", color: "#94A3B8", marginBottom: "28px", lineHeight: "1.6" },
  errorBox:  { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  label:     { display: "block", fontSize: "13px", fontWeight: "600", color: "#CBD5E1", marginBottom: "6px" },
  input:     { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #26364F", fontSize: "14px", color: "#F8FAFC", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#0B1120" },
  primaryBtn:{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,.25)", transition: "opacity 0.2s" },
  linkBtn:   { background: "none", border: "none", color: "#60A5FA", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "0", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" },
};