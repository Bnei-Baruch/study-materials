'use client'

import { useState } from 'react'
import { getApiUrl } from '@/lib/api'
import { SourceSearch } from './SourceSearch'

interface Source {
  source_id: string
  source_title: string
  source_url: string
  page_number?: string
}

interface PartFormProps {
  eventId: string
  eventDate: string
  existingParts: Array<{ order: number }> // To calculate next order
  onPartCreated: () => void
  onCancel?: () => void
}

export default function PartForm({ eventId, eventDate, existingParts, onPartCreated, onCancel }: PartFormProps) {
  // Preparation translations
  const preparationTitles: { [key: string]: string } = {
    he: 'הכנה לשיעור',
    en: 'Preparation to lesson',
    ru: 'Подготовка к уроку',
    es: 'Preparación para la lección',
    de: 'Vorbereitung zum Unterricht',
    it: 'Preparazione alla lezione',
    fr: 'Préparation à la leçon',
    uk: 'Підготовка до уроку',
  }

  // Pre-made title templates with translations
  const titleTemplates = [
    {
      id: 'recorded',
      translations: {
        he: 'שיעור מוקלט',
        en: 'Recorded Lesson',
        ru: 'Урок в записи',
        es: 'Lección grabada',
        de: 'Aufgezeichnete Lektion',
        it: 'Lezione registrata',
        fr: 'Leçon enregistrée',
        uk: 'Записаний урок',
      }
    },
    {
      id: 'live',
      translations: {
        he: 'שיעור חי בהשתתפות הרב',
        en: 'Live Broadcast With Rav',
        ru: 'Прямая трансляция с участием Рава',
        es: 'Transmisión en vivo con Rav',
        de: 'Live-Übertragung mit Rav',
        it: 'Trasmissione in diretta con Rav',
        fr: 'Diffusion en direct avec Rav',
        uk: 'Пряма трансляція з Равом',
      }
    },
    {
      id: 'tes',
      translations: {
        he: 'שיעור תע"ס עם הרב"ש',
        en: 'TES Lesson With RABASH',
        ru: 'Урок ТЭС с Рабашем',
        es: 'Lección TES con RABASH',
        de: 'TES-Lektion mit RABASH',
        it: 'Lezione TES con RABASH',
        fr: 'Leçon TES avec RABASH',
        uk: 'Урок ТЕС з РАБАШем',
      }
    },
    {
      id: 'zohar',
      translations: {
        he: 'קוראים בזוהר',
        en: 'Zohar Reading',
        ru: 'Читаем Зоар',
        es: 'Lectura del Zohar',
        de: 'Sohar-Lesung',
        it: 'Lettura dello Zohar',
        fr: 'Lecture du Zohar',
        uk: 'Читаємо Зоар',
      }
    },
    {
      id: 'society',
      translations: {
        he: 'בונים חברה רוחנית',
        en: 'Building a Spiritual Society',
        ru: 'Строим духовное общество',
        es: 'Construyendo una sociedad espiritual',
        de: 'Wir bauen eine spirituelle Gesellschaft',
        it: 'Costruiamo una società spirituale',
        fr: 'Construire une société spirituelle',
        uk: 'Будуємо духовне суспільство',
      }
    },
    {
      id: 'conversations',
      translations: {
        he: 'שיחות על הדרך',
        en: 'Conversations on the Way',
        ru: 'Беседы в пути',
        es: 'Conversaciones en el camino',
        de: 'Gespräche unterwegs',
        it: 'Conversazioni lungo la strada',
        fr: 'Conversations en chemin',
        uk: 'Бесіди на шляху',
      }
    },
    {
      id: 'studying_friends',
      translations: {
        he: 'לימוד בין חברים',
        en: 'Studying with Friends',
        ru: 'Учеба в кругу друзей',
        es: 'Estudio entre amigos',
        de: 'Lernen mit Freunden',
        it: 'Studio tra amici',
        fr: 'Étudier avec des amis',
        uk: 'Навчання з друзями',
      }
    },
  ]

  // Calculate next order number based on existing parts
  const calculateInitialOrder = () => {
    if (existingParts.length === 0) {
      return 0 // Start with preparation if no parts
    }
    const maxOrder = Math.max(...existingParts.map(p => p.order))
    return maxOrder + 1 // Next order after the highest existing
  }

  const [partType, setPartType] = useState('live_lesson')
  const [language, setLanguage] = useState('he')
  const [order, setOrder] = useState<number | ''>('') // Start blank
  const [title, setTitle] = useState('') // Start blank
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('') // Track selected template
  const [sources, setSources] = useState<Source[]>([])
  const [excerptsLink, setExcerptsLink] = useState('')
  const [transcriptLink, setTranscriptLink] = useState('')
  const [lessonLink, setLessonLink] = useState('')
  const [programLink, setProgramLink] = useState('')
  const [customLinks, setCustomLinks] = useState<Array<{ title: string; url: string }>>([])

  const [readingBeforeSleepLink, setReadingBeforeSleepLink] = useState('') // Start blank
  const [lessonPreparationLink, setLessonPreparationLink] = useState('') // Start blank
  const [recordedLessonDate, setRecordedLessonDate] = useState('') // Date the recorded lesson was given
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = titleTemplates.find(t => t.id === templateId)
    if (template) {
      setTitle(template.translations[language as keyof typeof template.translations] || template.translations.en)
      setSelectedTemplate(templateId) // Remember which template was selected
    }
  }

  // Auto-update title and links when order is 0 (preparation)
  const handleOrderChange = (newOrder: number | '') => {
    setOrder(newOrder)
    if (newOrder === 0) {
      setTitle(preparationTitles[language] || 'Preparation to lesson')
      // Auto-fill preparation links
      setReadingBeforeSleepLink('https://goo.gl/zCBDD4')
      setLessonPreparationLink('https://docs.google.com/document/d/1uHtE1U7sgWCumeWUc5jyE2dfECqj09DZgaPQys-jbzs/edit')
    } else {
      // Clear title if it was a preparation title
      if (order === 0 && Object.values(preparationTitles).includes(title)) {
        setTitle('')
      }
      // Clear preparation links when switching to regular part
      setReadingBeforeSleepLink('')
      setLessonPreparationLink('')
    }
  }

  // Auto-update title when language changes and order is 0
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    if (order === 0) {
      setTitle(preparationTitles[newLanguage] || 'Preparation to lesson')
    }
  }

  const handleAddSource = async (source: Source) => {
    // Fetch the source title in the current language
    try {
      const response = await fetch(
        `${getApiUrl(`/sources/title?id=${source.source_id}&language=${language}`)}`
      )
      if (response.ok) {
        const data = await response.json()
        // Use the language-specific title and language-free URL
        setSources([...sources, {
          source_id: data.id,
          source_title: data.title,
          source_url: data.url,
        }])
      } else {
        // Fallback to the original source if fetch fails
        setSources([...sources, source])
      }
    } catch (err) {
      console.error('Failed to fetch source title:', err)
      // Fallback to the original source
      setSources([...sources, source])
    }
  }

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  const handleUpdatePageNumber = (index: number, pageNumber: string) => {
    const updated = [...sources]
    updated[index] = { ...updated[index], page_number: pageNumber }
    setSources(updated)
  }

  const handleUpdateSourceUrl = (index: number, url: string) => {
    const updated = [...sources]
    updated[index] = { ...updated[index], source_url: url }
    setSources(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (order === '') {
      setError('Please select a part number')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Format date as YYYY-MM-DD (extract only date part from ISO string)
      const dateOnly = new Date(eventDate).toISOString().split('T')[0]
      
      const response = await fetch(getApiUrl('/parts'),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          date: dateOnly,
          part_type: partType,
          language,
          event_id: eventId,
          order: order,
          template_id: selectedTemplate || undefined, // Send template ID if one was selected
          sources: order === 0 ? [] : sources, // No sources for prep parts
          // Preparation part links (only if order is 0)
          reading_before_sleep_link: order === 0 ? readingBeforeSleepLink : undefined,
          lesson_preparation_link: order === 0 ? lessonPreparationLink : undefined,
          // Regular part links (only if order is NOT 0)
          excerpts_link: order !== 0 ? excerptsLink || undefined : undefined,
          transcript_link: order !== 0 ? transcriptLink || undefined : undefined,
          lesson_link: order !== 0 ? lessonLink || undefined : undefined,
          program_link: order !== 0 ? programLink || undefined : undefined,
          // Custom links (language-specific)
          custom_links: order !== 0 ? customLinks.filter(link => link.title && link.url) : undefined,
          // Recorded lesson date (if provided)
          recorded_lesson_date: recordedLessonDate || undefined,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to create part')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setPartType('live_lesson')
      setLanguage('he')
      setOrder('') // Reset to blank
      setSelectedTemplate('') // Clear template selection
      setSources([])
      setExcerptsLink('')
      setTranscriptLink('')
      setLessonLink('')
      setProgramLink('')
      setCustomLinks([])
      setReadingBeforeSleepLink('')
      setLessonPreparationLink('')
      setRecordedLessonDate('')
      setShowOptionalFields(false)

      // Notify parent
      onPartCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Part Number, Type, and Language - MOVED TO TOP */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
            Part Number *
          </label>
          <select
            id="order"
            value={order}
            onChange={(e) => handleOrderChange(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="">-- Select Part Number --</option>
            <option value={0}>0 - Preparation</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
            <option value={9}>9</option>
            <option value={10}>10</option>
          </select>
        </div>

        <div>
          <label htmlFor="partType" className="block text-sm font-medium text-gray-700 mb-2">
            Part Type
          </label>
          <select
            id="partType"
            value={partType}
            onChange={(e) => setPartType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="live_lesson">Live Lesson</option>
            <option value="recorded_lesson">Recorded Lesson</option>
          </select>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="he">Hebrew (he)</option>
            <option value="en">English (en)</option>
            <option value="ru">Russian (ru)</option>
            <option value="uk">Ukrainian (uk)</option>
            <option value="es">Spanish (es)</option>
            <option value="de">German (de)</option>
            <option value="it">Italian (it)</option>
            <option value="fr">French (fr)</option>
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title * {order === 0 && <span className="text-gray-500 text-xs">(auto-filled for preparation)</span>}
        </label>
        
        {/* Template Tags */}
        {order !== 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Quick templates:</p>
            <div className="flex flex-wrap gap-2">
              {titleTemplates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full transition font-medium"
                >
                  {template.translations[language as keyof typeof template.translations] || template.translations.en}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="e.g., Shamati #1 - There Is None Else Besides Him"
          readOnly={order === 0}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
          placeholder="Brief description of the lesson part..."
        />
      </div>

      {/* Conditional Layout: Preparation vs Regular Part */}
      {order === 0 ? (
        // PREPARATION LAYOUT
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="font-semibold text-purple-800">Preparation Part</h3>
          </div>
          
          <div>
            <label htmlFor="readingBeforeSleepLink" className="block text-sm font-medium text-gray-700 mb-2">
              📖 Reading before Sleep Link <span className="text-gray-500 text-xs">(auto-filled)</span>
            </label>
            <input
              id="readingBeforeSleepLink"
              type="url"
              value={readingBeforeSleepLink}
              onChange={(e) => setReadingBeforeSleepLink(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="https://goo.gl/zCBDD4"
            />
          </div>

          <div>
            <label htmlFor="lessonPreparationLink" className="block text-sm font-medium text-gray-700 mb-2">
              📝 Lesson Preparation Link <span className="text-gray-500 text-xs">(auto-filled)</span>
            </label>
            <input
              id="lessonPreparationLink"
              type="url"
              value={lessonPreparationLink}
              onChange={(e) => setLessonPreparationLink(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="https://docs.google.com/document/d/1uHtE1U7sgWCumeWUc5jyE2dfECqj09DZgaPQys-jbzs/edit"
            />
          </div>
        </div>
      ) : (
        // REGULAR PART LAYOUT
        <>
          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sources
            </label>
            <SourceSearch onSelect={handleAddSource} />

            {sources.length > 0 && (
              <div className="mt-4 space-y-2">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{source.source_title}</div>
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={source.page_number || ''}
                          onChange={(e) => handleUpdatePageNumber(index, e.target.value)}
                          placeholder="Page number (optional, e.g., 42 or 15-17)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="url"
                          value={source.source_url || ''}
                          onChange={(e) => handleUpdateSourceUrl(index, e.target.value)}
                          placeholder="Source link (editable)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recorded Lesson Date - only shown when "Recorded lesson" template is selected */}
          {selectedTemplate === 'recorded' && (
            <div>
              <label htmlFor="recordedLessonDate" className="block text-sm font-medium text-gray-700 mb-2">
                Recorded Lesson Date <span className="text-gray-500 text-xs">(required for recorded lessons)</span>
              </label>
              <input
                id="recordedLessonDate"
                type="date"
                value={recordedLessonDate}
                onChange={(e) => setRecordedLessonDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the date this lesson was originally recorded. This will be copied to all translations.
              </p>
            </div>
          )}

          {/* Optional Links Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showOptionalFields ? '− Hide' : '+ Add'} Optional Links
            </button>
          </div>

          {showOptionalFields && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="excerptsLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpts Link
                </label>
                <input
                  id="excerptsLink"
                  type="url"
                  value={excerptsLink}
                  onChange={(e) => setExcerptsLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="transcriptLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Transcript Link
                </label>
                <input
                  id="transcriptLink"
                  type="url"
                  value={transcriptLink}
                  onChange={(e) => setTranscriptLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="lessonLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Link (Kabbalahmedia)
                </label>
                <input
                  id="lessonLink"
                  type="url"
                  value={lessonLink}
                  onChange={(e) => setLessonLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="https://kabbalahmedia.info/..."
                />
              </div>

              <div>
                <label htmlFor="programLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Program Link
                </label>
                <input
                  id="programLink"
                  type="url"
                  value={programLink}
                  onChange={(e) => setProgramLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="https://..."
                />
              </div>

              {/* Custom Links (Language-Specific) */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Links (Language-Specific)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                These links will only be added to this language version
              </p>
              
              {customLinks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {customLinks.map((link, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-gray-300 relative">
                      <button
                        type="button"
                        onClick={() => setCustomLinks(customLinks.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                        title="Remove custom link"
                      >
                        ✕
                      </button>
                      <div className="grid grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Title:</label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => {
                              const updated = [...customLinks]
                              updated[idx] = { ...updated[idx], title: e.target.value }
                              setCustomLinks(updated)
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Link title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">URL:</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...customLinks]
                              updated[idx] = { ...updated[idx], url: e.target.value }
                              setCustomLinks(updated)
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setCustomLinks([...customLinks, { title: '', url: '' }])}
                className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                + Add Custom Link
              </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Part'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}


