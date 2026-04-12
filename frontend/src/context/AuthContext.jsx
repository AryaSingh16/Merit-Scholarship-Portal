import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]       = useState(() => localStorage.getItem('merit_token'))
  const [role, setRole]         = useState(() => localStorage.getItem('merit_role'))
  const [studentId, setStudentId] = useState(() => localStorage.getItem('merit_sid'))
  const [userName, setUserName] = useState(() => localStorage.getItem('merit_name'))

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('merit_token', data.access_token)
    localStorage.setItem('merit_role',  data.role)
    localStorage.setItem('merit_sid',   data.student_id || '')
    localStorage.setItem('merit_name',  data.name || 'Admin')
    setToken(data.access_token)
    setRole(data.role)
    setStudentId(data.student_id)
    setUserName(data.name || 'Admin')
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setToken(null)
    setRole(null)
    setStudentId(null)
    setUserName(null)
  }, [])

  const isAuthenticated = Boolean(token)
  const isAdmin = role === 'admin'
  const isStudent = role === 'student'

  return (
    <AuthContext.Provider value={{ token, role, studentId, userName, isAuthenticated, isAdmin, isStudent, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
