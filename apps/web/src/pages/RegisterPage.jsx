import { useMemo, useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { EyeIcon, EyeOffIcon, GoogleIcon, MailIcon, WarningIcon } from "../components/icons";

const isGoogleLinkedAccountError = (clerkError) => {
  const code = clerkError?.code || "";
  const message = (clerkError?.message || "").toLowerCase();

  if (code === "strategy_for_user_invalid") return true;
  if (message.includes("google") || message.includes("oauth") || message.includes("social")) return true;

  return false;
};

const Field = ({ label, children, error }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={s.label}>{label}</label>
    {children}
    {error && (
      <div style={s.fieldError}>
        <WarningIcon size={12} color="#DC2626" /> {error}
      </div>
    )}
  </div>
);

export default function RegisterPage({ onRegisterSuccess, onBackToLogin }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [verifyCode, setVerifyCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const location = useLocation();

  const getAuthRedirectUrls = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      redirectUrl: `${origin}/sso-callback`,
      redirectUrlComplete: `${origin}/fleet/dashboard`,
    };
  };

  const invitationTicket = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get("__clerk_ticket") ||
      params.get("ticket") ||
      params.get("token") ||
      ""
    );
  }, [location.search]);

  const hasInvitationTicket = Boolean(invitationTicket);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldErrors((p) => ({ ...p, [key]: "" }));
    setTopError("");
  };

  const validate = () => {
    const e = {};
    if (!hasInvitationTicket) {
      if (!form.email.trim()) e.email = "Email is required.";
      else if (!form.email.includes("@")) e.email = "Enter a valid email.";
    }
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Minimum 6 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    setTopError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setTopError("Please fix the errors below.");
      return;
    }

    if (!isLoaded) return setTopError("Auth is loading, please wait...");

    setLoading(true);
    try {
      const createParams = hasInvitationTicket
        ? {
            strategy: "ticket",
            ticket: invitationTicket,
            password: form.password,
          }
        : {
            emailAddress: form.email.trim().toLowerCase(),
            password: form.password,
          };

      const result = await signUp.create(createParams);

      if (result.status === "complete") {
        if (!result.createdSessionId) {
          setTopError("Sign-up completed, but no session was created.");
          return;
        }

        await setActive({ session: result.createdSessionId });
        onRegisterSuccess(
          result.emailAddress || form.email.trim().toLowerCase()
        );
        return;
      }

      const needsEmailVerification = (result.unverifiedFields || []).includes("email_address");
      if (needsEmailVerification || !hasInvitationTicket) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setStep("verify");
        return;
      }

      setTopError(`Unable to continue sign-up (${result.status}). Please try the invite link again.`);
    } catch (err) {
      const clerkError = err?.errors?.[0];
      const message = (clerkError?.message || "").toLowerCase();
      if (isGoogleLinkedAccountError(clerkError)) {
        setFieldErrors((p) => ({ ...p, email: "This email is linked with Google." }));
        setTopError("This account already exists. Please sign in with Google.");
      } else if (clerkError?.code === "form_identifier_exists") {
        setFieldErrors((p) => ({ ...p, email: "This email is already registered." }));
        setTopError("This email is already registered. Please sign in with your existing account.");
      } else if (message.includes("ticket") || message.includes("invite") || message.includes("invitation")) {
        setTopError("This invitation link is invalid or expired. Ask workspace admin to send a fresh invite.");
      } else {
        setTopError(clerkError?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!isLoaded) {
      setTopError("Auth is loading, please wait...");
      return;
    }

    setLoading(true);
    try {
      const { redirectUrl, redirectUrlComplete } = getAuthRedirectUrls();
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (err) {
      setTopError(err?.errors?.[0]?.message || "Unable to continue with Google.");
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setTopError("");

    if (!verifyCode.trim()) return setTopError("Please enter the verification code.");
    if (!isLoaded) return setTopError("Auth is loading, please wait...");

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verifyCode.trim(),
      });

      console.log("Clerk verification result:", result);

      if (result.status !== "complete") {
        setTopError(`Verification returned status: ${result.status}`);
        return;
      }

      if (!result.createdSessionId) {
        setTopError("Verification completed, but no session was created.");
        return;
      }

      await setActive({ session: result.createdSessionId });

      const token = await getToken();
      if (!token) {
        // App-level effect will sync profile and invite metadata after auth settles.
      }

      onRegisterSuccess(result.emailAddress || form.email.trim().toLowerCase());
    } catch (err) {
      console.error("Verification failed:", err);

      const clerkError = err?.errors?.[0];
      const message = clerkError?.message || err?.message || "Verification failed. Please try again.";

      if (message.toLowerCase().includes("already verified")) {
        setTopError("This email is already verified. Please sign in.");
      } else if (clerkError?.code === "form_code_incorrect") {
        setTopError("Incorrect code. Please check your email and try again.");
      } else {
        setTopError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...s.input,
    borderColor: fieldErrors[field] ? "#FCA5A5" : "#E5E7EB",
    background: fieldErrors[field] ? "#FFF7F7" : "#FAFAFA",
  });

  if (step === "verify") {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, maxWidth: "420px", padding: "40px 44px" }}>
          <div style={s.logoRow}>
            <div style={s.logoIcon}>L</div>
            <span style={s.logoText}>
              Fleet<span style={s.logoAccent}>Flow</span>
            </span>
          </div>

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ marginBottom: "12px" }}>
              <MailIcon size={44} color="#4F46E5" />
            </div>
            <div style={s.heading}>Verify your email</div>
            <div style={s.subheading}>
              We sent a code to <strong style={{ color: "#4F46E5" }}>{form.email}</strong>
              <br />Enter it below to complete registration.
            </div>
          </div>

          {topError && (
            <div style={s.errorBox}>
              <WarningIcon size={14} color="#DC2626" /> {topError}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={s.label}>Verification Code</label>
            <input
              style={{ ...s.input, textAlign: "center", fontSize: "20px", letterSpacing: "4px" }}
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              autoFocus
            />
          </div>

          <button style={{ ...s.primaryBtn, opacity: loading ? 0.75 : 1 }} onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify & Create Account →"}
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button style={s.linkBtn} onClick={() => setStep("form")}>
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: "480px", padding: "36px 40px" }}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>L</div>
          <span style={s.logoText}>
            Fleet<span style={s.logoAccent}>Flow</span>
          </span>
        </div>

        <div style={s.heading}>Create Account</div>
        <div style={s.subheading}>
          {hasInvitationTicket
            ? "You were invited to a workspace. Set your password to continue."
            : "Sign up with email or continue with Google"}
        </div>

        {hasInvitationTicket && (
          <div style={s.successBox}>
            <WarningIcon size={14} color="#15803D" /> Invitation link detected. Complete sign-up to join your workspace.
          </div>
        )}

        {topError && (
          <div style={s.errorBox}>
            <WarningIcon size={14} color="#DC2626" /> {topError}
          </div>
        )}

        <button
          style={{ ...s.googleBtn, opacity: loading || !isLoaded ? 0.75 : 1 }}
          onClick={handleGoogleSignup}
          disabled={loading || !isLoaded}
        >
          <GoogleIcon size={18} />
          Continue with Google
        </button>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>OR</span>
          <div style={s.dividerLine} />
        </div>

        <Field label="Email" error={fieldErrors.email}>
          <input
            style={inputStyle("email")}
            type="email"
            placeholder={hasInvitationTicket ? "Email from invite" : "you@example.com"}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={hasInvitationTicket}
          />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle("password"), paddingRight: "44px" }}
              type={showPass ? "text" : "password"}
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <button style={s.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
              {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
          <input
            style={{
              ...inputStyle("confirmPassword"),
              borderColor: form.confirmPassword
                ? form.confirmPassword === form.password
                  ? "#86EFAC"
                  : "#FCA5A5"
                : "#E5E7EB",
            }}
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
          />
        </Field>

        <button
          style={{ ...s.primaryBtn, opacity: loading || !isLoaded ? 0.75 : 1, marginTop: "8px" }}
          onClick={handleSubmit}
          disabled={loading || !isLoaded}
        >
          {loading ? "Creating Account..." : "Create Account →"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6B7280" }}>
          Already have an account? <button style={s.linkBtn} onClick={onBackToLogin}>Sign in here</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #EDE9FE 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 4px 6px rgba(79,70,229,0.04), 0 20px 60px rgba(79,70,229,0.12)",
    border: "1px solid rgba(79,70,229,0.08)",
    boxSizing: "border-box",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  logoIcon: {
    width: "36px",
    height: "36px",
    background: "#4F46E5",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "800",
    fontSize: "18px",
  },
  logoText: { fontSize: "22px", fontWeight: "800", color: "#1E1B4B", letterSpacing: "-0.5px" },
  logoAccent: { color: "#4F46E5" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#1E1B4B", marginBottom: "6px", letterSpacing: "-0.3px" },
  subheading: { fontSize: "14px", color: "#6B7280", marginBottom: "22px", lineHeight: "1.5" },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#15803D",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  fieldError: { fontSize: "12px", color: "#DC2626", marginTop: "5px", display: "flex", alignItems: "center", gap: "6px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#9CA3AF",
    padding: "4px",
  },
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
  },
  primaryBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4F46E5, #6366F1)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
    transition: "opacity 0.2s",
    letterSpacing: "0.2px",
  },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 18px" },
  dividerLine: { flex: 1, height: "1px", background: "#E5E7EB" },
  dividerText: { fontSize: "12px", color: "#9CA3AF", fontWeight: "500" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#4F46E5",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    fontFamily: "inherit",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
};
