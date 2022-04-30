type MediaInfo = {
  type: string;
  media: string;
  initialization: string;
  startNumber: number;
  segmentFPS: number;
  segmentFrameCount: number;
  videoTracks: TrackInfo[];
};

type TrackInfo = {
  id: string;
  type: string;
  segmentLength: number;
  template: string;
};

class VideoPlayer {
  #viewer: HTMLVideoElement;
  mediaInfo: MediaInfo;
  mediaSource: MediaSource;
  #videoSourceBuffer: SourceBuffer;
  #videoBufferEventListener: EventListener;
  #currentVideoTrack: TrackInfo;
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

    const videoTrackName = "240p";
    this.#currentVideoTrack = this.mediaInfo.videoTracks.find(
      track => track.id === videoTrackName
    );

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
      this.#currentVideoTrack.type
    );

    const initTemplate = this.mediaInfo.initialization.split("$");
    const initialSegmentName =
      initTemplate[0] + this.#currentVideoTrack.id + initTemplate[2];
    await this.#loadSegment(initialSegmentName); // load video info moov atom

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
    const splitMedia = media.split("$");
    const videoTracks = Array.from(
      xml.getElementsByTagName("Representation")
    ).reduce<TrackInfo[]>((prev, element) => {
      const mimeType = element.getAttribute("mimeType");
      if (mimeType === "video/mp4") {
        const id = element.getAttribute("id");
        const codecs = element.getAttribute("codecs");
        const type = `${mimeType}; codecs="${codecs}"`;

        const template =
          splitMedia[0] + id + splitMedia[2] + "$number$" + splitMedia[4];
        const segmentLength =
          Number(element.getAttribute("duration")) /
          Number(element.getAttribute("timescale"));
        return [...prev, { id, type, segmentLength, template }];
      }
      return prev;
    }, []);

    return {
      type,
      media,
      initialization,
      startNumber,
      segmentFPS,
      segmentFrameCount,
      videoTracks,
    };
  }

  async #getSegment(segmentName: string) {
    const response = await fetch(`/video/stream/${segmentName}`);

    if (!response.ok) throw Error(`Invalid response: ${response.status}`);

    return await response.arrayBuffer();
  }

  async #loadSegment(initialSegmentName?: string) {
    const segmentNameTemplate = this.#currentVideoTrack.template.split("$");
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
