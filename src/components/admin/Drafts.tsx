"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Edit2, Trash2, Clock, FileText } from "lucide-react"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"

interface Draft {
  _id: string
  title: string
  productData: {
    title: string
    type: string
    price: string
    image: string
  }
  lastUpdated: string
  createdAt: string
}

const Drafts: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch drafts")
      }

      const data = await response.json()
      setDrafts(data)
    } catch (err) {
      console.error("Error fetching drafts:", err)
      setError("Failed to load drafts")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      setDeletingDraft(draftId)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete draft")
      }

      setDrafts(drafts.filter((draft) => draft._id !== draftId))
    } catch (err) {
      console.error("Error deleting draft:", err)
      setError("Failed to delete draft")
    } finally {
      setDeletingDraft(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Home
      </button>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Product Drafts</h2>

        {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {drafts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No drafts found</h3>
            <p className="mt-1 text-gray-500">Start creating a product to automatically save drafts.</p>
            <button
              onClick={() => navigate("/admin/create-product")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Product
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {drafts.map((draft) => (
                <li key={draft._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {draft.productData && draft.productData.image ? (
                          <img
                            src={getImageUrl(draft.productData.image) || "/placeholder.svg"}
                            alt={draft.title || draft.productData?.title || "Untitled Draft"}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = getPlaceholder(64, 64)
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <FileText className="text-gray-400" size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {draft.title || (draft.productData?.title ? draft.productData.title : "Untitled Draft")}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Clock className="mr-1" size={14} />
                          <span>Last updated: {formatDate(draft.lastUpdated || draft.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {draft.productData?.type} {draft.productData?.price ? `- ${draft.productData.price}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/edit-draft/${draft._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Edit draft"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft._id)}
                        disabled={deletingDraft === draft._id}
                        className={`p-2 text-red-600 hover:bg-red-50 rounded-full ${
                          deletingDraft === draft._id ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title="Delete draft"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default Drafts
