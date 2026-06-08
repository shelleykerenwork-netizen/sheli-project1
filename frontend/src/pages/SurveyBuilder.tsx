import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import type { Question, QuestionType } from "../types";

const TYPE_LABELS: Record<QuestionType, string> = {
  text: "טקסט חופשי", number: "מספר", single_choice: "בחירה יחידה",
  multiple_choice: "בחירה מרובה", rating: "דירוג (1-5)", yes_no: "כן / לא",
};

function emptyQuestion(order: number): Question {
  return { text: "", question_type: "text", required: true, order, options: [] };
}

export default function SurveyBuilder() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion(0)]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion(qs.length)]);
  }

  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx })));
  }

  function updateOption(qi: number, oi: number, text: string) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q, options: q.options.map((o, j) => j === oi ? { ...o, text } : o)
    }));
  }

  function addOption(qi: number) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q, options: [...q.options, { text: "", order: q.options.length }]
    }));
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q, options: q.options.filter((_, j) => j !== oi)
    }));
  }

  async function save() {
    if (!title.trim()) return alert("יש להזין כותרת לסקר");
    if (questions.some(q => !q.text.trim())) return alert("יש למלא טקסט לכל שאלה");
    setSaving(true);
    try {
      await api.post("/api/surveys/", { title, description, is_anonymous: isAnonymous, questions });
      navigate("/");
    } catch {
      alert("שגיאה בשמירת הסקר");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button style={s.back} onClick={() => navigate("/")}>→ חזרה</button>
        <h1 style={s.headerTitle}>סקר חדש</h1>
        <button style={s.btnSave} onClick={save} disabled={saving}>{saving ? "שומר..." : "שמור סקר"}</button>
      </header>

      <main style={s.main}>
        <div style={s.section}>
          <label style={s.label}>כותרת הסקר *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="לדוגמה: סקר תקציבי 2025" />
          <label style={s.label}>תיאור (אופציונלי)</label>
          <textarea style={{ ...s.input, minHeight: "70px" }} value={description} onChange={e => setDescription(e.target.value)} />
          <label style={s.checkRow}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            <span>סקר אנונימי (לא יאסף שם / תפקיד / רשות)</span>
          </label>
        </div>

        <h2 style={{ color: "#1e3a5f", marginBottom: "1rem" }}>שאלות</h2>

        {questions.map((q, i) => (
          <div key={i} style={s.qCard}>
            <div style={s.qHeader}>
              <span style={s.qNum}>שאלה {i + 1}</span>
              <button style={s.btnRemove} onClick={() => removeQuestion(i)}>✕</button>
            </div>
            <input style={s.input} placeholder="טקסט השאלה *" value={q.text} onChange={e => updateQuestion(i, { text: e.target.value })} />
            <div style={s.qRow}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>סוג שאלה</label>
                <select style={s.input} value={q.question_type} onChange={e => updateQuestion(i, { question_type: e.target.value as QuestionType, options: [] })}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <label style={{ ...s.checkRow, marginTop: "1.8rem" }}>
                <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i, { required: e.target.checked })} />
                <span>שדה חובה</span>
              </label>
            </div>

            {(q.question_type === "single_choice" || q.question_type === "multiple_choice") && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={s.label}>אפשרויות בחירה</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <input style={{ ...s.input, flex: 1 }} value={opt.text} placeholder={`אפשרות ${oi + 1}`} onChange={e => updateOption(i, oi, e.target.value)} />
                    <button style={s.btnRemove} onClick={() => removeOption(i, oi)}>✕</button>
                  </div>
                ))}
                <button style={s.btnAdd} onClick={() => addOption(i)}>+ הוסף אפשרות</button>
              </div>
            )}
          </div>
        ))}

        <button style={s.btnAddQ} onClick={addQuestion}>+ הוסף שאלה</button>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f0f4f8", direction: "rtl" },
  header: { background: "#1e3a5f", color: "#fff", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { margin: 0, fontSize: "1.3rem" },
  back: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem" },
  btnSave: { padding: "0.6rem 1.4rem", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
  main: { padding: "2rem", maxWidth: "760px", margin: "0 auto" },
  section: { background: "#fff", borderRadius: "10px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "0.6rem" },
  label: { fontWeight: 600, color: "#444", fontSize: "0.9rem" },
  input: { padding: "0.55rem 0.8rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem", width: "100%", boxSizing: "border-box" as const },
  checkRow: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" },
  qCard: { background: "#fff", borderRadius: "10px", padding: "1.25rem", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  qHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" },
  qNum: { fontWeight: 700, color: "#1e3a5f" },
  qRow: { display: "flex", gap: "1rem", alignItems: "flex-start", marginTop: "0.5rem" },
  btnRemove: { background: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "4px", cursor: "pointer", padding: "0.2rem 0.5rem" },
  btnAdd: { background: "#edf2f7", color: "#333", border: "none", borderRadius: "6px", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.85rem" },
  btnAddQ: { width: "100%", padding: "0.85rem", background: "#fff", border: "2px dashed #4a90d9", color: "#4a90d9", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" },
};
