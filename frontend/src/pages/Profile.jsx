import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setMessage(""); setError(""); setBusy(true);
    try {
      const { data } = await api.patch("/users/me", { name });
      setUser(data.user); setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="page-heading"><div><div className="eyebrow muted">ACCOUNT CENTRE / PROFILE</div><h1>My profile</h1><p>Manage the personal information associated with your account.</p></div></div>
      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <h2>{user?.name}</h2><p>{user?.email}</p><span className="role-chip">{user?.role?.toUpperCase()}</span>
          <div className="profile-divider"></div><div className="profile-meta"><span>ACCOUNT ID</span><b>{user?.id}</b></div>
          <div className="profile-meta"><span>MEMBER SINCE</span><b>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</b></div>
        </div>
        <div className="form-card">
          <div className="section-title">PERSONAL INFORMATION <span>EDIT PROFILE</span></div>
          <form onSubmit={submit}>
            <label>Full name</label><input value={name} onChange={e => setName(e.target.value)} minLength="2" maxLength="80" required/>
            <label>Email address</label><input value={user?.email || ""} disabled/>
            <p className="field-note">Email address and account role are managed separately and cannot be changed here.</p>
            {message && <div className="alert success">{message}</div>}
            {error && <div className="alert error">{error}</div>}
            <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"} <span>→</span></button>
          </form>
        </div>
      </div>
    </div>
  );
}
