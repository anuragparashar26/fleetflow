import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { CheckIcon, EyeIcon, EyeOffIcon, GoogleIcon, WarningIcon } from "../components/icons";

const isGoogleLinkedAccountError = (clerkError) => {
  const code = clerkError?.code || "";
  const message = (clerkError?.message || "").toLowerCase();

  if (code === "strategy_for_user_invalid") return true;
  if (message.includes("google") || message.includes("oauth") || message.includes("social")) return true;

  return false;
};

export default function AuthPage({ onLoginSuccess, onForgotPassword, onRegister, successMsg }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Clerk ka official sign-in hook
  const { isLoaded, signIn, setActive } = useSignIn();

  const getAuthRedirectUrls = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      redirectUrl: `${origin}/sso-callback`,
      redirectUrlComplete: `${origin}/fleet/dashboard`,
    };
  };

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

      if (isGoogleLinkedAccountError(clerkError)) {
        setError("This email is linked with Google. Please sign in with Google.");
      } else if (clerkError?.code === "form_password_incorrect") {
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

  const handleGoogleSignIn = async () => {
    setError("");
    if (!isLoaded) return setError("Auth is loading, please wait...");

    setLoading(true);
    try {
      const { redirectUrl, redirectUrlComplete } = getAuthRedirectUrls();
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (err) {
      setError(err?.errors?.[0]?.message || "Unable to continue with Google.");
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoIcon}>L</div>
          <span style={s.logoText}>Fleet<span style={s.logoAccent}>Flow</span></span>
        </div>

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
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>OR</span>
          <div style={s.dividerLine} />
        </div>

        <button
          style={{ ...s.googleBtn, opacity: loading || !isLoaded ? 0.75 : 1 }}
          onClick={handleGoogleSignIn}
          disabled={loading || !isLoaded}
        >
          <GoogleIcon size={18} />
          Continue with Google
        </button>

        <div style={s.bottomText}>
          Don't have an account?{" "}
          <button style={s.linkBtn} onClick={onRegister}>
            Create one here →
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", width: "100%",
    background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #EDE9FE 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px", boxSizing: "border-box",
  },
  card: {
    background: "#FFFFFF", borderRadius: "20px", padding: "40px 44px",
    width: "100%", maxWidth: "440px",
    boxShadow: "0 4px 6px rgba(79,70,229,0.04), 0 20px 60px rgba(79,70,229,0.12)",
    border: "1px solid rgba(79,70,229,0.08)", boxSizing: "border-box",
  },
  logoRow:   { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" },
  logoIcon:  { width: "36px", height: "36px", background: "#4F46E5", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "18px" },
  logoText:  { fontSize: "22px", fontWeight: "800", color: "#1E1B4B", letterSpacing: "-0.5px" },
  logoAccent:{ color: "#4F46E5" },
  heading:   { fontSize: "24px", fontWeight: "700", color: "#1E1B4B", marginBottom: "6px", letterSpacing: "-0.3px" },
  subheading:{ fontSize: "14px", color: "#6B7280", marginBottom: "28px", lineHeight: "1.5" },
  successBox:{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
  errorBox:  { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" },
  fieldGroup:{ marginBottom: "18px" },
  label:     { display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" },
  input:     { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#FAFAFA", transition: "border-color 0.2s" },
  eyeBtn:    { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9CA3AF", padding: "4px" },
  linkBtn:   { background: "none", border: "none", color: "#4F46E5", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "0", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" },
  primaryBtn:{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "opacity 0.2s", letterSpacing: "0.2px" },
  divider:   { display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" },
  dividerLine:{ flex: 1, height: "1px", background: "#E5E7EB" },
  dividerText:{ fontSize: "12px", color: "#9CA3AF", fontWeight: "500" },
  googleBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1.5px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#111827",
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
  bottomText: { textAlign: "center", fontSize: "13px", color: "#6B7280" },
};