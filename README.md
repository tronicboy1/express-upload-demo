## SSL
```
brew install mkcert
mkcert -install
cd server
mkcert -key-file key.pem -cert-file cert.pem example.com \*.example.com localhost
```
