const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const {
  signupRouter,
  loginRouter,
  productRouter,
  userRouter,
  commentsRouter,
  managerRouter,
  cartRouter,
  orderRouter,
  registerRouter,
  balanceRouter
} = require("./routes");
const { connectDB } = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Routers
// app.use("/", signupRouter);
app.use("/", loginRouter);
app.use("/", balanceRouter);
// app.use("/", productRouter);
// app.use("/", userRouter);
// app.use("/", commentsRouter);
// app.use("/", cartRouter);
// app.use("/", orderRouter);
// app.use("/", registerRouter);
// app.use("/admin", managerRouter);

app.use(express.static("pdf"));

try {
  if (!fs.existsSync(path.join(__dirname, "../pdf"))) {
    fs.mkdirSync(path.join(__dirname, "../pdf"));
  }
} catch {
  console.log("pdf folder already set up.");
}

const port = 4000;
connectDB();
app.listen(port, () => console.log("Server is running on", port));

module.exports = app;
