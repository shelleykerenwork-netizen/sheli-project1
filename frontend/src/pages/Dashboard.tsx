import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import type { Survey } from "../types";

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const baseUrl = window.location.origin;

  useEffect(() => { fetchSurveys(); }, []);

  async function fetchSurveys() {
    try {
      const res = await api.get("/api/surveys/");
      setSurveys(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(slug: string, current: boolean) {
    await api.patch(`/api/surveys/${slug}`, { is_active: !current });
    fetchSurveys();
  }

  async function deleteSurvey(slug: string) {
    if (!confirm("למחוק את הסקר? פעולה זו אינה הפיכה.")) return;
    await api.delete(`/api/surveys/${slug}`);
    fetchSurveys();
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.headerTitle}>מערכת סקרים</h1>
          <p style={s.headerSub}>איגוד מנהלי אגפי החינוך ברשויות המקומיות</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={s.btnPrimary} onClick={() => navigate("/builder")}>+ סקר חדש</button>
          <button style={s.btnGhost} onClick={logout}>יציאה</button>
        </div>
      </header>

      <main style={s.main}>
        {loading ? <p>טוען...</p> : surveys.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "1.1rem", color: "#666" }}>אין סקרים עדיין. צרי סקר חדש!</p>
          </div>
        ) : (
          <div style={s.grid}>
            {surveys.map(survey => (
              <div key={survey.id} style={s.card}>
                <div style={s.cardHeader}>
                  <h2 style={s.cardTitle}>{survey.title}</h2>
                  <span style={{ ...s.badge, background: survey.is_active ? "#c6f6d5" : "#fed7d7", color: survey.is_active ? "#276749" : "#9b2c2c" }}>
                    {survey.is_active ? "פעיל" : "סגור"}
                  </span>
                </div>
                <p style={s.cardMeta}>
                  {survey.response_count} תשובות · {survey.is_anonymous ? "אנונימי" : "מזוהה"} · {new Date(survey.created_at).toLocaleDateString("he-IL")}
                </p>
                <div style={s.linkBox}>
                  <a href={`/s/${survey.slug}`} target="_blank" rel="noreferrer" style={s.linkText}>{baseUrl}/s/{survey.slug}</a>
                  <button style={s.btnCopy} onClick={() => navigator.clipboard.writeText(`${baseUrl}/s/${survey.slug}`)}>העתק</button>
                </div>
                <div style={s.cardActions}>
                  <button style={s.btnSecondary} onClick={() => navigate(`/analytics/${survey.slug}`)}>📊 תוצאות</button>
                  <button style={s.btnSecondary} onClick={() => toggleActive(survey.slug, survey.is_active)}>
                    {survey.is_active ? "סגור סקר" : "פתח סקר"}
                  </button>
                  <button style={s.btnDanger} onClick={() => deleteSurvey(survey.slug)}>מחק</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f0f4f8", direction: "rtl" },
  header: { background: "#1e3a5f", color: "#fff", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { margin: 0, fontSize: "1.4rem" },
  headerSub: { margin: 0, fontSize: "0.85rem", opacity: 0.75 },
  main: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
  empty: { textAlign: "center", padding: "4rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" },
  card: { background: "#fff", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" },
  cardTitle: { margin: 0, fontSize: "1.1rem", color: "#1e3a5f" },
  badge: { padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600 },
  cardMeta: { color: "#666", fontSize: "0.85rem", margin: "0 0 0.75rem" },
  linkBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#f7f9fc", padding: "0.4rem 0.6rem", borderRadius: "6px", marginBottom: "1rem" },
  linkText: { flex: 1, fontSize: "0.78rem", color: "#4a90d9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  btnCopy: { fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  cardActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  btnPrimary: { padding: "0.6rem 1.2rem", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
  btnSecondary: { padding: "0.4rem 0.8rem", background: "#edf2f7", color: "#333", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" },
  btnGhost: { padding: "0.6rem 1rem", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "8px", cursor: "pointer" },
  btnDanger: { padding: "0.4rem 0.8rem", background: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" },
};
