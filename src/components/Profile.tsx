"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, UserCircle, AlertTriangle } from "lucide-react"
import { LanguageContext } from "../App"
import { getApiUrl } from "../utils/apiUtils"

const Profile: React.FC = () => {
  const { t } = useContext(LanguageContext)
  const navigate = useNavigate()

  const [user, setUser] = useState<{
    _id: string
    name: string
    email: string
    avatar: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

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

  // Handle name change
  const handleNameChange = async () => {
    if (!newName.trim()) {
      setError(t("nameCannotBeEmpty"))
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
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setSuccess(t("nameUpdated"))
      } else {
        setError(t("failedToUpdateName"))
      }
    } catch (error) {
      console.error("Name update error:", error)
      setError(t("nameUpdateError"))
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

    // Handle name input change with character limit
    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Limit to 24 characters
    if (value.length <= 24) {
        setNewName(value)
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* Name Change Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("changeName")}</h2>
              <div className="max-w-lg">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("currentName")}: {user?.name}
                </label>
                <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={newName}
                  onChange={handleNameInputChange}
                  maxLength={24}

                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder={t("enterNewName")}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-400">{newName.length}/24</div>
                </div>
                <button
                  onClick={handleNameChange}
                  disabled={loading || newName === user?.name || !newName.trim()}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? t("saving") : t("saveChanges")}
                </button>
              </div>
            </div>

             {/* Delete Account Section - Only show if not admin */}
             {!isAdmin && (
              <div>
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
