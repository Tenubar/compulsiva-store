"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Edit2, Trash2, Save, X, Search, UserIcon, AlertTriangle } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [actionError, setActionError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
    // Get admin email from environment variable
    setAdminEmail(import.meta.env.VITE_ADMIN_USER_EMAIL || "")
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/users`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setActionError("")
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      setIsProcessing(true)
      setActionError("")

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update user")
      }

      const updatedUser = await response.json()
      setUsers(users.map((user) => (user._id === updatedUser._id ? updatedUser : user)))
      setEditingUser(null)
    } catch (err: any) {
      console.error("Error updating user:", err)
      setActionError(err.message || "Failed to update user")
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteConfirmation(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsProcessing(true)
      setActionError("")

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/users/${userToDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete user")
      }

      setUsers(users.filter((user) => user._id !== userToDelete._id))
      setShowDeleteConfirmation(false)
      setUserToDelete(null)
    } catch (err: any) {
      console.error("Error deleting user:", err)
      setActionError(err.message || "Failed to delete user")
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setActionError("")
  }

  const cancelDelete = () => {
    setShowDeleteConfirmation(false)
    setUserToDelete(null)
    setActionError("")
  }

  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : users

  const isAdmin = (email: string) => email === adminEmail

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">User Management</h1>

        {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="text-gray-600">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
          </div>
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{actionError}</div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">No users found</h2>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try a different search term" : "Add some users to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?._id === user._id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 border rounded-md"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                            {isAdmin(user.email) && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?._id === user._id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2 py-1 border rounded-md"
                          disabled={isAdmin(user.email)}
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 truncate max-w-[150px]" title={user._id}>
                        {user._id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser?._id === user._id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleSaveUser}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save size={18} />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900">
                            <Edit2 size={18} />
                          </button>
                          {!isAdmin(user.email) && (
                            <button
                              onClick={() => confirmDeleteUser(user)}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirmation && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">Confirm User Deletion</h3>
            </div>

            <p className="mb-4 text-gray-700">
              Are you sure you want to delete the user <span className="font-semibold">{userToDelete.name}</span> (
              {userToDelete.email})?
            </p>

            <p className="mb-6 text-gray-700">
              This action will permanently remove the user from the database and cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
