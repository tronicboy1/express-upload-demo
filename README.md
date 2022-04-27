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
