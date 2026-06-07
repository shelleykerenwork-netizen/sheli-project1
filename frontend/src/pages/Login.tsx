import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch {
      setError("אימייל או סיסמה שגויים");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>איגוד מנהלי אגפי החינוך</h1>
        <h2 style={styles.subtitle}>מערכת סקרים</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>אימייל</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
          <label style={styles.label}>סיסמה</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "מתחבר..." : "התחברות"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", direction: "rtl" },
  card: { background: "#fff", padding: "2.5rem", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", minWidth: "340px" },
  title: { textAlign: "center", color: "#1e3a5f", fontSize: "1.2rem", marginBottom: "0.25rem" },
  subtitle: { textAlign: "center", color: "#4a90d9", fontSize: "1.5rem", marginBottom: "2rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: { fontWeight: 600, color: "#333" },
  input: { padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" },
  button: { marginTop: "0.5rem", padding: "0.75rem", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" },
  error: { color: "#e53e3e", textAlign: "center" },
};
