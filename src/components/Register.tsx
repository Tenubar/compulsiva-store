"use client"

import type React from "react"
import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserCircle } from "lucide-react"
import { LanguageContext } from "../App"
import Header from "./Header"

const Register: React.FC = () => {
  const { t, language, setLanguage } = useContext(LanguageContext)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const navigate = useNavigate()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 2 * 1024 * 1024) {
        setError(t("fileTooLarge"))
        return
      }

      if (!file.type.match("image.*")) {
        setError(t("invalidFileType"))
        return
      }

      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setError(t("passwordTooShort"))
      return
    }

    try {
      let avatarFilename = ""

      if (avatarFile) {
        const formData = new FormData()
        formData.append("image", avatarFile)

        const uploadResponse = await fetch(`${import.meta.env.VITE_SITE_URL}/api/upload/productImage`, {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          avatarFilename = uploadData.image.filename
        } else {
          setError(t("failedToUploadAvatar"))
          return
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          avatar: avatarFilename,
        }),
      })

      if (response.ok) {
        navigate("/login")
      } else {
        const data = await response.json()
        setError(data.message || t("registrationFailed"))
      }
    } catch (err) {
      setError(t("registrationError"))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency="USD" setCurrency={() => {}} language={language} setLanguage={setLanguage} />
      <div className="flex flex-col justify-center py-28 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/")}
          className="absolute top-20 left-4 flex items-center text-gray-600 hover:text-primary-dark"
        >
          <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
        </button>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t("createAccount")}</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t("fullName")}
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t("profilePicture")}</label>
                <div className="mt-1 flex items-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Avatar Preview"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label className="ml-5 cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                    {t("upload")}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t("email")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t("password")}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-dark hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t("register")}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t("alreadyHaveAccount")}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-dark bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t("signIn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
