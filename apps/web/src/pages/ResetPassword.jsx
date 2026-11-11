import { useState } from "react";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import styles from "../styles";
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon, TrophyIcon, WarningIcon, XIcon } from "../components/icons";


const getStrength = (pass) => {
  if (!pass)           return { label: "",            color: "transparent", width: "0%" };
  if (pass.length < 4) return { label: "Too short",   color: "#ff6b6b",     width: "20%" };
  if (pass.length < 6) return { label: "Weak",        color: "#ff9f43",     width: "40%" };
  if (pass.length < 8) return { label: "Fair",        color: "#ffd32a",     width: "60%" };
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass))
                       return { label: "Strong",   color: "#2ecc71",     width: "100%" };
  return               { label: "Good",               color: "#54a0ff",     width: "80%" };
};

export default function ResetPassword({ email, onSuccess }) {
  const [newPass, setNewPass]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [code, setCode]             = useState("");
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);
  const { isLoaded, signIn } = useSignIn();
  const { signOut } = useAuth();

  const strength = getStrength(newPass);

  const handleReset = async () => {
    setError("");
    if (!email) return setError("Open the reset flow to continue.");
    if (!code.trim()) return setError("Enter the reset code from your email.");
    if (!newPass || !confirmPass)  return setError("Please fill in both fields.");
    if (newPass.length < 4)        return setError("Password must be at least 4 characters.");
    if (newPass !== confirmPass)   return setError("Passwords don't match.");
    if (!isLoaded) return setError("Auth is still loading. Try again.");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPass,
      });

      if (result.status !== "complete") {
        return setError("Unable to reset password. Please try again.");
      }

      await signOut();
    } catch (err) {
      return setError(err?.errors?.[0]?.message || "Unable to reset password.");
    }

    setDone(true);

    
    setTimeout(() => onSuccess(), 2500);
  };

  // ── Success screen ──
  if (done) {
    return (
      <div style={styles.authPage}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ marginBottom: "16px" }}>
            <TrophyIcon size={56} color="#7c6af7" />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "10px" }}>
            Password Reset!
          </div>
          <div style={styles.subtitle}>
            Password update successfully.<br />Redirect to login page...
          </div>
          {/* Progress bar animation */}
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: "20px" }}>
            <div style={{
              height: "100%", background: "#7c6af7", borderRadius: "2px",
              animation: "fill 2.5s linear forwards",
            }} />
          </div>
          <style>{`@keyframes fill { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authPage}>
      <div style={styles.card}>

        <div style={{ fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          Set New Password <LockIcon size={18} color="#b3aaff" />
        </div>
        <div style={styles.subtitle}>
          {email ? (
            <>
              <strong style={{ color: "#b3aaff" }}>{email}</strong> for choose the new password
            </>
          ) : (
            <>Open the reset flow from Forgot Password to continue.</>
          )}
        </div>

        {error && (
          <div style={{ ...styles.error, display: "flex", alignItems: "center", gap: "8px" }}>
            <WarningIcon size={14} color="#ff8f8f" /> {error}
          </div>
        )}

        {/* Reset code */}
        <label style={styles.label}>Reset Code</label>
        <input
          style={styles.input}
          type="text"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* New password + eye toggle */}
        <label style={styles.label}>New Password</label>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...styles.input, paddingRight: "48px" }}
            type={showPass ? "text" : "password"}
            placeholder="Naya password daalo"
            value={newPass} onChange={(e) => setNewPass(e.target.value)}
          />
          <button onClick={() => setShowPass(!showPass)} style={{
            position: "absolute", right: "14px", top: "13px",
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", fontSize: "16px",
          }}>{showPass ? <EyeOffIcon size={16} color="rgba(255,255,255,0.6)" /> : <EyeIcon size={16} color="rgba(255,255,255,0.6)" />}</button>
        </div>

        {/* Strength bar */}
        {newPass && (
          <div style={{ marginTop: "-8px", marginBottom: "16px" }}>
            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: strength.width, background: strength.color,
                transition: "width 0.3s, background 0.3s", borderRadius: "2px",
              }} />
            </div>
            <div style={{ fontSize: "11px", color: strength.color, marginTop: "4px", fontWeight: "600" }}>
              {strength.label}
            </div>
          </div>
        )}

        {/* Confirm password */}
        <label style={styles.label}>Confirm New Password</label>
        <input
          style={{
            ...styles.input,
            borderColor: confirmPass
              ? confirmPass === newPass ? "rgba(80,200,120,0.5)" : "rgba(255,80,80,0.5)"
              : "rgba(255,255,255,0.15)",
          }}
          type="password" placeholder="Password repeat karo"
          value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />

        {/* Match hint */}
        {confirmPass && (
          <div style={{ fontSize: "12px", marginTop: "-10px", marginBottom: "12px", color: confirmPass === newPass ? "#80d8a0" : "#ff8080", display: "flex", alignItems: "center", gap: "6px" }}>
            {confirmPass === newPass ? <CheckIcon size={14} color="#80d8a0" /> : <XIcon size={14} color="#ff8080" />}
            {confirmPass === newPass ? "Passwords match" : "Passwords don't match"}
          </div>
        )}

        <button style={styles.btn} onClick={handleReset}>Reset Password</button>

      </div>
    </div>
  );
}