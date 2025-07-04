"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, UserCircle, AlertTriangle } from "lucide-react"
import { LanguageContext } from "../App"
import { getApiUrl } from "../utils/apiUtils"
import Header from "./Header"

const Profile: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newId, setNewId] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const [user, setUser] = useState<{
    _id: string
    name: string
    email: string
    avatar: string
    phone: string
    id: string
    firstName: string
    lastName: string
    address: {
      street: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  } | null>(null)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(getApiUrl("get-user-details"), {
          credentials: "include",
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setNewName(userData.name)
          setNewPhone(userData.phone || "")
          setNewId(userData.id || "")
          setNewFirstName(userData.firstName || "")
          setNewLastName(userData.lastName || "")
          setNewAddress(userData.address || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: ""
          })
          // Check if user is admin
          const adminEmail = import.meta.env.VITE_ADMIN_USER_EMAIL
          setIsAdmin(userData.email === adminEmail)
        } else {
          // If not logged in, redirect to login
          navigate("/login")
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        setError(t("errorFetchingUserData"))
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [navigate, t])

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError(t("fileTooLarge"))
        return
      }

      // Check file type
      if (!file.type.match("image.*")) {
        setError(t("invalidFileType"))
        return
      }

      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setError("")
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      setLoading(true)

      // If user already has an avatar, delete it first
      if (user?.avatar) {
        try {
          await fetch(getApiUrl(`api/images/delete-by-path`), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ path: getApiUrl(`api/images/${user.avatar}`) }),
          })
        } catch (error) {
          console.error("Failed to delete old avatar:", error)
        }
      }

      // Upload new avatar
      const formData = new FormData()
      formData.append("image", avatarFile)

      const uploadResponse = await fetch(getApiUrl("api/upload/productImage"), {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json()
        const avatarFilename = uploadData.image.filename

        // Update user profile with new avatar
        const updateResponse = await fetch(getApiUrl("update-user"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: user?.name,
            email: user?.email,
            avatar: avatarFilename,
          }),
        })

        if (updateResponse.ok) {
          const updatedUser = await updateResponse.json()
          setUser(updatedUser)
          setSuccess(t("avatarUpdated"))

          // Clear the file input
          setAvatarFile(null)
        } else {
          setError(t("failedToUpdateProfile"))
        }
      } else {
        setError(t("failedToUploadAvatar"))
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      setError(t("avatarUploadError"))
    } finally {
      setLoading(false)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!newName.trim() || !newPhone.trim() || !newId.trim() || !newFirstName.trim() || !newLastName.trim() ||
        !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || 
        !newAddress.postalCode.trim() || !newAddress.country.trim()) {
      setError(t("allFieldsRequired"))
      return
    }

    try {
      setLoading(true)

      const response = await fetch(getApiUrl("update-user"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          email: user?.email,
          avatar: user?.avatar,
          phone: newPhone,
          id: newId,
          firstName: newFirstName,
          lastName: newLastName,
          address: newAddress
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setSuccess(t("profileUpdated"))
      } else {
        setError(t("failedToUpdateProfile"))
      }
    } catch (error) {
      console.error("Profile update error:", error)
      setError(t("profileUpdateError"))
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setLoading(true)

      const response = await fetch(getApiUrl("delete-user"), {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        // Redirect to home page after successful deletion
        navigate("/")
      } else {
        setError(t("failedToDeleteAccount"))
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error("Account deletion error:", error)
      setError(t("accountDeletionError"))
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="mb-8 flex items-center">
          <button onClick={() => navigate("/")} className="flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{t("profile")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("profileSettings")}</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 mx-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Personal Information Section */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("personalInfo") || "Personal Information"}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="personalName" className="block text-sm font-medium text-gray-700">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    id="personalName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    id="personalEmail"
                    value={user?.email || ""}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("changeAvatar")}</h2>
              <div className="flex flex-col sm:flex-row items-center">
                <div className="mb-4 sm:mb-0 sm:mr-6">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Avatar Preview"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={getApiUrl(`api/images/${user.avatar || "/placeholder.svg"}`)}
                      alt="Current Avatar"
                      className="w-32 h-32 rounded-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=128&width=128"
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle size={64} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("uploadAvatar")}</label>
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                      <Upload size={16} className="inline mr-2" />
                      {t("chooseFile")}
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                    {avatarFile && <span className="ml-3 text-sm text-gray-500">{avatarFile.name}</span>}
                  </div>

                  {avatarFile && (
                    <button
                      onClick={handleAvatarUpload}
                      disabled={loading}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? t("uploading") : t("uploadAvatar")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("shippingInformation")}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    {t("firstName")}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    {t("lastName")}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {t("phone")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                    {t("id")}
                  </label>
                  <input
                    type="text"
                    id="id"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("address")}</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                    {t("street")}
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      {t("city")}
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      {t("state")}
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      {t("postalCode")}
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      {t("country")}
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end">
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
                >
                {loading ? t("saving") : t("saveChanges")}
              </button>
            </div>

            {/* Delete Account Section - Only show if not admin */}
            {!isAdmin && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t("deleteAccount")}</h2>
                <p className="text-sm text-gray-500 mb-4">{t("deleteAccountDescription")}</p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t("deleteAccount")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{t("deleteAccount")}</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{t("deleteAccountWarning")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? t("deleting") : t("deleteWarningYes")}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {t("deleteWarningNo")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
