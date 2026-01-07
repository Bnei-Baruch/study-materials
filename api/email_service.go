package api

import (
	"bytes"
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"time"
)

type EmailService struct {
	smtpHost    string
	smtpPort    int
	username    string
	password    string
	fromAddress string
	toAddress   string
	frontendURL string
}

func NewEmailService() *EmailService {
	port, _ := strconv.Atoi(os.Getenv("EMAIL_SMTP_PORT"))
	if port == 0 {
		port = 587 // Default SMTP port
	}

	return &EmailService{
		smtpHost:    os.Getenv("EMAIL_SMTP_HOST"),
		smtpPort:    port,
		username:    os.Getenv("EMAIL_USERNAME"),
		password:    os.Getenv("EMAIL_PASSWORD"),
		fromAddress: os.Getenv("EMAIL_FROM"),
		toAddress:   os.Getenv("EMAIL_TO"),
		frontendURL: os.Getenv("FRONTEND_URL"),
	}
}

// SendEventEmail sends an email with event details to the configured Google Group
func (s *EmailService) SendEventEmail(eventID string, titleHe string, titleEn string, date time.Time, isUpdate bool) error {
	// Format date in both languages
	dateHe := date.Format("Monday 2.1.2006")    // Hebrew format
	dateEn := date.Format("Monday Jan 2, 2006") // English format

	// Bilingual subject with optional update prefix
	var subject string
	if isUpdate {
		subject = fmt.Sprintf("עדכון: חומר לימוד: %s %s :: Update: Study Materials: %s %s",
			titleHe, dateHe, titleEn, dateEn)
	} else {
		subject = fmt.Sprintf("חומר לימוד: %s %s :: Study Materials: %s %s",
			titleHe, dateHe, titleEn, dateEn)
	}

	// Event details page URL (public page with event parameter)
	eventURL := fmt.Sprintf("%s/?event=%s", s.frontendURL, eventID)

	// Email body (only the link, no text)
	body := eventURL

	// Construct email message
	message := s.formatEmail(s.fromAddress, s.toAddress, subject, body)

	// Send via SMTP
	auth := smtp.PlainAuth("", s.username, s.password, s.smtpHost)
	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)

	return smtp.SendMail(addr, auth, s.fromAddress, []string{s.toAddress}, message)
}

func (s *EmailService) formatEmail(from, to, subject, body string) []byte {
	var buf bytes.Buffer
	buf.WriteString(fmt.Sprintf("From: %s\r\n", from))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", to))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	buf.WriteString("\r\n")
	buf.WriteString(body)
	return buf.Bytes()
}

