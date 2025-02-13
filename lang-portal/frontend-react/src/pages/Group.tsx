import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchGroupDetails, fetchGroupWords, type GroupDetails, type Word } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function Group() {
  const { id } = useParams<{ id: string }>()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string>('kanji')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { 
    data: group,
    isLoading: isLoadingGroup,
    error: groupError
  } = useApi<GroupDetails>(
    () => fetchGroupDetails(Number(id)),
    { dependencies: [id] }
  )

  const {
    data: wordsResponse,
    isLoading: isLoadingWords,
    error: wordsError
  } = useApi(
    () => fetchGroupWords(Number(id), currentPage, sortKey, sortDirection),
    { dependencies: [id, currentPage, sortKey, sortDirection] }
  )

  if (isLoadingGroup || isLoadingWords) {
    return <div>Loading...</div>
  }

  if (groupError || wordsError) {
    return <div>Error: {groupError?.message || wordsError?.message}</div>
  }

  if (!group) {
    return <div>Group not found</div>
  }

  return (
    <div>
      <h1>{group.group_name}</h1>
      <p>Total words: {group.word_count}</p>

      {/* Words table */}
      {wordsResponse && wordsResponse.words.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Kanji</th>
              <th>Romaji</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody>
            {wordsResponse.words.map((word: Word) => (
              <tr key={word.id}>
                <td>{word.kanji}</td>
                <td>{word.romaji}</td>
                <td>{word.english}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No words found in this group</p>
      )}

      {/* Pagination */}
      {wordsResponse && wordsResponse.total_pages > 1 && (
        <div>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {wordsResponse.total_pages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(wordsResponse.total_pages, p + 1))}
            disabled={currentPage === wordsResponse.total_pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
} 