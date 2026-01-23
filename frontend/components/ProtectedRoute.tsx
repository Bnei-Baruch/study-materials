'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginPage from './LoginPage'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasAdminRole, user, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Authenticated but no admin role - show access denied with user info and logout
  if (!hasAdminRole()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this area. Please contact an administrator if you believe this is a mistake.</p>
          
          {user?.email && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Logged in as:</p>
              <p className="text-gray-800 font-medium break-all">{user.email}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <a 
              href="/" 
              className="flex-1 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </a>
            <button
              onClick={logout}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}



