import VideoPlayer from "./video-player.js";

const videoPlayer = new VideoPlayer("viewer", "sanshin");
videoPlayer.loadVideo();

const qualitySelect = document.getElementById(
  "video-quality"
) as HTMLSelectElement;
qualitySelect.addEventListener("change", event => {
  console.log("track");
  const newTrack = qualitySelect.value;
  videoPlayer.changeVideoTrack(newTrack);
});
const audioQualitySelector = document.getElementById(
  "audio-quality"
) as HTMLSelectElement;
audioQualitySelector.addEventListener("change", () => {
  const newTrack = audioQualitySelector.value;
  videoPlayer.changeAudioTrack(newTrack);
});
