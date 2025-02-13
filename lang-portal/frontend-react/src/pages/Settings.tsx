import React, { useState } from 'react'
import { API_BASE_URL } from '@/services/api'

export default function Settings() {
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleResetHistory = async () => {
    if (!confirm('Are you sure you want to reset your study history? This cannot be undone.')) {
      return
    }

    setIsResetting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API_BASE_URL}/study-sessions/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to reset study history')
      }

      setSuccess('Study history has been reset successfully')
    } catch (err) {
      console.error('Error resetting history:', err)
      setError('Failed to reset study history. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Study History</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md">
            {success}
          </div>
        )}

        <button
          onClick={handleResetHistory}
          disabled={isResetting}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResetting ? 'Resetting...' : 'Reset Study History'}
        </button>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This will delete all your study sessions and progress data. This action cannot be undone.
        </p>
      </div>
    </div>
  )
}