import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://pinuy-binuy-analyzer-production.up.railway.app";
const VERSION = "4.3.2";

const fmt = (n) => n != null ? Number(n).toLocaleString("he-IL") : "N/A";
const fmtPrice = (n) => n != null ? `${fmt(n)} ₪` : "N/A";
const pct = (n) => n != null ? `${Number(n).toFixed(0)}%` : "N/A";

const STATUS_HE = { declared: "הוכרז", planning: "בתכנון", pre_deposit: "להפקדה", deposited: "הופקדה", approved: "אושרה", permit: "היתר בנייה", construction: "בביצוע", unknown: "לא ידוע" };
const IAI_COLORS = { excellent: "#10b981", good: "#f59e0b", moderate: "#ef4444", low: "#6b7280" };
const IAI_CAT = (s) => s >= 70 ? "excellent" : s >= 50 ? "good" : s >= 30 ? "moderate" : "low";
const SEVERITY_STYLE = { high: { bg: "rgba(239,68,68,0.12)", border: "#ef4444", dot: "#ef4444" }, medium: { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", dot: "#f59e0b" }, low: { bg: "rgba(107,114,128,0.12)", border: "#6b7280", dot: "#6b7280" }, info: { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", dot: "#3b82f6" } };
const STATUS_FLOW = ["declared","planning","pre_deposit","deposited","approved","permit","construction"];

function useFetch(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reload = useCallback(() => {
    setLoading(true); setError(null);
    fetch(`${API}${endpoint}`).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [endpoint, ...deps]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

function Spinner() { return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>; }

function Badge({ children, color = "#60a5fa", size = "sm" }) {
  return <span style={{ display: "inline-block", padding: size === "lg" ? "4px 12px" : "2px 8px", borderRadius: 6, background: `${color}18`, color, fontSize: size === "lg" ? 13 : 11, fontWeight: 600, letterSpacing: 0.3, border: `1px solid ${color}30` }}>{children}</span>;
}

function StatCard({ label, value, sub, accent = "#60a5fa", icon }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(255,255,255,0.06)", flex: "1 1 180px", minWidth: 160, transition: "border-color 0.2s, background 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
      <div style={{ fontSize: 12, color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{icon && <span style={{ marginLeft: 6 }}>{icon}</span>}{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: accent, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function IAIBar({ score, width = 120, height = 8 }) {
  const color = IAI_COLORS[IAI_CAT(score)];
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width, height, background: "rgba(255,255,255,0.06)", borderRadius: height/2, overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: height/2, transition: "width 0.6s ease" }} /></div><span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span></div>;
}

function StatusPill({ status }) {
  const colorMap = { declared: "#8b5cf6", planning: "#6366f1", pre_deposit: "#3b82f6", deposited: "#0ea5e9", approved: "#10b981", permit: "#22d3ee", construction: "#f59e0b" };
  return <Badge color={colorMap[status] || "#6b7280"}>{STATUS_HE[status] || status}</Badge>;
}

function StatusTimeline({ current }) {
  const idx = STATUS_FLOW.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "12px 0" }}>
      {STATUS_FLOW.map((s, i) => {
        const active = i <= idx, isCurrent = i === idx;
        return (<div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10, borderRadius: "50%", background: active ? (isCurrent ? "#10b981" : "#10b98180") : "rgba(255,255,255,0.1)", border: isCurrent ? "2px solid #10b981" : "none", boxShadow: isCurrent ? "0 0 8px rgba(16,185,129,0.4)" : "none", transition: "all 0.3s" }} title={STATUS_HE[s]} />
          {i < STATUS_FLOW.length - 1 && <div style={{ width: 24, height: 2, background: i < idx ? "#10b98160" : "rgba(255,255,255,0.06)" }} />}
        </div>);
      })}
    </div>
  );
}

const TH = { padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 500, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" };
const rowHover = (e, on) => e.currentTarget.style.background = on ? "rgba(255,255,255,0.04)" : "transparent";
const selectStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: 8, fontSize: 12, outline: "none" };

function DashboardPage({ onNavigate }) {
  const { data: health, loading: hl, error: healthErr } = useFetch("/health");
  const { data: opp, loading: ol } = useFetch("/api/opportunities?limit=10");
  const { data: sched, reload: reloadSched } = useFetch("/api/scheduler");
  const { data: alerts } = useFetch("/api/alerts?limit=5");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  
  const triggerManualScan = async () => {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch(`${API}/api/scheduler/run`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setScanMessage({ type: "success", text: "סריקה הופעלה! הדוח יישלח למייל בסיום." });
        setTimeout(() => { reloadSched(); setScanMessage(null); }, 10000);
      } else {
        setScanMessage({ type: "error", text: data.error || "שגיאה בהפעלת סריקה" });
      }
    } catch (err) {
      setScanMessage({ type: "error", text: "שגיאה בחיבור לשרת" });
    } finally {
      setScanning(false);
    }
  };
  
  if (hl || ol) return <Spinner />;
  const opportunities = opp?.opportunities || opp?.data || [];
  const isRunning = sched?.isRunning || scanning;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard icon={"🏗️"} label={"מתחמים"} value={health?.complexes || 0} accent="#60a5fa" />
        <StatCard icon={"💰"} label={"עסקאות"} value={health?.transactions || 0} accent="#a78bfa" />
        <StatCard icon={"🏠"} label={"מודעות"} value={health?.active_listings || 0} accent="#34d399" />
        <StatCard icon={"🔔"} label={"התראות"} value={health?.unread_alerts || 0} accent={health?.unread_alerts > 0 ? "#ef4444" : "#6b7280"} />
      </div>
      
      {/* Scan Control Panel */}
      <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>🔄 סריקת נתונים</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: sched?.enabled ? "#10b981" : "#ef4444" }} />
                סריקה אוטומטית: {sched?.enabled ? "פעיל" : "כבוי"}
              </span>
              <span>|</span>
              <span>⏰ כל יום ב-08:00</span>
              <span>|</span>
              <span>📧 דוח נשלח למייל</span>
            </div>
            {sched?.lastRun && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                סריקה אחרונה: {new Date(sched.lastRun.completedAt).toLocaleString("he-IL")} 
                {sched.lastRun.alertsGenerated > 0 && ` (${sched.lastRun.alertsGenerated} התראות חדשות)`}
              </div>
            )}
          </div>
          <button 
            onClick={triggerManualScan} 
            disabled={isRunning}
            style={{ 
              background: isRunning ? "#374151" : "linear-gradient(135deg, #10b981, #059669)", 
              border: "none", 
              color: "#fff", 
              padding: "12px 24px", 
              borderRadius: 10, 
              cursor: isRunning ? "not-allowed" : "pointer", 
              fontSize: 14, 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: isRunning ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
              transition: "all 0.2s"
            }}
          >
            {isRunning ? (
              <>
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                סורק...
              </>
            ) : (
              <>🚀 הפעל סריקה עכשיו</>
            )}
          </button>
        </div>
        {scanMessage && (
          <div style={{ 
            marginTop: 12, 
            padding: "10px 14px", 
            borderRadius: 8, 
            background: scanMessage.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${scanMessage.type === "success" ? "#10b981" : "#ef4444"}`,
            color: scanMessage.type === "success" ? "#10b981" : "#ef4444",
            fontSize: 13
          }}>
            {scanMessage.text}
          </div>
        )}
      </div>
      
      {/* Top Opportunities Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>{"🌟 הזדמנויות מובילות"}</h2>
          <button onClick={() => onNavigate("opportunities")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>{"צפה הכל ←"}</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["ציון","IAI","פרויקט","עיר","סטטוס","יח׳ד","יזם","מודעות"].map((h) => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>{opportunities.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onMouseEnter={(e) => rowHover(e, true)} onMouseLeave={(e) => rowHover(e, false)} onClick={() => onNavigate("complex", p.id)}>
                <td style={{ padding: "12px 14px" }}><Badge color={IAI_COLORS[IAI_CAT(p.iai_score)]} size="lg">{IAI_CAT(p.iai_score) === "excellent" ? "מצוין" : IAI_CAT(p.iai_score) === "good" ? "טוב" : "בינוני"}</Badge></td>
                <td style={{ padding: "12px 14px" }}><IAIBar score={p.iai_score || 0} /></td>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#e2e8f0" }}>{p.name}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.city}</td>
                <td style={{ padding: "12px 14px" }}><StatusPill status={p.status} /></td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{fmt(p.planned_units)}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.developer || "-"}</td>
                <td style={{ padding: "12px 14px" }}>{parseInt(p.active_listings) > 0 ? <Badge color="#34d399">{p.active_listings}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesPage({ onNavigate }) {
  const { data, loading } = useFetch("/api/opportunities?limit=50");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  if (loading) return <Spinner />;
  const opportunities = data?.opportunities || data?.data || [];
  let filtered = opportunities;
  if (filterCity) filtered = filtered.filter((p) => p.city === filterCity);
  if (filterStatus) filtered = filtered.filter((p) => p.status === filterStatus);
  const cities = [...new Set(opportunities.map((p) => p.city))].sort();
  const statuses = [...new Set(opportunities.map((p) => p.status))];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>כל ההזדמנויות ({filtered.length})</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}><option value="">כל הערים</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}><option value="">כל הסטטוסים</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_HE[s] || s}</option>)}</select>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["IAI ▼","פרויקט","עיר","סטטוס","יח׳ד מתוכננות","יח׳ד קיימות","יזם","מודעות","המלצה"].map((h) => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onMouseEnter={(e) => rowHover(e, true)} onMouseLeave={(e) => rowHover(e, false)} onClick={() => onNavigate("complex", p.id)}>
                <td style={{ padding: "12px 14px" }}><IAIBar score={p.iai_score || 0} /></td>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#e2e8f0" }}>{p.name}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.city}</td>
                <td style={{ padding: "12px 14px" }}><StatusPill status={p.status} /></td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{fmt(p.planned_units)}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{fmt(p.existing_units)}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.developer || "-"}</td>
                <td style={{ padding: "12px 14px" }}>{parseInt(p.active_listings) > 0 ? <Badge color="#34d399">{p.active_listings}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
                <td style={{ padding: "12px 14px" }}><Badge color={IAI_COLORS[IAI_CAT(p.iai_score)]}>{p.iai_score >= 70 ? "קנה עכשיו" : p.iai_score >= 50 ? "עקוב" : "המתן"}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ComplexDetailPage({ complexId, onBack }) {
  const { data: complex, loading } = useFetch(`/api/projects/${complexId}`);
  const { data: listings } = useFetch(`/api/projects/${complexId}/listings`);
  if (loading) return <Spinner />;
  if (!complex) return <div style={{ color: "#ef4444", textAlign: "center", padding: 40 }}>מתחם לא נמצא</div>;
  const p = complex.data || complex;
  const listingData = listings?.listings || listings?.data || [];
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← חזרה</button>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#e2e8f0" }}>{p.name}</h1>
            <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{p.city} | {p.addresses || "כתובות לא זמינות"}</p>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>ציון IAI</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: IAI_COLORS[IAI_CAT(p.iai_score || 0)], fontFamily: "'JetBrains Mono', monospace" }}>{p.iai_score || 0}</div>
          </div>
        </div>
        <StatusTimeline current={p.status} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>יזם</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{p.developer || "-"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>יח׳ד מתוכננות</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{fmt(p.planned_units)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>יח׳ד קיימות</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{fmt(p.existing_units)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>פרמיה תיאורטית</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{p.theoretical_premium_min && p.theoretical_premium_max ? `${p.theoretical_premium_min}-${p.theoretical_premium_max}%` : "-"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>פרמיה בפועל</div>
            <div style={{ fontSize: 15, color: p.actual_premium ? "#10b981" : "#e2e8f0", fontWeight: 600 }}>{p.actual_premium ? `${p.actual_premium}%` : "-"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>מודעות פעילות</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>{p.active_listings || 0}</div>
          </div>
        </div>
      </div>
      {listingData.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><h3 style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>מודעות למכירה ({listingData.length})</h3></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["כתובת","חדרים","מ״ר","מחיר","מחיר/מ״ר","מקור"].map((h) => <th key={h} style={TH}>{h}</th>)}
              </tr></thead>
              <tbody>{listingData.map((l, i) => (
                <tr key={l.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{l.address || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{l.rooms || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{l.area_sqm || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{fmtPrice(l.asking_price)}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{l.price_per_sqm ? fmtPrice(l.price_per_sqm) : "-"}</td>
                  <td style={{ padding: "10px 14px" }}><Badge color="#6366f1">{l.source || "yad2"}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplexesPage({ onNavigate }) {
  const { data, loading, error } = useFetch("/api/projects?limit=200");
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  
  if (loading) return <Spinner />;
  const projects = data?.projects || data?.data || [];
  const cities = [...new Set(projects.map((p) => p.city))].sort();
  let filtered = projects;
  if (search) filtered = filtered.filter((p) => p.name?.includes(search) || p.city?.includes(search) || p.addresses?.includes(search));
  if (filterCity) filtered = filtered.filter((p) => p.city === filterCity);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>כל המתחמים ({filtered.length})</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input type="text" placeholder="חיפוש..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...selectStyle, width: 160 }} />
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}><option value="">כל הערים</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["פרויקט","עיר","סטטוס","יזם","יח׳ד","מודעות","IAI"].map((h) => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onMouseEnter={(e) => rowHover(e, true)} onMouseLeave={(e) => rowHover(e, false)} onClick={() => onNavigate("complex", p.id)}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#e2e8f0" }}>{p.name}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.city}</td>
                <td style={{ padding: "12px 14px" }}><StatusPill status={p.status} /></td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.developer || "-"}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{fmt(p.planned_units)}</td>
                <td style={{ padding: "12px 14px" }}>{parseInt(p.active_listings) > 0 ? <Badge color="#34d399">{p.active_listings}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
                <td style={{ padding: "12px 14px" }}>{p.iai_score ? <IAIBar score={p.iai_score} width={80} /> : <span style={{ color: "#475569" }}>-</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AlertsPage() {
  const { data, loading, reload } = useFetch("/api/alerts?limit=100");
  const markRead = async (id) => { await fetch(`${API}/api/alerts/${id}/read`, { method: "PUT" }); reload(); };
  const markAll = async () => { await fetch(`${API}/api/alerts/read-all`, { method: "PUT" }); reload(); };
  if (loading) return <Spinner />;
  const alerts = data?.alerts || [];
  const unread = alerts.filter((a) => !a.is_read);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>התראות ({unread.length})</h2>
        {unread.length > 0 && <button onClick={markAll} style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>סמן הכל כנקרא</button>}
      </div>
      {alerts.length === 0 ? <div style={{ textAlign: "center", color: "#64748b", padding: 60 }}>אין התראות</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((a) => {
            const sev = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
            return (
              <div key={a.id} style={{ background: a.is_read ? "rgba(255,255,255,0.02)" : sev.bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${a.is_read ? "rgba(255,255,255,0.06)" : sev.border}`, opacity: a.is_read ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sev.dot }} />
                      <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 14 }}>{a.title}</span>
                    </div>
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{a.message}</p>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>{new Date(a.created_at).toLocaleString("he-IL")}</div>
                  </div>
                  {!a.is_read && <button onClick={() => markRead(a.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11 }}>✓</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScanPage() {
  const { data: sched, reload: reloadSched } = useFetch("/api/scheduler");
  const { data: scans, loading, reload: reloadScans } = useFetch("/api/scan/results?limit=20");
  const [scanning, setScanning] = useState(false);
  const triggerScan = async () => { setScanning(true); try { await fetch(`${API}/api/scheduler/run`, { method: "POST" }); setTimeout(() => { reloadSched(); reloadScans(); setScanning(false); }, 5000); } catch { setScanning(false); } };
  if (loading) return <Spinner />;
  const scanList = scans?.scans || [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>סריקה ותזמון</h2>
        <button onClick={triggerScan} disabled={scanning || sched?.isRunning} style={{ background: scanning || sched?.isRunning ? "#374151" : "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 10, cursor: scanning || sched?.isRunning ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>{scanning || sched?.isRunning ? "סורק..." : "הפעל סריקה ידנית"}</button>
      </div>
      
      {/* Scheduler Status */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#e2e8f0" }}>סטטוס תזמון</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>סריקה אוטומטית</div>
            <div style={{ fontSize: 14, color: sched?.enabled ? "#10b981" : "#ef4444", fontWeight: 600 }}>{sched?.enabled ? "✅ פעיל" : "❌ כבוי"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>תזמון</div>
            <div style={{ fontSize: 14, color: "#e2e8f0" }}>כל יום ב-08:00 (שעון ישראל)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Perplexity AI</div>
            <div style={{ fontSize: 14, color: sched?.perplexityConfigured ? "#10b981" : "#ef4444" }}>{sched?.perplexityConfigured ? "✅ מוגדר" : "❌ לא מוגדר"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Claude AI</div>
            <div style={{ fontSize: 14, color: sched?.claudeConfigured ? "#10b981" : "#f59e0b" }}>{sched?.claudeConfigured ? "✅ מוגדר" : "⚠️ לא מוגדר"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>התראות מייל</div>
            <div style={{ fontSize: 14, color: sched?.notificationsConfigured ? "#10b981" : "#ef4444" }}>{sched?.notificationsConfigured ? "✅ פעיל" : "❌ לא מוגדר"}</div>
          </div>
        </div>
      </div>
      
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><h3 style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>היסטוריית סריקות</h3></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#","סוג","סטטוס","נסרקו","עסקאות","מודעות","התראות","תאריך"].map((h) => <th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>{scanList.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.id}</td>
                <td style={{ padding: "10px 14px" }}><Badge color="#6366f1">{s.scan_type}</Badge></td>
                <td style={{ padding: "10px 14px" }}><Badge color={s.status === "completed" ? "#10b981" : s.status === "running" ? "#f59e0b" : "#ef4444"}>{s.status === "completed" ? "הושלם" : s.status === "running" ? "רץ" : "נכשל"}</Badge></td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.complexes_scanned || 0}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.new_transactions || 0}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.new_listings || 0}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{s.alerts_sent || 0}</td>
                <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11 }}>{new Date(s.started_at).toLocaleString("he-IL")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedComplex, setSelectedComplex] = useState(null);
  const navigate = (p, id) => { setPage(p); setSelectedComplex(id || null); };
  const navStyle = (p) => ({ background: page === p ? "rgba(96,165,250,0.15)" : "transparent", border: "none", color: page === p ? "#60a5fa" : "#94a3b8", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 600 : 400, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" });
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0c0f1a 0%, #111827 100%)", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif", direction: "rtl" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');`}</style>
      <header style={{ background: "rgba(17,24,39,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>Q</div>
          <div><div style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>QUANTUM</div><div style={{ fontSize: 11, color: "#64748b" }}>Pinuy Binuy Analyzer</div></div>
        </div>
        <nav style={{ display: "flex", gap: 6 }}>
          <button style={navStyle("dashboard")} onClick={() => navigate("dashboard")}>📊 דשבורד</button>
          <button style={navStyle("opportunities")} onClick={() => navigate("opportunities")}>⭐ הזדמנויות</button>
          <button style={navStyle("complexes")} onClick={() => navigate("complexes")}>🏢 מתחמים</button>
          <button style={navStyle("alerts")} onClick={() => navigate("alerts")}>🔔 התראות</button>
          <button style={navStyle("scans")} onClick={() => navigate("scans")}>🔄 סריקות</button>
        </nav>
        <div style={{ fontSize: 11, color: "#475569" }}>v{VERSION}</div>
      </header>
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
        {page === "opportunities" && <OpportunitiesPage onNavigate={navigate} />}
        {page === "complexes" && <ComplexesPage onNavigate={navigate} />}
        {page === "complex" && <ComplexDetailPage complexId={selectedComplex} onBack={() => navigate("complexes")} />}
        {page === "alerts" && <AlertsPage />}
        {page === "scans" && <ScanPage />}
      </main>
    </div>
  );
}
