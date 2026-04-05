import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/apiError.js";

function toDatetimeLocalValue(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateRecordPage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meError, setMeError] = useState("");
  const [loadingMe, setLoadingMe] = useState(true);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => toDatetimeLocalValue());
  const [notes, setNotes] = useState("");
  const [userId, setUserId] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setLoadingMe(true);
      setMeError("");
      try {
        const { data } = await api.get("/api/me");
        if (cancelled) return;
        const user = data.user;
        setMe(user);
        if (user?.role === "ADMIN" && user?.id) {
          setUserId(user.id);
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          setMeError("Please log in.");
        } else {
          setMeError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingMe(false);
        }
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setSubmitError("Enter a valid positive amount.");
      return;
    }
    const trimmedUser = userId.trim();
    if (!trimmedUser) {
      setSubmitError("User ID is required.");
      return;
    }

    setSaving(true);
    try {
      const iso = new Date(date).toISOString();
      const body = {
        amount: parsed,
        type,
        category: category.trim(),
        date: iso,
        userId: trimmedUser,
      };
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        body.notes = trimmedNotes;
      }
      await api.post("/api/records", body);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response?.status === 403) {
        setSubmitError("Only admins can create records.");
      } else {
        setSubmitError(getApiErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadingMe) {
    return (
      <main className="create-record-page">
        <p className="dashboard-status">Loading…</p>
      </main>
    );
  }

  if (meError) {
    return (
      <main className="create-record-page">
        <p className="auth-error">
          {meError}{" "}
          <Link to="/login">Log in</Link>
        </p>
        <p>
          <Link to="/">← Records</Link>
        </p>
      </main>
    );
  }

  if (me?.role !== "ADMIN") {
    return (
      <main className="create-record-page">
        <h1>Create record</h1>
        <p className="auth-error">
          Only administrators can create records.
        </p>
        <p>
          <Link to="/">← Records</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="create-record-page">
      <h1>Create record</h1>
      <p className="page-breadcrumb">
        <Link to="/">← Records</Link>
      </p>

      <form onSubmit={handleSubmit} className="create-record-form">
        <label>
          Amount
          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Type
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </label>
        <label>
          Category
          <input
            type="text"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </label>
        <label>
          Date
          <input
            type="datetime-local"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          Notes
          <textarea
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label>
          User ID (record owner)
          <input
            type="text"
            name="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            title="UUID of the user this record belongs to"
          />
        </label>
        <p className="auth-hint">
          Defaults to your account; change to assign to another user.
        </p>

        {submitError ? <p className="auth-error">{submitError}</p> : null}

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create record"}
        </button>
      </form>
    </main>
  );
}
