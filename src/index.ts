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
    if (["video/mp4"].includes(file.mimetype)) {
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
    exec(
      "ffprobe uploads/output.mp4 -show_streams -print_format json",
      { encoding: "utf-8" },
      (error, stdout, stderr) => {
        if (error) reject(stderr);
        resolve(stdout);
      }
    )
  )
    .then(stdout => console.log(JSON.parse(stdout)))
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
  const filename = req.file.filename;
  const filenameNoExtension = filename.split(".")[0];
  if (!req.file) {
    return res.render(path.join(__dirname, "index.ejs"), {
      message: "Invalid Format",
    });
  }

  new Promise<string>((resolve, reject) =>
    exec(
      `mkdir uploads/${filenameNoExtension} && cd uploads/${filenameNoExtension} && pwd && ffmpeg -y -i ../${filename} -g 60 \
      -filter_complex "[0:v]fps=30,split=3[720_in][480_in][240_in];[720_in]scale=-2:720[720_out];[480_in]scale=-2:480[480_out];[240_in]scale=-2:240[240_out];[0:a]asplit=2[128_out][64_out]" \
      -map "[720_out]" 720.h264  -map "[480_out]" 480.h264 -map "[240_out]" 240.h264 \
      -map "[128_out]" audio128.m4a -map "[64_out]" audio64.m4a \
      -b:v:0 3500k -maxrate:v:0 3500k -bufsize:v:0 3500k \
      -b:v:1 1690k -maxrate:v:1 1690k -bufsize:v:1 1690k \
      -b:v:2 326k -maxrate:v:2 326k -bufsize:v:2 326k \
      -b:a:0 128k -b:a:1 64k \
      -x264-params "keyint=60:min-keyint=60:scenecut=0" \
      && MP4Box -dash 4000 -frag 4000 \
      -segment-name 'segment_$RepresentationID$_' -fps 30 \
      "240.h264#video:id=240p" "480.h264#video:id=480p" \
      "720.h264#video:id=720p" \
      "audio128.m4a#audio:id=audio128:role=main" \
      "audio64.m4a#audio:id=audio64" \
      -out mpd.mpd`,
      { encoding: "utf-8" },
      (error, stdout, stderr) => {
        if (error) reject(stderr);
        resolve(stdout);
      }
    )
  )
    .then(stdout => console.log(stdout))
    .catch(error => console.log(error))
    .finally(() => res.redirect(`/uploads/${req.file.filename}`));
});

app.get("/video", (req, res) => {
  res.render("video.ejs");
});

app.get("/video/:videoId/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const videoId = req.params.videoId;
  console.log(fileName, videoId);
  const readStream = createReadStream(
    path.resolve(__dirname, "../uploads", videoId, fileName)
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
