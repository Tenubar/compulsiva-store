"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"
import type { ProductType } from "../../App"

interface Product {
  _id: string
  title: string
  type: ProductType
  price: number
  image: string
}

const DeleteProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/products`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        setError("Failed to fetch products")
      }
    } catch (err) {
      setError("An error occurred while fetching products")
    }
  }

  const handleDelete = async (productId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/product/${productId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setProducts(products.filter((p) => p._id !== productId))
        setSelectedProduct(null)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to delete product")
      }
    } catch (err) {
      setError("An error occurred while deleting the product")
    } finally {
      setLoading(false)
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
        <h2 className="text-3xl font-bold text-center mb-8">Delete Products</h2>

        {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={`/${product.image}` || "/placeholder.svg?height=64&width=64"}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=64"
                  }}
                />
                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">
                    ${product.price} - {product.type}
                  </p>
                </div>
              </div>
              {selectedProduct === product._id ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(product._id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedProduct(product._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DeleteProducts
