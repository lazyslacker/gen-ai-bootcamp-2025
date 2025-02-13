import { useState } from 'react'
import { fetchStudySessions, type StudySession } from '@/services/api'
import { useApi } from '@/hooks/useApi'

interface GroupStudyHistoryProps {
  groupId: number
}

export default function GroupStudyHistory({ groupId }: GroupStudyHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const {
    data: sessionsResponse,
    isLoading,
    error
  } = useApi(
    () => fetchStudySessions(currentPage, 10, { groupId }),
    { dependencies: [groupId, currentPage] }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h3>Study History</h3>
      {sessionsResponse?.items.length ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Words Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {sessionsResponse.items.map((session: StudySession) => (
                <tr key={session.id}>
                  <td>{new Date(session.start_time).toLocaleDateString()}</td>
                  <td>{session.activity_name}</td>
                  <td>{session.review_items_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
        <p>No study history for this group</p>
      )}
    </div>
  )
} 