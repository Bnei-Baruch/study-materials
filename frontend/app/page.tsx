'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { formatEventDate, formatDateOnly } from '@/lib/dateUtils'
import { groupEventsByDate, getDateGroupColorClasses } from '@/lib/eventGrouping'
import {
  BookOpen,
  Video,
  FileText,
  Copy,
  Check,
  Shield,
  ChevronDown,
  ChevronUp,
  Share2,
  MessageCircle,
  Send,
  Calendar,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
  type: string
  number: number
  titles?: {
    he?: string
    en?: string
    ru?: string
    es?: string
    de?: string
    it?: string
    fr?: string
    uk?: string
  }
  public: boolean
  end_date?: string
  parent_event_id?: string
  hide_from_lessons_tab?: boolean
}

interface EventTypeInfo {
  id: string
  name: string
  color: string
  titles: Record<string, string>
}

interface Source {
  source_id: string
  source_title: string
  source_url: string
  page_number?: string
  start_point?: string
  end_point?: string
}

interface CustomLink {
  title: string
  url: string
}

interface Part {
  id: string
  title: string
  description: string
  date: string
  part_type: string
  language: string
  event_id: string
  order?: number | null
  part_number: number | null
  position: number
  excerpts_link?: string
  transcript_link?: string
  transcript_start_point?: string
  transcript_end_point?: string
  lesson_link?: string
  program_link?: string
  reading_before_sleep_link?: string
  lesson_preparation_link?: string
  lineup_for_hosts_link?: string
  recorded_lesson_date?: string
  sources: Source[]
  custom_links?: CustomLink[]
  created_at: string
  show_updated_badge?: boolean
}

const LANGUAGES = {
  he: '🇮🇱 עברית',
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  es: '🇪🇸 Español',
  de: '🇩🇪 Deutsch',
  it: '🇮🇹 Italiano',
  fr: '🇫🇷 Français',
  uk: '🇺🇦 Українська',
  tr: '🇹🇷 Türkçe',
  'pt-BR': '🇧🇷 Português',
  bg: '🇧🇬 Български',
}

// Format date based on language locale (date only, no time)
const formatDateByLanguage = (dateString: string, language: string) => {
  return formatDateOnly(dateString, language)
}

