###########################################################
# Step 1 Build Go Deps
############################################################
FROM golang:1.13-alpine AS go-builder

ENV GOOS linux
ENV GOARCH amd64
ENV CGO_ENABLED 0

WORKDIR /build

RUN apk --update add --no-cache git

COPY . ./

RUN go get && go build -o ./server

############################################################
# Step 2 Build JavaScript Deps
############################################################
FROM node:12-alpine as node-builder

WORKDIR /build

COPY . ./

RUN yarn && yarn build

############################################################
# Step 3 Copy Files and Run Server
############################################################
FROM gcr.io/distroless/static

COPY --from=node-builder /build/build /build
COPY --from=go-builder /build/server /server

EXPOSE 3000

ENTRYPOINT [ "/server" ]
