"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Heart } from "lucide-react"
import { LanguageContext } from "../App"
import { getApiUrl } from "../utils/apiUtils"
import { useCurrencyConversion } from "../utils/currencyUtils"
import Header from "./Header"

interface WishlistItem {
  _id: string
  productId: string
  title: string
  type: string
  price: number
  image: string
  description?: string
}

const Wishlist: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const { formatPrice } = useCurrencyConversion()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchWishlistItems()
  }, [])

  const fetchWishlistItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl("api/wishlist")}`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch wishlist items")
      }

      const data = await response.json()
      setWishlistItems(data.items || [])
    } catch (err) {
      setError("Error loading wishlist items")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`${getApiUrl(`api/wishlist/${itemId}`)}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setWishlistItems(wishlistItems.filter((item) => item._id !== itemId))
      } else {
        setError("Failed to remove item from wishlist")
      }
    } catch (err) {
      setError("Error removing item from wishlist")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">{t("loadingWishlist")}...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <div className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">{t("yourWishlist")}</h1>

          {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          {wishlistItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-2 text-lg font-medium text-gray-900">{t("emptyWishlist")}</h2>
              <p className="mt-1 text-sm text-gray-500">{t("startShoppingWishlist")}</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-dark hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t("continueShopping")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t("itemsInWishlist")}</h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {wishlistItems.map((item) => (
                  <li key={item._id} className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=100"
                          }}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                          <p className="text-base font-medium text-gray-900">{formatPrice(item.price, currency)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.type}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        )}
                        <div className="mt-4 flex justify-between">
                          <button
                            onClick={() => navigate(`/product/${item.productId}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t("viewProduct")}
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            {t("removeFromWishlist")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                  <p>
                    <button
                      type="button"
                      className="text-primary-dark font-medium hover:text-primary-dark/80"
                      onClick={() => navigate("/")}
                    >
                      {t("continueShopping")}
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wishlist
