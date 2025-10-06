"use client"

import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

const SellerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SITE_URL}/api/check-seller-or-admin`, { credentials: "include" })
        setAllowed(res.ok)
      } catch {
        setAllowed(false)
      }
    }
    check()
  }, [])

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!allowed) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

export default SellerRoute
