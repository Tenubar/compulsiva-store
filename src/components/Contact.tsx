"use client"

import type React from "react"
import { useState, useContext } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"

const Contact: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
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
        subject: "",
        message: "",
      })
    } catch (error) {
      setSubmitError(t("contact.errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6"
          style = {{
            color: "var(--color-text-black)"
          }}
          >{t("contactTitle")}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4"
              style = {{
                color: "var(--color-text-header)"
              }}
              >{t("contactGetInTouch")}</h2>
              <p className="mb-6 text-gray-700">{t("contactGetInTouchText")}</p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 rounded-full mr-3"
                  style ={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-white)"
                  }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium"
                    style = {{
                      color: "var(--color-text-header)"
                    }}
                    >{t("contactAddress")}</h3>
                    <p className="text-gray-700">-</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 rounded-full mr-3"
                  style = {{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-white)"
                  }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium"
                    style = {{
                      color: "var(--color-text-header)"
                    }}
                    >{t("contactPhone")}</h3>
                    <p className="text-gray-700">-</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 rounded-full mr-3"
                  style = {{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-white)"
                  }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium"
                    style = {{
                      color: "var(--color-text-header)"
                    }}
                    >{t("contactEmail")}</h3>
                    <p className="text-gray-700">-</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 rounded-full mr-3"
                  style = {{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-white)"
                  }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium"
                    style = {{
                      color: "var(--color-text-header)"
                    }}
                    >{t("contactBusinessHours")}</h3>
                    <p className="text-gray-700">{t("contactBusinessHoursText")}</p>
                  </div>
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

export default Contact
