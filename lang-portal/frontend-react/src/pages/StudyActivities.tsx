import { useState } from 'react'
import { fetchStudyActivities, type StudyActivity } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function StudyActivities() {
  const { 
    data: activities, 
    isLoading, 
    error 
  } = useApi<StudyActivity[]>(
    () => fetchStudyActivities(),
    { 
      onError: (err) => console.error('Failed to fetch activities:', err)
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Study Activities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities?.map(activity => (
          <div 
            key={activity.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
          >
            <img 
              src={activity.preview_url} 
              alt={activity.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{activity.description}</p>
              <a 
                href={activity.launch_url}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Start Activity
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}