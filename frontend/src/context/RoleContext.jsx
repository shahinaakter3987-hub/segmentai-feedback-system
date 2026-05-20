import React, { createContext, useContext, useState } from 'react'

const RoleContext = createContext()

export const ROLES = {
  Admin:       { label: 'Admin',             color: '#a78bfa', icon: '⚙️' },
  Top:         { label: 'Top Management',    color: '#f59e0b', icon: '👔' },
  Middle:      { label: 'Middle Management', color: '#38bdf8', icon: '🏢' },
  Operational: { label: 'Operational Staff', color: '#34d399', icon: '🔧' },
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState('Admin')
  return (
    <RoleContext.Provider value={{ role, setRole, roleInfo: ROLES[role] }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
