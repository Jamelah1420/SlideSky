// server.js
import express from "express";
import analyze from "./api/analyze.js";
import answer from "./api/ChatBot.js";

const app = express();

// raw-body passthrough (we used manual parsing in the handlers)
app.use((req, res, next) => {
  let data = [];
  req.on("data", chunk => data.push(chunk));
  req.on("end", () => {
    req.rawBody = Buffer.concat(data).toString("utf8");
    next();
  });
});

app.post("/api/analyze", (req, res) => analyze(req, res));
app.post("/api/answer-question", (req, res) => answer(req, res));

app.use(express.static("dist")); // if you build the React app
app.listen(3001, () => console.log("API on http://localhost:3001"));
