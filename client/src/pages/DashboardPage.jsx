import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/apiError.js";
import { formatMoney } from "../utils/money.js";

const COL_INCOME = "#059669";
const COL_EXPENSE = "#dc2626";
const COL_NET = "#0d9488";
const COL_NET_NEGATIVE = "#dc2626";
const PIE_COLORS = [COL_INCOME, COL_EXPENSE];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function pctChangeText(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "—";
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}% vs last month`;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [sumRes, catRes, trendRes, insRes, recRes] = await Promise.all([
          api.get("/api/dashboard/summary"),
          api.get("/api/dashboard/categories"),
          api.get("/api/dashboard/trends"),
          api.get("/api/dashboard/insights"),
          api.get("/api/dashboard/recent", { params: { page: 1, limit: 6 } }),
        ]);
        if (cancelled) return;
        setSummary(sumRes.data);
        setCategories(catRes.data.categories ?? []);
        setTrends(trendRes.data);
        setInsights(insRes.data);
        setRecent(recRes.data.records ?? []);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          setError("Please log in to view the dashboard.");
        } else if (err.response?.status === 403) {
          setError(
            "The dashboard is available to Analyst and Admin roles only. Open Records to browse entries."
          );
        } else {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const topExpenseCategories = useMemo(() => {
    return [...categories]
      .filter((c) => c.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 8)
      .map((c) => ({
        name:
          c.category.length > 14
            ? `${c.category.slice(0, 12)}…`
            : c.category,
        fullName: c.category,
        expense: c.totalExpense,
      }));
  }, [categories]);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Income", value: summary.totalIncome },
      { name: "Expenses", value: summary.totalExpense },
    ];
  }, [summary]);

  return (
    <main className="dashboard-page dashboard-rich">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Summaries, trends, and recent activity across all records.
          </p>
        </div>
        <Link to="/" className="dashboard-link-records">
          View all records →
        </Link>
      </div>

      {loading ? <p className="dashboard-status">Loading insights…</p> : null}

      {error ? (
        <p className="auth-error">
          {error}{" "}
          {error.includes("log in") ? <Link to="/login">Log in</Link> : null}
        </p>
      ) : null}

      {!loading && !error && summary && insights && trends ? (
        <>
          <dl className="summary-grid summary-grid-wide">
            <div className="summary-card summary-income">
              <dt>Total income</dt>
              <dd>{formatMoney(summary.totalIncome)}</dd>
            </div>
            <div className="summary-card summary-expense">
              <dt>Total expenses</dt>
              <dd>{formatMoney(summary.totalExpense)}</dd>
            </div>
            <div className="summary-card summary-net">
              <dt>Net balance</dt>
              <dd>{formatMoney(summary.netBalance)}</dd>
            </div>
          </dl>

          <section className="dashboard-insight-strip" aria-label="Key metrics">
            <div className="insight-chip">
              <span className="insight-label">Transactions</span>
              <strong>{insights.recordCount}</strong>
            </div>
            <div className="insight-chip">
              <span className="insight-label">Categories in use</span>
              <strong>{insights.categoryCount}</strong>
            </div>
            <div className="insight-chip">
              <span className="insight-label">Avg. transaction</span>
              <strong>{formatMoney(insights.avgTransactionAmount)}</strong>
            </div>
            <div className="insight-chip insight-chip-wide">
              <span className="insight-label">This month net</span>
              <strong>{formatMoney(insights.thisMonth.net)}</strong>
              <span className="insight-hint">
                {pctChangeText(insights.netChangePercent)}
              </span>
            </div>
          </section>

          <div className="dashboard-chart-grid">
            <section className="chart-card" aria-labelledby="trend-heading">
              <h2 id="trend-heading" className="chart-card-title">
                Cash flow trend
              </h2>
              <p className="chart-card-desc">
                Income vs expenses by month (last 12 months).
              </p>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={trends.months}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke={COL_INCOME}
                      fill={COL_INCOME}
                      fillOpacity={0.25}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke={COL_EXPENSE}
                      fill={COL_EXPENSE}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="chart-card" aria-labelledby="net-heading">
              <h2 id="net-heading" className="chart-card-title">
                Monthly net
              </h2>
              <p className="chart-card-desc">
                Income minus expenses per month.
              </p>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={trends.months}
                    margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Bar dataKey="net" name="Net" radius={[3, 3, 3, 3]}>
                      {trends.months.map((entry) => (
                        <Cell
                          key={entry.period}
                          fill={
                            entry.net >= 0 ? COL_NET : COL_NET_NEGATIVE
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="chart-card" aria-labelledby="cat-heading">
              <h2 id="cat-heading" className="chart-card-title">
                Top spending categories
              </h2>
              <p className="chart-card-desc">
                Categories with at least one expense (income-only labels are
                excluded).
              </p>
              {topExpenseCategories.length === 0 ? (
                <p className="chart-empty-hint">
                  No expense data by category yet.
                </p>
              ) : (
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={topExpenseCategories}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value) => formatMoney(value)}
                        labelFormatter={(_, p) =>
                          p?.[0]?.payload?.fullName ?? ""
                        }
                      />
                      <Bar
                        dataKey="expense"
                        name="Expenses"
                        fill={COL_EXPENSE}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="chart-card chart-card-pie" aria-labelledby="mix-heading">
              <h2 id="mix-heading" className="chart-card-title">
                Income vs expense (totals)
              </h2>
              <p className="chart-card-desc">Share of all-time volume.</p>
              <div className="chart-area chart-area-pie">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="dashboard-recent" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="chart-card-title">
              Recent activity
            </h2>
            <div className="records-table-wrap dashboard-recent-table">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="records-empty-cell">
                        No records yet.
                      </td>
                    </tr>
                  ) : (
                    recent.map((r) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
