'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { initKeycloak, isAuthenticated, hasRole, getUserInfo, login, logout } from '@/lib/keycloak'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  login: () => void
  logout: () => void
  hasAdminRole: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    initKeycloak()
      .then((auth) => {
        setAuthenticated(auth)
        if (auth) {
          setUser(getUserInfo())
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const hasAdminRole = () => {
    return hasRole('study-materials_admin')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,
        isLoading: loading,
        user,
        login,
        logout,
        hasAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}



