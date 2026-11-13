import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, WarningIcon } from "../components/icons";
import { supabase } from "../utils/supabaseClient";

export default function RegisterPage({ onRegisterSuccess, onBackToLogin }) {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitedUser, setInvitedUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setInvitedUser(data.session.user);
        setForm((current) => ({ ...current, email: data.session.user.email || current.email }));
      }
    });
  }, []);

  const handleSubmit = async () => {
    setError(""); setMessage("");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      if (invitedUser) {
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
        if (updateError) throw updateError;
        onRegisterSuccess?.();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: { emailRedirectTo: `${window.location.origin}/fleet/dashboard` },
        });
        if (signUpError) throw signUpError;
        if (data.session) onRegisterSuccess?.();
        else setMessage("Account created. Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <div style={s.page}><div style={s.card}>
    <div style={s.heading}>Create Account</div>
    <div style={s.subheading}>{invitedUser ? "Set your password to join the workspace." : "Create your FleetFlow account with Supabase Auth."}</div>
    {error && <div style={s.errorBox}><WarningIcon size={14} color="#DC2626" /> {error}</div>}
    {message && <div style={s.successBox}>{message}</div>}
    <label style={s.label}>Email</label><input style={s.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
    <label style={s.label}>Password</label><div style={{ position: "relative" }}><input style={{ ...s.input, paddingRight: 44 }} type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button style={s.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>{showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}</button></div>
    <label style={s.label}>Confirm Password</label><input style={s.input} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
    <button style={{ ...s.primaryBtn, opacity: loading ? 0.75 : 1 }} onClick={handleSubmit} disabled={loading}>{loading ? "Creating Account..." : "Create Account"}</button>
    <div style={s.bottomText}>Already have an account? <button style={s.linkBtn} onClick={onBackToLogin}>Sign in here</button></div>
  </div></div>;
}

const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080B12", padding: 20 },
  card: { background: "#0E1524", borderRadius: 20, padding: "36px 40px", width: "100%", maxWidth: 480, color: "#F8FAFC" },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 6 }, subheading: { color: "#94A3B8", marginBottom: 22 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#CBD5E1", margin: "16px 0 6px" },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #26364F", boxSizing: "border-box", background: "#0B1120", color: "#F8FAFC" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: 0 },
  primaryBtn: { width: "100%", marginTop: 24, padding: 13, borderRadius: 10, border: 0, background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "#fff", fontWeight: 700 },
  linkBtn: { background: "none", border: 0, color: "#60A5FA", cursor: "pointer" }, bottomText: { textAlign: "center", marginTop: 20, color: "#94A3B8", fontSize: 13 },
  errorBox: { background: "#FEF2F2", color: "#DC2626", padding: 12, marginBottom: 12, display: "flex", gap: 8 }, successBox: { background: "#F0FDF4", color: "#15803D", padding: 12, marginBottom: 12 },
};
