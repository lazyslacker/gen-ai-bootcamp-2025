import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchGroups, type Group, type GroupsResponse } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function Groups() {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<'name' | 'word_count'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const {
    data: groupsResponse,
    isLoading,
    error
  } = useApi<GroupsResponse>(
    () => fetchGroups(currentPage, sortKey, sortDirection),
    { dependencies: [currentPage, sortKey, sortDirection] }
  )

  const handleSort = (key: 'name' | 'word_count') => {
    if (key === sortKey) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const renderContent = () => {
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

    if (!groupsResponse?.groups?.length) {
      return (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No groups found</p>
          <Link 
            to="/groups/new"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Create your first group
          </Link>
        </div>
      )
    }

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center">
                    Name
                    {sortKey === 'name' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('word_count')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center">
                    Words
                    {sortKey === 'word_count' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {groupsResponse.groups.map((group: Group) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/groups/${group.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {group.group_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                    {group.word_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groupsResponse.total_pages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-800 dark:text-gray-200">
              Page {currentPage} of {groupsResponse.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(groupsResponse.total_pages, p + 1))}
              disabled={currentPage === groupsResponse.total_pages}
              className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Word Groups</h1>
        <Link 
          to="/groups/new"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          New Group
        </Link>
      </div>
      {renderContent()}
    </div>
  )
}