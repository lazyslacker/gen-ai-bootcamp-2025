import React, { useState } from 'react'
import { fetchWords, type Word } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import WordsTable from '@/components/WordsTable'

export default function Words() {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<'kanji' | 'romaji' | 'english'>('kanji')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const {
    data: wordsResponse,
    isLoading,
    error
  } = useApi(
    () => fetchWords(currentPage, sortKey, sortDirection),
    { dependencies: [currentPage, sortKey, sortDirection] }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Error: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Words</h1>
      {wordsResponse?.words ? (
        <>
          <WordsTable 
            words={wordsResponse.words}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={setSortKey}
          />
          {wordsResponse.total_pages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-800 dark:text-gray-200">
                Page {currentPage} of {wordsResponse.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(wordsResponse.total_pages, p + 1))}
                disabled={currentPage === wordsResponse.total_pages}
                className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No words found</p>
        </div>
      )}
    </div>
  )
}