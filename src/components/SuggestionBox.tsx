"use client"

import type React from "react"
import { useState, useContext, useEffect } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"
import { useNavigate } from "react-router-dom"

interface Suggestion {
  _id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

const SuggestionBox: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    fetchSuggestions()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/get-user-details`, {
        credentials: "include",
      })
      if (response.ok) {
        const userData = await response.json()
        setIsAuthenticated(true)
        setUserId(userData._id)
      } else {
        setIsAuthenticated(false)
        setUserId(null)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setIsAuthenticated(false)
      setUserId(null)
    }
  }

  const fetchSuggestions = async (page = 1) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/suggestions?page=${page}&limit=5`)
      const data = await response.json()
      setSuggestions(data.suggestions)
      setHasMore(data.hasMore)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Recheck authentication before submitting
    await checkAuth()
    
    if (!isAuthenticated) {
      setSubmitError("You need to be logged in to submit suggestions.")
      return
    }

    setIsSubmitting(true)
    setSubmitSuccess(false)
    setSubmitError("")

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setSubmitError("Your session has expired. Please log in again.")
          setIsAuthenticated(false)
          setUserId(null)
        } else {
          throw new Error("Failed to submit suggestion")
        }
        return
      }

      setSubmitSuccess(true)
      setMessage("")
      fetchSuggestions(1) // Refresh suggestions
    } catch (error) {
      console.error("Submit error:", error)
      setSubmitError(t("suggestionBox.errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (suggestionId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/suggestions/${suggestionId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete suggestion")
      }

      fetchSuggestions(currentPage) // Refresh suggestions
    } catch (error) {
      console.error("Error deleting suggestion:", error)
    }
  }

  const loadMore = () => {
    const nextPage = currentPage + 1
    fetchSuggestions(nextPage)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6"
          style = {{
            color: "var(--color-text-header)"
          }}
          >{t("suggestionBoxTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="mb-4 text-gray-700">{t("suggestionBoxIntro")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {submitSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {t("suggestionBoxSuccessMessage")}
              </div>
            )}

            {submitError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{submitError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="suggestion" className="block text-gray-700 mb-2">
                  {t("suggestionBoxSuggestion")}
                </label>
                <textarea
                  id="suggestion"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{
                      outline: "none",
                      boxShadow: "0 0 0 0px var(--color-primary)",
                      transition: "box-shadow 0.2s",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.boxShadow = "0 0 0 2px var(--color-primary)"
                    }}
                    onBlur={e => {
                      e.currentTarget.style.boxShadow = "0 0 0 0px var(--color-primary)"
                    }}
                  placeholder={t("suggestionBoxSuggestionPlaceholder")}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full text-white py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-primary)",
                  transition: "background-color 0.3s ease",
                }}
                 onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-secondary)"
                  }}
                  onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-primary)"
                  }}
              >
                {isSubmitting ? t("suggestionBoxSubmitting") : t("suggestionBoxSubmit")}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4"
              style = {{
                color: "var(--color-text-header)"
              }}
              >{t("suggestionBoxRecentSuggestions")}</h3>

              <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion._id} className="bg-gray-50 p-4 rounded-lg relative">
                  {isAuthenticated && suggestion.userId === userId && (
                    <button
                      onClick={() => handleDelete(suggestion._id)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
                      title="Delete suggestion"
                    >
                      ×
                    </button>
                  )}
                  <p className="italic text-gray-600">"{suggestion.message}"</p>
                  <p className="text-sm text-gray-500 mt-2">{suggestion.userName}</p>
                </div>
              ))}
                </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => fetchSuggestions(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchSuggestions(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SuggestionBox
