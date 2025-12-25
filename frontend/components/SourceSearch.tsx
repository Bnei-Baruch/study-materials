'use client'

import { useState, useEffect, useRef } from 'react'

interface Source {
  source_id: string
  source_title: string
  source_url: string
}

interface SourceResult {
  id: string
  title: string
  url: string
}

interface SourceSearchProps {
  onSelect: (source: Source) => void
}

export function SourceSearch({ onSelect }: SourceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SourceResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search sources
  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchSources = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `http://localhost:8080/api/sources/search?q=${encodeURIComponent(query)}`
        )
        const data = await response.json()
        setResults(data.sources || [])
        setIsOpen(true)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(searchSources, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (result: SourceResult) => {
    onSelect({
      source_id: result.id,
      source_title: result.title,
      source_url: result.url,
    })
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sources in Hebrew, Russian, English, Spanish..."
          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-gray-500 text-center">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-center">
              No sources found
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{result.title}</div>
                    <div className="text-sm text-gray-500">{result.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}


