'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Email {
  id: string
  subject: string
  sender: string
  date: string
  snippet: string
  labels: string[]
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState<Email[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchEmails()
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setEmails([])
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const fetchEmails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/emails')
      const data = await response.json()
      
      if (data.success) {
        setEmails(data.emails)
      } else {
        setError(data.error || 'Failed to fetch emails')
      }
    } catch (err) {
      setError('Failed to fetch emails')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshEmails = () => {
    fetchEmails()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gmail API Workflow</h1>
              <p className="text-gray-600 mt-2">Retrieve and analyze your Gmail emails</p>
            </div>
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={refreshEmails}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh Emails'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Login with Google
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Status */}
        {!isAuthenticated && !isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentication Required</h3>
            <p className="text-yellow-700 mb-4">
              Please login with your Google account to access your Gmail emails.
            </p>
            <button
              onClick={handleLogin}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-md font-medium"
            >
              Login with Google
            </button>
          </div>
        )}

        {/* Emails Display */}
        {isAuthenticated && emails.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Emails ({emails.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing emails from the last 2 days
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {emails.map((email) => (
                <div key={email.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {email.subject || 'No Subject'}
                        </h3>
                        <div className="flex space-x-1">
                          {email.labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        From: {email.sender}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(email.date).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {email.snippet}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Emails State */}
        {isAuthenticated && emails.length === 0 && !isLoading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No emails found</h3>
            <p className="mt-2 text-gray-600">
              No emails were found in the last 2 days. Try refreshing or check your email filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 