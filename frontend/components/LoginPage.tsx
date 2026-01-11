'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">
          Study Materials Admin
        </h1>
        <p className="text-gray-600 mb-8">
          Authentication required to access the admin area
        </p>
        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Login with Keycloak
        </button>
      </div>
    </div>
  )
}



