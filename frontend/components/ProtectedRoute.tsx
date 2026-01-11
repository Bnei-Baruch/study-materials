'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginPage from './LoginPage'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasAdminRole } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !hasAdminRole()) {
    return <LoginPage />
  }

  return <>{children}</>
}



