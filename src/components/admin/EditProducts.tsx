"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Edit2, X, Upload, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import type { ProductType } from "../../App"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"

interface Product {
  _id: string
  title: string
  type: ProductType
  price: number
  image: string
  hoverImage: string
  description?: string
  materials?: string
  sizes?: string[]
  shipping?: string
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
  const [sizeInput, setSizeInput] = useState("")
  const [newlyAddedImages, setNewlyAddedImages] = useState<string[]>([]) // Track newly added images
  const navigate = useNavigate()

  // For image carousel
  const [startIndex, setStartIndex] = useState(0)
  const imagesPerView = 4
  const imageContainerRef = useRef<HTMLDivElement>(null)

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

  // Modified to immediately update the image in the database
  const handleFileUpload = async (file: File, field: "image" | "hoverImage", oldImagePath?: string) => {
    if (!selectedProduct) return
    if (!file || (file.type !== "image/jpeg" && file.type !== "image/png")) {
      setError("Please select a valid JPG or PNG image")
      return
    }

    setUploading(true)
    setError("")

    // If there's an old image, delete it first
    if (oldImagePath) {
      try {
        await handleDeleteImage(oldImagePath)
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
      const newImagePath = data.image.path

      // Add to newly added images list
      setNewlyAddedImages((prev) => [...prev, newImagePath])

      // Update the product in the database with the new image
      const updateResponse = await fetch(
        `${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}/update-image`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ field, imagePath: newImagePath }),
        },
      )

      if (updateResponse.ok) {
        const updatedProduct = await updateResponse.json()

        // Update the local state
        setSelectedProduct(updatedProduct)

        // Update the product in the products list
        setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)))
      } else {
        throw new Error("Failed to update product with new image")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload and update image")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imagePath: string) => {
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete image")
      }

      // Remove from newly added images if it was there
      setNewlyAddedImages((prev) => prev.filter((img) => img !== imagePath))
    } catch (err: any) {
      console.error("Delete image error:", err)
      setError(err.message || "Failed to delete image")
      throw err
    } finally {
      setDeletingImage(null)
    }
  }

  const handleAddSize = () => {
    if (!selectedProduct) return
    if (sizeInput.trim()) {
      const updatedSizes = [...(selectedProduct.sizes || []), sizeInput.trim()]
      setSelectedProduct({ ...selectedProduct, sizes: updatedSizes })
      setSizeInput("")
    }
  }

  const handleRemoveSize = (index: number) => {
    if (!selectedProduct || !selectedProduct.sizes) return
    const updatedSizes = selectedProduct.sizes.filter((_, i) => i !== index)
    setSelectedProduct({ ...selectedProduct, sizes: updatedSizes })
  }

  // Update the handleAddAdditionalImage function to save images immediately
  const handleAddAdditionalImage = () => {
    if (!selectedProduct) return

    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/jpeg, image/png"
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          setUploading(true)
          setError("")

          // Upload the image
          const formData = new FormData()
          formData.append("image", file)

          const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/upload/productImage`, {
            method: "POST",
            body: formData,
          })

          const data = await response.json()
          const newImagePath = data.image.path

          // Add to newly added images list for tracking
          setNewlyAddedImages((prev) => [...prev, newImagePath])

          // Update the product in the database with the new additional image
          const updatedImages = [...(selectedProduct.additionalImages || []), newImagePath]

          // Update the database with just the new image
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
            // Update the local state
            setSelectedProduct({
              ...selectedProduct,
              additionalImages: updatedImages,
            })

            // Also update the product in the products list
            setProducts(
              products.map((p) => (p._id === selectedProduct._id ? { ...p, additionalImages: updatedImages } : p)),
            )
          } else {
            throw new Error("Failed to update product with new image")
          }
        } catch (err: any) {
          console.error("Error adding image:", err)
          setError(err.message || "Failed to add image")
        } finally {
          setUploading(false)
        }
      }
    }
    fileInput.click()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setLoading(true)
    setError("")

    try {
      console.log("Updating product with ID:", selectedProduct._id)
      console.log("Update data:", selectedProduct)

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(selectedProduct),
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
                {(["Shirt", "Pants", "Shoes", "Bracelet", "Collar"] as ProductType[]).map((type) => (
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Quantity</label>
              <input
                type="number"
                min="1"
                value={selectedProduct.productQuantity || 1}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    productQuantity: Math.max(1, Number.parseInt(e.target.value) || 1),
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
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
              <label className="block text-sm font-medium text-gray-700">Materials</label>
              <input
                type="text"
                value={selectedProduct.materials || ""}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, materials: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sizes</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className="mt-1 block flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="Enter a size (e.g., S, M, L, XL)"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Add
                </button>
              </div>
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProduct.sizes.map((size, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shipping</label>
              <input
                type="text"
                value={selectedProduct.shipping || ""}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, shipping: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={selectedProduct.image}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  onClick={() => {
                    const fileInput = document.createElement("input")
                    fileInput.type = "file"
                    fileInput.accept = "image/jpeg, image/png"
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        handleFileUpload(file, "image", selectedProduct.image)
                      }
                    }
                    fileInput.click()
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <span className="flex items-center">
                      <RefreshCw size={16} className="mr-1" /> Change
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hover Image</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={selectedProduct.hoverImage}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  onClick={() => {
                    const fileInput = document.createElement("input")
                    fileInput.type = "file"
                    fileInput.accept = "image/jpeg, image/png"
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        handleFileUpload(file, "hoverImage", selectedProduct.hoverImage)
                      }
                    }
                    fileInput.click()
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <span className="flex items-center">
                      <RefreshCw size={16} className="mr-1" /> Change
                    </span>
                  )}
                </button>
              </div>
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
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      {img.split("/").pop() || `Image ${index + 1}`}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await handleDeleteImage(img)

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
                        className={`ml-1 text-blue-600 hover:text-blue-800 focus:outline-none ${
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
                    <h3 className="font-semibold">{product.title}</h3>
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
    </div>
  )
}

export default EditProducts
