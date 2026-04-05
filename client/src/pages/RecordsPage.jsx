import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/apiError.js";
import { formatMoney } from "../utils/money.js";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDatetimeLocalValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `YYYY-MM-DD` from `<input type="date">` → start of local day as ISO8601 */
function dateInputToIsoStart(dateStr) {
  if (!dateStr?.trim()) return "";
  const d = new Date(`${dateStr.trim()}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

/** `YYYY-MM-DD` → end of local day as ISO8601 */
function dateInputToIsoEnd(dateStr) {
  if (!dateStr?.trim()) return "";
  const d = new Date(`${dateStr.trim()}T23:59:59.999`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function RecordsPage() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [typeFilter, setTypeFilter] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [page, setPage] = useState(1);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState(null);

  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = viewer?.role === "ADMIN";

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFromFilter) params.dateFrom = dateFromFilter;
      if (dateToFilter) params.dateTo = dateToFilter;
      const { data } = await api.get("/api/records", { params });
      setRecords(data.records ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in to view records.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to view records.");
      } else {
        setError(getApiErrorMessage(err));
      }
      setRecords([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, categoryFilter]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/me")
      .then((res) => {
        if (!cancelled) setViewer(res.data.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function applyCategory() {
    setCategoryFilter(categoryDraft.trim());
    setPage(1);
  }

  function applyDates() {
    const fromIso = dateInputToIsoStart(dateFromDraft);
    const toIso = dateInputToIsoEnd(dateToDraft);
    if (dateFromDraft.trim() && !fromIso) {
      setError("Invalid “from” date.");
      return;
    }
    if (dateToDraft.trim() && !toIso) {
      setError("Invalid “to” date.");
      return;
    }
    if (fromIso && toIso && new Date(fromIso) > new Date(toIso)) {
      setError("“From” date must be on or before “to” date.");
      return;
    }
    setError("");
    setDateFromFilter(fromIso);
    setDateToFilter(toIso);
    setPage(1);
  }

  function clearDates() {
    setDateFromDraft("");
    setDateToDraft("");
    setDateFromFilter("");
    setDateToFilter("");
    setPage(1);
  }

  function openEdit(r) {
    setEditingRecord(r);
    setEditError("");
    setEditForm({
      amount: String(r.amount),
      type: r.type,
      category: r.category,
      date: toDatetimeLocalValue(r.date),
      notes: r.notes ?? "",
      userId: r.userId ?? r.user?.id ?? "",
    });
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingRecord || !editForm) return;
    setEditError("");
    const parsed = Number.parseFloat(editForm.amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setEditError("Enter a valid positive amount.");
      return;
    }
    const uid = editForm.userId.trim();
    if (!uid) {
      setEditError("User ID is required.");
      return;
    }
    setEditSaving(true);
    try {
      const body = {
        amount: parsed,
        type: editForm.type,
        category: editForm.category.trim(),
        date: new Date(editForm.date).toISOString(),
        userId: uid,
      };
      const notes = editForm.notes.trim();
      body.notes = notes || null;
      await api.put(`/api/records/${editingRecord.id}`, body);
      setEditingRecord(null);
      setEditForm(null);
      await loadRecords();
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/records/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadRecords();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const { totalPages = 0, hasNext, hasPrev, total = 0 } = pagination || {};

  return (
    <main className="records-page">
      <h1>Records</h1>
      <p className="page-breadcrumb">
        {!isHome ? (
          <>
            <Link to="/">← Home</Link>
            {isAdmin ? (
              <>
                {" · "}
                <Link to="/records/new">Create record</Link>
              </>
            ) : null}
          </>
        ) : isAdmin ? (
          <Link to="/records/new">Create record</Link>
        ) : null}
      </p>

      <section className="records-filters" aria-label="Filters">
        <label className="filter-field">
          <span>Type</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </label>
        <div className="filter-field filter-category">
          <label>
            <span>Category</span>
            <input
              type="text"
              value={categoryDraft}
              onChange={(e) => setCategoryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCategory();
                }
              }}
              placeholder="Exact match"
            />
          </label>
          <button type="button" onClick={applyCategory}>
            Apply
          </button>
        </div>
        <div className="filter-field filter-dates">
          <label>
            <span>From date</span>
            <input
              type="date"
              value={dateFromDraft}
              onChange={(e) => setDateFromDraft(e.target.value)}
            />
          </label>
          <label>
            <span>To date</span>
            <input
              type="date"
              value={dateToDraft}
              onChange={(e) => setDateToDraft(e.target.value)}
            />
          </label>
          <button type="button" onClick={applyDates}>
            Apply dates
          </button>
          {(dateFromFilter || dateToFilter) && (
            <button type="button" className="btn-clear-dates" onClick={clearDates}>
              Clear dates
            </button>
          )}
        </div>
      </section>

      {loading ? <p className="dashboard-status">Loading…</p> : null}

      {error ? (
        <p className="auth-error">
          {error}{" "}
          {error.includes("log in") ? <Link to="/login">Log in</Link> : null}
        </p>
      ) : null}

      {!loading && !error && (
        <>
          <p className="records-meta">
            {total} record{total === 1 ? "" : "s"}
            {pagination
              ? ` · Page ${pagination.page} of ${totalPages || 1}`
              : null}
            {dateFromFilter || dateToFilter ? (
              <>
                {" · "}
                Date:{" "}
                {dateFromFilter
                  ? new Date(dateFromFilter).toLocaleDateString()
                  : "…"}
                {" — "}
                {dateToFilter
                  ? new Date(dateToFilter).toLocaleDateString()
                  : "…"}
              </>
            ) : null}
          </p>

          {records.length === 0 ? (
            <p className="records-empty">No records match these filters.</p>
          ) : (
            <div className="records-table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>User</th>
                    <th>Notes</th>
                    {isAdmin ? <th className="records-actions-col">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.type}</td>
                      <td>{r.category}</td>
                      <td
                        className={
                          r.type === "INCOME"
                            ? "amount-income"
                            : "amount-expense"
                        }
                      >
                        {formatMoney(r.amount)}
                      </td>
                      <td>{r.user?.name ?? r.user?.email ?? "—"}</td>
                      <td className="records-notes">
                        {r.notes ? r.notes : "—"}
                      </td>
                      {isAdmin ? (
                        <td className="records-actions-cell">
                          <div className="records-actions">
                            <button
                              type="button"
                              className="btn-text"
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
                              onClick={() => setDeleteTarget(r)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="records-pagination">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}

      {editingRecord && editForm ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !editSaving && setEditingRecord(null)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-labelledby="edit-record-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-record-title" className="modal-title">
              Edit record
            </h2>
            <form className="modal-form" onSubmit={submitEdit}>
              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Type
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </label>
              <label>
                Category
                <input
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, category: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Notes
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>
              <label>
                User ID (owner)
                <input
                  value={editForm.userId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, userId: e.target.value }))
                  }
                  required
                />
              </label>
              {editError ? <p className="auth-error">{editError}</p> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={editSaving}
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div
            className="modal-panel modal-panel-sm"
            role="dialog"
            aria-labelledby="del-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-title" className="modal-title">
              Delete record?
            </h2>
            <p className="modal-body-text">
              This removes the{" "}
              <strong>{deleteTarget.category}</strong> entry for{" "}
              {formatMoney(deleteTarget.amount)}. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteLoading}
                onClick={confirmDelete}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
