package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

type server struct {
	proxy http.Handler
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/CIS") {
		s.proxy.ServeHTTP(w, r)
	} else {
		http.ServeFile(w, r, fmt.Sprintf("build%s", r.URL.Path))
	}
}

func main() {
	port := os.Getenv("PORT")
	if len(port) == 0 {
		port = "8080"
	}

	url, err := url.Parse("https://rtt.metrolinktrains.com")
	if err != nil {
		log.Fatal(err)
	}

	s := &server{
		proxy: httputil.NewSingleHostReverseProxy(url),
	}

	http.ListenAndServe(fmt.Sprintf(":%s", port), s)
}
