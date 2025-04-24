"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/check-admin`, {
          credentials: "include",
        })

        if (response.ok) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default AdminRoute
