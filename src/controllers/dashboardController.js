const { asyncHandler } = require("../middleware/asyncHandler");
const dashboardService = require("../services/dashboardService");

const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  res.status(200).json(data);
});

const categories = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryTotals();
  res.status(200).json(data);
});

const recent = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecent(req.query);
  res.status(200).json(data);
});

const trends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrends();
  res.status(200).json(data);
});

const insights = asyncHandler(async (req, res) => {
  const data = await dashboardService.getInsights();
  res.status(200).json(data);
});

module.exports = { summary, categories, recent, trends, insights };
