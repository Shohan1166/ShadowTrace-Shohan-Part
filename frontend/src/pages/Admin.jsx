import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");

  async function loadUsers() {
    try {
      const { data } = await api.get("/users");
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(id, role) {
    setError(""); setWorkingId(id);
    try {
      const { data } = await api.patch(`/users/${id}/role`, { role });
      setUsers(current => current.map(u => u.id === id ? data.user : u));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update role.");
    } finally { setWorkingId(""); }
  }

  return (
    <div>
      <div className="page-heading"><div><div className="eyebrow muted">ADMINISTRATION / ACCESS CONTROL</div><h1>Admin panel</h1><p>Review registered accounts and manage role-based access.</p></div><span className="status-pill"><i></i> ADMIN ACCESS</span></div>
      <div className="admin-note"><b>Role management</b><p>Only administrators can view this directory and change account roles. Public registration cannot create administrator accounts.</p></div>
      <div className="table-card">
        <div className="table-heading"><div><h3>Registered users</h3><p>Latest accounts · maximum 200 records</p></div><button className="secondary-button" onClick={loadUsers}>↻ Refresh</button></div>
        {error && <div className="alert error">{error}</div>}
        {loading ? <div className="empty-state">Loading accounts…</div> : (
          <div className="table-scroll"><table><thead><tr><th>USER</th><th>EMAIL</th><th>ROLE</th><th>JOINED</th><th>ACCESS ACTION</th></tr></thead>
            <tbody>{users.map(u => <tr key={u.id}><td><div className="table-user"><span>{u.name.charAt(0).toUpperCase()}</span><b>{u.name}</b></div></td><td>{u.email}</td><td><span className={`role-chip ${u.role === "admin" ? "admin-chip" : ""}`}>{u.role}</span></td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td><select value={u.role} disabled={workingId === u.id} onChange={e => changeRole(u.id, e.target.value)}><option value="user">User</option><option value="admin">Admin</option></select></td></tr>)}</tbody>
          </table></div>
        )}
        {!loading && users.length === 0 && <div className="empty-state">No user accounts found.</div>}
      </div>
    </div>
  );
}
