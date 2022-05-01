## SSL
```
brew install mkcert
mkcert -install
mkcert -key-file key.pem -cert-file cert.pem example.com \*.example.com localhost
```

# Converting Video files for streaming
```
brew install ffmpeg MP4Box
ffmpeg -i INPUT.ext -vbsf h264_mp4toannexb -x264-params keyint=96:scenecut=0 -g 48 -vf fps=24 -vcodec libx264 -an OUTPUT.h264
MP4Box -add 2.h264 -fps 24 output.mp4
MP4Box -dash 2000 -frag 2000 -rap -segment-name segment_ output.mp4
```

```
ffmpeg -y -i ../original.MOV -g 60 \
-filter_complex "[0:v]fps=30,split=3[720_in][480_in][240_in];[720_in]scale=-2:720[720_out];[480_in]scale=-2:480[480_out];[240_in]scale=-2:240[240_out]" \
-map "[720_out]" 720.h264  -map "[480_out]" 480.h264 -map "[240_out]" 240.h264 -map 0:a audio.m4a \
-b:v:0 3500k -maxrate:v:0 3500k -bufsize:v:0 3500k \
-b:v:1 1690k -maxrate:v:1 1690k -bufsize:v:1 1690k \
-b:v:2 326k -maxrate:v:2 326k -bufsize:v:2 326k \
-b:a:0 128k \
-x264-params "keyint=60:min-keyint=60:scenecut=0" \
-seg_duration 2

MP4Box -dash 4000 -frag 4000 \
-segment-name 'segment_$RepresentationID$_' -fps 30 \
"240.h264#video:id=240p" "480.h264#video:id=480p" \
"720.h264#video:id=720p" \
"audio.m4a#audio:id=Japanese:role=main" \
-out dash/sanshin.mpd
```

## Mapping to Multiple Bitrates, splitting audo
```
ffmpeg -y -i sanshin.mp4 -to 20 -filter_complex "[0:v]split=2[sd_in][hd_in];[sd_in]scale=-2:480[sd];[hd_in]scale=-2:720[hd];[0:a]volume=0.8[audio]" -map "[sd]" sd.mp4 -map "[hd]" hd.mp4 -map "[audio]" audio.mp3
```

## Quality Control

### Constant BitRate
```
ffmpeg -i sanshin.mp4 -vcodec libx264 -crf 51 -to 5 transcoded.mp4
```

### Preset Time
slower time -> smaller size
```
ffmpeg -y -i sanshin.mp4 -vcodec libx264 -preset slow -to 5 transcoded.mp4
```

### Bitrate
```
ffmpeg -y -i sanshin.mp4 -vcodec libx264 -b:v 1M -to 5 transcoded.mp4
```
