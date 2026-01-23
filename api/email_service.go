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
func (s *EmailService) SendEventEmail(eventID string, titleHe string, titleEn string, titleEs string, titleRu string, date time.Time, startTime string, endTime string, isUpdate bool) error {
	// Format dates in different languages
	dateEn := date.Format("Monday, Jan 2, 2006")
	dateHe := s.formatDateHebrew(date)
	dateSp := s.formatDateSpanish(date)
	dateRu := s.formatDateRussian(date)

	// Format time display
	timeDisplay := s.formatTime(startTime, endTime)

	// Bilingual subject with optional update prefix
	var subject string
	if isUpdate {
		subject = fmt.Sprintf("עדכון: חומר לימוד: %s %s :: Update: Study Materials: %s %s",
			titleHe, dateHe, titleEn, dateEn)
	} else {
		subject = fmt.Sprintf("חומר לימוד: %s %s :: Study Materials: %s %s",
			titleHe, dateHe, titleEn, dateEn)
	}

	// Event details page URL
	eventURL := fmt.Sprintf("%s/?event=%s", s.frontendURL, eventID)

	// Generate HTML body with real data
	htmlBody := s.generateEmailHTML(eventURL, titleHe, titleEn, titleEs, titleRu, dateHe, dateEn, dateSp, dateRu, timeDisplay)

	// Construct email message with HTML content
	message := s.formatEmailHTML(s.fromAddress, s.toAddress, subject, htmlBody)

	// Send via SMTP
	auth := smtp.PlainAuth("", s.username, s.password, s.smtpHost)
	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)

	return smtp.SendMail(addr, auth, s.fromAddress, []string{s.toAddress}, message)
}

// formatDateHebrew formats date in Hebrew format
func (s *EmailService) formatDateHebrew(date time.Time) string {
	hebrewDays := []string{"ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"}
	hebrewMonths := []string{"ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"}

	dayName := hebrewDays[date.Weekday()]
	day := date.Day()
	monthName := hebrewMonths[date.Month()-1]
	year := date.Year()

	return fmt.Sprintf("יום %s, %d ב%s %d", dayName, day, monthName, year)
}

// formatDateSpanish formats date in Spanish format
func (s *EmailService) formatDateSpanish(date time.Time) string {
	spanishMonths := []string{"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"}
	spanishDays := []string{"Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"}

	dayName := spanishDays[date.Weekday()]
	day := date.Day()
	monthName := spanishMonths[date.Month()-1]
	year := date.Year()

	return fmt.Sprintf("%s, %d de %s de %d", dayName, day, monthName, year)
}

// formatDateRussian formats date in Russian format
func (s *EmailService) formatDateRussian(date time.Time) string {
	russianMonths := []string{"января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"}
	russianDays := []string{"Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"}

	dayName := russianDays[date.Weekday()]
	day := date.Day()
	monthName := russianMonths[date.Month()-1]
	year := date.Year()

	return fmt.Sprintf("%s, %d %s %d", dayName, day, monthName, year)
}

// formatTime formats start and end time
func (s *EmailService) formatTime(startTime string, endTime string) string {
	if startTime == "" {
		return ""
	}
	if endTime == "" {
		return startTime
	}
	return fmt.Sprintf("%s - %s", startTime, endTime)
}

