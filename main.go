package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

type assestManifest struct {
	Entrypoints []string `json:"entrypoints"`
}

type server struct {
	proxy       http.Handler
	entrypoints []string
	target      *url.URL
}

func isIndex(u *url.URL) bool {
	segs := strings.Split(u.Path, "/")
	seg := segs[len(segs)-1]

	if len(seg) == 0 || strings.HasSuffix(u.Path, "index.html") {
		return true
	}

	return false
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/CIS") {
		r.URL.Host = s.target.Host
		r.URL.Scheme = s.target.Scheme
		r.Host = s.target.Host
		r.Header.Set("Referer", "http://localhost:3000/")
		r.Header.Set("Accept", "application/json")
		r.Header.Set("Cookie", "")
		r.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36")

		s.proxy.ServeHTTP(w, r)
		return
	}

	if isIndex(r.URL) {
		if pusher, ok := w.(http.Pusher); ok {
			for _, e := range s.entrypoints {
				err := pusher.Push(e, nil)
				if err != nil {
					log.Println("Push Error", err)
				}
			}
		}
	}

	http.ServeFile(w, r, fmt.Sprintf("build%s", r.URL.Path))
}

func main() {
	port := os.Getenv("PORT")
	if len(port) == 0 {
		port = "8080"
	}

	file, err := os.Open("./build/asset-manifest.json")
	if err != nil {
		log.Fatal(err)
	}

	data := assestManifest{}
	err = json.NewDecoder(file).Decode(&data)
	if err != nil {
		log.Fatal(err)
	}

	url, err := url.Parse("https://rtt.metrolinktrains.com")
	if err != nil {
		log.Fatal(err)
	}

	s := &server{
		proxy:       httputil.NewSingleHostReverseProxy(url),
		entrypoints: data.Entrypoints,
		target:      url,
	}

	log.Printf("Starting server on port %v\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), s)
}
