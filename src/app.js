const express = require("express");
const cors = require("cors");

const { policies } = require("./config/accessControl");
const authRoutes = require("./routes/authRoutes");
const { authenticate } = require("./middleware/authMiddleware");
const { requireRoles } = require("./middleware/roleMiddleware");
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorMiddleware } = require("./middleware/errorMiddleware");
const { AppError } = require("./utils/AppError");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/me", authenticate, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get(
  "/api/admin-only",
  authenticate,
  requireRoles(...policies.adminOnly),
  (req, res) => {
    res.status(200).json({ message: "Admin access granted" });
  }
);

app.use((req, res, next) => {
  next(new AppError("Not Found", 404));
});

app.use(errorMiddleware);

module.exports = app;