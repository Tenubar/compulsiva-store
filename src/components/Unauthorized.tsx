"use client"

import type React from "react"

import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShieldAlert } from "lucide-react"

const Unauthorized: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Return to Home
        </button>
      </div>
    </div>
  )
}

export default Unauthorized
