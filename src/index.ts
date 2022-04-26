import express from "express";
import path from "path";
import https from "https";
import { readFileSync } from "fs";

const app = express();

const server = https.createServer(
  {
    key: readFileSync(path.resolve(__dirname, "../key.pem")),
    cert: readFileSync(path.resolve(__dirname, "../cert.pem")),
  },
  app
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const port = 4000;
server.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
