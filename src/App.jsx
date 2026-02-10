import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://pinuy-binuy-analyzer-production.up.railway.app";

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
  const { data: health, loading: hl } = useFetch("/health");
  const { data: opp, loading: ol } = useFetch("/api/opportunities?limit=10");
  const { data: sched } = useFetch("/api/scheduler");
  const { data: alerts } = useFetch("/api/alerts?limit=5");
  if (hl || ol) return <Spinner />;
  const opportunities = opp?.opportunities || opp?.data || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard icon={"🏗️"} label={"מתחמים"} value={health?.complexes || 0} accent="#60a5fa" />
        <StatCard icon={"💰"} label={"עסקאות"} value={health?.transactions || 0} accent="#a78bfa" />
        <StatCard icon={"🏠"} label={"מודעות"} value={health?.listings || 0} accent="#34d399" />
        <StatCard icon={"🔔"} label={"התראות"} value={health?.unread_alerts || 0} accent={health?.unread_alerts > 0 ? "#ef4444" : "#6b7280"} />
        <StatCard icon={"⏰"} label={"סריקה אוטומטית"} value={sched?.enabled ? "פעיל" : "כבוי"} sub={sched?.enabled ? "כל יום ראשון 06:00" : ""} accent={sched?.enabled ? "#10b981" : "#ef4444"} />
      </div>
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
              <tr key={p.id} onClick={() => onNavigate("detail", p.id)} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => rowHover(e,true)} onMouseLeave={(e) => rowHover(e,false)}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: IAI_COLORS[IAI_CAT(p.iai_score)] }}>{i + 1}</td>
                <td style={{ padding: "12px 14px" }}><IAIBar score={p.iai_score} width={80} /></td>
                <td style={{ padding: "12px 14px", fontWeight: 500, color: "#e2e8f0" }}>{p.name}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.city}</td>
                <td style={{ padding: "12px 14px" }}><StatusPill status={p.status} /></td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(p.planned_units) || "-"}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 12 }}>{p.developer || "-"}</td>
                <td style={{ padding: "12px 14px" }}>{parseInt(p.active_listings) > 0 ? <Badge color="#34d399">{p.active_listings}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {alerts?.alerts?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: "18px 22px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>{"🔔 התראות אחרונות"}</h2>
          {alerts.alerts.map((a) => { const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info; return (
            <div key={a.id} style={{ padding: "10px 14px", marginBottom: 8, borderRadius: 10, background: s.bg, borderRight: `3px solid ${s.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
              <div><div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>{a.title}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{a.message}</div></div>
            </div>); })}
        </div>
      )}
    </div>
  );
}

function OpportunitiesPage({ onNavigate }) {
  const { data, loading } = useFetch("/api/opportunities?limit=50");
  const [sortKey, setSortKey] = useState("iai_score");
  const [sortDir, setSortDir] = useState(-1);
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  if (loading) return <Spinner />;
  const raw = data?.opportunities || data?.data || [];
  const cities = [...new Set(raw.map((p) => p.city))].sort();
  const statuses = [...new Set(raw.map((p) => p.status))].sort();
  const filtered = raw.filter((p) => (!filterCity || p.city === filterCity) && (!filterStatus || p.status === filterStatus)).sort((a, b) => { const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0; return (typeof av === "string" ? av.localeCompare(bv) : av - bv) * sortDir; });
  const toggleSort = (key) => { if (sortKey === key) setSortDir(-sortDir); else { setSortKey(key); setSortDir(-1); } };
  const SortHead = ({ k, children }) => <th onClick={() => toggleSort(k)} style={{ ...TH, color: sortKey === k ? "#60a5fa" : "#64748b", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>{children} {sortKey === k ? (sortDir === -1 ? "▼" : "▲") : ""}</th>;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0", flexGrow: 1 }}>{"כל ההזדמנויות"} ({filtered.length})</h2>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}><option value="">{"כל הערים"}</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}><option value="">{"כל הסטטוסים"}</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_HE[s] || s}</option>)}</select>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <SortHead k="iai_score">IAI</SortHead><SortHead k="name">{"פרויקט"}</SortHead><SortHead k="city">{"עיר"}</SortHead><SortHead k="status">{"סטטוס"}</SortHead><SortHead k="planned_units">{"יח״ד מתוכננות"}</SortHead><SortHead k="existing_units">{"יח״ד קיימות"}</SortHead>
              <th style={TH}>{"יזם"}</th><th style={TH}>{"מודעות"}</th><th style={TH}>{"המלצה"}</th>
            </tr></thead>
            <tbody>{filtered.map((p) => (
              <tr key={p.id} onClick={() => onNavigate("detail", p.id)} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => rowHover(e,true)} onMouseLeave={(e) => rowHover(e,false)}>
                <td style={{ padding: "12px 14px" }}><IAIBar score={p.iai_score} width={70} /></td>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#e2e8f0", maxWidth: 200 }}>{p.name}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{p.city}</td>
                <td style={{ padding: "12px 14px" }}><StatusPill status={p.status} /></td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(p.planned_units)}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(p.existing_units)}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.developer || "-"}</td>
                <td style={{ padding: "12px 14px" }}>{parseInt(p.active_listings) > 0 ? <Badge color="#34d399">{p.active_listings}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
                <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 11 }}>{p.recommendation || "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailPage({ complexId, onNavigate }) {
  const { data: complex, loading } = useFetch(`/api/projects/${complexId}`);
  const { data: listings } = useFetch(`/api/projects/${complexId}/listings`);
  if (loading) return <Spinner />;
  if (!complex) return <div style={{ color: "#ef4444", textAlign: "center", padding: 40 }}>Complex not found</div>;
  const c = complex.complex || complex;
  const ls = listings?.listings || listings?.data || [];
  const ratio = c.planned_units && c.existing_units ? (c.planned_units / c.existing_units).toFixed(1) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <button onClick={() => onNavigate("opportunities")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 8 }}>{"→ חזרה להזדמנויות"}</button>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</h1>
          <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{c.city} | {c.region} {c.addresses ? `| ${c.addresses}` : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 42, fontWeight: 800, color: IAI_COLORS[IAI_CAT(c.iai_score)], fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{c.iai_score}</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>IAI Score</div></div>
          <StatusPill status={c.status} />
        </div>
      </div>
      <StatusTimeline current={c.status} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label={"יח״ד מתוכננות"} value={fmt(c.planned_units)} accent="#60a5fa" />
        <StatCard label={"יח״ד קיימות"} value={fmt(c.existing_units)} accent="#a78bfa" />
        <StatCard label={"מכפיל"} value={ratio ? `x${ratio}` : "N/A"} accent="#34d399" />
        <StatCard label={"פרמיה תיאורטית"} value={`${pct(c.theoretical_premium_min)}-${pct(c.theoretical_premium_max)}`} accent="#f59e0b" />
        <StatCard label={"יזם"} value={c.developer || "N/A"} sub={c.developer_strength === "strong" ? "חזק" : c.developer_strength === "weak" ? "חלש" : "בינוני"} accent={c.developer_strength === "strong" ? "#10b981" : c.developer_strength === "weak" ? "#ef4444" : "#f59e0b"} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: "18px 22px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>{"פירוט IAI"}</h3>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
          <div><span style={{ color: "#64748b" }}>Premium Gap: </span><span style={{ color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{pct(c.premium_gap)}</span></div>
          <div><span style={{ color: "#64748b" }}>Certainty: </span><span style={{ color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{Number(c.certainty_factor).toFixed(2)}</span></div>
          <div><span style={{ color: "#64748b" }}>Yield: </span><span style={{ color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{Number(c.yield_factor).toFixed(2)}</span></div>
          <div><span style={{ color: "#64748b" }}>{"המלצה"}: </span><span style={{ color: IAI_COLORS[IAI_CAT(c.iai_score)], fontWeight: 700 }}>{c.recommendation || (c.iai_score >= 70 ? "רכישה מומלצת בחום" : "שווה בדיקה")}</span></div>
        </div>
      </div>
      {c.perplexity_summary && (
        <div style={{ background: "rgba(59,130,246,0.05)", borderRadius: 14, border: "1px solid rgba(59,130,246,0.15)", padding: "18px 22px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "#60a5fa", fontWeight: 600 }}>{"🤖 סיכום מודיעין"}</h3>
          <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7, direction: "rtl" }}>{c.perplexity_summary}</div>
          {c.last_perplexity_update && <div style={{ color: "#475569", fontSize: 11, marginTop: 10 }}>{"עדכון אחרון"}: {new Date(c.last_perplexity_update).toLocaleDateString("he-IL")}</div>}
        </div>
      )}
      {ls.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><h3 style={{ margin: 0, fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>{"🏠 מודעות פעילות"} ({ls.length})</h3></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{["כתובת","חדרים","שטח (m²)","מחיר","למ״ר","SSI","מקור"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 500, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>{ls.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0", fontSize: 12 }}>{l.address || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{l.rooms || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{l.area_sqm || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(l.asking_price)}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{l.price_per_sqm ? fmtPrice(l.price_per_sqm) : "-"}</td>
                  <td style={{ padding: "10px 14px" }}>{l.ssi_score > 0 ? <Badge color={l.ssi_score >= 70 ? "#ef4444" : "#f59e0b"}>{l.ssi_score}</Badge> : <span style={{ color: "#475569" }}>0</span>}</td>
                  <td style={{ padding: "10px 14px", color: "#60a5fa", fontSize: 11 }}>{l.source || "Perplexity"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AllProjectsPage({ onNavigate }) {
  const { data, loading } = useFetch("/api/projects?limit=200");
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  if (loading) return <Spinner />;
  const projects = data?.projects || data?.data || [];
  const cities = [...new Set(projects.map((p) => p.city))].sort();
  const filtered = projects.filter((p) => (!search || p.name.includes(search) || (p.developer && p.developer.includes(search))) && (!filterCity || p.city === filterCity));
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0", flexGrow: 1 }}>{"כל המתחמים"} ({filtered.length})</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={"חיפוש..."} style={{...selectStyle, width: 180}} />
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}><option value="">{"כל הערים"}</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((p) => (
          <div key={p.id} onClick={() => onNavigate("detail", p.id)} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: "16px 18px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#60a5fa40"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 14 }}>{p.name}</div>
              {p.iai_score > 0 && <Badge color={IAI_COLORS[IAI_CAT(p.iai_score)]} size="lg">{p.iai_score}</Badge>}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>{p.city} | {p.region}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><StatusPill status={p.status} />{p.developer && <span style={{ color: "#64748b", fontSize: 11 }}>{p.developer}</span>}</div>
            {p.planned_units && <div style={{ marginTop: 8, color: "#64748b", fontSize: 12 }}>{fmt(p.existing_units)} {"→"} {fmt(p.planned_units)} {"יח״ד"}</div>}
          </div>
        ))}
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
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0" }}>{"התראות"} ({alerts.length})</h2>
        {data?.unread_count > 0 && <button onClick={markAll} style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>{"סמן הכל כנקרא"}</button>}
      </div>
      {alerts.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>{"אין התראות"}</div> : alerts.map((a) => {
        const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
        return (<div key={a.id} style={{ padding: "14px 18px", marginBottom: 10, borderRadius: 12, background: s.bg, borderRight: `3px solid ${s.border}`, display: "flex", alignItems: "center", gap: 12, opacity: a.is_read ? 0.5 : 1, transition: "opacity 0.2s" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>{a.title}</div><div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{a.message}</div><div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString("he-IL")} | {a.complex_name} ({a.city})</div></div>
          {!a.is_read && <button onClick={() => markRead(a.id)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>{"✓"}</button>}
        </div>);
      })}
    </div>
  );
}

function ScanPage() {
  const { data: sched, reload: reloadSched } = useFetch("/api/scheduler");
  const { data: scans, loading, reload: reloadScans } = useFetch("/api/scan/results?limit=20");
  const [scanning, setScanning] = useState(false);
  const triggerScan = async () => { setScanning(true); try { await fetch(`${API}/api/scheduler/run`, { method: "POST" }); setTimeout(() => { reloadSched(); reloadScans(); setScanning(false); }, 5000); } catch { setScanning(false); } };
  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0" }}>{"סריקה ותזמון"}</h2>
        <button onClick={triggerScan} disabled={scanning || sched?.isRunning} style={{ background: scanning ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)", border: `1px solid ${scanning ? "#f59e0b50" : "#10b98150"}`, color: scanning ? "#f59e0b" : "#10b981", padding: "8px 18px", borderRadius: 10, cursor: scanning ? "wait" : "pointer", fontSize: 13, fontWeight: 600 }}>{scanning ? "סורק..." : "הפעל סריקה ידנית"}</button>
      </div>
      {sched && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: "18px 22px", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>{"סטטוס תזמון"}</h3>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
            <div><span style={{ color: "#64748b" }}>{"סטטוס"}: </span><Badge color={sched.enabled ? "#10b981" : "#ef4444"}>{sched.enabled ? "פעיל" : "כבוי"}</Badge></div>
            <div><span style={{ color: "#64748b" }}>Cron: </span><span style={{ color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{sched.cron}</span></div>
            <div><span style={{ color: "#64748b" }}>Timezone: </span><span style={{ color: "#e2e8f0" }}>{sched.timezone}</span></div>
            <div><span style={{ color: "#64748b" }}>Perplexity: </span><Badge color={sched.perplexityConfigured ? "#10b981" : "#ef4444"}>{sched.perplexityConfigured ? "מוגדר" : "לא מוגדר"}</Badge></div>
          </div>
          {sched.lastRun && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 12, color: "#94a3b8" }}><strong>{"ריצה אחרונה"}</strong>: {sched.lastRun.summary || sched.lastRun.error || "N/A"}</div>}
        </div>
      )}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><h3 style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>{"היסטוריית סריקות"}</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{["#","סוג","סטטוס","נסרקו","עסקאות","מודעות","התראות","תאריך"].map((h) => <th key={h} style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 500, fontSize: 11 }}>{h}</th>)}</tr></thead>
          <tbody>{(scans?.scans || []).map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{s.id}</td>
              <td style={{ padding: "8px 12px" }}><Badge color={s.scan_type === "weekly_auto" ? "#a78bfa" : "#60a5fa"}>{s.scan_type}</Badge></td>
              <td style={{ padding: "8px 12px" }}><Badge color={s.status === "completed" ? "#10b981" : s.status === "running" ? "#f59e0b" : "#ef4444"}>{s.status}</Badge></td>
              <td style={{ padding: "8px 12px", color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{s.complexes_scanned}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{s.new_transactions}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{s.new_listings}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{s.alerts_sent || 0}</td>
              <td style={{ padding: "8px 12px", color: "#64748b", fontSize: 11 }}>{s.started_at ? new Date(s.started_at).toLocaleString("he-IL") : "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", icon: "▣", label: "דשבורד" },
  { id: "opportunities", icon: "☆", label: "הזדמנויות" },
  { id: "projects", icon: "○", label: "מתחמים" },
  { id: "alerts", icon: "◇", label: "התראות" },
  { id: "scans", icon: "↻", label: "סריקות" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [detailId, setDetailId] = useState(null);
  const navigate = (p, id) => { setPage(p); if (id) setDetailId(id); window.scrollTo(0, 0); };
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0c0f1a", fontFamily: "'Rubik', 'Segoe UI', sans-serif", color: "#e2e8f0", direction: "rtl" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}body{margin:0;padding:0;background:#0c0f1a}table{direction:rtl}`}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)" }} />
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(12,15,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", height: 56, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>Q</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.3 }}>QUANTUM</span>
          </div>
          <nav style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV_ITEMS.map((item) => { const active = page === item.id || (page === "detail" && item.id === "opportunities"); return (
              <button key={item.id} onClick={() => navigate(item.id)} style={{ background: active ? "rgba(96,165,250,0.1)" : "transparent", border: "none", color: active ? "#60a5fa" : "#64748b", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#94a3b8"; }} onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
              </button>); })}
          </nav>
          <div style={{ fontSize: 11, color: "#475569" }}>v3.0</div>
        </div>
      </header>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 80px", position: "relative", zIndex: 1 }}>
        {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
        {page === "opportunities" && <OpportunitiesPage onNavigate={navigate} />}
        {page === "projects" && <AllProjectsPage onNavigate={navigate} />}
        {page === "alerts" && <AlertsPage />}
        {page === "scans" && <ScanPage />}
        {page === "detail" && detailId && <DetailPage complexId={detailId} onNavigate={navigate} />}
      </main>
    </div>
  );
}
