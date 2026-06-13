import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../api";

const COLORS = ["#4a90d9", "#50c878", "#f6ad55", "#fc8181", "#9f7aea", "#76e4f7"];

interface QuestionData {
  question_id: number;
  question_text: string;
  question_type: string;
  total_answers: number;
  distribution?: { label: string; count: number }[];
  avg?: number; min?: number; max?: number; values?: number[];
  text_answers?: string[];
}

interface Analytics {
  survey_title: string;
  total_responses: number;
  filters: { authorities: string[]; roles: string[] };
  questions: QuestionData[];
}

export default function SurveyAnalytics() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Analytics | null>(null);
  const [authority, setAuthority] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => { load(); }, [slug, authority, role]);

  async function load() {
    const params = new URLSearchParams();
    if (authority) params.set("authority", authority);
    if (role) params.set("role", role);
    const res = await api.get(`/api/surveys/${slug}/analytics?${params}`);
    setData(res.data);
  }

  async function exportExcel() {
    const res = await api.get(`/api/surveys/${slug}/export`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a"); a.href = url; a.download = `${slug}.xlsx`; a.click();
  }

  if (!data) return <div style={center}>טוען...</div>;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button style={s.back} onClick={() => navigate("/")}>→ חזרה</button>
        <div>
          <h1 style={s.headerTitle}>{data.survey_title}</h1>
          <p style={s.headerSub}>{data.total_responses} תשובות</p>
        </div>
        <button style={s.btnExport} onClick={exportExcel}>⬇ ייצוא Excel</button>
      </header>

      <main style={s.main}>
        {(data.filters.authorities.length > 0 || data.filters.roles.length > 0) && (
          <div style={s.filtersBar}>
            <strong>סינון:</strong>
            {data.filters.authorities.length > 0 && (
              <select style={s.select} value={authority} onChange={e => setAuthority(e.target.value)}>
                <option value="">כל הרשויות</option>
                {data.filters.authorities.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {data.filters.roles.length > 0 && (
              <select style={s.select} value={role} onChange={e => setRole(e.target.value)}>
                <option value="">כל התפקידים</option>
                {data.filters.roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            {(authority || role) && <button style={s.btnClear} onClick={() => { setAuthority(""); setRole(""); }}>נקה</button>}
          </div>
        )}

        <div style={s.grid}>
          {data.questions.map(q => (
            <div key={q.question_id} style={s.card}>
              <h3 style={s.qTitle}>{q.question_text}</h3>
              <p style={s.qMeta}>{q.total_answers} תשובות</p>

              {q.distribution && q.distribution.length > 0 && (
                <>
                  {q.distribution.length <= 5 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={q.distribution.map(d => ({ name: d.label, value: d.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                          {q.distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} (${q.total_answers > 0 ? Math.round(value / q.total_answers * 100) : 0}%)`, "תשובות"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={q.distribution.map(d => ({ name: d.label, count: d.count, pct: q.total_answers > 0 ? Math.round(d.count / q.total_answers * 100) : 0 }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value: number, _name: string, props: { payload?: { pct?: number } }) => [`${value} (${props.payload?.pct ?? 0}%)`, "תשובות"]} />
                        <Bar dataKey="count" fill="#4a90d9" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <div style={s.pctList}>
                    {q.distribution.map((d, i) => {
                      const pct = q.total_answers > 0 ? Math.round(d.count / q.total_answers * 100) : 0;
                      return (
                        <div key={i} style={s.pctRow}>
                          <span style={s.pctLabel}>{d.label}</span>
                          <div style={s.pctBarWrap}>
                            <div style={{ ...s.pctBar, width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span style={s.pctNum}>{pct}%</span>
                          <span style={s.pctCount}>({d.count})</span>
                        </div>
                      );
                    })}
                  </div>
                  {q.avg !== undefined && (
                    <div style={{ ...s.statsRow, marginTop: "0.75rem" }}>
                      <div style={s.stat}><span style={s.statVal}>{q.avg} / 5</span><span style={s.statLbl}>ממוצע</span></div>
                    </div>
                  )}
                </>
              )}

              {q.avg !== undefined && q.question_type === "number" && (
                <>
                  <div style={s.statsRow}>
                    <div style={s.stat}><span style={s.statVal}>{q.avg}</span><span style={s.statLbl}>ממוצע</span></div>
                    <div style={s.stat}><span style={s.statVal}>{q.min}</span><span style={s.statLbl}>מינימום</span></div>
                    <div style={s.stat}><span style={s.statVal}>{q.max}</span><span style={s.statLbl}>מקסימום</span></div>
                  </div>
                  {q.values && q.values.length > 0 && (() => {
                    const freq: Record<string, number> = {};
                    q.values!.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
                    const entries = Object.entries(freq).sort((a, b) => Number(a[0]) - Number(b[0]));
                    if (entries.length > 1 && entries.length <= 20) return (
                      <div style={{ ...s.pctList, marginTop: "0.75rem" }}>
                        {entries.map(([val, cnt], i) => {
                          const pct = Math.round(cnt / q.total_answers * 100);
                          return (
                            <div key={i} style={s.pctRow}>
                              <span style={s.pctLabel}>{val}</span>
                              <div style={s.pctBarWrap}><div style={{ ...s.pctBar, width: `${pct}%`, background: "#4a90d9" }} /></div>
                              <span style={s.pctNum}>{pct}%</span>
                              <span style={s.pctCount}>({cnt})</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                    return null;
                  })()}
                </>
              )}

              {q.text_answers && q.text_answers.length > 0 && (
                <ul style={s.textList}>
                  {q.text_answers.map((t, i) => <li key={i} style={s.textItem}>{t}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const center: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" };
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f0f4f8", direction: "rtl" },
  header: { background: "#1e3a5f", color: "#fff", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  headerTitle: { margin: 0, fontSize: "1.2rem" },
  headerSub: { margin: 0, fontSize: "0.85rem", opacity: 0.75 },
  back: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem", whiteSpace: "nowrap" },
  btnExport: { padding: "0.5rem 1rem", background: "#50c878", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  main: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
  filtersBar: { display: "flex", alignItems: "center", gap: "1rem", background: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", flexWrap: "wrap" },
  select: { padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem" },
  btnClear: { padding: "0.35rem 0.8rem", background: "#edf2f7", border: "none", borderRadius: "6px", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" },
  card: { background: "#fff", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  qTitle: { color: "#1e3a5f", margin: "0 0 0.25rem", fontSize: "1rem" },
  qMeta: { color: "#888", fontSize: "0.82rem", margin: "0 0 1rem" },
  statsRow: { display: "flex", gap: "1rem", marginTop: "0.5rem" },
  stat: { flex: 1, textAlign: "center", background: "#f7f9fc", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" },
  statVal: { fontSize: "1.4rem", fontWeight: 700, color: "#1e3a5f" },
  statLbl: { fontSize: "0.78rem", color: "#666" },
  textList: { listStyle: "none", padding: 0, margin: 0 },
  textItem: { padding: "0.5rem 0.75rem", background: "#f7f9fc", borderRadius: "6px", marginBottom: "0.4rem", fontSize: "0.9rem", color: "#333" },
  pctList: { display: "flex", flexDirection: "column" as const, gap: "0.4rem", marginTop: "0.5rem" },
  pctRow: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" },
  pctLabel: { width: "80px", textAlign: "right" as const, color: "#444", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  pctBarWrap: { flex: 1, height: "10px", background: "#edf2f7", borderRadius: "5px", overflow: "hidden" },
  pctBar: { height: "100%", borderRadius: "5px", transition: "width 0.3s" },
  pctNum: { width: "36px", textAlign: "left" as const, fontWeight: 700, color: "#1e3a5f", flexShrink: 0 },
  pctCount: { width: "32px", color: "#999", flexShrink: 0 },
};
