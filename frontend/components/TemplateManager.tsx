'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, Check, X } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface TemplateDefinition {
  id: string
  translations: { [key: string]: string }
  visible: boolean
}

interface TemplateConfig {
  languages: string[]
  preparation: { [key: string]: string }
  templates: TemplateDefinition[]
}

const LANGUAGE_NAMES: { [key: string]: string } = {
  he: '🇮🇱 Hebrew',
  en: '🇬🇧 English',
  ru: '🇷🇺 Russian',
  uk: '🇺🇦 Ukrainian',
  es: '🇪🇸 Spanish',
  de: '🇩🇪 German',
  it: '🇮🇹 Italian',
  fr: '🇫🇷 French',
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState<TemplateDefinition>({
    id: '',
    translations: {},
    visible: true,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(getApiUrl('/templates'))
      if (!res.ok) throw new Error('Failed to fetch templates')
      const config: TemplateConfig = await res.json()
      setTemplates(config.templates)
      setLanguages(config.languages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (template: TemplateDefinition) => {
    setEditingId(template.id)
    setEditingTemplate({ ...template })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTemplate(null)
  }

  const saveTemplate = async () => {
    if (!editingTemplate) return

    try {
      const res = await fetch(getApiUrl(`/templates/${editingTemplate.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translations: editingTemplate.translations,
          visible: editingTemplate.visible,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to save template')
      }

      await fetchTemplates()
      setEditingId(null)
      setEditingTemplate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/templates/${id}`), {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete template')

      await fetchTemplates()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const createTemplate = async () => {
    if (!newTemplate.id.trim()) {
      setError('Template ID is required')
      return
    }

    // Validate all languages have translations
    for (const lang of languages) {
      if (!newTemplate.translations[lang] || !newTemplate.translations[lang].trim()) {
        setError(`Translation missing for ${lang}`)
        return
      }
    }

    try {
      const res = await fetch(getApiUrl('/templates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to create template')
      }

      await fetchTemplates()
      setShowNewForm(false)
      setNewTemplate({
        id: '',
        translations: {},
        visible: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading templates...</div>
  }

  return (
    <div className="notranslate p-6 bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Manage Templates</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={() => setShowNewForm(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Template
        </button>
      </div>

      {/* New Template Form */}
      {showNewForm && (
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">Create New Template</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Template ID</label>
            <input
              type="text"
              value={newTemplate.id}
              onChange={(e) => setNewTemplate({ ...newTemplate, id: e.target.value })}
              placeholder="e.g., workshop"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={newTemplate.visible}
              onChange={(e) => setNewTemplate({ ...newTemplate, visible: e.target.checked })}
              id="new-visible"
            />
            <label htmlFor="new-visible" className="cursor-pointer">
              Show in part creation form
            </label>
          </div>

          {languages.map((lang) => (
            <div key={lang} className="mb-3">
              <label className="block text-sm font-medium mb-1">
                {LANGUAGE_NAMES[lang] || lang}
              </label>
              <input
                type="text"
                value={newTemplate.translations[lang] || ''}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    translations: { ...newTemplate.translations, [lang]: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="flex gap-2 mt-6">
            <button
              onClick={createTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Check size={18} />
              Create
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-6">
        {templates.map((template) => (
          <div key={template.id} className="p-6 border border-gray-300 rounded-lg">
            {editingId === template.id ? (
              <>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600">Template ID: {template.id}</p>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTemplate?.visible || false}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate!,
                        visible: e.target.checked,
                      })
                    }
                    id={`visible-${template.id}`}
                  />
                  <label htmlFor={`visible-${template.id}`} className="cursor-pointer">
                    Show in part creation form
                  </label>
                </div>

                {languages.map((lang) => (
                  <div key={lang} className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      {LANGUAGE_NAMES[lang] || lang}
                    </label>
                    <input
                      type="text"
                      value={editingTemplate?.translations[lang] || ''}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate!,
                          translations: {
                            ...editingTemplate!.translations,
                            [lang]: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={saveTemplate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Check size={18} />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">{template.id}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {template.visible ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded">✓ Visible</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded">Hidden</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {languages.map((lang) => (
                    <div key={lang} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600 w-20">
                        {LANGUAGE_NAMES[lang] || lang}
                      </span>
                      <span className="text-gray-800 flex-1 ml-4">
                        {template.translations[lang]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(template)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  {deleteConfirm === template.id ? (
                    <>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