const TRANSLATIONS = {
  he: {
    conventionsTab: 'כנסים ואירועים',
    lessonsTab: 'שיעורים יומיים',
    upcoming: 'קרובים',
    past: 'שעברו',
    all: 'הכל',
    toStudyMaterials: 'לחומרי הלימוד',
    addToCalendar: 'הוסף ליומן',
    day: 'יום',
    days: 'ימים',
    backToConventions: 'חזרה לרשימה',
    todayBadge: 'היום',
    noEvents: 'אין אירועים זמינים',
    backToEvents: 'חזרה לרשימת השיעורים',
    noMaterials: 'אין חומרים זמינים',
    originalDate: 'תאריך השיעור המקורי: ',
    page: 'עמ\'',
    copyLink: 'העתק קישור',
    readSource: 'לקריאת המקור',
    part: 'חלק',
    share: 'שתף',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'העתק כטקסט',
    links: 'קישורים',
    sources: 'מקורות',
    studyMaterials: 'חומרי לימוד',
    studyMaterialsDescription: 'חומרי לימוד ומקורות לשיעורים, כנסים ואירועים של ״בני ברוך - קבלה לעם״',
    filterByDate: 'סינון לפי תאריך',
    fromDate: 'מתאריך',
    toDate: 'עד תאריך',
    clearFilters: 'נקה סינון',
    eventsFound: 'שיעורים נמצאו',
    loadMore: 'לעוד שיעורים >>',
    readingBeforeSleep: 'קטע הכנה לשינה',
    lessonPreparation: 'מסמך הכנה לשיעור',
    watchLesson: 'צפייה בשיעור',
    lessonTranscript: 'תמליל השיעור',
    selectedExcerpts: 'קטעים נבחרים',
    lineupForHosts: 'ליינאפ מנחים',
    startPoint: 'דבר המתחיל:',
    endPoint: 'עד:',
    updated: 'עודכן',
  },
  en: {
    conventionsTab: 'Conventions & Events',
    lessonsTab: 'Daily Lessons',
    upcoming: 'Upcoming',
    past: 'Past',
    all: 'All',
    toStudyMaterials: 'Study Materials',
    addToCalendar: 'Add to Calendar',
    day: 'Day',
    days: 'days',
    backToConventions: 'Back to list',
    todayBadge: 'Today',
    noEvents: 'No events available',
    backToEvents: 'Back to events',
    noMaterials: 'No materials available',
    originalDate: 'Original lesson date: ',
    page: 'p.',
    copyLink: 'Copy link',
    readSource: 'Read the source',
    part: 'Part',
    share: 'Share',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Copy as text',
    links: 'Links',
    sources: 'Sources',
    studyMaterials: 'Study Materials',
    studyMaterialsDescription: 'Study materials and sources for lessons, conventions and events of Bnei Baruch',
    filterByDate: 'Filter by date',
    fromDate: 'From date',
    toDate: 'To date',
    clearFilters: 'Clear filters',
    eventsFound: 'events found',
    loadMore: 'Load more lessons',
    readingBeforeSleep: 'Reading Before Sleep',
    lessonPreparation: 'Lesson Preparation',
    watchLesson: 'Watch Lesson',
    lessonTranscript: 'Lesson Transcript',
    selectedExcerpts: 'Selected Excerpts',
    lineupForHosts: 'Lineup for the hosts',
    startPoint: 'From:',
    endPoint: 'To:',
    updated: 'Updated',
  },
  ru: {
    conventionsTab: 'Съезды и мероприятия',
    lessonsTab: 'Ежедневные уроки',
    upcoming: 'Предстоящие',
    past: 'Прошедшие',
    all: 'Все',
    toStudyMaterials: 'К материалам',
    addToCalendar: 'В календарь',
    day: 'День',
    days: 'дней',
    backToConventions: 'Назад к списку',
    todayBadge: 'Сегодня',
    noEvents: 'Нет доступных событий',
    backToEvents: 'Вернуться к событиям',
    noMaterials: 'Нет доступных материалов',
    originalDate: 'Дата оригинального урока: ',
    page: 'стр.',
    copyLink: 'Копировать ссылку',
    readSource: 'Читать источник',
    part: 'Часть',
    share: 'Поделиться',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Копировать как текст',
    links: 'Ссылки',
    sources: 'Источники',
    studyMaterials: 'Учебные материалы',
    studyMaterialsDescription: 'Учебные материалы и источники для уроков, конгрессов и событий Бней Барух',
    filterByDate: 'Фильтр по дате',
    fromDate: 'С даты',
    toDate: 'По дату',
    clearFilters: 'Очистить фильтры',
    eventsFound: 'уроков найдено',
    loadMore: 'Загрузить еще уроки',
    readingBeforeSleep: 'Чтение перед сном',
    lessonPreparation: 'Подготовка к уроку',
    watchLesson: 'Смотреть урок',
    lessonTranscript: 'Транскрипт урока',
    selectedExcerpts: 'Избранные отрывки',
    lineupForHosts: 'Лайнап для ведущих',
    startPoint: 'От:',
    endPoint: 'До:',
    updated: 'Обновлено',
  },
  es: {
    conventionsTab: 'Congresos y Eventos',
    lessonsTab: 'Lecciones Diarias',
    upcoming: 'Próximos',
    past: 'Pasados',
    all: 'Todos',
    toStudyMaterials: 'Materiales de estudio',
    addToCalendar: 'Añadir al calendario',
    day: 'Día',
    days: 'días',
    backToConventions: 'Volver a la lista',
    todayBadge: 'Hoy',
    noEvents: 'No hay eventos disponibles',
    backToEvents: 'Volver a eventos',
    noMaterials: 'No hay materiales disponibles',
    originalDate: 'Fecha de la lección original: ',
    page: 'p.',
    copyLink: 'Copiar enlace',
    readSource: 'Leer la fuente',
    part: 'Parte',
    share: 'Compartir',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Copiar como texto',
    links: 'Enlaces',
    sources: 'Fuentes',
    studyMaterials: 'Materiales de estudio',
    studyMaterialsDescription: 'Materiales de estudio y fuentes para lecciones, congresos y eventos de Bnei Baruch',
    filterByDate: 'Filtrar por fecha',
    fromDate: 'Desde fecha',
    toDate: 'Hasta fecha',
    clearFilters: 'Limpiar filtros',
    eventsFound: 'lecciones encontradas',
    loadMore: 'Cargar más lecciones',
    readingBeforeSleep: 'Lectura antes de dormir',
    lessonPreparation: 'Preparación de la lección',
    watchLesson: 'Ver lección',
    lessonTranscript: 'Transcripción de la lección',
    selectedExcerpts: 'Extractos seleccionados',
    lineupForHosts: 'Lineup para los presentadores',
    startPoint: 'De:',
    endPoint: 'Hasta:',
    updated: 'Actualizado',
  },
  de: {
    conventionsTab: 'Kongresse & Veranstaltungen',
    lessonsTab: 'Tägliche Lektionen',
    upcoming: 'Bevorstehend',
    past: 'Vergangen',
    all: 'Alle',
    toStudyMaterials: 'Zu den Materialien',
    addToCalendar: 'Zum Kalender',
    day: 'Tag',
    days: 'Tage',
    backToConventions: 'Zurück zur Liste',
    todayBadge: 'Heute',
    noEvents: 'Keine Veranstaltungen verfügbar',
    backToEvents: 'Zurück zu Veranstaltungen',
    noMaterials: 'Keine Materialien verfügbar',
    originalDate: 'Ursprüngliches Lektionsdatum: ',
    page: 'S.',
    copyLink: 'Link kopieren',
    readSource: 'Quelle lesen',
    part: 'Teil',
    share: 'Teilen',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Als Text kopieren',
    links: 'Links',
    sources: 'Quellen',
    studyMaterials: 'Studienmaterialien',
    studyMaterialsDescription: 'Studienmaterialien und Quellen für Lektionen, Kongresse und Veranstaltungen von Bnei Baruch',
    filterByDate: 'Nach Datum filtern',
    fromDate: 'Von Datum',
    toDate: 'Bis Datum',
    clearFilters: 'Filter löschen',
    eventsFound: 'Lektionen gefunden',
    loadMore: 'Mehr Lektionen laden',
    readingBeforeSleep: 'Lesen vor dem Schlafengehen',
    lessonPreparation: 'Lektionsvorbereitung',
    watchLesson: 'Lektion ansehen',
    lessonTranscript: 'Lektionstranskript',
    selectedExcerpts: 'Ausgewählte Auszüge',
    lineupForHosts: 'Aufstellung für die Gastgeber',
    startPoint: 'Von:',
    endPoint: 'Bis:',
    updated: 'Aktualisiert',
  },
  it: {
    conventionsTab: 'Congressi ed Eventi',
    lessonsTab: 'Lezioni Quotidiane',
    upcoming: 'In arrivo',
    past: 'Passati',
    all: 'Tutti',
    toStudyMaterials: 'Materiali di studio',
    addToCalendar: 'Aggiungi al calendario',
    day: 'Giorno',
    days: 'giorni',
    backToConventions: 'Torna alla lista',
    todayBadge: 'Oggi',
    noEvents: 'Nessun evento disponibile',
    backToEvents: 'Torna agli eventi',
    noMaterials: 'Nessun materiale disponibile',
    originalDate: 'Data della lezione originale: ',
    page: 'p.',
    copyLink: 'Copia link',
    readSource: 'Leggi la fonte',
    part: 'Parte',
    share: 'Condividi',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Copia come testo',
    links: 'Collegamenti',
    sources: 'Fonti',
    studyMaterials: 'Materiali di studio',
    studyMaterialsDescription: 'Materiali di studio e fonti per lezioni, congressi ed eventi di Bnei Baruch',
    filterByDate: 'Filtra per data',
    fromDate: 'Dalla data',
    toDate: 'Alla data',
    clearFilters: 'Cancella filtri',
    eventsFound: 'lezioni trovate',
    loadMore: 'Carica altre lezioni',
    readingBeforeSleep: 'Lettura prima di dormire',
    lessonPreparation: 'Preparazione della lezione',
    watchLesson: 'Guarda la lezione',
    lessonTranscript: 'Trascrizione della lezione',
    selectedExcerpts: 'Estratti selezionati',
    lineupForHosts: 'Lineup per i conduttori',
    startPoint: 'Da:',
    endPoint: 'A:',
    updated: 'Aggiornato',
  },
  fr: {
    conventionsTab: 'Congrès & Événements',
    lessonsTab: 'Leçons Quotidiennes',
    upcoming: 'À venir',
    past: 'Passés',
    all: 'Tous',
    toStudyMaterials: 'Matériaux d\'étude',
    addToCalendar: 'Ajouter au calendrier',
    day: 'Jour',
    days: 'jours',
    backToConventions: 'Retour à la liste',
    todayBadge: 'Aujourd\'hui',
    noEvents: 'Aucun événement disponible',
    backToEvents: 'Retour aux événements',
    noMaterials: 'Aucun matériel disponible',
    originalDate: 'Date de la leçon originale: ',
    page: 'p.',
    copyLink: 'Copier le lien',
    readSource: 'Lire la source',
    part: 'Partie',
    share: 'Partager',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Copier en tant que texte',
    links: 'Liens',
    sources: 'Sources',
    studyMaterials: 'Matériaux d\'étude',
    studyMaterialsDescription: 'Matériaux d\'étude et sources pour les leçons, congrès et événements de Bnei Baruch',
    filterByDate: 'Filtrer par date',
    fromDate: 'De la date',
    toDate: 'À la date',
    clearFilters: 'Effacer les filtres',
    eventsFound: 'leçons trouvées',
    loadMore: 'Charger plus de leçons',
    readingBeforeSleep: 'Lecture avant de dormir',
    lessonPreparation: 'Préparation de la leçon',
    watchLesson: 'Regarder la leçon',
    lessonTranscript: 'Transcription de la leçon',
    selectedExcerpts: 'Extraits sélectionnés',
    lineupForHosts: 'Lineup pour les présentateurs',
    startPoint: 'De:',
    endPoint: 'À:',
    updated: 'Mis à jour',
  },
  uk: {
    conventionsTab: 'З\'їзди та заходи',
    lessonsTab: 'Щоденні уроки',
    upcoming: 'Наближаються',
    past: 'Минулі',
    all: 'Всі',
    toStudyMaterials: 'До матеріалів',
    addToCalendar: 'До календаря',
    day: 'День',
    days: 'днів',
    backToConventions: 'Назад до списку',
    todayBadge: 'Сьогодні',
    noEvents: 'Немає доступних подій',
    backToEvents: 'Повернутися до подій',
    noMaterials: 'Немає доступних матеріалів',
    originalDate: 'Дата оригінального уроку: ',
    page: 'стор.',
    copyLink: 'Копіювати посилання',
    readSource: 'Читати джерело',
    part: 'Частина',
    share: 'Поділитися',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Копіювати як текст',
    links: 'Посилання',
    sources: 'Джерела',
    studyMaterials: 'Навчальні матеріали',
    studyMaterialsDescription: 'Навчальні матеріали та джерела для уроків, конгресів та подій Бней Барух',
    filterByDate: 'Фільтр за датою',
    fromDate: 'Від дати',
    toDate: 'До дати',
    clearFilters: 'Очистити фільтри',
    eventsFound: 'уроків знайдено',
    loadMore: 'Завантажити більше уроків',
    readingBeforeSleep: 'Читання перед сном',
    lessonPreparation: 'Підготовка до уроку',
    watchLesson: 'Дивитися урок',
    lessonTranscript: 'Транскрипт уроку',
    selectedExcerpts: 'Вибрані уривки',
    lineupForHosts: 'Програма для ведучих',
    startPoint: 'Від:',
    endPoint: 'До:',
    updated: 'Оновлено',
  },
  tr: {
    conventionsTab: 'Kongreler & Etkinlikler',
    lessonsTab: 'Günlük Dersler',
    upcoming: 'Yaklaşan',
    past: 'Geçmiş',
    all: 'Tümü',
    toStudyMaterials: 'Ders Materyalleri',
    addToCalendar: 'Takvime Ekle',
    day: 'Gün',
    days: 'gün',
    backToConventions: 'Listeye Dön',
    todayBadge: 'Bugün',
    noEvents: 'Kullanılabilir etkinlik yok',
    backToEvents: 'Etkinliklere geri dön',
    noMaterials: 'Kullanılabilir materyal yok',
    originalDate: 'Orijinal ders tarihi: ',
    page: 's.',
    copyLink: 'Bağlantıyı kopyala',
    readSource: 'Kaynağı oku',
    part: 'Bölüm',
    share: 'Paylaş',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Metin olarak kopyala',
    links: 'Bağlantılar',
    sources: 'Kaynaklar',
    studyMaterials: 'Çalışma Materyalleri',
    studyMaterialsDescription: 'Bnei Baruch dersler, kongreler ve etkinlikleri için çalışma materyalleri ve kaynaklar',
    filterByDate: 'Tarihe göre filtrele',
    fromDate: 'Başlangıç tarihi',
    toDate: 'Bitiş tarihi',
    clearFilters: 'Filtreleri temizle',
    eventsFound: 'ders bulundu',
    loadMore: 'Daha fazla ders yükle',
    readingBeforeSleep: 'Uyku Öncesi Okuma',
    lessonPreparation: 'Ders Hazırlığı',
    watchLesson: 'Dersi izle',
    lessonTranscript: 'Ders Transkripti',
    selectedExcerpts: 'Seçilmiş Alıntılar',
    lineupForHosts: 'Sunucular için program',
    startPoint: 'Başla:',
    endPoint: 'Bitir:',
    updated: 'Güncellendi',
  },
  'pt-BR': {
    conventionsTab: 'Congressos & Eventos',
    lessonsTab: 'Aulas Diárias',
    upcoming: 'Próximos',
    past: 'Anteriores',
    all: 'Todos',
    toStudyMaterials: 'Materiais de estudo',
    addToCalendar: 'Adicionar ao calendário',
    day: 'Dia',
    days: 'dias',
    backToConventions: 'Voltar à lista',
    todayBadge: 'Hoje',
    noEvents: 'Nenhum evento disponível',
    backToEvents: 'Voltar para eventos',
    noMaterials: 'Nenhum material disponível',
    originalDate: 'Data da aula original: ',
    page: 'p.',
    copyLink: 'Copiar link',
    readSource: 'Ler a fonte',
    part: 'Parte',
    share: 'Compartilhar',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Copiar como texto',
    links: 'Links',
    sources: 'Fontes',
    studyMaterials: 'Materiais de Estudo',
    studyMaterialsDescription: 'Materiais de estudo e fontes para aulas, congressos e eventos de Bnei Baruch',
    filterByDate: 'Filtrar por data',
    fromDate: 'De data',
    toDate: 'Até data',
    clearFilters: 'Limpar filtros',
    eventsFound: 'aulas encontradas',
    loadMore: 'Carregar mais aulas',
    readingBeforeSleep: 'Leitura Antes de Dormir',
    lessonPreparation: 'Preparação da Aula',
    watchLesson: 'Assistir Aula',
    lessonTranscript: 'Transcrição da Aula',
    selectedExcerpts: 'Trechos Selecionados',
    lineupForHosts: 'Lineup para apresentadores',
    startPoint: 'De:',
    endPoint: 'Para:',
    updated: 'Atualizado',
  },
  bg: {
    conventionsTab: 'Конгреси и събития',
    lessonsTab: 'Ежедневни уроци',
    upcoming: 'Предстоящи',
    past: 'Минали',
    all: 'Всички',
    toStudyMaterials: 'Учебни материали',
    addToCalendar: 'Добави в календар',
    day: 'Ден',
    days: 'дни',
    backToConventions: 'Назад към списъка',
    todayBadge: 'Днес',
    noEvents: 'Няма налични събития',
    backToEvents: 'Обратно към събитията',
    noMaterials: 'Няма налични материали',
    originalDate: 'Дата на оригиналния урок: ',
    page: 'стр.',
    copyLink: 'Копирай връзка',
    readSource: 'Прочети източника',
    part: 'Част',
    share: 'Споделяне',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copyAsText: 'Копирай като текст',
    links: 'Връзки',
    sources: 'Източници',
    studyMaterials: 'Учебни материали',
    studyMaterialsDescription: 'Учебни материали и източници за уроци, конгреси и събития на Бней Барух',
    filterByDate: 'Филтрирай по дата',
    fromDate: 'От дата',
    toDate: 'До дата',
    clearFilters: 'Изчисти филтрите',
    eventsFound: 'намерени урока',
    loadMore: 'Зареди още уроци',
    readingBeforeSleep: 'Четене преди сън',
    lessonPreparation: 'Подготовка за урока',
    watchLesson: 'Гледай урока',
    lessonTranscript: 'Транскрипт на урока',
    selectedExcerpts: 'Избрани откъси',
    lineupForHosts: 'Програма за водещи',
    startPoint: 'От:',
    endPoint: 'До:',
    updated: 'Актуализирано',
  },
}

