import { useState } from 'react'
import { fetchStudySessions, type StudySession } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function StudyHistory() {
  const [currentPage, setCurrentPage] = useState(1)
  
  const {
    data: sessionsResponse,
    isLoading,
    error
  } = useApi(
    () => fetchStudySessions(currentPage),
    { dependencies: [currentPage] }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h2>Study History</h2>
      {sessionsResponse?.items.length ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Group</th>
                <th>Activity</th>
                <th>Words Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {sessionsResponse.items.map((session: StudySession) => (
                <tr key={session.id}>
                  <td>{new Date(session.start_time).toLocaleDateString()}</td>
                  <td>{session.group_name}</td>
                  <td>{session.activity_name}</td>
                  <td>{session.review_items_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {sessionsResponse.total_pages > 1 && (
            <div>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {sessionsResponse.total_pages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(sessionsResponse.total_pages, p + 1))}
                disabled={currentPage === sessionsResponse.total_pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p>No study sessions found</p>
      )}
    </div>
  )
} 