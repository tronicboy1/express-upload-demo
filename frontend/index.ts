import VideoPlayer from "./video-player.js"

// type MediaInfo = {
//   type: string;
//   media: string;
//   initialization: string;
//   timescale: string;
//   startNumber: string;
//   duration: string;
// };

// const getMPD = (fileName: string) =>
//   fetch(`/video/${fileName}`)
//     .then(response => {
//       if (!response.ok) throw Error(`Invalid response: ${response.status}`);

//       return response.text();
//     })
//     .then(text => new window.DOMParser().parseFromString(text, "text/xml"))
//     .then(xml => {
//       const representation = xml.getElementsByTagName("Representation")[0];
//       const mimeType = representation.getAttribute("mimeType");
//       const codecs = representation.getAttribute("codecs");
//       const type = `${mimeType}; codecs="${codecs}"`;
//       const template = xml.getElementsByTagName("SegmentTemplate")[0];
//       const media = template.getAttribute("media");
//       const initialization = template.getAttribute("initialization");
//       const timescale = template.getAttribute("timescale");
//       const startNumber = template.getAttribute("startNumber");
//       const duration = template.getAttribute("duration");

//       return { type, media, initialization, timescale, startNumber, duration };
//     });

// const getSegment = (segmentName: string) =>
//   fetch(`/video/stream/${segmentName}`).then(response => {
//     if (!response.ok) throw Error(`Invalid response: ${response.status}`);

//     return response.arrayBuffer();
//   });

// getMPD("output_dash.mpd").then(mediaInfo =>
//   new Promise<{ mediaInfo: MediaInfo; mediaSource: MediaSource }>(
//     (resolve, reject) => {
//       console.log(mediaInfo);
//       const video = document.getElementById("viewer");
//       const mediaSource = new MediaSource();
//       if (video instanceof HTMLVideoElement) {
//         video.src = URL.createObjectURL(mediaSource);
//         video.onloadedmetadata = event => {
//           console.log("data available");
//           video.playbackRate = 2;
//           video.onseeked = event => console.log(event);
//           video.addEventListener("seeking", event =>
//             console.log("seeking", event)
//           );
//         };
//       }

//       if (!MediaSource.isTypeSupported(mediaInfo.type))
//         reject("unsupported video type");

//       mediaSource.addEventListener("sourceopen", () =>
//         resolve({ mediaInfo, mediaSource })
//       );
//     }
//   ).then(({ mediaInfo, mediaSource }) => {
//     //mediaSource.duration = Number(mediaInfo.duration);
//     const videoSourceBuffer = mediaSource.addSourceBuffer(mediaInfo.type);

//     getSegment(mediaInfo.initialization)
//       .then(
//         arrBuffer =>
//           new Promise<boolean>((resolve, reject) => {
//             videoSourceBuffer.appendBuffer(arrBuffer);

//             videoSourceBuffer.removeEventListener("updateend", listener);
//             listener = () => resolve(true);
//             videoSourceBuffer.addEventListener("updateend", listener);
//           })
//       )
//       .then(
//         () =>
//           new Promise((resolve, reject) => {
//             let segmentNumber = Number(mediaInfo.startNumber);
//             const repeatSegment = () =>
//               appendBuffer(segmentNumber, videoSourceBuffer, mediaInfo)
//                 .then(() => {
//                   segmentNumber++;
//                   console.log(mediaSource.activeSourceBuffers);
//                   repeatSegment();
//                 })
//                 .catch(error => console.log(error));
//             repeatSegment();
//           })
//       );
//   })
// );

// let listener: EventListener;

// const appendBuffer = (
//   segmentNumber: number,
//   videoSourceBuffer: SourceBuffer,
//   mediaInfo: MediaInfo
// ) => {
//   const segmentNameTemplate = mediaInfo.media.split("$");
//   const segmentName =
//     segmentNameTemplate[0] + String(segmentNumber) + segmentNameTemplate[2];
//   return getSegment(segmentName).then(
//     arrBuffer =>
//       new Promise<boolean>((resolve, reject) => {
//         videoSourceBuffer.appendBuffer(arrBuffer);

//         videoSourceBuffer.removeEventListener("updateend", listener);
//         listener = () => resolve(true);
//         videoSourceBuffer.addEventListener("updateend", listener);
//       })
//   );
// };

const videoPlayer = new VideoPlayer("viewer");
videoPlayer.loadVideo("sanshin.mpd");

