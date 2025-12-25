package api

import (
	"encoding/json"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/common"
	"github.com/gorilla/mux"
)

// handleGetLessons returns lessons with full metadata
// GET /api/lessons?lang=hebrew
func handleGetLessons(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang")
	
	// Language is required for this endpoint
	if lang == "" {
		http.Error(w, "language parameter is required", http.StatusBadRequest)
		return
	}

	lessons := common.Cache.GetLessonsByLanguage(lang)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	if len(lessons) == 0 {
		w.Write([]byte("[]"))
		return
	}
	
	json.NewEncoder(w).Encode(lessons)
}

// handleGetLesson returns a specific lesson by ID
// GET /api/lessons/{id}
func handleGetLesson(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	lesson, ok := common.Cache.GetLessonByID(id)
	if !ok {
		http.Error(w, "lesson not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(lesson)
}


