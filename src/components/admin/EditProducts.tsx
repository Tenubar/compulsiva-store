"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Edit2, X, Upload, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react"
import type { ProductType } from "../../App"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"
import GalleryModal from "./GalleryModal"
import ConfirmationModal from "./ConfirmationModal"

// Update the Product interface to include color in sizes
interface Product {
  _id: string
  title: string
  type: ProductType
  price: number
  image: string
  hoverImage: string
  description?: string
  materials?: string
  sizes?: Array<{ size: string; quantity: number; color: string }>
  shipping?: Array<{ name: string; price: number }>
  productQuantity?: number
  additionalImages?: string[]
}

const EditProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null) // Store original state for cancel
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  // Add state for color input after the sizeQuantityInput state
  const [sizeInput, setSizeInput] = useState("")
  const [sizeQuantityInput, setSizeQuantityInput] = useState("")
  // Replace selectedColors array with selectedColor string
  const [selectedColor, setSelectedColor] = useState("")
  const [customColor, setCustomColor] = useState("")
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [isCustomColor, setIsCustomColor] = useState(false)
  const [newlyAddedImages, setNewlyAddedImages] = useState<string[]>([]) // Track newly added images
  // Add a new state variable for the "Use same image" checkbox after the other state declarations (around line 50)
  const [useSameImage, setUseSameImage] = useState(false)
  const navigate = useNavigate()
  const [productQuantity, setProductQuantity] = useState<number>(1)

  // For image carousel
  const [startIndex, setStartIndex] = useState(0)
  const [isMaterialsRequired, setIsMaterialsRequired] = useState(true)
  const [isSizesRequired, setIsSizesRequired] = useState(true)
  const imagesPerView = 4
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const [shippingName, setShippingName] = useState("")
  const [shippingPrice, setShippingPrice] = useState("")

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [selectedImageField, setSelectedImageField] = useState<"image" | "hoverImage" | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ path: string; field: "image" | "hoverImage" } | null>(null)

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

  // Add saveProductWithImage function
  const saveProductWithImage = async (fieldName: "image" | "hoverImage", imagePath: string) => {
    if (!selectedProduct?._id) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...selectedProduct,
          [fieldName]: imagePath,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save product with ${fieldName}`)
      }
    } catch (err) {
      console.error(`Error saving product with ${fieldName}:`, err)
      throw err
    }
  }

  // Add saveProductWithAdditionalImages function
  const saveProductWithAdditionalImages = async (newAdditionalImages: string[]) => {
    if (!selectedProduct?._id) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...selectedProduct,
          additionalImages: newAdditionalImages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save product with additional images")
      }
    } catch (err) {
      console.error("Error saving product with additional images:", err)
      throw err
    }
  }

  // Updated fetch function with AbortController
  const fetchProducts = useCallback(async () => {
    const controller = new AbortController()
    const signal = controller.signal

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/products`, {
        credentials: "include",
        signal, // Pass abort signal
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        setError("Failed to fetch products")
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("An error occurred while fetching products")
      }
    }

    return () => controller.abort() // Cleanup abort controller
  }, [])

  // Only fetch products once when the component mounts
  useEffect(() => {
    const controller = new AbortController()
    fetchProducts()

    return () => controller.abort() // Cleanup function to abort request
  }, [fetchProducts])

  // When a product is selected, update the required states based on whether the fields have values
  useEffect(() => {
    if (selectedProduct) {
      // If materials exists and is not empty, set materials as required
      setIsMaterialsRequired(!!selectedProduct.materials && selectedProduct.materials.trim() !== "")
      // If sizes exists and has items, set sizes as required
      setIsSizesRequired(!!selectedProduct.sizes && selectedProduct.sizes.length > 0)
      // Set product quantity
      setProductQuantity(selectedProduct.productQuantity || 1)
      // Check if hover image is the same as main image
      setUseSameImage(selectedProduct.image === selectedProduct.hoverImage)
    }
  }, [selectedProduct])

  // Modified to immediately update the image in the database
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
      if (selectedProduct) {
        const allImages = [
          ...(selectedProduct.image ? [selectedProduct.image] : []),
          ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
          ...(selectedProduct.additionalImages || []),
        ]
        if (allImages.includes(imagePath)) {
          setError("Can't add duplicated images")
          return
        }

        // Update the state with the image path
        setSelectedProduct({
          ...selectedProduct,
          [fieldName]: imagePath,
        } as Product)

        // Save product immediately after image upload
        if (selectedProduct._id) {
          console.log(`Auto-saving product after ${fieldName} upload...`)
          await saveProductWithImage(fieldName, imagePath)
          console.log(`Product auto-saved successfully after ${fieldName} upload`)
        }
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imagePath: string, fieldName: "image" | "hoverImage" | "additionalImages") => {
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
        // Clear the image state
        if (selectedProduct) {
          if (fieldName === "additionalImages") {
            const updatedImages = selectedProduct.additionalImages?.filter((i) => i !== imagePath) || []
            setSelectedProduct({
              ...selectedProduct,
              additionalImages: updatedImages,
            } as Product)
          } else {
            setSelectedProduct({
              ...selectedProduct,
              [fieldName]: "",
            } as Product)
          }

          // Save product immediately after image deletion
          if (selectedProduct._id) {
            if (fieldName === "additionalImages") {
              await saveProductWithAdditionalImages(
                selectedProduct.additionalImages?.filter((i) => i !== imagePath) || [],
              )
            } else {
              await saveProductWithImage(fieldName, "")
            }
          }
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

  const handleAddSize = () => {
    if (!selectedProduct || !isSizesRequired) return
    if (sizeInput.trim() && sizeQuantityInput.trim()) {
      const quantity = Number.parseInt(sizeQuantityInput)
      if (isNaN(quantity) || quantity < 1) {
        setError("Quantity must be a positive number")
        return
      }

      // Use either the selected color, custom color, or default
      let finalColor = "Default"
      if (isCustomColor && customColor.trim()) {
        finalColor = customColor.trim()
      } else if (selectedColor) {
        finalColor = selectedColor
      }

      const newSize = {
        size: sizeInput.trim(),
        quantity,
        color: finalColor,
      }
      const updatedSizes = [...(selectedProduct.sizes || []), newSize]
      setSelectedProduct({ ...selectedProduct, sizes: updatedSizes })
      setSizeInput("")
      setSizeQuantityInput("")
      setSelectedColor("")
      setCustomColor("")
      setShowColorDropdown(false)
    }
  }

  const handleRemoveSize = (index: number) => {
    if (!selectedProduct || !selectedProduct.sizes || !isSizesRequired) return
    const updatedSizes = selectedProduct.sizes.filter((_, i) => i !== index)
    setSelectedProduct({ ...selectedProduct, sizes: updatedSizes })
  }

  // Update the handleAddAdditionalImage function to save images immediately
  const handleAddAdditionalImage = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/jpeg, image/png"
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && selectedProduct) {
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
          const allImages = [
            ...(selectedProduct.image ? [selectedProduct.image] : []),
            ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
            ...(selectedProduct.additionalImages || []),
          ]
          if (allImages.includes(imagePath)) {
            setError("Can't add duplicated images")
            return
          }

          // Update state with the new image
          const newAdditionalImages = [...(selectedProduct.additionalImages || []), imagePath]
          setSelectedProduct({
            ...selectedProduct,
            additionalImages: newAdditionalImages,
          } as Product)

          // Save product immediately after adding an additional image
          if (selectedProduct._id) {
            console.log("Auto-saving product after adding additional image...")
            await saveProductWithAdditionalImages(newAdditionalImages)
            console.log("Product auto-saved successfully after adding additional image")
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

  const handleAddShipping = () => {
    if (!selectedProduct) return
    if (shippingName.trim() && shippingPrice.trim()) {
      const newShipping = {
        name: shippingName.trim(),
        price: Number(shippingPrice),
      }
      setSelectedProduct({
        ...selectedProduct,
        shipping: [...(selectedProduct.shipping || []), newShipping],
      })
      setShippingName("")
      setShippingPrice("")
    }
  }

  const handleRemoveShipping = (index: number) => {
    if (!selectedProduct) return
    const newShippingOptions = (selectedProduct.shipping || []).filter((_, i) => i !== index)
    setSelectedProduct({
      ...selectedProduct,
      shipping: newShippingOptions,
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setLoading(true)
    setError("")

    try {
      // Modify the productToUpdate object in the handleUpdate function (around line 400)
      const productToUpdate = {
        ...selectedProduct,
        productQuantity: isSizesRequired ? 0 : productQuantity,
        hoverImage: useSameImage ? selectedProduct.image : selectedProduct.hoverImage,
      }

      console.log("Updating product with ID:", selectedProduct._id)
      console.log("Update data:", selectedProduct)

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(productToUpdate),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        console.log("Product updated successfully:", updatedProduct)

        // Update the products list with the updated product
        setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)))

        // Clear the newly added images list since they're now part of the product
        setNewlyAddedImages([])

        // Clear selected product
        setSelectedProduct(null)
        setOriginalProduct(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update product")
      }
    } catch (err: any) {
      console.error("Update error:", err)
      setError(err.message || "An error occurred while updating the product")
    } finally {
      setLoading(false)
    }
  }

  // Update the handleCancel function to properly revert changes
  const handleCancel = async () => {
    // Delete any newly added images
    if (newlyAddedImages.length > 0) {
      setError("")

      for (const imagePath of newlyAddedImages) {
        try {
          await fetch(`${import.meta.env.VITE_SITE_URL}/api/images/delete-by-path`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ path: imagePath }),
          })
        } catch (err) {
          console.error("Error cleaning up image:", err)
          // Continue with other deletions even if one fails
        }
      }

      // If we've added images to the product in the database, revert those changes
      if (originalProduct && selectedProduct) {
        try {
          await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              ...originalProduct,
              additionalImages: originalProduct.additionalImages || [],
            }),
          })

          // Update the products list with the original product
          setProducts(products.map((p) => (p._id === originalProduct._id ? originalProduct : p)))
        } catch (err) {
          console.error("Error reverting product changes:", err)
        }
      }

      setNewlyAddedImages([])
    }

    // Reset to original state
    setSelectedProduct(null)
    setOriginalProduct(null)
  }

  // Handle navigation for image carousel
  const scrollLeft = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1)
    }
  }

  const scrollRight = () => {
    if (selectedProduct) {
      const allImages = [
        ...(selectedProduct.image ? [selectedProduct.image] : []),
        ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
        ...(selectedProduct.additionalImages || []),
      ]

      if (startIndex + imagesPerView < allImages.length) {
        setStartIndex(startIndex + 1)
      }
    }
  }

  const handleGallerySelect = (imagePath: string) => {
    if (!selectedProduct) return

    // Check for duplicates
    const allImages = [
      ...(selectedProduct.image ? [selectedProduct.image] : []),
      ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
      ...(selectedProduct.additionalImages || []),
    ]
    if (allImages.includes(imagePath)) {
      setError("Can't add duplicated images")
      return
    }

    if (selectedImageField === "image") {
      setSelectedProduct({ ...selectedProduct, image: imagePath } as Product)
      if (selectedProduct._id) {
        handleFileUpload(new File([], ""), "image", selectedProduct.image)
      }
    } else if (selectedImageField === "hoverImage") {
      setSelectedProduct({ ...selectedProduct, hoverImage: imagePath } as Product)
      if (selectedProduct._id) {
        handleFileUpload(new File([], ""), "hoverImage", selectedProduct.hoverImage)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Home
      </button>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Edit Products</h2>

        {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {selectedProduct ? (
          <form onSubmit={handleUpdate} className="space-y-6 bg-white p-6 rounded-lg shadow">
            {/* Image Visualizer */}
            {selectedProduct && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Product Images</h3>
                <div className="relative">
                  {startIndex > 0 && (
                    <button
                      type="button"
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
                    {[
                      ...(selectedProduct.image ? [selectedProduct.image] : []),
                      ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
                      ...(selectedProduct.additionalImages || []),
                    ]
                      .slice(startIndex, startIndex + imagesPerView)
                      .map((img, index) => (
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

                  {selectedProduct &&
                    [
                      ...(selectedProduct.image ? [selectedProduct.image] : []),
                      ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
                      ...(selectedProduct.additionalImages || []),
                    ].length >
                      startIndex + imagesPerView && (
                      <button
                        type="button"
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10"
                      >
                        <ChevronRight size={20} />
                      </button>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {
                    [
                      ...(selectedProduct.image ? [selectedProduct.image] : []),
                      ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
                      ...(selectedProduct.additionalImages || []),
                    ].length
                  }{" "}
                  image
                  {[
                    ...(selectedProduct.image ? [selectedProduct.image] : []),
                    ...(selectedProduct.hoverImage ? [selectedProduct.hoverImage] : []),
                    ...(selectedProduct.additionalImages || []),
                  ].length !== 1
                    ? "s"
                    : ""}{" "}
                  total
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={selectedProduct.title}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={selectedProduct.type}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, type: e.target.value as ProductType })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              >
                {(["Shirt", "Pants", "Shoes", "Bracelet", "Collar", "Other"] as ProductType[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                value={selectedProduct.price}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            {/* Product Quantity */}
            <div>
              <label htmlFor="productQuantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                id="productQuantity"
                min="0"
                value={productQuantity}
                onChange={(e) => setProductQuantity(Number(e.target.value))}
                disabled={isSizesRequired}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isSizesRequired ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Sizes</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sizesRequired"
                    checked={isSizesRequired}
                    onChange={(e) => setIsSizesRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sizesRequired" className="ml-2 text-sm text-gray-600">
                    Required
                  </label>
                </div>
              </div>
              <div className="flex items-center mt-1 space-x-2">
                <input
                  type="text"
                  placeholder="Enter size"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !isSizesRequired ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={!isSizesRequired}
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={sizeQuantityInput}
                  onChange={(e) => setSizeQuantityInput(e.target.value)}
                  className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !isSizesRequired ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={!isSizesRequired}
                />
                <div className="relative w-full">
                  {isCustomColor ? (
                    <input
                      type="text"
                      placeholder="Custom color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !isSizesRequired ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      disabled={!isSizesRequired}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => isSizesRequired && setShowColorDropdown(!showColorDropdown)}
                        className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          !isSizesRequired ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        disabled={!isSizesRequired}
                      >
                        {selectedColor || "Select color"}
                      </button>
                      {showColorDropdown && isSizesRequired && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                          {availableColors.map((color) => (
                            <div
                              key={color}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedColor(color)
                                setShowColorDropdown(false)
                                setIsCustomColor(false)
                              }}
                            >
                              <div className="flex items-center">
                                <span
                                  className="w-4 h-4 mr-2 rounded-full"
                                  style={{ backgroundColor: color.toLowerCase() }}
                                ></span>
                                <span>{color}</span>
                              </div>
                              {selectedColor === color && (
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
                          <div
                            className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                            onClick={() => setIsCustomColor(true)}
                          >
                            <span className="text-blue-600">+ Add custom color</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {isCustomColor && isSizesRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomColor(false)
                        setCustomColor("")
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSize}
                  disabled={!isSizesRequired}
                  className={`px-4 py-2 text-sm font-medium text-white ${
                    !isSizesRequired ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Add
                </button>
              </div>
              {selectedProduct?.sizes && selectedProduct.sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProduct.sizes.map((sizeObj, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center justify-between bg-gray-100 rounded-md text-gray-700 px-3 py-1 mr-2 mt-2"
                    >
                      <div className="flex items-center">
                        <span
                          className="w-4 h-4 mr-2 rounded-full"
                          style={{ backgroundColor: sizeObj.color.toLowerCase() }}
                        ></span>
                        <span>
                          {sizeObj.size} - {sizeObj.quantity} units - {sizeObj.color}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        disabled={!isSizesRequired}
                        className={`ml-2 ${
                          !isSizesRequired ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-700"
                        } focus:outline-none`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={selectedProduct.description || ""}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Materials</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="materialsRequired"
                    checked={isMaterialsRequired}
                    onChange={(e) => setIsMaterialsRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="materialsRequired" className="ml-2 text-sm text-gray-600">
                    Required
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={selectedProduct.materials || ""}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, materials: e.target.value })}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
                  !isMaterialsRequired ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!isMaterialsRequired}
              />
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
                {(selectedProduct?.shipping || []).map((option, index) => (
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
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="image"
                  required
                  value={selectedProduct?.image || ""}
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
                      if (file && selectedProduct) {
                        handleFileUpload(file, "image", selectedProduct.image)
                      }
                    }
                    fileInput.click()
                  }}
                  disabled={uploading || deletingImage === selectedProduct?.image}
                >
                  {uploading ? (
                    "Saving..."
                  ) : selectedProduct?.image ? (
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
                {selectedProduct?.image && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageToDelete({ path: selectedProduct.image, field: "image" })
                      setIsDeleteModalOpen(true)
                    }}
                    disabled={deletingImage === selectedProduct.image}
                    className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      deletingImage === selectedProduct.image ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {selectedProduct?.image && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProduct) {
                      setSelectedProduct({ ...selectedProduct, image: "" })
                      if (selectedProduct._id) {
                        saveProductWithImage("image", "")
                      }
                    }
                  }}
                  className="mt-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Hover Image</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useSameImage"
                    checked={useSameImage}
                    onChange={(e) => setUseSameImage(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useSameImage" className="ml-2 text-sm text-gray-600">
                    Use the same as Image
                  </label>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  id="hoverImage"
                  required={!useSameImage}
                  value={useSameImage ? "Using main image" : selectedProduct?.hoverImage || ""}
                  readOnly
                  className={`mt-1 block flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
                    useSameImage ? "bg-gray-200 text-gray-500" : "bg-gray-100"
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <button
                  type="button"
                  className={`ml-2 px-4 py-2 text-sm font-medium text-white 
                  ${uploading || useSameImage ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
                  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  onClick={() => {
                    const fileInput = document.createElement("input")
                    fileInput.type = "file"
                    fileInput.accept = "image/jpeg, image/png"
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file && selectedProduct) {
                        handleFileUpload(file, "hoverImage", selectedProduct.hoverImage)
                      }
                    }
                    fileInput.click()
                  }}
                  disabled={uploading || deletingImage === selectedProduct?.hoverImage || useSameImage}
                >
                  {uploading ? (
                    "Saving..."
                  ) : selectedProduct?.hoverImage && !useSameImage ? (
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
                  ${uploading || useSameImage ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} 
                  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  onClick={() => {
                    setSelectedImageField("hoverImage")
                    setIsGalleryModalOpen(true)
                  }}
                  disabled={uploading || useSameImage}
                >
                  Gallery
                </button>
                {selectedProduct?.hoverImage && !useSameImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageToDelete({ path: selectedProduct.hoverImage, field: "hoverImage" })
                      setIsDeleteModalOpen(true)
                    }}
                    disabled={deletingImage === selectedProduct.hoverImage}
                    className={`ml-2 p-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      deletingImage === selectedProduct.hoverImage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {selectedProduct?.hoverImage && !useSameImage && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProduct) {
                      setSelectedProduct({ ...selectedProduct, hoverImage: "" })
                      if (selectedProduct._id) {
                        saveProductWithImage("hoverImage", "")
                      }
                    }
                  }}
                  className="mt-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Images</label>
              <div className="flex items-center">
                <div className="mt-1 block flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500">
                  {selectedProduct.additionalImages?.length || 0} additional images
                </div>
                <button
                  type="button"
                  onClick={handleAddAdditionalImage}
                  disabled={uploading}
                  className={`ml-2 px-4 py-2 text-sm font-medium text-white 
                  ${uploading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
                  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <Upload size={16} className="mr-1" />
                  Upload
                </button>
              </div>
              {selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProduct.additionalImages.map((img, index) => (
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
                        onClick={async () => {
                          try {
                            await handleDeleteImage(img, "additionalImages")

                            // Update the product in the database
                            const updatedImages = selectedProduct.additionalImages?.filter((i) => i !== img) || []
                            const updateResponse = await fetch(
                              `${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}/add-image`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                credentials: "include",
                                body: JSON.stringify({ additionalImages: updatedImages }),
                              },
                            )

                            if (updateResponse.ok) {
                              const updatedProduct = await updateResponse.json()

                              // Update the local state
                              setSelectedProduct(updatedProduct)

                              // Update the product in the products list
                              setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)))
                            }
                          } catch (err) {
                            console.error("Error deleting additional image:", err)
                          }
                        }}
                        disabled={deletingImage === img}
                        className={`absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none ${
                          deletingImage === img ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || uploading || deletingImage !== null}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Product"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product._id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={getImageUrl(product.image) || "/placeholder.svg"}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = getPlaceholder(64, 64)
                    }}
                  />
                  <div>
                    <a
                      href={`/product/${product._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-blue-600"
                    >
                      {product.title}
                    </a>
                    <p className="text-gray-600">
                      ${product.price} - {product.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Store original product for potential cancel operation
                    setOriginalProduct({ ...product })
                    setSelectedProduct({ ...product })
                    // Reset newly added images list
                    setNewlyAddedImages([])
                    // Reset carousel
                    setStartIndex(0)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
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

export default EditProducts
