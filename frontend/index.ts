import VideoPlayer from "./video-player.js";

const videoPlayer = new VideoPlayer("viewer");

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
const videoIdSelector = document.getElementById(
  "video-id"
) as HTMLSelectElement;
videoIdSelector.addEventListener("change", () =>
  videoPlayer.loadVideo(videoIdSelector.value)
);
fetch("/video/list")
  .then(result => {
    if (!result.ok) throw Error("Video List not found.");
    return result.json();
  })
  .then((videoList: string[]) => {
    videoList.forEach(video => {
      const newOption = document.createElement("option");
      newOption.value = video;
      newOption.innerText = video;
      videoIdSelector.insertAdjacentElement("beforeend", newOption);
    });
  })
  .then(() => videoPlayer.loadVideo(videoIdSelector.value));
