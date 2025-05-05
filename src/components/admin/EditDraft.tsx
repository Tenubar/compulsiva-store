"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, X, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react"
import type { ProductType } from "../../App"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"
import GalleryModal from "./GalleryModal"
import ConfirmationModal from "./ConfirmationModal"

// Update the DraftData interface to include color in sizes
interface DraftData {
  title: string
  type: ProductType
  price: string
  image: string
  hoverImage: string
  description: string
  materials: string
  sizes: Array<{ size: string; quantity: number; colors: string[] }>
  shipping: Array<{ name: string; price: number }>
  productQuantity: number
  additionalImages: string[]
}

const EditDraft: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<ProductType>("Shirt")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [hoverImage, setHoverImage] = useState("")
  const [description, setDescription] = useState("")
  const [materials, setMaterials] = useState("")
  // Add state for color input after the sizeQuantityInput state
  const [sizeInput, setSizeInput] = useState("")
  const [sizeQuantityInput, setSizeQuantityInput] = useState("")
  const [sizeColorInput, setSizeColorInput] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [sizes, setSizes] = useState<Array<{ size: string; quantity: number; colors: string[] }>>([])
  const [shippingName, setShippingName] = useState("")
  const [shippingPrice, setShippingPrice] = useState("")
  const [shippingOptions, setShippingOptions] = useState<Array<{ name: string; price: number }>>([])
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
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const formChangedRef = useRef(false)

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [selectedImageField, setSelectedImageField] = useState<"image" | "hoverImage" | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ path: string; field: "image" | "hoverImage" } | null>(null)

  useEffect(() => {
    if (id) {
      loadDraft(id)
    } else {
      navigate("/admin/drafts")
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [id, navigate])

  // Set up auto-save timer
  useEffect(() => {
    // No need for interval timer anymore
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [draftId])

  // Mark form as changed when any field updates
  useEffect(() => {
    formChangedRef.current = true
  }, [title, type, price, image, hoverImage, description, materials, sizes, shippingOptions, additionalImages])

  // Update the loadDraft function to handle color in sizes
  const loadDraft = async (draftId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/drafts/${draftId}`, {
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
        setSizes(
          Array.isArray(productData.sizes)
            ? productData.sizes.map((s: string | { size: string; quantity: number; colors?: string[] | string }) =>
                typeof s === "string"
                  ? { size: s, quantity: 1, colors: ["Default"] }
                  : {
                      ...s,
                      colors: s.colors ? (Array.isArray(s.colors) ? s.colors : [s.colors]) : ["Default"],
                    },
              )
            : [],
        )
        setShippingOptions(productData.shipping || [])
        setAdditionalImages(productData.additionalImages || [])
      } else {
        // If draft not found, redirect to drafts page
        setError("Draft not found")
        setTimeout(() => {
          navigate("/admin/drafts")
        }, 2000)
      }
    } catch (err) {
      console.error("Error loading draft:", err)
      setError("Error loading draft")
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    if (!draftId) return

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
        shipping: shippingOptions,
        productQuantity: 1,
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
    } catch (err) {
      console.error("Error saving draft:", err)
    } finally {
      setSavingDraft(false)
    }
  }

  // Add specialized save functions for images
  const saveDraftWithImage = async (fieldName: "image" | "hoverImage", imagePath: string) => {
    if (!draftId) return

    try {
      setSavingDraft(true)
      console.log(`Saving draft with ${fieldName}:`, imagePath)

      const draftData: DraftData = {
        title,
        type,
        price,
        image: fieldName === "image" ? imagePath : image,
        hoverImage: fieldName === "hoverImage" ? imagePath : hoverImage,
        description,
        materials,
        sizes,
        shipping: shippingOptions,
        productQuantity: 1,
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
        throw new Error(`Failed to save draft with ${fieldName}: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error(`Error saving draft with ${fieldName}:`, err)
    } finally {
      setSavingDraft(false)
    }
  }

  // Add specialized save function for additional images
  const saveDraftWithAdditionalImages = async (newAdditionalImages: string[]) => {
    if (!draftId) return

    try {
      setSavingDraft(true)
      console.log("Saving draft with additional images:", newAdditionalImages)

      const draftData: DraftData = {
        title,
        type,
        price,
        image,
        hoverImage,
        description,
        materials,
        sizes,
        shipping: shippingOptions,
        productQuantity: 1,
        additionalImages: newAdditionalImages,
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
        throw new Error(`Failed to save draft with additional images: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error("Error saving draft with additional images:", err)
    } finally {
      setSavingDraft(false)
    }
  }

  const handleFileUpload = async (file: File, fieldName: "image" | "hoverImage", oldImagePath?: string) => {
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

      // Check for duplicates
      const allImages = [...(image ? [image] : []), ...(hoverImage ? [hoverImage] : []), ...additionalImages]
      if (allImages.includes(imagePath)) {
        setError("Can't add duplicated images")
        return
      }

      // Update the state with the image path
      if (fieldName === "image") {
        setImage(imagePath)
      } else if (fieldName === "hoverImage") {
        setHoverImage(imagePath)
      }

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

  const handleDeleteImage = async (imagePath: string, fieldName: "image" | "hoverImage") => {
    try {
      setDeletingImage(imagePath)
      setError("")

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
          await saveDraftWithAdditionalImages(updatedAdditionalImages)
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

          // Check for duplicates
          const allImages = [...(image ? [image] : []), ...(hoverImage ? [hoverImage] : []), ...additionalImages]
          if (allImages.includes(imagePath)) {
            setError("Can't add duplicated images")
            return
          }

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

  // Add this array of available colors
  const availableColors = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Pink",
    "Orange",
    "Brown",
    "Gray",
    "Teal",
  ]

  // Add this function to toggle color selection
  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color))
    } else {
      setSelectedColors([...selectedColors, color])
    }
  }

  // Update the handleAddSize function to include color
  const handleAddSize = () => {
    if (sizeInput.trim() && sizeQuantityInput.trim()) {
      const quantity = Number.parseInt(sizeQuantityInput)
      if (isNaN(quantity) || quantity < 1) {
        setError("Quantity must be a positive number")
        return
      }

      const newSize = {
        size: sizeInput.trim(),
        quantity,
        colors: selectedColors.length > 0 ? selectedColors : ["Default"],
      }
      const newSizes = [...sizes, newSize]
      setSizes(newSizes)
      setSizeInput("")
      setSizeQuantityInput("")
      setSelectedColors([])
      setShowColorDropdown(false)

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

  const handleAddShipping = () => {
    if (shippingName.trim() && shippingPrice.trim()) {
      const newShipping = {
        name: shippingName.trim(),
        price: Number(shippingPrice),
      }
      setShippingOptions([...shippingOptions, newShipping])
      setShippingName("")
      setShippingPrice("")
      formChangedRef.current = true
    }
  }

  const handleRemoveShipping = (index: number) => {
    const newShippingOptions = shippingOptions.filter((_, i) => i !== index)
    setShippingOptions(newShippingOptions)
    formChangedRef.current = true
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
      shippingOptions.length === 0
    ) {
      setError("Please fill all the required inputs and add at least one size and shipping option")
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
          shipping: shippingOptions,
          productQuantity: 1,
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
                  shipping: [],
                  productQuantity: 1,
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

  const handleGallerySelect = (imagePath: string) => {
    // Check for duplicates
    const allImages = [...(image ? [image] : []), ...(hoverImage ? [hoverImage] : []), ...additionalImages]
    if (allImages.includes(imagePath)) {
      setError("Can't add duplicated images")
      return
    }

    if (selectedImageField === "image") {
      setImage(imagePath)
      if (draftId) {
        saveDraftWithImage("image", imagePath)
      }
    } else if (selectedImageField === "hoverImage") {
      setHoverImage(imagePath)
      if (draftId) {
        saveDraftWithImage("hoverImage", imagePath)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading draft...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/admin/drafts")}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Drafts
      </button>

      <div className="max-w-md mx-auto">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Edit Draft</h2>

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
                      handleFileUpload(file, "image", image)
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
              <button
                type="button"
                className={`ml-2 px-4 py-2 text-sm font-medium text-white 
      ${uploading ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} 
      rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                onClick={() => {
                  setSelectedImageField("image")
                  setIsGalleryModalOpen(true)
                }}
                disabled={uploading}
              >
                Gallery
              </button>
              {image && (
                <button
                  type="button"
                  onClick={() => {
                    setImageToDelete({ path: image, field: "image" })
                    setIsDeleteModalOpen(true)
                  }}
                  disabled={deletingImage === image}
                  className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    deletingImage === image ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {image && (
              <button
                type="button"
                onClick={() => {
                  setImage("")
                  saveDraftWithImage("image", "")
                }}
                className="mt-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
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
                      handleFileUpload(file, "hoverImage", hoverImage)
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
              <button
                type="button"
                className={`ml-2 px-4 py-2 text-sm font-medium text-white 
      ${uploading ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} 
      rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                onClick={() => {
                  setSelectedImageField("hoverImage")
                  setIsGalleryModalOpen(true)
                }}
                disabled={uploading}
              >
                Gallery
              </button>
              {hoverImage && (
                <button
                  type="button"
                  onClick={() => {
                    setImageToDelete({ path: hoverImage, field: "hoverImage" })
                    setIsDeleteModalOpen(true)
                  }}
                  disabled={deletingImage === hoverImage}
                  className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    deletingImage === hoverImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {hoverImage && (
              <button
                type="button"
                onClick={() => {
                  setHoverImage("")
                  saveDraftWithImage("hoverImage", "")
                }}
                className="mt-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <div>
            <label htmlFor="sizes" className="block text-sm font-medium text-gray-700">
              Sizes
            </label>
            <div className="flex items-center mt-1">
              <input
                type="text"
                id="sizeInput"
                placeholder="Enter size"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Quantity"
                min="1"
                value={sizeQuantityInput}
                onChange={(e) => setSizeQuantityInput(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ml-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="relative w-full ml-2">
                <button
                  type="button"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {selectedColors.length > 0 ? selectedColors.join(", ") : "Select colors"}
                </button>
                {showColorDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                    {availableColors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleColor(color)}
                      >
                        <div className="flex items-center">
                          <span
                            className="w-4 h-4 mr-2 rounded-full"
                            style={{ backgroundColor: color.toLowerCase() }}
                          ></span>
                          <span>{color}</span>
                        </div>
                        {selectedColors.includes(color) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddSize}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            <div className="mt-2">
              {sizes.map((sizeObj, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 text-sm text-gray-700"
                >
                  {sizeObj.size} - {sizeObj.quantity} units -{" "}
                  {Array.isArray(sizeObj.colors) ? sizeObj.colors.join(", ") : sizeObj.colors}
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(index)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
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
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="materials" className="block text-sm font-medium text-gray-700">
              Materials
            </label>
            <textarea
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
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Shipping Options</label>
            <div className="flex items-center mt-1">
              <input
                type="text"
                placeholder="Shipping name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Price"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ml-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddShipping}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            <ul className="mt-2">
              {shippingOptions.map((option, index) => (
                <li
                  key={index}
                  className="inline-flex items-center justify-between bg-gray-100 rounded-md text-gray-700 px-3 py-1 mr-2 mt-2"
                >
                  <span>
                    {option.name} - ${option.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveShipping(index)}
                    className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Images</label>
            <div className="mt-1 flex items-center">
              <button
                type="button"
                onClick={handleAddAdditionalImage}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Image
              </button>
            </div>
            <div className="mt-2 flex flex-wrap -m-1">
              {additionalImages.map((img, index) => (
                <div key={index} className="m-1 relative">
                  <img
                    src={getImageUrl(img) || "/placeholder.svg"}
                    alt={`Additional product image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = getPlaceholder(80, 80)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAdditionalImage(img)}
                    disabled={deletingImage === img}
                    className={`absolute top-0 right-0 m-1 p-1 text-white bg-red-600 hover:bg-red-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      deletingImage === img ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false)
          setSelectedImageField(null)
        }}
        onSelect={handleGallerySelect}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setImageToDelete(null)
        }}
        onConfirm={() => {
          if (imageToDelete) {
            handleDeleteImage(imageToDelete.path, imageToDelete.field)
          }
        }}
        title="Delete Image"
        message="This will remove the image from the whole page. Are you sure you want to continue?"
      />
    </div>
  )
}

export default EditDraft
