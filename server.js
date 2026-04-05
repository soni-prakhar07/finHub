require("dotenv").config();

process.on("unhandledRejection", (reason, promise) => {
  console.error("[unhandledRejection]", reason);
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
});

process.on("uncaughtException", (error) => {
  console.error("[uncaughtException]", error);
  if (error.stack) {
    console.error(error.stack);
  }
});

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});