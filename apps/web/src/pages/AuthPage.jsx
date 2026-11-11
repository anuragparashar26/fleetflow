import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { CheckIcon, EyeIcon, EyeOffIcon, WarningIcon } from "../components/icons";

export default function AuthPage({ onLoginSuccess, onForgotPassword, onRegister, successMsg }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Clerk ka official sign-in hook
  const { isLoaded, signIn, setActive } = useSignIn();

  const handleLogin = async () => {
    setError("");

    // Basic validation
    if (!email || !password) return setError("Please fill in all fields.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!isLoaded) return setError("Auth is loading, please wait...");

    setLoading(true);
    try {
      // Step 1: Clerk se actual sign in attempt
      const result = await signIn.create({
        strategy: "password",
        identifier: email.trim().toLowerCase(),
        password:   password,
      });

      // Step 2: Check if sign in is complete
      if (result.status === "complete") {
        // Step 3: Session active karo
        await setActive({ session: result.createdSessionId });
        // Step 4: App ko batao login hua
        onLoginSuccess?.();
      } else if (result.status === "needs_first_factor") {
        setError("Additional verification is enabled in Clerk for this account. This app currently supports password-only sign-in. Disable required second-factor in Clerk, then try again.");
      } else if (result.status === "needs_second_factor") {
        setError("Additional verification is enabled in Clerk for this account. This app currently supports password-only sign-in. Disable required second-factor in Clerk, then try again.");
      } else {
        // Email verification pending ya koi aur step
        setError(`Unsupported sign-in status: ${result.status}. This app supports password-only sign-in.`);
      }

    } catch (err) {
      // Clerk ka error message dikhao
      const clerkError = err?.errors?.[0];

      if (clerkError?.code === "form_password_incorrect") {
        setError("Incorrect password. Please try again.");
      } else if (clerkError?.code === "form_identifier_not_found") {
        setError("No account found with this email.");
      } else if (clerkError?.code === "too_many_requests") {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError(clerkError?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.heading}>Welcome back</div>
        <div style={s.subheading}>Sign in to continue to your workspace</div>

        {successMsg && (
          <div style={s.successBox}>
            <CheckIcon size={14} color="#15803D" /> {successMsg}
          </div>
        )}
        {error && (
          <div style={s.errorBox}>
            <WarningIcon size={14} color="#DC2626" /> {error}
          </div>
        )}

        {/* Email */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...s.input, paddingRight: "44px" }}
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoComplete="current-password"
            />
            <button style={s.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
              {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: "right", marginBottom: "24px" }}>
          <button style={s.linkBtn} onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>

        {/* Sign In button */}
        <button
          style={{ ...s.primaryBtn, opacity: loading || !isLoaded ? 0.75 : 1 }}
          onClick={handleLogin}
          disabled={loading || !isLoaded}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={s.bottomText}>
          Don't have an account?{" "}
          <button style={s.linkBtn} onClick={onRegister}>
            Create one here
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", width: "100%",
    background: "radial-gradient(circle at 15% 10%, rgba(37,99,235,.22), transparent 28rem), #080B12",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px", boxSizing: "border-box",
  },
  card: {
    background: "#0E1524", borderRadius: "20px", padding: "40px 44px",
    width: "100%", maxWidth: "440px",
    boxShadow: "0 24px 80px rgba(0,0,0,.35)", border: "1px solid #1E293B", boxSizing: "border-box",
  },
  logoRow:   { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" },
  logoIcon:  { width: "36px", height: "36px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "18px" },
  logoText:  { fontSize: "22px", fontWeight: "800", color: "#F8FAFC", letterSpacing: "-0.5px" },
  logoAccent:{ color: "#38BDF8" },
  heading:   { fontSize: "24px", fontWeight: "700", color: "#F8FAFC", marginBottom: "6px", letterSpacing: "-0.3px" },
  subheading:{ fontSize: "14px", color: "#94A3B8", marginBottom: "28px", lineHeight: "1.5" },
  successBox:{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
  errorBox:  { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
  fieldGroup:{ marginBottom: "18px" },
  label:     { display: "block", fontSize: "13px", fontWeight: "600", color: "#CBD5E1", marginBottom: "6px" },
  input:     { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #26364F", fontSize: "14px", color: "#F8FAFC", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#0B1120", transition: "border-color 0.2s" },
  eyeBtn:    { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9CA3AF", padding: "4px" },
  linkBtn:   { background: "none", border: "none", color: "#60A5FA", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "0", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" },
  primaryBtn:{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,.25)", transition: "opacity 0.2s", letterSpacing: "0.2px" },
  divider:   { display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" },
  dividerLine:{ flex: 1, height: "1px", background: "#1E293B" },
  dividerText:{ fontSize: "12px", color: "#64748B", fontWeight: "500" },
  googleBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1.5px solid #26364F",
    background: "#111B2E",
    color: "#E2E8F0",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  bottomText: { textAlign: "center", fontSize: "13px", color: "#94A3B8" },
};