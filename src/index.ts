import express from "express";
import bodyParser from "body-parser";
import path from "path";
import https from "https";
import { readFileSync, createReadStream } from "fs";
import { execSync, exec } from "child_process";
import multer from "multer";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads");
  },
  filename(req, file, callback) {
    callback(null, `${new Date().getTime()}-${file.originalname}`);
  },
});

const upload = multer({
  dest: path.resolve(__dirname, "../uploads/"),
  storage,
  fileFilter(req, file, callback) {
    if (["text/csv", "image/png"].includes(file.mimetype)) {
      callback(null, true);
    }
    callback(null, true);
  },
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use("/public", express.static(path.resolve(__dirname, "../public")));

const server = https.createServer(
  {
    key: readFileSync(path.resolve(__dirname, "../key.pem")),
    cert: readFileSync(path.resolve(__dirname, "../cert.pem")),
  },
  app
);

app.get("/", (req, res) => {
  new Promise<string>((resolve, reject) =>
    exec("ls -a", { encoding: "utf-8" }, (error, stdout, stderr) => {
      if (error) reject(stderr);
      resolve(stdout);
    })
  )
    .then(stdout => console.log(stdout))
    .catch(error => console.log(error))
    .finally(() =>
      res.render(path.join(__dirname, "index.ejs"), { message: "Hello World" })
    );
});

app.get("/uploads/:fileName", (req, res) => {
  console.log(req.params.fileName);
  const fileStream = createReadStream(
    path.resolve(__dirname, "../uploads", req.params.fileName)
  );
  fileStream.pipe(res);
});

app.post("/", upload.single("file"), (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.render(path.join(__dirname, "index.ejs"), {
      message: "Invalid Format",
    });
  }
  res.redirect(`/uploads/${req.file.filename}`);
});

app.get("/video", (req, res) => {
  res.render("video.ejs");
});

app.get("/video/:name", (req, res) => {
  const videoName = req.params.name;
  res.sendFile(path.resolve(__dirname, "../uploads", videoName));
});

app.get("/video/stream/:name", (req, res) => {
  const segmentName = req.params.name;
  const readStream = createReadStream(
    path.resolve(__dirname, "../uploads", segmentName)
  );
  readStream.on("error", err => {
    res.sendStatus(404);
  });
  readStream.pipe(res);
});

const port = 4000;
server.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
