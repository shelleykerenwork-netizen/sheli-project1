export default function SurveyDone() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", direction: "rtl" }}>
      <div style={{ background: "#fff", padding: "3rem", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>✅</div>
        <h1 style={{ color: "#1e3a5f", marginTop: "1rem" }}>תודה על מילוי הסקר!</h1>
        <p style={{ color: "#666" }}>תשובותיך נשמרו בהצלחה.</p>
      </div>
    </div>
  );
}
