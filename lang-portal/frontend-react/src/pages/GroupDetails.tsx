import { useParams } from 'react-router-dom'
import { fetchGroupDetails, fetchStudySessions, type StudySession } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import GroupStudyHistory from '@/components/GroupStudyHistory'

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)

  const { 
    data: group,
    isLoading,
    error 
  } = useApi(
    () => fetchGroupDetails(groupId),
    { dependencies: [groupId] }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h1>{group?.group_name}</h1>
      <GroupStudyHistory groupId={groupId} />
    </div>
  )
} 