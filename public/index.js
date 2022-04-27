var getMPD = function (fileName) {
    return fetch("/video/".concat(fileName))
        .then(function (response) {
        if (!response.ok)
            throw Error("Invalid response: ".concat(response.status));
        return response.text();
    })
        .then(function (text) { return new window.DOMParser().parseFromString(text, "text/xml"); })
        .then(function (xml) {
        var representation = xml.getElementsByTagName("Representation")[0];
        var mimeType = representation.getAttribute("mimeType");
        var codecs = representation.getAttribute("codecs");
        var type = "".concat(mimeType, "; codecs=\"").concat(codecs, "\"");
        var template = xml.getElementsByTagName("SegmentTemplate")[0];
        var media = template.getAttribute("media");
        var initialization = template.getAttribute("initialization");
        var timescale = template.getAttribute("timescale");
        var startNumber = template.getAttribute("startNumber");
        var duration = template.getAttribute("duration");
        return { type: type, media: media, initialization: initialization, timescale: timescale, startNumber: startNumber, duration: duration };
    });
};
var getSegment = function (segmentName) {
    return fetch("/video/stream/".concat(segmentName)).then(function (response) {
        if (!response.ok)
            throw Error("Invalid response: ".concat(response.status));
        return response.arrayBuffer();
    });
};
getMPD("output_dash.mpd").then(function (mediaInfo) {
    return new Promise(function (resolve, reject) {
        console.log(mediaInfo);
        var video = document.getElementById("viewer");
        var mediaSource = new MediaSource();
        if (video instanceof HTMLVideoElement) {
            video.src = URL.createObjectURL(mediaSource);
            video.onloadedmetadata = function (event) {
                console.log("data available");
            };
        }
        if (!MediaSource.isTypeSupported(mediaInfo.type))
            reject("unsupported video type");
        mediaSource.addEventListener("sourceopen", function () {
            return resolve({ mediaInfo: mediaInfo, mediaSource: mediaSource });
        });
    }).then(function (_a) {
        var mediaInfo = _a.mediaInfo, mediaSource = _a.mediaSource;
        //mediaSource.duration = Number(mediaInfo.duration);
        var videoSourceBuffer = mediaSource.addSourceBuffer(mediaInfo.type);
        getSegment(mediaInfo.initialization)
            .then(function (arrBuffer) {
            return new Promise(function (resolve, reject) {
                videoSourceBuffer.appendBuffer(arrBuffer);
                videoSourceBuffer.removeEventListener("updateend", listener);
                listener = function () { return resolve(true); };
                videoSourceBuffer.addEventListener("updateend", listener);
            });
        })
            .then(function () {
            return new Promise(function (resolve, reject) {
                var segmentNumber = Number(mediaInfo.startNumber);
                var repeatSegment = function () {
                    return appendBuffer(segmentNumber, videoSourceBuffer, mediaInfo)
                        .then(function () {
                        segmentNumber++;
                        repeatSegment();
                    })["catch"](function (error) { return console.log(error); });
                };
                repeatSegment();
            });
        });
    });
});
var listener;
var appendBuffer = function (segmentNumber, videoSourceBuffer, mediaInfo) {
    var segmentNameTemplate = mediaInfo.media.split("$");
    var segmentName = segmentNameTemplate[0] + String(segmentNumber) + segmentNameTemplate[2];
    return getSegment(segmentName).then(function (arrBuffer) {
        return new Promise(function (resolve, reject) {
            videoSourceBuffer.appendBuffer(arrBuffer);
            videoSourceBuffer.removeEventListener("updateend", listener);
            listener = function () { return resolve(true); };
            videoSourceBuffer.addEventListener("updateend", listener);
        });
    });
};
