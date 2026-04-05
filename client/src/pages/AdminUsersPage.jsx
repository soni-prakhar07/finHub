import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/apiError.js";

const ROLES = ["VIEWER", "ANALYST", "ADMIN"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowSaving, setRowSaving] = useState(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("VIEWER");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function refreshUsers() {
    const { data } = await api.get("/api/users");
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/me")
      .then((res) => {
        if (!cancelled) setMe(res.data.user);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (me && me.role !== "ADMIN") {
      navigate("/", { replace: true });
    }
  }, [me, navigate]);

  useEffect(() => {
    if (!me || me.role !== "ADMIN") return undefined;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        await refreshUsers();
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          setError("Please log in.");
        } else if (err.response?.status === 403) {
          setError("Admin access required.");
        } else {
          setError(getApiErrorMessage(err));
        }
        setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [me]);

  async function changeRole(userId, role) {
    setRowSaving(userId);
    setError("");
    try {
      const { data } = await api.patch(`/api/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data.user : u))
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRowSaving(null);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateMsg("");
    setCreateBusy(true);
    try {
      await api.post("/api/users", {
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("VIEWER");
      setCreateMsg("User created.");
      await refreshUsers();
    } catch (err) {
      setCreateMsg(getApiErrorMessage(err));
    } finally {
      setCreateBusy(false);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUser) return;
    setDeleteBusy(true);
    setError("");
    try {
      await api.delete(`/api/users/${deleteUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDeleteUser(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!me) {
    return (
      <main className="admin-users-page">
        <p className="dashboard-status">Loading…</p>
      </main>
    );
  }

  if (me.role !== "ADMIN") {
    return null;
  }

  return (
    <main className="admin-users-page">
      <h1>Users</h1>
      <p className="page-breadcrumb">
        <Link to="/">← Home</Link>
      </p>

      <section className="admin-create-card" aria-labelledby="invite-heading">
        <h2 id="invite-heading" className="section-title">
          Create user
        </h2>
        <form className="admin-create-form" onSubmit={handleCreateUser}>
          <label>
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary" disabled={createBusy}>
            {createBusy ? "Creating…" : "Add user"}
          </button>
        </form>
        {createMsg ? (
          <p
            className={
              createMsg.includes("created")
                ? "form-feedback form-feedback-success"
                : "form-feedback form-feedback-error"
            }
          >
            {createMsg}
          </p>
        ) : null}
      </section>

      {loading ? <p className="dashboard-status">Loading…</p> : null}

      {error ? (
        <p className="auth-error">
          {error}{" "}
          {error.includes("log in") ? <Link to="/login">Log in</Link> : null}
        </p>
      ) : null}

      {!loading && !error && (
        <div className="records-table-wrap">
          <table className="records-table admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="records-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isOtherAdmin = u.role === "ADMIN" && u.id !== me.id;
                const disabled = isOtherAdmin || rowSaving === u.id;
                const canDelete =
                  u.id !== me.id && u.role !== "ADMIN";
                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {isOtherAdmin ? (
                        <span
                          className="admin-role-locked"
                          title="Cannot change another admin's role"
                        >
                          {u.role}
                        </span>
                      ) : (
                        <select
                          className="admin-role-select"
                          value={u.role}
                          disabled={disabled}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          aria-label={`Role for ${u.email}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>{u.status ? "Active" : "Disabled"}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="records-actions-cell">
                      {canDelete ? (
                        <button
                          type="button"
                          className="btn-text btn-text-danger"
                          onClick={() => setDeleteUser(u)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="admin-action-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteUser ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !deleteBusy && setDeleteUser(null)}
        >
          <div
            className="modal-panel modal-panel-sm"
            role="dialog"
            aria-labelledby="del-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-user-title" className="modal-title">
              Delete user?
            </h2>
            <p className="modal-body-text">
              Remove <strong>{deleteUser.name}</strong> ({deleteUser.email})
              and all of their records. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleteBusy}
                onClick={() => setDeleteUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteBusy}
                onClick={confirmDeleteUser}
              >
                {deleteBusy ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
