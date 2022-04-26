import express from "express";
import bodyParser from "body-parser";
import path from "path";
import https from "https";
import { readFileSync } from "fs";
import multer from "multer";

const upload = multer({ dest: path.resolve(__dirname, "../uploads/") });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const server = https.createServer(
  {
    key: readFileSync(path.resolve(__dirname, "../key.pem")),
    cert: readFileSync(path.resolve(__dirname, "../cert.pem")),
  },
  app
);

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "index.ejs"), { message: "Hello World" });
});

app.post("/", upload.single("file"), (req, res) => {
  console.log(req.file);
  res.redirect("/")
});

const port = 4000;
server.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
