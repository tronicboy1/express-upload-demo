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
