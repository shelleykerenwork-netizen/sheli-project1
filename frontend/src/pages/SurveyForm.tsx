import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import type { Survey, AnswerCreate } from "../types";

export default function SurveyForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [authority, setAuthority] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/surveys/${slug}`).then(r => setSurvey(r.data)).catch(() => setError("סקר לא נמצא"));
  }, [slug]);

  function setAnswer(qId: number, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function toggleMulti(qId: number, value: string) {
    const current = answers[qId] ? answers[qId].split("|") : [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setAnswers(prev => ({ ...prev, [qId]: updated.join("|") }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!survey) return;
    for (const q of survey.questions) {
      if (q.required && !answers[q.id!]) {
        setError(`יש לענות על שאלה: "${q.text}"`);
        return;
      }
    }
    if (!survey.is_anonymous && (!name || !role || !authority)) {
      setError("יש למלא שם, תפקיד ורשות");
      return;
    }
    setError("");
    setSubmitting(true);
    const payload: AnswerCreate[] = survey.questions.map(q => ({ question_id: q.id!, value: answers[q.id!] || null }));
    try {
      await api.post(`/api/surveys/${slug}/responses`, {
        respondent_name: survey.is_anonymous ? null : name,
        respondent_role: survey.is_anonymous ? null : role,
        respondent_authority: survey.is_anonymous ? null : authority,
        answers: payload,
      });
      navigate(`/s/${slug}/done`);
    } catch {
      setError("שגיאה בשליחת הסקר. נסי שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !survey) return <div style={center}><p style={{ color: "#e53e3e" }}>{error}</p></div>;
  if (!survey) return <div style={center}><p>טוען סקר...</p></div>;
  if (!survey.is_active) return <div style={center}><p>הסקר אינו פעיל כרגע.</p></div>;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>{survey.title}</h1>
        {survey.description && <p style={s.desc}>{survey.description}</p>}

        <form onSubmit={submit}>
          {!survey.is_anonymous && (
            <div style={s.identityBox}>
              <h3 style={s.sectionTitle}>פרטים מזהים</h3>
              <label style={s.label}>שם מלא *</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} required />
              <label style={s.label}>תפקיד *</label>
              <input style={s.input} value={role} onChange={e => setRole(e.target.value)} required />
              <label style={s.label}>שם הרשות *</label>
              <input style={s.input} value={authority} onChange={e => setAuthority(e.target.value)} required />
            </div>
          )}

          {survey.questions.map((q, i) => (
            <div key={q.id} style={s.qBlock}>
              <p style={s.qText}>{i + 1}. {q.text}{q.required && <span style={{ color: "#e53e3e" }}> *</span>}</p>

              {q.question_type === "text" && (
                <textarea style={{ ...s.input, minHeight: "80px" }} value={answers[q.id!] || ""} onChange={e => setAnswer(q.id!, e.target.value)} />
              )}
              {q.question_type === "number" && (
                <input type="number" style={s.input} value={answers[q.id!] || ""} onChange={e => setAnswer(q.id!, e.target.value)} />
              )}
              {q.question_type === "yes_no" && (
                <div style={s.radioRow}>
                  {["כן", "לא"].map(v => (
                    <label key={v} style={s.radioLabel}>
                      <input type="radio" name={`q${q.id}`} value={v} checked={answers[q.id!] === v} onChange={() => setAnswer(q.id!, v)} /> {v}
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === "rating" && (
                <div style={s.radioRow}>
                  {[1,2,3,4,5].map(v => (
                    <label key={v} style={s.radioLabel}>
                      <input type="radio" name={`q${q.id}`} value={String(v)} checked={answers[q.id!] === String(v)} onChange={() => setAnswer(q.id!, String(v))} /> {v}
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === "single_choice" && (
                <div style={s.radioRow}>
                  {q.options.map(opt => (
                    <label key={opt.id} style={s.radioLabel}>
                      <input type="radio" name={`q${q.id}`} value={opt.text} checked={answers[q.id!] === opt.text} onChange={() => setAnswer(q.id!, opt.text)} /> {opt.text}
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === "multiple_choice" && (
                <div style={s.radioRow}>
                  {q.options.map(opt => (
                    <label key={opt.id} style={s.radioLabel}>
                      <input type="checkbox" value={opt.text} checked={(answers[q.id!] || "").split("|").includes(opt.text)} onChange={() => toggleMulti(q.id!, opt.text)} /> {opt.text}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && <p style={{ color: "#e53e3e", marginBottom: "1rem" }}>{error}</p>}
          <button style={s.btnSubmit} type="submit" disabled={submitting}>{submitting ? "שולח..." : "שליחת הסקר"}</button>
        </form>
      </div>
    </div>
  );
}

const center: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" };
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f0f4f8", direction: "rtl", padding: "2rem 1rem" },
  card: { background: "#fff", borderRadius: "12px", padding: "2rem", maxWidth: "680px", margin: "0 auto", boxShadow: "0 4px 24px rgba(0,0,0,0.09)" },
  title: { color: "#1e3a5f", fontSize: "1.5rem", marginBottom: "0.5rem" },
  desc: { color: "#555", marginBottom: "1.5rem" },
  identityBox: { background: "#f7f9fc", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  sectionTitle: { margin: "0 0 0.5rem", color: "#1e3a5f" },
  label: { fontWeight: 600, fontSize: "0.9rem", color: "#444" },
  input: { padding: "0.55rem 0.8rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem", width: "100%", boxSizing: "border-box" as const },
  qBlock: { marginBottom: "1.5rem" },
  qText: { fontWeight: 600, color: "#222", marginBottom: "0.6rem" },
  radioRow: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  radioLabel: { display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" },
  btnSubmit: { width: "100%", padding: "0.85rem", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer" },
};
