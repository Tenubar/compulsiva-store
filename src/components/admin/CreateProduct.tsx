"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, X, Upload, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import type { ProductType } from "../../App"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"

interface DraftData {
  title: string
  type: ProductType
  price: string
  image: string
  hoverImage: string
  description: string
  materials: string
  sizes: string[]
  shipping: string
  productQuantity: number
  additionalImages: string[]
}

const CreateProduct: React.FC = () => {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<ProductType>("Shirt")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [hoverImage, setHoverImage] = useState("")
  const [description, setDescription] = useState("")
  const [materials, setMaterials] = useState("")
  const [sizeInput, setSizeInput] = useState("")
  const [sizes, setSizes] = useState<string[]>([])
  const [shipping, setShipping] = useState("Standard Shipping: 3-5 Days")
  const [productQuantity, setProductQuantity] = useState(1)
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const navigate = useNavigate()

  // For image carousel
  const [startIndex, setStartIndex] = useState(0)
  const imagesPerView = 4
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // For auto-saving
  const formChangedRef = useRef(false)
  const draftCreatedRef = useRef(false)

  // Check if URL has a draft ID parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const draft = params.get("draft")

    if (draft) {
      loadDraft(draft)
    } else {
      // Create a new draft when component mounts, but only if one hasn't been created yet
      if (!draftCreatedRef.current) {
        createNewDraft()
        draftCreatedRef.current = true
      }
    }
  }, [])

  // Mark form as changed when any field updates
  useEffect(() => {
    formChangedRef.current = true
  }, [
    title,
    type,
    price,
    image,
    hoverImage,
    description,
    materials,
    sizes,
    shipping,
    productQuantity,
    additionalImages,
  ])

  const createNewDraft = async () => {
    try {
      setSavingDraft(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: "New Product Draft",
          productData: {
            title: "",
            type: "Shirt",
            price: "",
            image: "",
            hoverImage: "",
            description: "",
            materials: "",
            sizes: [],
            shipping: "Standard Shipping: 3-5 Days",
            productQuantity: 1,
            additionalImages: [],
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraftId(data._id)
      }
    } catch (err) {
      console.error("Error creating draft:", err)
    } finally {
      setSavingDraft(false)
    }
  }

  const loadDraft = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setDraftId(data._id)

        // Load draft data into form
        const productData = data.productData
        setTitle(productData.title || "")
        setType(productData.type || "Shirt")
        setPrice(productData.price?.toString() || "")
        setImage(productData.image || "")
        setHoverImage(productData.hoverImage || "")
        setDescription(productData.description || "")
        setMaterials(productData.materials || "")
        setSizes(productData.sizes || [])
        setShipping(productData.shipping || "Standard Shipping: 3-5 Days")
        setProductQuantity(productData.productQuantity || 1)
        setAdditionalImages(productData.additionalImages || [])
      } else {
        // If draft not found, create a new one
        if (!draftCreatedRef.current) {
          createNewDraft()
          draftCreatedRef.current = true
        }
      }
    } catch (err) {
      console.error("Error loading draft:", err)
      if (!draftCreatedRef.current) {
        createNewDraft()
        draftCreatedRef.current = true
      }
    }
  }

  const saveDraft = async () => {
    if (!draftId) return Promise.reject(new Error("No draft ID available"))

    try {
      setSavingDraft(true)

      const draftData: DraftData = {
        title,
        type,
        price,
        image,
        hoverImage,
        description,
        materials,
        sizes,
        shipping,
        productQuantity,
        additionalImages,
      }

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title || "Untitled Draft",
          productData: draftData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.status} ${response.statusText}`)
      }

      console.log("Draft saved successfully")
      return response.json()
    } catch (err) {
      console.error("Error saving draft:", err)
      throw err
    } finally {
      setSavingDraft(false)
    }
  }

  // Save draft with specific image field updated
  const saveDraftWithImage = async (fieldName: string, imagePath: string) => {
    if (!draftId) return Promise.reject(new Error("No draft ID available"))

    try {
      setSavingDraft(true)

      // Create a draft data object with current state values
      const draftData: DraftData = {
        title,
        type,
        price,
        image,
        hoverImage,
        description,
        materials,
        sizes,
        shipping,
        productQuantity,
        additionalImages,
      }

      // Update the specific image field
      if (fieldName === "image") {
        draftData.image = imagePath
      } else if (fieldName === "hoverImage") {
        draftData.hoverImage = imagePath
      }

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title || "Untitled Draft",
          productData: draftData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.status} ${response.statusText}`)
      }

      console.log(`Draft saved successfully with updated ${fieldName}`)
      return response.json()
    } catch (err) {
      console.error(`Error saving draft with ${fieldName}:`, err)
      throw err
    } finally {
      setSavingDraft(false)
    }
  }

  // Save draft with updated additional images
  const saveDraftWithAdditionalImages = async (updatedAdditionalImages: string[]) => {
    if (!draftId) return Promise.reject(new Error("No draft ID available"))

    try {
      setSavingDraft(true)

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title || "Untitled Draft",
          productData: {
            title,
            type,
            price,
            image,
            hoverImage,
            description,
            materials,
            sizes,
            shipping,
            productQuantity,
            additionalImages: updatedAdditionalImages,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.status} ${response.statusText}`)
      }

      console.log("Draft saved successfully with updated additional images")
      return response.json()
    } catch (err) {
      console.error("Error saving draft with additional images:", err)
      throw err
    } finally {
      setSavingDraft(false)
    }
  }

  const handleFileUpload = async (
    file: File,
    fieldName: string,
    callback: (path: string) => void,
    oldImagePath?: string,
  ) => {
    if (!file || (file.type !== "image/jpeg" && file.type !== "image/png")) {
      setError("Please select a valid JPG or PNG image")
      return
    }

    setUploading(true)
    setError("")

    // If there's an old image, delete it first
    if (oldImagePath) {
      try {
        await handleDeleteImage(oldImagePath, fieldName)
      } catch (err) {
        console.error("Error deleting old image:", err)
        // Continue with upload even if delete fails
      }
    }

    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/upload/productImage`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Uploaded:", data)

      // Get the image path
      const imagePath = data.image.path

      // Update the state with the image path
      callback(imagePath)

      // Save draft immediately after image upload
      if (draftId) {
        console.log(`Auto-saving draft after ${fieldName} upload...`)
        await saveDraftWithImage(fieldName, imagePath)
        console.log(`Draft auto-saved successfully after ${fieldName} upload`)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imagePath: string, fieldName: string) => {
    try {
      setDeletingImage(imagePath)
      setError("")

      // Find the image in the database by path and delete it
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/delete-by-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ path: imagePath }),
      })

      if (response.ok) {
        // Clear the image state based on fieldName
        if (fieldName === "image") {
          setImage("")
        } else if (fieldName === "hoverImage") {
          setHoverImage("")
        }

        // Save draft immediately after image deletion
        if (draftId) {
          console.log(`Auto-saving draft after ${fieldName} deletion...`)
          await saveDraftWithImage(fieldName, "")
          console.log(`Draft auto-saved successfully after ${fieldName} deletion`)
        }
      } else {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete image")
      }
    } catch (err: any) {
      console.error("Delete image error:", err)
      setError(err.message || "Failed to delete image")
    } finally {
      setDeletingImage(null)
    }
  }

  const handleDeleteAdditionalImage = async (imagePath: string) => {
    try {
      setDeletingImage(imagePath)
      setError("")

      // Find the image in the database by path and delete it
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/delete-by-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ path: imagePath }),
      })

      if (response.ok) {
        // Remove the image from the additionalImages array
        const updatedAdditionalImages = additionalImages.filter((img) => img !== imagePath)
        setAdditionalImages(updatedAdditionalImages)

        // Save draft immediately after image deletion
        if (draftId) {
          console.log("Auto-saving draft after additional image deletion...")
          await saveDraftWithAdditionalImages(updatedAdditionalImages)
          console.log("Draft auto-saved successfully after additional image deletion")
        }
      } else {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete image")
      }
    } catch (err: any) {
      console.error("Delete image error:", err)
      setError(err.message || "Failed to delete image")
    } finally {
      setDeletingImage(null)
    }
  }

  const handleAddAdditionalImage = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/jpeg, image/png"
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploading(true)
        setError("")

        try {
          const formData = new FormData()
          formData.append("image", file)

          const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/upload/productImage`, {
            method: "POST",
            body: formData,
          })

          const data = await response.json()
          console.log("Uploaded additional image:", data)

          // Get the image path
          const imagePath = data.image.path

          // Update state with the new image
          const newAdditionalImages = [...additionalImages, imagePath]
          setAdditionalImages(newAdditionalImages)

          // Save draft immediately after adding an additional image
          if (draftId) {
            console.log("Auto-saving draft after adding additional image...")
            await saveDraftWithAdditionalImages(newAdditionalImages)
            console.log("Draft auto-saved successfully after adding additional image")
          }
        } catch (err) {
          console.error("Upload error:", err)
          setError("Failed to upload")
        } finally {
          setUploading(false)
        }
      }
    }
    fileInput.click()
  }

  const handleAddSize = () => {
    if (sizeInput.trim()) {
      const newSizes = [...sizes, sizeInput.trim()]
      setSizes(newSizes)
      setSizeInput("")

      // Save draft immediately after adding a size
      if (draftId) {
        formChangedRef.current = true
        saveDraft()
        formChangedRef.current = false
      }
    }
  }

  const handleRemoveSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index)
    setSizes(newSizes)

    // Save draft immediately after removing a size
    if (draftId) {
      formChangedRef.current = true
      saveDraft()
      formChangedRef.current = false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that all required fields have a value.
    if (
      !title.trim() ||
      !price.trim() ||
      !image.trim() ||
      !hoverImage.trim() ||
      !description.trim() ||
      !materials.trim() ||
      sizes.length === 0 ||
      !shipping.trim() ||
      productQuantity < 1
    ) {
      setError("Please fill all the required inputs and add at least one size")
      return
    }

    setLoading(true)
    setError("")

    try {
      // First create the product
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          type,
          price: Number(price),
          image,
          hoverImage,
          description,
          materials,
          sizes,
          shipping,
          productQuantity,
          additionalImages,
        }),
      })

      if (response.ok) {
        // Before deleting the draft, update it to remove image references
        // This prevents the server from deleting the images when the draft is deleted
        if (draftId) {
          try {
            // First update the draft to remove image references
            await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                title: title || "Untitled Draft",
                productData: {
                  title,
                  type,
                  price,
                  // Remove image references to prevent them from being deleted
                  image: "",
                  hoverImage: "",
                  description,
                  materials,
                  sizes,
                  shipping,
                  productQuantity,
                  additionalImages: [],
                },
              }),
            })

            // Then delete the draft
            await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
              method: "DELETE",
              credentials: "include",
            })
          } catch (err) {
            console.error("Error handling draft cleanup:", err)
            // Continue even if there's an error with draft cleanup
          }
        }

        navigate("/")
      } else {
        const data = await response.json()
        setError(data.message || "Failed to create product")
      }
    } catch (err) {
      setError("An error occurred while creating the product")
    } finally {
      setLoading(false)
    }
  }

  // Handle navigation for image carousel
  const scrollLeft = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1)
    }
  }

  const scrollRight = () => {
    if (startIndex + imagesPerView < additionalImages.length) {
      setStartIndex(startIndex + 1)
    }
  }

  // All images for the carousel
  const allImages = [...(image ? [image] : []), ...(hoverImage ? [hoverImage] : []), ...additionalImages]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Home
      </button>

      <div className="max-w-md mx-auto">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create New Product</h2>

        {savingDraft && (
          <div className="mt-2 text-center text-sm text-gray-500">
            <span className="inline-block animate-pulse">Saving draft...</span>
          </div>
        )}

        {/* Image Visualizer */}
        {allImages.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Product Images</h3>
            <div className="relative">
              {startIndex > 0 && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div
                ref={imageContainerRef}
                className="flex overflow-x-auto scrollbar-hide gap-2 py-2"
                style={{ scrollBehavior: "smooth" }}
              >
                {allImages.slice(startIndex, startIndex + imagesPerView).map((img, index) => (
                  <div key={index} className="flex-shrink-0 w-20 h-20 relative">
                    <img
                      src={getImageUrl(img) || "/placeholder.svg"}
                      alt={`Product image ${index + startIndex + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = getPlaceholder(80, 80)
                      }}
                    />
                  </div>
                ))}
              </div>

              {startIndex + imagesPerView < allImages.length && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {allImages.length} image{allImages.length !== 1 ? "s" : ""} total
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ProductType)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {(["Shirt", "Pants", "Shoes", "Bracelet", "Collar"] as ProductType[]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="productQuantity" className="block text-sm font-medium text-gray-700">
              Product Quantity
            </label>
            <input
              type="number"
              id="productQuantity"
              required
              min="1"
              value={productQuantity}
              onChange={(e) => {
                setProductQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="image"
                required
                value={image}
                readOnly
                className="mt-1 block flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className={`ml-2 px-4 py-2 text-sm font-medium text-white 
                ${uploading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
                rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => {
                  const fileInput = document.createElement("input")
                  fileInput.type = "file"
                  fileInput.accept = "image/jpeg, image/png"
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      handleFileUpload(file, "image", (path) => setImage(path), image)
                    }
                  }
                  fileInput.click()
                }}
                disabled={uploading || deletingImage === image}
              >
                {uploading ? (
                  "Saving..."
                ) : image ? (
                  <span className="flex items-center">
                    <RefreshCw size={16} className="mr-1" /> Change
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
              {image && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image, "image")}
                  disabled={deletingImage === image}
                  className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    deletingImage === image ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="hoverImage" className="block text-sm font-medium text-gray-700">
              Hover Image
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="hoverImage"
                required
                value={hoverImage}
                readOnly
                className="mt-1 block flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className={`ml-2 px-4 py-2 text-sm font-medium text-white 
                ${uploading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
                rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => {
                  const fileInput = document.createElement("input")
                  fileInput.type = "file"
                  fileInput.accept = "image/jpeg, image/png"
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      handleFileUpload(file, "hoverImage", (path) => setHoverImage(path), hoverImage)
                    }
                  }
                  fileInput.click()
                }}
                disabled={uploading || deletingImage === hoverImage}
              >
                {uploading ? (
                  "Saving..."
                ) : hoverImage ? (
                  <span className="flex items-center">
                    <RefreshCw size={16} className="mr-1" /> Change
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
              {hoverImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(hoverImage, "hoverImage")}
                  disabled={deletingImage === hoverImage}
                  className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    deletingImage === hoverImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="materials" className="block text-sm font-medium text-gray-700">
              Materials
            </label>
            <input
              type="text"
              id="materials"
              required
              value={materials}
              onChange={(e) => {
                setMaterials(e.target.value)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sizes</label>
            <div className="flex items-center mt-1">
              <input
                type="text"
                placeholder="Enter size"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            <ul className="mt-2">
              {sizes.map((size, index) => (
                <li
                  key={index}
                  className="inline-flex items-center justify-between bg-gray-100 rounded-md text-gray-700 px-3 py-1 mr-2 mt-2"
                >
                  <span>{size}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(index)}
                    className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label htmlFor="shipping" className="block text-sm font-medium text-gray-700">
              Shipping
            </label>
            <input
              type="text"
              id="shipping"
              required
              value={shipping}
              onChange={(e) => {
                setShipping(e.target.value)
                formChangedRef.current = true
              }}
              onBlur={() => {
                if (draftId && formChangedRef.current) {
                  saveDraft()
                  formChangedRef.current = false
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="additionalImages" className="block text-sm font-medium text-gray-700">
              Additional Images
            </label>
            <div className="mt-1">
              <button
                type="button"
                onClick={handleAddAdditionalImage}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload size={16} className="mr-2 inline-block" /> Add Image
              </button>
              <div className="mt-2 flex flex-wrap gap-2">
                {additionalImages.map((img, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={getImageUrl(img) || "/placeholder.svg"}
                      alt={`Additional image ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = getPlaceholder(80, 80)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteAdditionalImage(img)}
                      disabled={deletingImage === img}
                      className={`absolute top-0 right-0 p-1 text-white bg-red-600 hover:bg-red-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                        deletingImage === img ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProduct
