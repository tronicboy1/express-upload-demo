navigator.mediaDevices
  .getUserMedia({
    video: {
      width: { min: 320, ideal: 640, max: 1920 },
      height: { min: 200, ideal: 400 },
      frameRate: { ideal: 30, min: 10, max: 60 },
    },
    audio: true,
  })
  .then((stream) => {
    const viewer = document.getElementById("viewer");
    if (viewer instanceof HTMLVideoElement) {
      viewer.srcObject = stream;
      viewer.onloadedmetadata = (event) => {
        viewer.play();
      };
    }
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    });
    mediaRecorder.start();
    const recordedChunks = [];
    let chunkNo = 0;

    mediaRecorder.ondataavailable = (blobEvent) => {
      console.log(blobEvent);
      const formData = new FormData();
      formData.append("chunkNo", String(chunkNo));
      formData.append("file", blobEvent.data);

      fetch("/video", {
        method: "PUT",
        body: formData,
      }).then((result) => console.log(result));
    };

    setInterval(() => mediaRecorder.requestData(), 5000);
  });
