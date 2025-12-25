package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/spf13/viper"
)

// AuthMiddleware checks password authentication for protected endpoints
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only protect /api/sync endpoint
		if r.URL.Path == "/api/sync" {
			pass := extractPassword(r)
			if pass == "" || !validatePass(pass) {
				log.Printf("Authorization failed for %s", r.URL.Path)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			log.Printf("Authorization successful for %s", r.URL.Path)
		}
		
		// All other endpoints are public
		next.ServeHTTP(w, r)
	})
}

// extractPassword extracts password from Authorization header
func extractPassword(r *http.Request) string {
	authHeader := strings.Split(strings.TrimSpace(r.Header.Get("Authorization")), " ")
	
	if len(authHeader) == 2 && strings.ToLower(authHeader[0]) == "pass" && len(authHeader[1]) > 0 {
		return authHeader[1]
	}
	return ""
}

// validatePass validates the password against config
func validatePass(pass string) bool {
	return pass == viper.GetString("app.app-script-pass")
}


