const express = require("express");
require("dotenv").config();
const dbConnect = require("./config/dbConnect");
const initRoutes = require("./routes/index");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
// giup client có thể nhận được cookie bên server gửi 
app.use(
  cors({
    origin: [process.env.URL_CLIENT,"https://digital-fe.vercel.app/"],
    credentials: true,
    method: ["POST", "PUT", "GET", "DELETE"],
  })
);
app.use(cookieParser());
const port = process.env.PORT || 8888;
app.use(express.json());
// giup doc duoc cac data theo kieu data object
app.use(express.urlencoded({ extended: true }));
dbConnect();

initRoutes(app);

app.listen(port, () => {
  console.log("Server running: " + port);
});
