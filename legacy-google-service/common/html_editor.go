package common

import (
	"log"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// HtmlEditor processes HTML content
type HtmlEditor struct{}

// Init processes HTML string and adds target="_blank" to all links
func (h HtmlEditor) Init(s string) string {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader("<div id=\"__gowrapper__\">" + s + "</div>"))
	if err != nil {
		log.Print("parse html error", err)
		return s
	}
	h.addTargetToLink(doc)

	inner := doc.Find("#__gowrapper__")
	r, errPrint := goquery.OuterHtml(inner)
	if errPrint != nil {
		log.Print("print html error", errPrint)
		return s
	}
	return r
}

// addTargetToLink adds target="_blank" to all anchor tags
func (h *HtmlEditor) addTargetToLink(doc *goquery.Document) *goquery.Document {
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		s.SetAttr("target", "_blank")
	})
	return doc
}


