const { prisma } = require("../config/prisma");
const { getPagination, paginationMeta } = require("../utils/pagination");

const userSelect = {
  id: true,
  name: true,
  email: true,
};

async function getSummary() {
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.record.aggregate({
      where: { type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.record.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ?? 0;
  const totalExpense = expenseAgg._sum.amount ?? 0;
  const netBalance = totalIncome - totalExpense;

  return { totalIncome, totalExpense, netBalance };
}

async function getCategoryTotals() {
  const rows = await prisma.record.groupBy({
    by: ["category", "type"],
    _sum: { amount: true },
  });

  const byCategory = new Map();

  for (const row of rows) {
    if (!byCategory.has(row.category)) {
      byCategory.set(row.category, {
        category: row.category,
        totalIncome: 0,
        totalExpense: 0,
      });
    }
    const entry = byCategory.get(row.category);
    const sum = row._sum.amount ?? 0;
    if (row.type === "INCOME") {
      entry.totalIncome = sum;
    } else if (row.type === "EXPENSE") {
      entry.totalExpense = sum;
    }
  }

  const categories = Array.from(byCategory.values()).map((c) => ({
    ...c,
    net: c.totalIncome - c.totalExpense,
  }));

  categories.sort((a, b) => a.category.localeCompare(b.category));

  return { categories };
}

async function getRecent(query = {}) {
  const { page, limit, skip } = getPagination(query);

  const [total, records] = await prisma.$transaction([
    prisma.record.count(),
    prisma.record.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: { user: { select: userSelect } },
    }),
  ]);

  return {
    records,
    pagination: paginationMeta({ total, page, limit }),
  };
}

/** Last 12 calendar months with income / expense per month (zero-filled gaps). */
async function getMonthlyTrends() {
  const rows = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "date"), 'YYYY-MM') AS period,
      COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END), 0)::float AS income,
      COALESCE(SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END), 0)::float AS expense
    FROM "Record"
    GROUP BY DATE_TRUNC('month', "date")
    ORDER BY DATE_TRUNC('month', "date") ASC
  `;

  const byPeriod = new Map();
  for (const r of rows) {
    byPeriod.set(r.period, {
      income: Number(r.income),
      expense: Number(r.expense),
    });
  }

  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const x = byPeriod.get(period) ?? { income: 0, expense: 0 };
    months.push({
      period,
      label: d.toLocaleString(undefined, { month: "short", year: "numeric" }),
      income: x.income,
      expense: x.expense,
      net: x.income - x.expense,
    });
  }

  return { months };
}

/** Extra KPIs and month-over-month context for the dashboard. */
async function getInsights() {
  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    recordCount,
    distinctCategories,
    avgRow,
    thisIn,
    thisEx,
    prevIn,
    prevEx,
  ] = await Promise.all([
    prisma.record.count(),
    prisma.record.findMany({
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.record.aggregate({
      _avg: { amount: true },
    }),
    prisma.record.aggregate({
      where: { type: "INCOME", date: { gte: startThisMonth, lt: startNextMonth } },
      _sum: { amount: true },
    }),
    prisma.record.aggregate({
      where: { type: "EXPENSE", date: { gte: startThisMonth, lt: startNextMonth } },
      _sum: { amount: true },
    }),
    prisma.record.aggregate({
      where: { type: "INCOME", date: { gte: startLastMonth, lt: startThisMonth } },
      _sum: { amount: true },
    }),
    prisma.record.aggregate({
      where: { type: "EXPENSE", date: { gte: startLastMonth, lt: startThisMonth } },
      _sum: { amount: true },
    }),
  ]);

  const thisIncome = thisIn._sum.amount ?? 0;
  const thisExpense = thisEx._sum.amount ?? 0;
  const prevIncome = prevIn._sum.amount ?? 0;
  const prevExpense = prevEx._sum.amount ?? 0;
  const thisNet = thisIncome - thisExpense;
  const prevNet = prevIncome - prevExpense;

  let netChangePercent = null;
  if (prevNet !== 0) {
    netChangePercent = ((thisNet - prevNet) / Math.abs(prevNet)) * 100;
  } else if (thisNet !== 0) {
    netChangePercent = thisNet > 0 ? 100 : -100;
  }

  return {
    recordCount,
    categoryCount: distinctCategories.length,
    avgTransactionAmount: avgRow._avg.amount ?? 0,
    thisMonth: {
      income: thisIncome,
      expense: thisExpense,
      net: thisNet,
    },
    lastMonth: {
      income: prevIncome,
      expense: prevExpense,
      net: prevNet,
    },
    netChangePercent,
  };
}

module.exports = {
  getSummary,
  getCategoryTotals,
  getRecent,
  getMonthlyTrends,
  getInsights,
};
