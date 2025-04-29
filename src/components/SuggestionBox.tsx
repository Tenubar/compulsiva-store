"use client"

import type React from "react"
import { useState, useContext } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"

const SuggestionBox: React.FC = () => {
  const { t, language, setLanguage } = useContext(LanguageContext)
  const [currency, setCurrency] = useState<"USD" | "EUR" | "VES">("USD")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    suggestion: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(false)
    setSubmitError("")

    // Simulate API call
    try {
      // In a real app, you would send this data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitSuccess(true)
      setFormData({
        name: "",
        email: "",
        category: "",
        suggestion: "",
      })
    } catch (error) {
      setSubmitError(t("suggestionBox.errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-primary-dark">{t("suggestionBoxTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="mb-4 text-gray-700">{t("suggestionBoxIntro")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {submitSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {t("suggestionBoxSuccessMessage")}
              </div>
            )}

            {submitError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{submitError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    {t("suggestionBoxName")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">
                    {t("suggestionBoxEmail")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700 mb-2">
                  {t("suggestionBoxCategory")}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">{t("suggestionBoxSelectCategory")}</option>
                  <option value="products">{t("suggestionBoxProducts")}</option>
                  <option value="website">{t("suggestionBoxWebsite")}</option>
                  <option value="service">{t("suggestionBoxService")}</option>
                  <option value="other">{t("suggestionBoxOther")}</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="suggestion" className="block text-gray-700 mb-2">
                  {t("suggestionBoxSuggestion")}
                </label>
                <textarea
                  id="suggestion"
                  name="suggestion"
                  value={formData.suggestion}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  placeholder={t("suggestionBoxSuggestionPlaceholder")}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-dark text-white py-2 px-4 rounded-md hover:bg-primary-darker transition duration-300 disabled:opacity-50"
              >
                {isSubmitting ? t("suggestionBoxSubmitting") : t("suggestionBoxSubmit")}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-lg mb-4 text-primary-dark">{t("suggestionBoxRecentSuggestions")}</h3>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="italic text-gray-600">"{t("suggestionBoxSampleSuggestion1")}"</p>
                  <p className="text-sm text-gray-500 mt-2">{t("suggestionBoxSampleName1")}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="italic text-gray-600">"{t("suggestionBoxSampleSuggestion2")}"</p>
                  <p className="text-sm text-gray-500 mt-2">{t("suggestionBoxSampleName2")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SuggestionBox