// generateEmailHTML creates the production-ready HTML email template with real data
func (s *EmailService) generateEmailHTML(eventURL string, titleHe string, titleEn string, titleEs string, titleRu string, dateHe string, dateEn string, dateSp string, dateRu string, timeDisplay string) string {
	htmlTemplate := `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Study Materials Available</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0; padding: 0; max-width: 600px;">
          
          <!-- Header with Logo and Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #00b6be 0%%, #008a90 100%%); padding: 20px 15px; text-align: center;">
              
              <!-- Logo and Title -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; margin-bottom: 12px;">
                <tr>
                  <td style="text-align: right; padding-left: 8px;">
                    <div style="color: #ffffff; font-size: 18px; font-weight: bold; line-height: 1.1; margin: 0;">בני ברוך</div>
                    <div style="color: rgba(255,255,255,0.9); font-size: 11px; line-height: 1.1; margin: 0;">קהילת לומדי קבלה</div>
                  </td>
                  <td style="padding-top: 2px;">
                    <img src="https://raw.githubusercontent.com/Bnei-Baruch/kmedia-mdb/master/public/logo.png" alt="בני ברוך" width="40" height="40" style="display: block; border-radius: 50%%; background: white; margin: 0; padding: 0; border: 0;"/>
                  </td>
                </tr>
              </table>
              
              <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 19px; font-weight: bold; line-height: 1.2;">
                📚 New Study Materials | חומרי לימוד חדשים
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.92); font-size: 12px; line-height: 1.3;">
                Nuevos Materiales | Новые Материалы
              </p>
            </td>
          </tr>
          
          <!-- 4 Language Sections in Grid -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0;">
                
                <!-- Row 1: English and Hebrew -->
                <tr>
                  <!-- English Section -->
                  <td width="50%%" valign="top" style="padding: 25px; border-right: 2px solid #00b6be; border-bottom: 2px solid #00b6be; background-color: #ffffff; margin: 0;">
                    <h3 style="margin: 0 0 12px 0; color: #004d52; font-size: 16px; font-weight: bold; text-align: center; line-height: 1.3;">
                      %s
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">📅</strong> %s
                    </p>
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">🕐</strong> %s
                    </p>
                    <div style="text-align: center;">
                      <a href="%s&lang=en" style="display: inline-block; background: linear-gradient(135deg, #00b6be 0%%, #008a90 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; border: 0; margin: 0;">
                        📚 View Materials
                      </a>
                    </div>
                  </td>
                  
                  <!-- Hebrew Section -->
                  <td width="50%%" valign="top" dir="rtl" style="padding: 25px; border-bottom: 2px solid #00b6be; background-color: #f8feff; margin: 0;">
                    <h3 style="margin: 0 0 12px 0; color: #004d52; font-size: 16px; font-weight: bold; text-align: center; line-height: 1.3;">
                      %s
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">📅</strong> %s
                    </p>
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">🕐</strong> %s
                    </p>
                    <div style="text-align: center;">
                      <a href="%s&lang=he" style="display: inline-block; background: linear-gradient(135deg, #00b6be 0%%, #008a90 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; border: 0; margin: 0;">
                        📚 לצפייה בחומרים
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Row 2: Spanish and Russian -->
                <tr>
                  <!-- Spanish Section -->
                  <td width="50%%" valign="top" style="padding: 25px; border-right: 2px solid #00b6be; background-color: #f8feff; margin: 0;">
                    <h3 style="margin: 0 0 12px 0; color: #004d52; font-size: 16px; font-weight: bold; text-align: center; line-height: 1.3;">
                      %s
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">📅</strong> %s
                    </p>
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">🕐</strong> %s
                    </p>
                    <div style="text-align: center;">
                      <a href="%s&lang=es" style="display: inline-block; background: linear-gradient(135deg, #00b6be 0%%, #008a90 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; border: 0; margin: 0;">
                        📚 Ver Materiales
                      </a>
                    </div>
                  </td>
                  
                  <!-- Russian Section -->
                  <td width="50%%" valign="top" style="padding: 25px; background-color: #ffffff; margin: 0;">
                    <h3 style="margin: 0 0 12px 0; color: #004d52; font-size: 16px; font-weight: bold; text-align: center; line-height: 1.3;">
                      %s
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">📅</strong> %s
                    </p>
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; text-align: center; line-height: 1.4;">
                      <strong style="font-weight: bold;">🕐</strong> %s
                    </p>
                    <div style="text-align: center;">
                      <a href="%s&lang=ru" style="display: inline-block; background: linear-gradient(135deg, #00b6be 0%%, #008a90 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: bold; border: 0; margin: 0;">
                        📚 Просмотреть
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #f8f8f8; text-align: center; border-top: 3px solid #00b6be; margin: 0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 11px; line-height: 1.5;">
                You are receiving this email because you subscribed to study material notifications.
              </p>
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 11px; line-height: 1.5;">
                הנכם מקבלים דוא"ל זה מכיוון שנרשמתם לקבלת התראות חומרי לימוד.
              </p>
              <p style="margin: 0; color: #999999; font-size: 10px; line-height: 1.4;">
                © 2025 בני ברוך - קהילת לומדי קבלה | Bnei Baruch Kabbalah Education. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`

	// Populate template with real event data
	html := fmt.Sprintf(htmlTemplate,
		// English section
		titleEn,
		dateEn,
		timeDisplay,
		eventURL,
		// Hebrew section
		titleHe,
		dateHe,
		timeDisplay,
		eventURL,
		// Spanish section
		titleEs,
		dateSp,
		timeDisplay,
		eventURL,
		// Russian section
		titleRu,
		dateRu,
		timeDisplay,
		eventURL,
	)

	return html
}

func (s *EmailService) formatEmailHTML(from, to, subject, htmlBody string) []byte {
	var buf bytes.Buffer
	buf.WriteString(fmt.Sprintf("From: %s\r\n", from))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", to))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buf.WriteString("\r\n")
	buf.WriteString(htmlBody)
	return buf.Bytes()
}
