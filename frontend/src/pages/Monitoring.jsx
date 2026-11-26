import React, { useEffect, useState } from "react";
import api from "../services/api";

function dateLabel(value) {
  if (!value) return "Not scanned yet";
  return new Date(value).toLocaleString();
}

export default function Monitoring() {
  const [accounts, setAccounts] = useState([]);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("Personal account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanningId, setScanningId] = useState("");
  const [notice, setNotice] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  async function loadAccounts() {
    try {
      const { data } = await api.get("/monitoring/accounts");
      setAccounts(data.accounts || []);
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Could not load monitored accounts." });
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAccounts(); }, []);

  async function handleAdd(event) {
    event.preventDefault(); setSaving(true); setNotice(null); setScanResult(null);
    try {
      const { data } = await api.post("/monitoring/accounts", { email, label });
      setAccounts((current) => [data.account, ...current]);
      setEmail(""); setLabel("Personal account");
      setNotice({ type: "success", text: data.message });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Could not add this account." });
    } finally { setSaving(false); }
  }

  async function handleScan(account) {
    setScanningId(account._id); setNotice(null); setScanResult(null);
    try {
      const { data } = await api.post(`/monitoring/accounts/${account._id}/scan`);
      setScanResult(data);
      await loadAccounts();
      setNotice({ type: "success", text: data.message });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Exposure analysis failed." });
    } finally { setScanningId(""); }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this monitored account?")) return;
    try {
      await api.delete(`/monitoring/accounts/${id}`);
      setAccounts((current) => current.filter((item) => item._id !== id));
      if (scanResult?.account?.id === id) setScanResult(null);
      setNotice({ type: "success", text: "Monitored account removed." });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Could not remove account." });
    }
  }

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">MODULE 02 / CREDENTIAL EXPOSURE</div><h1>Exposure monitoring</h1><p>Add an account and compare its email identifier with the local simulated breach dataset.</p></div><span className="status-pill"><i /> SIMULATED DATASET</span></div>
      <div className="privacy-note"><b>Privacy and scope</b><p>ShadowTrace stores a one-way SHA-256 email digest for matching. It does not store passwords, retrieve leaked passwords, or crawl the dark web. Results depend only on the academic demo dataset installed in this project.</p></div>
      <div className="module-grid">
        <section className="form-card"><div className="section-title">ADD AN ACCOUNT <span>YOUR ACCOUNT ONLY</span></div>
          <form onSubmit={handleAdd}>
            <label htmlFor="monitor-email">Email address</label><input id="monitor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required maxLength={254} />
            <label htmlFor="monitor-label">Account label</label><input id="monitor-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Personal / University / Work" maxLength={60} />
            <p className="field-note">The original email address is not saved. Only a one-way digest and masked address are retained.</p>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Adding…" : "Add for monitoring"} <span>→</span></button>
          </form>
        </section>
        <section className="stat-card module-stat"><div className="stat-top">MONITORED ACCOUNTS <i className="stat-icon blue">◎</i></div><strong className="stat-value">{accounts.length}</strong><small>Accounts linked to your user profile</small></section>
      </div>
      {notice && <div className={`alert ${notice.type}`}>{notice.text}</div>}
      <div className="section-title">YOUR MONITORED ACCOUNTS <span>{accounts.length} TOTAL</span></div>
      <section className="table-card"><div className="table-scroll"><table><thead><tr><th>ACCOUNT</th><th>LAST ANALYSIS</th><th>DATASET MATCHES</th><th>ACTIONS</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="4" className="empty-state">Loading accounts…</td></tr> : accounts.length === 0 ? <tr><td colSpan="4" className="empty-state">No monitored accounts yet. Add an email address above to begin.</td></tr> : accounts.map((account) => <tr key={account._id}><td><b>{account.label}</b><div className="muted">{account.emailMasked}</div></td><td>{dateLabel(account.lastScannedAt)}</td><td><span className="count-chip">{account.exposureCount || 0}</span></td><td><button className="secondary-button" onClick={() => handleScan(account)} disabled={!!scanningId}>{scanningId === account._id ? "Analyzing…" : "Analyze"}</button> <button className="text-button danger-text" onClick={() => handleRemove(account._id)}>Remove</button></td></tr>)}
      </tbody></table></div></section>
      {scanResult && <>
        <div className="section-title">LATEST ANALYSIS <span>{scanResult.account.emailMasked}</span></div>
        <section className="table-card"><div className="analysis-summary"><div><small>DATASET MATCHES</small><strong>{scanResult.summary.exposureCount}</strong></div><div><small>RISK SCORE</small><strong>{scanResult.summary.riskScore}/100</strong><span className={`severity-chip ${(scanResult.summary.riskLevel || "low").toLowerCase()}`}>{scanResult.summary.riskLevel}</span></div><div><small>ANALYSIS TIME</small><strong className="analysis-date">{dateLabel(scanResult.summary.scannedAt)}</strong></div></div>
          <div className="risk-panel"><div className="section-title">RISK ASSESSMENT <span>MODULE 02 / ASHIF MRIDHA</span></div><p>Score calculated from the matching demo records, record severity, and exposed data types. This is an academic risk indicator, not a guarantee of compromise.</p>{(scanResult.summary.riskFactors || []).map((factor, index) => <span className="factor-chip" key={index}>{factor}</span>)}</div>
          <div className="recommendation-panel"><div className="section-title">SECURITY RECOMMENDATIONS <span>MODULE 02 / AL MAHMUD SHOHAN</span></div><div className="recommendation-list">{(scanResult.recommendations || []).map((item, index) => <article className="recommendation-item" key={index}><span className={`priority-chip ${item.priority.toLowerCase()}`}>{item.priority}</span><div><b>{item.title}</b><p>{item.detail}</p></div></article>)}</div></div>
          {scanResult.exposures.length === 0 ? <div className="empty-state">No matching records were found in the current simulated dataset. This does not prove that the account has never been exposed elsewhere.</div> : <div className="table-scroll"><table><thead><tr><th>SOURCE</th><th>DATE</th><th>DATA TYPES IN RECORD</th><th>SEVERITY LABEL</th></tr></thead><tbody>{scanResult.exposures.map((item) => <tr key={item.id}><td><b>{item.sourceName}</b><div className="muted">{item.synthetic ? "Synthetic academic record" : "Dataset record"}</div></td><td>{item.breachDate ? new Date(item.breachDate).toLocaleDateString() : "Not specified"}</td><td>{item.exposedDataTypes.join(", ")}</td><td><span className={`severity-chip ${item.severity.toLowerCase()}`}>{item.severity}</span></td></tr>)}</tbody></table></div>}
        </section>
      </>}
    </>
  );
}
