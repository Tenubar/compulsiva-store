"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ProductType } from "../App"
import { getImageUrl, getPlaceholder } from "../utils/imageUtils"
// Add import for the API utility functions
import { getApiUrl } from "../utils/apiUtils"
import { useNavigate } from "react-router-dom"
import { LanguageContext } from "../App"
import { useCurrencyConversion } from "../utils/currencyUtils"
import type { Currency } from "../App"

interface Product {
  _id: string
  title: string
  type: ProductType
  price: number
  image: string
  hoverImage: string
}

interface ProductGridProps {
  onProductClick: (productId: string) => void
  selectedTypes: ProductType[]
  currency: Currency
}

const PRODUCTS_PER_PAGE = 12

const ProductGrid: React.FC<ProductGridProps> = ({ onProductClick, selectedTypes, currency }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useContext(LanguageContext)
  const { formatPrice } = useCurrencyConversion()

  useEffect(() => {
    // Update the fetchProducts function
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await axios.get(getApiUrl("products"))
        setProducts(response.data)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTypes])

  const filteredProducts =
    selectedTypes.length > 0 ? products.filter((product) => selectedTypes.includes(product.type)) : products

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative aspect-square bg-gray-200 animate-pulse"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setHoveredProduct(product._id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            <div className="relative aspect-square h-[300px]">
              <img
                src={getImageUrl(hoveredProduct === product._id ? product.hoverImage : product.image)}
                alt={product.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => navigate(`/product/${product._id}`)}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = getPlaceholder(300, 300)
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
              <p className="text-gray-600 mb-2">{formatPrice(product.price, currency)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Page numbers */}
          <div className="flex space-x-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1
              // Show current page, first, last, and pages around current
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    className={`w-10 h-10 rounded-md ${
                      currentPage === pageNumber ? "bg-blue-600 text-white" : "border hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              }
              // Show ellipsis for skipped pages
              if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return (
                  <span key={pageNumber} className="w-10 h-10 flex items-center justify-center">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  )
}

export default ProductGrid
