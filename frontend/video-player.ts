type MediaInfo = {
  type: string;
  media: string;
  initialization: string;
  startNumber: number;
  segmentFPS: number;
  segmentFrameCount: number;
};

class VideoPlayer {
  #viewer: HTMLVideoElement;
  mediaInfo: MediaInfo;
  mediaSource: MediaSource;
  #videoSourceBuffer: SourceBuffer;
  #videoBufferEventListener: EventListener;
  #audioSourceBuffer: SourceBuffer;
  #audioBufferEventListener: EventListener;
  #segmentNumber: number;
  #finalSegmentNumber: number;

  constructor(viewerElementId: string) {
    const viewerElement = document.getElementById(viewerElementId);
    if (!(viewerElement instanceof HTMLVideoElement))
      throw Error("Element Id did not yield a valid player element");
    this.#viewer = viewerElement;
  }

  async loadVideo(MPDFileName: string) {
    this.mediaInfo = await this.#getMPD(MPDFileName);
    this.mediaSource = new MediaSource();
    this.#segmentNumber = Number(this.mediaInfo.startNumber);

    await new Promise<boolean>((resolve, reject) => {
      this.#viewer.src = URL.createObjectURL(this.mediaSource);
      this.#viewer.onloadedmetadata = event => {
        console.log("data available");
        this.#viewer.playbackRate = 2;
        this.#viewer.onseeked = event => console.log(event);
        this.#viewer.addEventListener("seeking", event =>
          console.log("seeking", event)
        );
      };
      if (!MediaSource.isTypeSupported(this.mediaInfo.type)) {
        reject("unsupported video type");
      }

      this.mediaSource.addEventListener("sourceopen", () => resolve(true));
    });

    this.#videoSourceBuffer = this.mediaSource.addSourceBuffer(
      this.mediaInfo.type
    );

    await this.#loadSegment(this.mediaInfo.initialization); // load video info moov atom

    this.#calculateFinalSegmentNumber();

    await this.#loadSegment(); // load first segment
    console.log(this.#segmentNumber);
  }

  async #getMPD(fileName: string) {
    const response = await fetch(`/video/${fileName}`);

    if (!response.ok) throw Error(`Invalid response: ${response.status}`);

    const text = await response.text();
    const xml = new window.DOMParser().parseFromString(text, "text/xml");

    const representation = xml.getElementsByTagName("Representation")[0];
    const mimeType = representation.getAttribute("mimeType");
    const codecs = representation.getAttribute("codecs");
    const type = `${mimeType}; codecs="${codecs}"`;
    const template = xml.getElementsByTagName("SegmentTemplate")[0];
    const media = template.getAttribute("media");
    const initialization = template.getAttribute("initialization");
    const segmentFPS = Number(template.getAttribute("timescale"));
    const startNumber = Number(template.getAttribute("startNumber"));
    const segmentFrameCount = Number(template.getAttribute("duration"));

    return {
      type,
      media,
      initialization,
      startNumber,
      segmentFPS,
      segmentFrameCount,
    };
  }

  async #getSegment(segmentName: string) {
    const response = await fetch(`/video/stream/${segmentName}`);

    if (!response.ok) throw Error(`Invalid response: ${response.status}`);

    return await response.arrayBuffer();
  }

  async #loadSegment(initialSegmentName?: string) {
    const segmentNameTemplate = this.mediaInfo.media.split("$");
    const segmentName =
      initialSegmentName ?? // for loading initial buffer
      segmentNameTemplate[0] +
        String(this.#segmentNumber) +
        segmentNameTemplate[2];
    const nextSegment = await this.#getSegment(segmentName);

    await new Promise<boolean>((resolve, reject) => {
      this.#videoSourceBuffer.appendBuffer(nextSegment);

      this.#videoSourceBuffer.removeEventListener(
        "updateend",
        this.#videoBufferEventListener
      );
      this.#videoBufferEventListener = () => resolve(true);
      this.#videoSourceBuffer.addEventListener(
        "updateend",
        this.#videoBufferEventListener
      );
    });

    if (!initialSegmentName) this.#segmentNumber++; // increment if not loading initial
  }

  async #appendAudioBuffer() {
    const segmentNameTemplate = this.mediaInfo.media.split("$");
    const segmentName =
      segmentNameTemplate[0] +
      String(this.#segmentNumber) +
      segmentNameTemplate[2];
    const nextSegment = await this.#getSegment(segmentName);

    await new Promise<boolean>((resolve, reject) => {
      this.#audioSourceBuffer.appendBuffer(nextSegment);

      this.#audioSourceBuffer.removeEventListener(
        "updateend",
        this.#audioBufferEventListener
      );
      this.#audioBufferEventListener = () => resolve(true);
      this.#audioSourceBuffer.addEventListener(
        "updateend",
        this.#audioBufferEventListener
      );
    });
  }

  #calculateFinalSegmentNumber() {
    const videoLength = this.mediaSource.duration;
    const segmentLength =
      this.mediaInfo.segmentFrameCount / this.mediaInfo.segmentFPS;
    console.log(
      videoLength,
      segmentLength,
      Math.ceil(videoLength / segmentLength)
    );
  }
}

export default VideoPlayer;