export default function PublicPage({ initialTab = 'lessons' }: { initialTab?: 'lessons' | 'conventions' } = {}) {
  const router = useRouter()
  const [language, setLanguage] = useState('he')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [sharedPart, setSharedPart] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalEvents, setTotalEvents] = useState(0)
  const [activeTab, setActiveTab] = useState<'conventions' | 'lessons'>(initialTab)
  const [conventionFilter, setConventionFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [conventions, setConventions] = useState<Event[]>([])
  const [conventionsLoading, setConventionsLoading] = useState(false)
  const [selectedConvention, setSelectedConvention] = useState<Event | null>(null)
  const [conventionSessions, setConventionSessions] = useState<Event[]>([])
  const [selectedConventionDay, setSelectedConventionDay] = useState<string | null>(null)
  const [fromConvention, setFromConvention] = useState(false)
  const [eventTypes, setEventTypes] = useState<EventTypeInfo[]>([])
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])


  // Translation helper
  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language as keyof typeof TRANSLATIONS]?.[key] || TRANSLATIONS.en[key]
  }

  // Format time range for display (removes leading zeros, uses language-specific separator)
  const formatTimeRange = (startTime: string, endTime: string): string => {
    // Remove leading zeros from hours: "02:40" becomes "2:40"
    const start = startTime.replace(/^0/, '')
    const end = endTime.replace(/^0/, '')
    
    // Language-specific separators
    const separators: { [key: string]: string } = {
      he: 'עד',      // Hebrew: until
      en: 'to',      // English: to
      ru: 'до',      // Russian: until
      es: 'hasta',   // Spanish: until
      de: 'bis',     // German: until
      it: 'fino a',  // Italian: until to
      fr: 'à',       // French: to
      uk: 'до',      // Ukrainian: until
    }
    
    const separator = separators[language] || '-'
    return `${start} ${separator} ${end}`
  }

  // Format full event date display (day of week | date | time)
  const formatEventDateDisplay = (dateString: string, startTime?: string, endTime?: string): string => {
    // Validate input
    if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
      console.warn('formatEventDateDisplay: Invalid date string:', dateString)
      return 'Date not available'
    }

    let date: Date
    try {
      if (typeof dateString !== 'string') {
        console.warn('formatEventDateDisplay: dateString is not a string:', typeof dateString, dateString)
        return 'Invalid date'
      }

      // Parse date string properly
      if (dateString.includes('T')) {
        // ISO format with time
        date = new Date(dateString)
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Date-only format (YYYY-MM-DD)
        date = new Date(dateString + 'T00:00:00Z')
      } else {
        // Try parsing as-is
        date = new Date(dateString)
      }
      
      // Check if date is valid immediately after creation
      if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
        console.warn('formatEventDateDisplay: Invalid date object created from:', dateString)
        return 'Invalid date'
      }
    } catch (e) {
      console.error('formatEventDateDisplay: Error parsing date:', dateString, e)
      return 'Invalid date'
    }

    const isHebrew = language === 'he' || language === 'he-IL'
    
    try {
      // Get day of week
      const dayOfWeek = new Intl.DateTimeFormat(isHebrew ? 'he-IL' : language, {
        timeZone: 'Asia/Jerusalem',
        weekday: 'long',
      }).format(date)
      
      // Get date in appropriate format
      let displayDate: string
      if (isHebrew) {
        // Hebrew format: 2.2.26 (day.month.year with single digits)
        const day = date.getUTCDate()
        const month = date.getUTCMonth() + 1
        const year = String(date.getUTCFullYear()).slice(-2)
        displayDate = `${day}.${month}.${year}`
      } else {
        displayDate = formatDate(dateString)
      }
      
      // Build the display string
      let result = `${dayOfWeek} | ${displayDate}`
      if (startTime && endTime) {
        result += ` | ${formatTimeRange(startTime, endTime)}`
      }
      
      return result
    } catch (e) {
      console.error('formatEventDateDisplay: Error formatting date:', dateString, e)
      return 'Date formatting error'
    }
  }

  // Load language from localStorage and listen for changes from Navigation
  useEffect(() => {
    const saved = localStorage.getItem('public-language')
    if (saved && saved in LANGUAGES) {
      setLanguage(saved)
    }

    // Listen for language changes from Navigation
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('public-language')
      if (newLang && newLang in LANGUAGES) {
        setLanguage(newLang)
      }
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  // Fetch public events when language or date filters change
  useEffect(() => {
    fetchEvents()

    const interval = setInterval(() => {
      if (!document.hidden) fetchEvents()
    }, 10 * 60 * 1000)

    const onVisible = () => { if (!document.hidden) fetchEvents() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [language, startDate, endDate])

  // Fetch conventions and event types on mount / language change
  useEffect(() => {
    fetchConventions()
    fetchEventTypes()
  }, [language])

  // Fetch parts when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchParts(selectedEvent.id)
    }
  }, [selectedEvent, language])

  // Auto-expand all parts on load
  useEffect(() => {
    if (parts.length > 0) {
      const allPartIds = new Set(parts.map(p => p.id))
      setExpandedParts(allPartIds)
    }
  }, [parts])

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking inside a dropdown or share button
      if (!target.closest('[data-share-dropdown]') && !target.closest('[data-share-button]')) {
        setOpenShareDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Detect event/convention from URL parameter and auto-select
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('event')
    const conventionId = urlParams.get('convention')

    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId)
      if (event) { setSelectedEvent(event); setActiveTab('lessons') }
    } else if (conventionId && conventions.length > 0) {
      const convention = conventions.find(c => c.id === conventionId)
      if (convention) {
        setActiveTab('conventions')
        setSelectedConvention(convention)
        setConventionSessions([])
        setSelectedConventionDay(null)
        fetchConventionSessions(convention.id)
      }
    }
  }, [events, conventions])

  // Listen for browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const eventId = urlParams.get('event')
      const conventionId = urlParams.get('convention')
      const isConventionsPath = window.location.pathname === '/conventions'

      if (eventId && events.length > 0) {
        const event = events.find(e => e.id === eventId)
        if (event) { setSelectedEvent(event); setActiveTab('lessons'); return }
      }
      if (conventionId && conventions.length > 0) {
        const convention = conventions.find(c => c.id === conventionId)
        if (convention) {
          setSelectedEvent(null)
          setParts([])
          setExpandedParts(new Set())
          setSelectedConvention(convention)
          setConventionSessions([])
          setSelectedConventionDay(null)
          setActiveTab('conventions')
          fetchConventionSessions(convention.id)
          return
        }
      }
      // No specific item — sync tab from path and clear selection
      setSelectedEvent(null)
      setParts([])
      setExpandedParts(new Set())
      setSelectedConvention(null)
      setConventionSessions([])
      setSelectedConventionDay(null)
      setActiveTab(isConventionsPath ? 'conventions' : 'lessons')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [events, conventions])

  const fetchEvents = async () => {
    console.log(`[study] fetching events at ${new Date().toLocaleTimeString()}`)
    try {
      setLoading(true)
      const params = new URLSearchParams({
        public: 'true',
        limit: '10',
        language: language,
        hide_from_lessons_tab: 'false',
      })
      if (startDate) params.append('from_date', startDate)
      if (endDate) params.append('to_date', endDate)

      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      setEvents(data.events || [])
      setTotalEvents(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConventions = async () => {
    try {
      setConventionsLoading(true)
      const params = new URLSearchParams({
        public: 'true',
        types: 'convention,holiday,special_event',
        limit: '100',
      })
      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      setConventions(data.events || [])
    } catch (error) {
      console.error('Failed to fetch conventions:', error)
    } finally {
      setConventionsLoading(false)
    }
  }

  const fetchConventionSessions = async (conventionId: string) => {
    try {
      const params = new URLSearchParams({
        public: 'true',
        parent_id: conventionId,
        limit: '100',
      })
      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      const sessions: Event[] = data.events || []
      setConventionSessions(sessions)
      // Auto-select first day
      if (sessions.length > 0) {
        const firstDay = sessions[0].date.split('T')[0]
        setSelectedConventionDay(firstDay)
      }
    } catch (error) {
      console.error('Failed to fetch convention sessions:', error)
      setConventionSessions([])
    }
  }

  const fetchEventTypes = async () => {
    try {
      const response = await fetch(getApiUrl('/event-types'))
      const data = await response.json()
      setEventTypes(data || [])
    } catch (error) {
      console.error('Failed to fetch event types:', error)
    }
  }

  const loadMore = async () => {
    try {
      const params = new URLSearchParams({
        public: 'true',
        limit: '10',
        offset: events.length.toString(),
        language: language,
        hide_from_lessons_tab: 'false',
      })
      if (startDate) params.append('from_date', startDate)
      if (endDate) params.append('to_date', endDate)

      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      setEvents([...events, ...(data.events || [])])
      setTotalEvents(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch more events:', error)
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = startDate || endDate

  const fetchParts = async (eventId: string) => {
    try {
      const response = await fetch(getApiUrl(`/events/${eventId}/parts?language=${language}`))
      const data = await response.json()
      setParts((data.parts || [])
        .sort((a: Part, b: Part) => (a.order ?? 0) - (b.order ?? 0))
        .map((p: Part) => ({ ...p, part_number: p.part_number ?? p.order })))
    } catch (error) {
      console.error('Failed to fetch parts:', error)
      setParts([])
    }
  }

  const copyToClipboard = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const togglePart = (partId: string) => {
    const newExpanded = new Set(expandedParts)
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId)
    } else {
      newExpanded.add(partId)
    }
    setExpandedParts(newExpanded)
  }

  const addLanguageToUrl = (url: string) => {
    // Add language code to kabbalahmedia.info URLs
    if (url.includes('kabbalahmedia.info')) {
      // Check if URL already has a language code
      if (!url.match(/kabbalahmedia\.info\/[a-z]{2}\//)) {
        // Insert language code after domain
        return url.replace('kabbalahmedia.info/', `kabbalahmedia.info/${language}/`)
      }
    }
    return url
  }

  const generatePartMessage = (part: Part, event: Event) => {
    const eventTitle = getEventTitle(event)
    const eventDate = formatDate(event.date)
    const isPreparation = part.part_number === 0
    const partTitle = isPreparation ? part.title : `${t('part')} ${part.part_number}: ${part.title}`
    const separator = language === 'he' ? '‮━━━━━━━━━━' : '━━━━━━━━━━'
    
    let message = `*${eventTitle}*\n${eventDate}\n\n${separator}\n\n`
    
    message += `*${partTitle}*\n`
    
    if (part.description) {
      message += `${part.description}\n`
    }
    
    if (part.recorded_lesson_date) {
      message += `${t('originalDate')}${formatDateByLanguage(part.recorded_lesson_date, language)}\n`
    }
    
    // Sources
    if (part.sources && part.sources.length > 0) {
      part.sources.forEach(source => {
        const sourceUrl = addLanguageToUrl(source.source_url)
        message += `◆ ${t('readSource')}\n`
        message += `${sourceUrl}\n`
        if (source.page_number) {
          message += `   ${t('page')} ${source.page_number}\n`
        }
        message += `\n`
      })
    }
    
    // Links
    const links: { label: string; url: string }[] = []
    
    if (isPreparation) {
      if (part.reading_before_sleep_link) {
        links.push({ label: t('readingBeforeSleep'), url: addLanguageToUrl(part.reading_before_sleep_link) })
      }
      if (part.lesson_preparation_link) {
        links.push({ label: t('lessonPreparation'), url: addLanguageToUrl(part.lesson_preparation_link) })
      }
    } else {
      if (part.lesson_link) {
        links.push({ label: t('watchLesson'), url: addLanguageToUrl(part.lesson_link) })
      }
      if (part.transcript_link) {
        links.push({ label: t('lessonTranscript'), url: addLanguageToUrl(part.transcript_link) })
      }
      if (part.excerpts_link) {
        links.push({ label: t('selectedExcerpts'), url: addLanguageToUrl(part.excerpts_link) })
      }
      if (part.lineup_for_hosts_link) {
        links.push({ label: t('lineupForHosts'), url: addLanguageToUrl(part.lineup_for_hosts_link) })
      }
    }
    
    // Custom links
    if (part.custom_links && part.custom_links.length > 0) {
      part.custom_links.forEach(link => {
        links.push({ label: link.title, url: addLanguageToUrl(link.url) })
      })
    }
    
    if (links.length > 0) {
      links.forEach(link => {
        message += `◆ ${link.label}\n`
        message += `${link.url}\n\n`
      })
    }
    
    return message
  }

  const generateEventMessage = (event: Event) => {
    const eventTitle = getEventTitle(event)
    const eventDate = formatDate(event.date)
    const separator = language === 'he' ? '‮━━━━━━━━━━' : '━━━━━━━━━━'
    
    let message = `*${eventTitle}*\n${eventDate}\n\n`
    
    // Include all parts information
    if (parts && parts.length > 0) {
      parts.forEach(part => {
        const isPreparation = part.part_number === 0
        const partTitle = isPreparation ? part.title : `${t('part')} ${part.part_number}: ${part.title}`
        
        message += `${separator}\n\n*${partTitle}*\n`
        
        if (part.description) {
          message += `${part.description}\n`
        }
        
        if (part.recorded_lesson_date) {
          message += `${t('originalDate')}${formatDateByLanguage(part.recorded_lesson_date, language)}\n`
        }
        
        // Sources
        if (part.sources && part.sources.length > 0) {
          part.sources.forEach(source => {
            const sourceUrl = addLanguageToUrl(source.source_url)
            message += `◆ ${t('readSource')}\n`
            message += `${sourceUrl}\n`
            if (source.page_number) {
              message += `   ${t('page')} ${source.page_number}\n`
            }
            message += `\n`
          })
        }
        
        // Links
        const links: { label: string; url: string }[] = []
        
        if (isPreparation) {
          if (part.reading_before_sleep_link) {
            links.push({ label: t('readingBeforeSleep'), url: addLanguageToUrl(part.reading_before_sleep_link) })
          }
          if (part.lesson_preparation_link) {
            links.push({ label: t('lessonPreparation'), url: addLanguageToUrl(part.lesson_preparation_link) })
          }
        } else {
          if (part.lesson_link) {
            links.push({ label: t('watchLesson'), url: addLanguageToUrl(part.lesson_link) })
          }
          if (part.transcript_link) {
            links.push({ label: t('lessonTranscript'), url: addLanguageToUrl(part.transcript_link) })
          }
          if (part.excerpts_link) {
            links.push({ label: t('selectedExcerpts'), url: addLanguageToUrl(part.excerpts_link) })
          }
          if (part.lineup_for_hosts_link) {
            links.push({ label: t('lineupForHosts'), url: addLanguageToUrl(part.lineup_for_hosts_link) })
          }
        }
        
        // Custom links
        if (part.custom_links && part.custom_links.length > 0) {
          part.custom_links.forEach(link => {
            links.push({ label: link.title, url: addLanguageToUrl(link.url) })
          })
        }
        
        if (links.length > 0) {
          links.forEach(link => {
            message += `◆ ${link.label}\n`
            message += `${link.url}\n\n`
          })
        }
      })
    }
    
    return message
  }

  const sharePartToWhatsApp = (part: Part, event: Event) => {
    const message = generatePartMessage(part, event)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const sharePartToTelegram = (part: Part, event: Event) => {
    const message = generatePartMessage(part, event)
    const encodedMessage = encodeURIComponent(message)
    const telegramUrl = `https://t.me/share/url?url=&text=${encodedMessage}`
    window.open(telegramUrl, '_blank')
  }

  const copyPartAsText = async (part: Part, event: Event) => {
    try {
      const message = generatePartMessage(part, event)
      await navigator.clipboard.writeText(message)
      setSharedPart(part.id)
      setTimeout(() => setSharedPart(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const localeMap: { [key: string]: string } = {
      he: 'he-IL',
      en: 'en-US',
      ru: 'ru-RU',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      fr: 'fr-FR',
      uk: 'uk-UA',
    }
    return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const getPartColorClasses = (order: number | null | undefined) => {
    if (order === 0) {
      return {
        border: 'border-amber-500',
        bg: 'bg-amber-300/10 dark:bg-amber-900/20',
        bgHover: 'hover:bg-amber-400/20',
        text: 'text-amber-900 dark:text-amber-300',
        icon: 'text-amber-600 dark:text-amber-400',
      }
    }
    
    const colorSchemes = [
      { border: 'border-blue-500', bg: 'bg-blue-300/10 dark:bg-blue-900/20', bgHover: 'hover:bg-blue-400/20', text: 'text-blue-900 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400' },
      { border: 'border-orange-500', bg: 'bg-orange-300/10 dark:bg-orange-900/20', bgHover: 'hover:bg-orange-400/20', text: 'text-orange-900 dark:text-orange-300', icon: 'text-orange-600 dark:text-orange-400' },
      { border: 'border-green-500', bg: 'bg-green-300/10 dark:bg-green-900/20', bgHover: 'hover:bg-green-400/20', text: 'text-green-900 dark:text-green-300', icon: 'text-green-600 dark:text-green-400' },
      { border: 'border-indigo-500', bg: 'bg-indigo-300/10 dark:bg-indigo-900/20', bgHover: 'hover:bg-indigo-400/20', text: 'text-indigo-900 dark:text-indigo-300', icon: 'text-indigo-600 dark:text-indigo-400' },
      { border: 'border-teal-500', bg: 'bg-teal-300/10 dark:bg-teal-900/20', bgHover: 'hover:bg-teal-400/20', text: 'text-teal-900 dark:text-teal-300', icon: 'text-teal-600 dark:text-teal-400' },
      { border: 'border-purple-500', bg: 'bg-purple-300/10 dark:bg-purple-900/20', bgHover: 'hover:bg-purple-400/20', text: 'text-purple-900 dark:text-purple-300', icon: 'text-purple-600 dark:text-purple-400' },
      { border: 'border-pink-500', bg: 'bg-pink-300/10 dark:bg-pink-900/20', bgHover: 'hover:bg-pink-400/20', text: 'text-pink-900 dark:text-pink-300', icon: 'text-pink-600 dark:text-pink-400' },
      { border: 'border-rose-500', bg: 'bg-rose-300/10 dark:bg-rose-900/20', bgHover: 'hover:bg-rose-400/20', text: 'text-rose-900 dark:text-rose-300', icon: 'text-rose-600 dark:text-rose-400' },
    ]
    
    if (order == null) return colorSchemes[0]
    return colorSchemes[(order - 1) % colorSchemes.length]
  }

  const getEventTitle = (event: Event) => {
    return event.titles?.[language as keyof typeof event.titles] || 
           event.titles?.he || 
           `Event ${event.number}`
  }

  const CONVENTION_TYPES = ['convention', 'holiday', 'special_event']

  const getConventionDays = (convention: Event): string[] => {
    const start = new Date(convention.date)
    const end = convention.end_date ? new Date(convention.end_date) : start
    const days: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      days.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }

  const formatConventionDateRange = (convention: Event): string => {
    const startDate = convention.date
    const endDate = convention.end_date
    if (!endDate || endDate.split('T')[0] === startDate.split('T')[0]) {
      return formatDateByLanguage(startDate, language)
    }
    const s = new Date(startDate)
    const e = new Date(endDate)
    const sDay = s.getUTCDate()
    const eDay = e.getUTCDate()
    const sMonth = s.toLocaleDateString(language === 'he' ? 'he-IL' : language, { month: 'long', timeZone: 'UTC' })
    const eMonth = e.toLocaleDateString(language === 'he' ? 'he-IL' : language, { month: 'long', timeZone: 'UTC' })
    const year = e.getUTCFullYear()
    if (sMonth === eMonth) {
      return language === 'he'
        ? `${eDay}-${sDay} ${eMonth} ${year}`
        : `${sDay}–${eDay} ${eMonth} ${year}`
    }
    return language === 'he'
      ? `${eDay} ${eMonth} - ${sDay} ${sMonth} ${year}`
      : `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`
  }

  const getEventTypeBadgeStyle = (typeName: string) => {
    const et = eventTypes.find(t => t.name === typeName)
    const color = et?.color || 'gray'
    const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
      blue:   { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-800 dark:text-blue-200',   dot: 'bg-blue-500' },
      amber:  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', dot: 'bg-amber-500' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', dot: 'bg-indigo-500' },
      green:  { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', dot: 'bg-purple-500' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
      gray:   { bg: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-800 dark:text-gray-200',   dot: 'bg-gray-500' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', dot: 'bg-orange-500' },
      teal:   { bg: 'bg-teal-100 dark:bg-teal-900/40',  text: 'text-teal-800 dark:text-teal-200',   dot: 'bg-teal-500' },
      pink:   { bg: 'bg-pink-100 dark:bg-pink-900/40',  text: 'text-pink-800 dark:text-pink-200',   dot: 'bg-pink-500' },
      red:    { bg: 'bg-red-100 dark:bg-red-900/40',    text: 'text-red-800 dark:text-red-200',     dot: 'bg-red-500' },
    }
    return colorMap[color] || colorMap.gray
  }

  const getEventTypeTitle = (typeName: string) => {
    const et = eventTypes.find(t => t.name === typeName)
    return et?.titles?.[language] || et?.titles?.['en'] || typeName
  }

  const handleEventClick = (event: Event, originConvention?: boolean) => {
    setSelectedEvent(event)
    setParts([])
    setExpandedParts(new Set())
    setFromConvention(originConvention ?? false)
    window.history.pushState(null, '', `/?event=${event.id}`)
    // Note: event detail stays on / regardless of source tab
  }

  const handleConventionClick = (convention: Event) => {
    setSelectedConvention(convention)
    setConventionSessions([])
    setSelectedConventionDay(null)
    fetchConventionSessions(convention.id)
    const fromLessons = activeTab === 'lessons' ? '?from=lessons' : ''
    window.history.pushState(null, '', `/conventions?convention=${convention.id}${fromLessons}`)
  }

  const handleBackToEvents = () => {
    if (fromConvention && selectedConvention) {
      // Go back to convention detail
      setSelectedEvent(null)
      setParts([])
      setExpandedParts(new Set())
      setFromConvention(false)
      window.history.pushState(null, '', '/')
      return
    }
    setSelectedEvent(null)
    setParts([])
    setExpandedParts(new Set())
    setFromConvention(false)
    window.history.pushState(null, '', '/')
  }

  const handleBackToConventions = () => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    setSelectedConvention(null)
    setConventionSessions([])
    setSelectedConventionDay(null)
    if (from === 'lessons') {
      setActiveTab('lessons')
      router.push('/')
    } else {
      router.push('/conventions')
    }
  }

  const isRTL = language === 'he'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="notranslate min-h-screen bg-cyan-50 dark:bg-gray-950 transition-colors"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Content */}
        {selectedEvent ? (
          parts.length === 0 ? (
          <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
            <button
              onClick={handleBackToEvents}
              className="mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
              {t('backToEvents')}
            </button>
            <div className="text-center text-gray-600 dark:text-gray-400">
              {t('noMaterials')}
            </div>
          </div>
        ) : (
          // Parts List
          <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
            <button
              onClick={handleBackToEvents}
              className="mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
              {t('backToEvents')}
            </button>
            
            {/* Event Title Header */}
            <div className="mb-8 bg-blue-50 dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-blue-200 dark:border-gray-700 relative">
              <h2 className="text-blue-900 dark:text-blue-200 mb-3 font-semibold" style={{ fontSize: '20px' }}>
                {getEventTitle(selectedEvent)}
              </h2>
              <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '14px' }}>
                {selectedEvent.date ? formatEventDateDisplay(selectedEvent.date, selectedEvent.start_time, selectedEvent.end_time) : 'Date not available'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenShareDropdown(openShareDropdown === 'event' ? null : 'event')
                }}
                className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} bg-white dark:bg-gray-700 text-green-500 dark:text-green-400 border border-green-500 dark:border-green-600 rounded-full p-2 hover:bg-green-50 dark:hover:bg-gray-600 transition-all flex-shrink-0 z-10`}
                data-share-button
                title={t('share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
              
              {/* Share Dropdown */}
              {openShareDropdown === 'event' && (
                <div data-share-dropdown className={`absolute ${isRTL ? 'left-5' : 'right-5'} top-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-[160px] z-20`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = generateEventMessage(selectedEvent)
                      const encodedMessage = encodeURIComponent(message)
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
                      window.open(whatsappUrl, '_blank')
                      setOpenShareDropdown(null)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span>{t('whatsapp')}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = generateEventMessage(selectedEvent)
                      const encodedMessage = encodeURIComponent(message)
                      const telegramUrl = `https://t.me/share/url?url=&text=${encodedMessage}`
                      window.open(telegramUrl, '_blank')
                      setOpenShareDropdown(null)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                  >
                    <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>{t('telegram')}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = generateEventMessage(selectedEvent)
                      navigator.clipboard.writeText(message)
                      setSharedPart(selectedEvent.id)
                      setTimeout(() => setSharedPart(null), 2000)
                      setOpenShareDropdown(null)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                  >
                    {sharedPart === selectedEvent.id ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <span>{t('copyAsText')}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {parts.map((part) => {
            const colors = getPartColorClasses(part.part_number)
            const isExpanded = expandedParts.has(part.id)
            const isPreparation = part.part_number === 0

            return (
              <div
                key={part.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${isRTL ? 'border-r-4' : 'border-l-4'} ${colors.border} relative mb-6`}
              >
                {/* Part Header */}
                <div className="p-4 flex items-start gap-3">
                  <div className={`flex-1 max-w-[65%] ${isRTL ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} ${colors.border}`}>
                    <h3 className={`${colors.text} font-bold mb-1 flex items-center gap-2 flex-wrap`} style={{ fontSize: '16px' }}>
                      {part.part_number === 0 ? part.title : `${t('part')} ${part.part_number}: ${part.title}`}
                      {part.show_updated_badge && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          {t('updated')}
                        </span>
                      )}
                    </h3>
                    {part.description && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed" style={{ fontSize: '13px' }}>
                        {part.description}
                      </p>
                    )}
                    {part.recorded_lesson_date && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2" style={{ fontSize: '12px' }}>
                        {t('originalDate')} {formatDateByLanguage(part.recorded_lesson_date, language)}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - positioned on the left/right side */}
                  <div className={`flex gap-2 absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePart(part.id)
                      }}
                      className="bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 border border-blue-500 dark:border-blue-600 rounded-full p-2 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenShareDropdown(openShareDropdown === part.id ? null : part.id)
                      }}
                      className="bg-white dark:bg-gray-700 text-green-500 dark:text-green-400 border border-green-500 dark:border-green-600 rounded-full p-2 hover:bg-green-50 dark:hover:bg-gray-600 transition-all flex-shrink-0"
                      data-share-button
                      title={t('share')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    {/* Share Dropdown for Part */}
                    {openShareDropdown === part.id && (
                      <div data-share-dropdown className={`absolute ${isRTL ? 'left-12' : 'right-12'} mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-[160px] z-20`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sharePartToWhatsApp(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                        >
                          <MessageCircle className="w-5 h-5 text-green-600" />
                          <span>{t('whatsapp')}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sharePartToTelegram(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                        >
                          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>{t('telegram')}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyPartAsText(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors dark:text-gray-200"
                        >
                          {sharedPart === part.id ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          )}
                          <span>{t('copyAsText')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Part Content (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-2">
                    {/* Sources */}
                    {part.sources && part.sources.length > 0 && part.sources.map((source, idx) => (
                      <div key={idx} className={`flex flex-col gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 ${colors.text}`}
                            style={{ fontSize: '14px' }}
                          >
                            {t('readSource')}
                            {source.page_number && (
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {` ${t('page')} ${source.page_number}`}
                              </span>
                            )}
                          </a>
                          <button
                            onClick={(e) => copyToClipboard(source.source_url, e)}
                            className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                            title={t('copyLink')}
                          >
                            {copiedUrl === source.source_url ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {(source.start_point || source.end_point) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 ml-6 space-y-1">
                            {source.start_point && (
                              <div><strong>{t('startPoint')}</strong> {source.start_point}</div>
                            )}
                            {source.end_point && (
                              <div><strong>{t('endPoint')}</strong> {source.end_point}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Preparation Links */}
                    {isPreparation && part.reading_before_sleep_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <Shield className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.reading_before_sleep_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('readingBeforeSleep')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.reading_before_sleep_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.reading_before_sleep_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {isPreparation && part.lesson_preparation_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.lesson_preparation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('lessonPreparation')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_preparation_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.lesson_preparation_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lesson Link */}
                    {part.lesson_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <Video className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.lesson_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('watchLesson')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.lesson_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Transcript Link */}
                    {part.transcript_link && (
                      <div className={`flex flex-col gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                          <a
                            href={part.transcript_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 ${colors.text}`}
                            style={{ fontSize: '14px' }}
                          >
                            {t('lessonTranscript')}
                          </a>
                          <button
                            onClick={(e) => copyToClipboard(part.transcript_link!, e)}
                            className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                          >
                            {copiedUrl === part.transcript_link ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {(part.transcript_start_point || part.transcript_end_point) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 ml-6 space-y-1">
                            {part.transcript_start_point && <div><strong>{t('startPoint')}</strong> {part.transcript_start_point}</div>}
                            {part.transcript_end_point && <div><strong>{t('endPoint')}</strong> {part.transcript_end_point}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Excerpts Link */}
                    {part.excerpts_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <BookOpen className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.excerpts_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('selectedExcerpts')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.excerpts_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.excerpts_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lineup for Hosts Link */}
                    {part.lineup_for_hosts_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.lineup_for_hosts_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('lineupForHosts')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lineup_for_hosts_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.lineup_for_hosts_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Custom Links */}
                    {part.custom_links && part.custom_links.length > 0 && part.custom_links.map((link, idx) => (
                      <div key={idx} className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {link.title}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(link.url, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === link.url ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
            </div>
          </div>
          )
        ) : selectedConvention ? (
          // Convention Detail View
          <div>
            {/* Back button */}
            <div className="flex justify-start mb-4">
              <button
                onClick={handleBackToConventions}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
                style={{ fontSize: '14px' }}
              >
                <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
                {t('backToConventions')}
              </button>
            </div>

            {/* Convention Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {(() => {
                  const style = getEventTypeBadgeStyle(selectedConvention.type)
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                      {getEventTypeTitle(selectedConvention.type)}
                    </span>
                  )
                })()}
              </div>
              <h2 className="text-blue-900 dark:text-blue-200 font-bold mb-3" style={{ fontSize: '22px' }}>
                {getEventTitle(selectedConvention)}
              </h2>
              <div className="flex items-center gap-5 text-gray-600 dark:text-gray-400 flex-wrap" style={{ fontSize: '14px' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatConventionDateRange(selectedConvention)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getConventionDays(selectedConvention).length} {t('days')}</span>
                </div>
              </div>
            </div>

            {/* Day Navigation Tabs */}
            {getConventionDays(selectedConvention).length > 1 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap justify-start">
                {getConventionDays(selectedConvention).map((dayStr, idx) => {
                  const dayDate = new Date(dayStr + 'T00:00:00Z')
                  const monthName = dayDate.toLocaleDateString(language === 'he' ? 'he-IL' : language, { month: 'short', timeZone: 'UTC' })
                  const dayNum = dayDate.getUTCDate()
                  const isSelected = selectedConventionDay === dayStr
                  return (
                    <button
                      key={dayStr}
                      onClick={() => setSelectedConventionDay(dayStr)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {t('day')} {idx + 1} · {dayNum} {monthName}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Sessions for Selected Day */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {conventionSessions.filter(s => {
                const sDay = s.date.split('T')[0]
                return sDay === (selectedConventionDay || getConventionDays(selectedConvention)[0])
              }).length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10" style={{ fontSize: '14px' }}>
                  {t('noEvents')}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {conventionSessions
                    .filter(s => {
                      const sDay = s.date.split('T')[0]
                      return sDay === (selectedConventionDay || getConventionDays(selectedConvention)[0])
                    })
                    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                    .map((session) => {
                      const timeStr = session.start_time
                        ? session.start_time.replace(/^0/, '') + (session.end_time ? ` – ${session.end_time.replace(/^0/, '')}` : '')
                        : null
                      return (
                        <button
                          key={session.id}
                          onClick={() => handleEventClick(session, true)}
                          className={`w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          <div className="flex-1 flex items-center gap-3">
                            {timeStr && (
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0" style={{ fontSize: '13px' }}>
                                {session.end_time ? formatTimeRange(session.start_time!, session.end_time) : session.start_time!.replace(/^0/, '')}
                              </span>
                            )}
                            {timeStr && <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>}
                            <span className="text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium" style={{ fontSize: '15px' }}>
                              {getEventTitle(session)}
                            </span>
                          </div>
                          {isRTL
                            ? <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ms-3" />
                            : <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 rotate-180 ms-3" />
                          }
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // List View with Tabs
          <div>
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-200 mb-2">
                {t('studyMaterials')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '15px' }}>
                {t('studyMaterialsDescription')}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className={`flex border-b border-gray-200 dark:border-gray-700 mb-6`}>
              {(['lessons', 'conventions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                    router.push(tab === 'lessons' ? '/' : '/conventions')
                  }}
                  className={`flex items-center gap-2 px-5 py-3 font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-700 text-blue-900 dark:text-blue-200'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  style={{ fontSize: '16px' }}
                >
                  {tab === 'conventions' ? (
                    <><Calendar className="w-4 h-4" />{t('conventionsTab')}</>
                  ) : (
                    <><BookOpen className="w-4 h-4" />{t('lessonsTab')}</>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'conventions' ? (
              // Conventions Tab
              <div>
                {(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const isUpcoming = (c: Event) => {
                    const end = new Date((c.end_date || c.date).split('T')[0] + 'T23:59:59Z')
                    return end >= today
                  }
                  const upcomingList = conventions.filter(isUpcoming).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  const pastList = conventions.filter(c => !isUpcoming(c)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  const filteredConventions = conventionFilter === 'upcoming' ? upcomingList : conventionFilter === 'past' ? pastList : [...upcomingList, ...pastList]

                  return (
                    <>
                      {/* Time filter pills */}
                      <div className="flex gap-2 mb-5 flex-wrap">
                        {([['upcoming', upcomingList.length], ['past', pastList.length], ['all', conventions.length]] as const).map(([filter, count]) => (
                          <button
                            key={filter}
                            onClick={() => setConventionFilter(filter)}
                            className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                              conventionFilter === filter
                                ? 'bg-blue-800 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                            style={{ fontSize: '14px' }}
                          >
                            {filter === 'upcoming' ? t('upcoming') : filter === 'past' ? t('past') : t('all')}
                            <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${conventionFilter === filter ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                              {count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Convention Cards */}
                      {conventionsLoading ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">{t('noEvents')}</div>
                      ) : filteredConventions.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">{t('noEvents')}</div>
                      ) : (
                        <div className="space-y-3">
                          {filteredConventions.map((convention) => {
                            const style = getEventTypeBadgeStyle(convention.type)
                            const days = getConventionDays(convention)
                            const daysCount = days.length
                            const startD = new Date(convention.date.split('T')[0] + 'T00:00:00Z')
                            const endD = convention.end_date ? new Date(convention.end_date.split('T')[0] + 'T00:00:00Z') : startD
                            const now = new Date()
                            now.setHours(0, 0, 0, 0)
                            const isToday = startD <= now && endD >= now
                            const daysUntilStart = Math.ceil((startD.getTime() - now.getTime()) / 86400000)
                            const monthName = startD.toLocaleDateString(language === 'he' ? 'he-IL' : language, { month: 'short', timeZone: 'UTC' })
                            const startDay = startD.getUTCDate()
                            const endDay = endD.getUTCDate()
                            const year = startD.getUTCFullYear()
                            const dayDisplay = daysCount > 1 ? (language === 'he' ? `${endDay}-${startDay}` : `${startDay}-${endDay}`) : `${startDay}`

                            return (
                              <div key={convention.id} onClick={() => handleConventionClick(convention)} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex items-stretch cursor-pointer hover:shadow-lg transition-shadow">
                                {/* Date column */}
                                <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-3 gap-0.5 ${style.bg}`}>
                                  <span className={`text-xs font-medium ${style.text}`}>{monthName}</span>
                                  <span className={`font-bold leading-none ${style.text}`} style={{ fontSize: daysCount > 1 ? '20px' : '28px' }}>{dayDisplay}</span>
                                  <span className={`text-xs ${style.text}`}>{year}</span>
                                </div>

                                {/* Main content */}
                                <div className="flex-1 p-4">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                                      {getEventTypeTitle(convention.type)}
                                    </span>
                                    {isToday && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                        {t('todayBadge')}
                                      </span>
                                    )}
                                    {!isToday && daysUntilStart > 0 && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                        {language === 'he' ? `בעוד ${daysUntilStart} ${t('days')}` : `${t('days').replace('days', '')}${daysUntilStart} ${t('days')}`}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-blue-900 dark:text-blue-200 font-semibold mb-2 leading-snug" style={{ fontSize: '16px' }}>
                                    {getEventTitle(convention)}
                                  </h3>
                                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 flex-wrap" style={{ fontSize: '13px' }}>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{formatConventionDateRange(convention)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{daysCount} {t('days')}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 p-3 justify-center flex-shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleConventionClick(convention) }}
                                    className={`px-3 py-2 rounded-lg text-white font-medium text-xs flex items-center gap-1 ${style.dot.replace('bg-', 'bg-')} hover:opacity-90 transition-opacity`}
                                    style={{ backgroundColor: style.dot.includes('purple') ? '#7c3aed' : style.dot.includes('teal') ? '#0d9488' : style.dot.includes('orange') ? '#ea580c' : '#2563eb' }}
                                  >
                                    {t('toStudyMaterials')}
                                    <ChevronLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                                  </button>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 font-medium text-xs border border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 transition-colors flex items-center gap-1"
                                  >
                                    {t('addToCalendar')}
                                    <span>+</span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            ) : (
              // Daily Lessons Tab
              <div>
                {/* Filters */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      hasActiveFilters
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                    style={{ fontSize: '14px' }}
                  >
                    <Filter className="w-4 h-4" />
                    <span>{t('filterByDate')}</span>
                    {hasActiveFilters && (
                      <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center" style={{ fontSize: '11px' }}>
                        1
                      </span>
                    )}
                  </button>

                  {showFilters && (
                    <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2" style={{ fontSize: '13px' }}>
                            {t('fromDate')}
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2" style={{ fontSize: '13px' }}>
                            {t('toDate')}
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '13px' }}>
                            {events.length} {t('eventsFound')}
                          </span>
                          <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                            style={{ fontSize: '13px' }}
                          >
                            <X className="w-4 h-4" />
                            <span>{t('clearFilters')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Events List Grouped by Date */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-gray-600 dark:text-gray-400 py-12">Loading...</div>
                  ) : events.length === 0 ? (
                    <div className="text-center text-gray-600 dark:text-gray-400 py-12">
                      {t('noEvents')}
                    </div>
                  ) : (
                    groupEventsByDate(events, language === 'he' ? 'he-IL' : language).map((dateGroup) => {
                      const colors = getDateGroupColorClasses(dateGroup.dayIndex)
                      const groupDate = new Date(dateGroup.date + 'T00:00:00Z')
                      const activeConventions = conventions.filter(c => {
                        const start = new Date(c.date.split('T')[0] + 'T00:00:00Z')
                        const end = c.end_date ? new Date(c.end_date.split('T')[0] + 'T00:00:00Z') : start
                        return groupDate >= start && groupDate <= end
                      })
                      return (
                        <div
                          key={dateGroup.date}
                          className={`rounded-xl shadow-md bg-white dark:bg-gray-800 overflow-hidden ${isRTL ? 'border-r-4' : 'border-l-4'} ${isRTL ? colors.border : colors.borderLTR}`}
                        >
                          <div
                            className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                            style={activeConventions.length > 0 ? (() => {
                              const c = activeConventions[0]
                              const isHoliday = c.type === 'holiday'
                              const s = getEventTypeBadgeStyle(c.type)
                              const accent = isDark
                                ? (c.type === 'holiday' ? '#fbbf24' : c.type === 'special_event' ? '#2dd4bf' : '#a78bfa')
                                : (c.type === 'holiday' ? '#f59e0b' : c.type === 'special_event' ? '#0d9488' : '#7c3aed')
                              if (isHoliday) {
                                return isDark
                                  ? { background: 'linear-gradient(90deg, #78350f40, #92400e28, #78350f15)' }
                                  : { background: 'linear-gradient(90deg, #fef3c740, #fde68a50, #fef9c320)' }
                              }
                              const dir = isRTL ? '270deg' : '90deg'
                              return { background: `linear-gradient(${dir}, ${accent}30, ${accent}12)` }
                            })() : undefined}
                          >
                            <div className="flex items-center gap-2 flex-wrap" style={{ color: isDark ? '#d1d5db' : '#646464' }}>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" style={{ color: 'inherit' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                  {dateGroup.dayOfWeek} | {dateGroup.displayDate}
                                </h3>
                              </div>
                              {activeConventions.map(c => {
                                const cStart = new Date(c.date.split('T')[0] + 'T00:00:00Z')
                                const dayNum = Math.floor((groupDate.getTime() - cStart.getTime()) / 86400000) + 1
                                const typeClass = c.type === 'holiday'
                                  ? (isDark ? 'bg-amber-900/50 text-amber-200' : 'bg-amber-100 text-amber-800')
                                  : c.type === 'convention'
                                  ? (isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-800')
                                  : (isDark ? 'bg-teal-900/50 text-teal-200' : 'bg-teal-100 text-teal-800')
                                const cStyle = getEventTypeBadgeStyle(c.type)
                                return (
                                  <span key={c.id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeClass}`}>
                                    {c.type !== 'holiday' && <span className={`w-1.5 h-1.5 rounded-full ${cStyle.dot}`} />}
                                    {getEventTitle(c)} · {t('day')} {dayNum}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(() => {
                              const CONVENTION_TYPES = ['convention', 'holiday', 'special_event']
                              const childrenMap: Record<string, Event[]> = {}
                              const topLevel: Event[] = []
                              const topLevelIds = new Set(dateGroup.events.filter(ev => !ev.parent_event_id).map(ev => ev.id))
                              for (const ev of dateGroup.events) {
                                if (ev.parent_event_id && topLevelIds.has(ev.parent_event_id)) {
                                  if (!childrenMap[ev.parent_event_id]) childrenMap[ev.parent_event_id] = []
                                  childrenMap[ev.parent_event_id].push(ev)
                                } else {
                                  topLevel.push(ev)
                                }
                              }
                              const getAccentColor = (ev: Event) => {
                                const s = getEventTypeBadgeStyle(ev.type)
                                if (isDark) {
                                  return s.dot.includes('purple') ? '#a78bfa' : s.dot.includes('teal') ? '#2dd4bf' : s.dot.includes('orange') ? '#fb923c' : '#60a5fa'
                                }
                                return s.dot.includes('purple') ? '#7c3aed' : s.dot.includes('teal') ? '#0d9488' : s.dot.includes('orange') ? '#ea580c' : '#2563eb'
                              }
                              const renderEventRow = (event: Event, isChild = false, parentEvent?: Event) => {
                                const isConventionType = CONVENTION_TYPES.includes(event.type)
                                const evStyle = isConventionType ? getEventTypeBadgeStyle(event.type) : null
                                const accentColor = getAccentColor(event)
                                const parentAccent = parentEvent ? getAccentColor(parentEvent) : (isDark ? '#a78bfa' : '#7c3aed')

                                if (isConventionType && !isChild) {
                                  return (
                                    <button
                                      key={event.id}
                                      onClick={() => handleConventionClick(event)}
                                      className={`w-full p-4 transition-colors group flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'}`}
                                      style={{ background: `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${accentColor}22, ${accentColor}0a)` }}
                                    >
                                      {isRTL ? (
                                        <>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="font-semibold text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" style={{ fontSize: '16px' }}>
                                                {getEventTitle(event)}
                                              </span>
                                              {evStyle && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${evStyle.bg} ${evStyle.text}`}>
                                                  {getEventTypeTitle(event.type)}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: '13px', color: accentColor }}>
                                              <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatConventionDateRange(event)}</span>
                                              </div>
                                              {event.start_time && event.end_time && (
                                                <div className="flex items-center gap-1">
                                                  <Clock className="w-3.5 h-3.5" />
                                                  <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 ms-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                                            <ChevronLeft className="w-4 h-4" style={{ color: accentColor }} />
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              {evStyle && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${evStyle.bg} ${evStyle.text}`}>
                                                  {getEventTypeTitle(event.type)}
                                                </span>
                                              )}
                                              <span className="font-semibold text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" style={{ fontSize: '16px' }}>
                                                {getEventTitle(event)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: '13px', color: accentColor }}>
                                              <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatConventionDateRange(event)}</span>
                                              </div>
                                              {event.start_time && event.end_time && (
                                                <div className="flex items-center gap-1">
                                                  <Clock className="w-3.5 h-3.5" />
                                                  <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 ms-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                                            <ChevronLeft className="w-4 h-4 rotate-180" style={{ color: accentColor }} />
                                          </div>
                                        </>
                                      )}
                                    </button>
                                  )
                                }

                                return (
                                  <button
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className={`w-full transition-colors group flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'} ${isChild ? (isRTL ? 'pr-10 pl-4 py-3' : 'pl-10 pr-4 py-3') : 'p-4 hover:bg-blue-100 dark:hover:bg-gray-700'}`}
                                    style={isChild ? { borderInlineEnd: `3px solid ${parentAccent}40`, background: `${parentAccent}06` } : undefined}
                                  >
                                    {isRTL ? (
                                      <>
                                        <div className="flex-1 text-right">
                                          <h4 className={`text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors mb-1 ${isChild ? 'font-normal' : ''}`} style={{ fontSize: isChild ? '14px' : '16px' }}>
                                            {getEventTitle(event)}
                                          </h4>
                                          {event.start_time && event.end_time && (
                                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>
                                              <Clock className="w-3.5 h-3.5" />
                                              <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                            </div>
                                          )}
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-[-4px] transition-all flex-shrink-0" />
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex-1 text-left">
                                          <h4 className={`text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors mb-1 ${isChild ? 'font-normal' : ''}`} style={{ fontSize: isChild ? '14px' : '16px' }}>
                                            {getEventTitle(event)}
                                          </h4>
                                          {event.start_time && event.end_time && (
                                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>
                                              <Clock className="w-3.5 h-3.5" />
                                              <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                            </div>
                                          )}
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 rotate-180" />
                                      </>
                                    )}
                                  </button>
                                )
                              }
                              return topLevel.flatMap(event => [
                                renderEventRow(event),
                                ...(childrenMap[event.id] || []).map(child => renderEventRow(child, true, event)),
                              ])
                            })()}
                          </div>
                        </div>
                      )
                    })
                  )}

                  {/* Load More Button */}
                  {events.length > 0 && events.length < totalEvents && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMore}
                        className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow-md font-semibold"
                        style={{ fontSize: '14px' }}
                      >
                        {t('loadMore')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
    </div>
  )
}
