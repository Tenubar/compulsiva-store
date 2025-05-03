"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, X, Search, ImageIcon, Upload, Loader } from "lucide-react"
import Header from "../Header"
import { useContext } from "react"
import { LanguageContext } from "../../App"

// Update the ImageItem interface to include product information
interface ImageItem {
  _id: string
  filename: string
  path: string
  size: number
  mimetype: string
  products?: Array<{
    id: string
    title: string
  }>
}

const AdminGallery: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()
  const { language, setLanguage, t } = useContext(LanguageContext)

  // Add these new state variables after the existing state declarations
  const [isChangingImage, setIsChangingImage] = useState(false)
  const [uploadingNewImage, setUploadingNewImage] = useState(false)
  const [changeImageError, setChangeImageError] = useState("")
  const [productInfo, setProductInfo] = useState<Array<{ id: string; title: string }>>([])
  const [loadingProductInfo, setLoadingProductInfo] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  // Add this useEffect hook to fetch product info when an image is selected
  useEffect(() => {
    const fetchProductInfo = async () => {
      if (selectedImage && selectedImage._id) {
        setLoadingProductInfo(true)
        try {
          const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/${selectedImage._id}/products`, {
            credentials: "include",
          })

          if (!response.ok) {
            throw new Error("Failed to fetch product information")
          }

          const data = await response.json()
          setProductInfo(data.products)
        } catch (err) {
          console.error("Error fetching product info:", err)
          setProductInfo([])
        } finally {
          setLoadingProductInfo(false)
        }
      } else {
        setProductInfo([]) // Reset product info when no image is selected
      }
    }

    fetchProductInfo()
  }, [selectedImage])

  // Update the fetchImages function to also fetch product information
  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images?includeProducts=true`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch images")
      }

      const data = await response.json()
      setImages(data)
    } catch (err) {
      console.error("Error fetching images:", err)
      setError("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  // Add this new function to handle image replacement
  const handleChangeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedImage) return

    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingNewImage(true)
      setChangeImageError("")

      const formData = new FormData()
      formData.append("image", file)
      formData.append("oldImagePath", selectedImage.path)

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/replace`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to replace image")
      }

      const data = await response.json()

      // Update the images list with the new image
      setImages((prevImages) =>
        prevImages.map((img) =>
          img._id === selectedImage._id ? { ...img, path: data.path, filename: data.filename } : img,
        ),
      )

      // Update the selected image
      setSelectedImage({
        ...selectedImage,
        path: data.path,
        filename: data.filename,
      })

      setIsChangingImage(false)
    } catch (err: any) {
      console.error("Error replacing image:", err)
      setChangeImageError(err.message || "Failed to replace image")
    } finally {
      setUploadingNewImage(false)
    }
  }

  // Update the handleDeleteImage function to remove the product check
  const handleDeleteImage = async (id: string) => {
    try {
      setIsDeleting(true)
      setDeleteError("")

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/${id}?force=true`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete image")
      }

      setImages(images.filter((img) => img._id !== id))
      setSelectedImage(null)
    } catch (err: any) {
      console.error("Error deleting image:", err)
      setDeleteError(err.message || "Failed to delete image")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  const filteredImages = searchTerm
    ? images.filter(
        (img) =>
          img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          img.path.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : images

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency="USD" setCurrency={() => {}} language={language} setLanguage={setLanguage} />
      <div className="py-32 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/")}
          className="absolute top-24 left-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">{t("imageGallery")}</h1>

          {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          <div className="mb-6 flex justify-between items-center">
            <div className="relative w-64">
              <input
                type="text"
                placeholder={t("searchImages")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            <div className="text-gray-600">
              {filteredImages.length} {filteredImages.length === 1 ? t("imageFound") : t("imagesFound")}
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-2 text-lg font-medium text-gray-900">{t("noImagesFound")}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? t("tryDifferentSearch") : t("uploadImages")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image._id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                    selectedImage?._id === image._id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.path || "/placeholder.svg"}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=200"
                      }}
                    />
                  </div>
                  <div className="p-2 text-xs truncate text-gray-600">{image.filename}</div>
                </div>
              ))}
            </div>
          )}

          {selectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold">{t("imageDetails")}</h3>
                  <button onClick={() => setSelectedImage(null)} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                  <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2">
                    <img
                      src={selectedImage.path || "/placeholder.svg"}
                      alt={selectedImage.filename}
                      className="max-h-80 max-w-full object-contain"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("id")}</h4>
                      <p className="text-gray-900 break-all">{selectedImage._id}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("filename")}</h4>
                      <p className="text-gray-900 break-all">{selectedImage.filename}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("path")}</h4>
                      <p className="text-gray-900 break-all">{selectedImage.path}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("size")}</h4>
                      <p className="text-gray-900">{formatFileSize(selectedImage.size)}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("format")}</h4>
                      <p className="text-gray-900">{selectedImage.mimetype}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("productName")}</h4>
                      {loadingProductInfo ? (
                        <div className="flex items-center text-gray-500">
                          <Loader size={14} className="animate-spin mr-2" />
                          <span>{t("loading")}</span>
                        </div>
                      ) : productInfo.length > 0 ? (
                        <p className="text-gray-900">{productInfo[0].title}</p>
                      ) : (
                        <p className="text-gray-500 italic">{t("noProductsUsingImage")}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t("productUrl")}</h4>
                      {loadingProductInfo ? (
                        <div className="flex items-center text-gray-500">
                          <Loader size={14} className="animate-spin mr-2" />
                          <span>{t("loading")}</span>
                        </div>
                      ) : productInfo.length > 0 ? (
                        <a
                          href={`/product/${productInfo[0].id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          /product/{productInfo[0].id}
                        </a>
                      ) : (
                        <p className="text-gray-500 italic">{t("noProductUrlAvailable")}</p>
                      )}
                    </div>

                    {changeImageError && (
                      <div className="bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                        {changeImageError}
                      </div>
                    )}

                    <div className="space-y-2">
                      {isChangingImage ? (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleChangeImage}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {uploadingNewImage && (
                            <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                              <span className="text-sm text-gray-600">{t("uploading")}</span>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setIsChangingImage(false)}
                              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsChangingImage(true)}
                          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                        >
                          <Upload size={18} className="mr-2" /> {t("changeImage")}
                        </button>
                      )}

                      {deleteError && (
                        <div className="bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                          {deleteError}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteImage(selectedImage._id)}
                        disabled={isDeleting}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center"
                      >
                        {isDeleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {t("deleting")}
                          </>
                        ) : (
                          <>
                            <Trash2 size={18} className="mr-2" /> {t("deleteImage")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminGallery
