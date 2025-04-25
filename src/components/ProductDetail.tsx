"use client"

import type React from "react"
import { useState, useEffect, useRef, useContext } from "react"
import axios from "axios"
import { ArrowLeft, Star, X, ChevronLeft, ChevronRight, MessageSquare, Trash2, Reply } from "lucide-react"
import Header from "./Header"
import { useNavigate, useParams } from "react-router-dom"
import Footer from "./Footer"
import { LanguageContext } from "../App"
import { getImageUrl, getPlaceholder } from "../utils/imageUtils"
import { getProductApiUrl } from "../utils/apiUtils"

interface ProductDetailProps {
  onBack: () => void
}

interface Product {
  _id: string
  title: string
  price: number
  description?: string
  materials?: string
  sizes?: string[]
  shipping?: string
  image: string
  hoverImage?: string
  type?: string
  images?: string[] // Array of all product images
  productQuantity?: number // Added product quantity
  visits?: number // Added visits counter
  averageRating?: number // Added average rating
  ratingCount?: number // Added rating count
  reviews?: Array<{
    id: number
    rating: number
    comment: string
    author: string
  }>
  recommended?: Array<{
    _id: string
    title: string
    price: number
    image: string
    hoverImage?: string
    images?: string[]
  }>
}

interface Comment {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  text: string
  createdAt: string
  likes: number
  dislikes: number
  replies?: Comment[]
}

// Add a global variable to store scroll position
let lastScrollPosition = 0

const ProductDetail: React.FC<ProductDetailProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>()
  const { t, language, setLanguage } = useContext(LanguageContext)
  const [quantity, setQuantity] = useState(1)
  const [currency, setCurrency] = useState<"USD" | "EUR" | "VES">("USD")
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [userData, setUserData] = useState<{ _id: string; name: string; email: string } | null>(null)

  const navigate = useNavigate()
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState("")

  const visitIncremented = useRef(false)

  useEffect(() => {
    if (!id) {
      setError("Product ID is missing")
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        setLoading(true)
        // Use the utility function to get the correct API URL
        const response = await axios.get(getProductApiUrl(id))
        setProduct(response.data)
        // Set the first image as selected by default
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0])
        } else if (response.data.image) {
          setSelectedImage(response.data.image)
        }
        // Initialize selected size when product loads
        if (response.data && response.data.sizes && response.data.sizes.length > 0) {
          setSelectedSize(response.data.sizes[0])
        }

        // Increment visit count only once per page load
        if (!visitIncremented.current) {
          incrementVisits(id)
          visitIncremented.current = true
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/get-user-details`, {
          credentials: "include",
        })
        if (response.ok) {
          const userData = await response.json()
          setIsLoggedIn(true)
          setUserData(userData)

          // If user is logged in, fetch their rating for this product
          fetchUserRating(id)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsLoggedIn(false)
      }
    }

    fetchProduct()
    checkAuth()
    fetchComments(id)
  }, [id])

  const incrementVisits = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/visit`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Error incrementing visits:", error)
    }
  }

  const fetchUserRating = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/user-rating`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUserRating(data.rating)
      }
    } catch (error) {
      console.error("Error fetching user rating:", error)
    }
  }

  const fetchComments = async (id: string) => {
    try {
      setLoadingComments(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/comments`)

      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!id) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ value: rating }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserRating(rating)

        // Update product rating in state
        if (product) {
          setProduct({
            ...product,
            averageRating: data.averageRating,
            ratingCount: data.ratingCount,
          })
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!commentText.trim() || !id) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: commentText }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([{ ...newComment, replies: [] }, ...comments])
        setCommentText("")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!replyText.trim() || !id) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/products/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          text: replyText,
          parentId,
        }),
      })

      if (response.ok) {
        const newReply = await response.json()

        // Update comments state with the new reply
        const updatedComments = comments.map((comment) => {
          if (comment._id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            }
          }
          return comment
        })

        setComments(updatedComments)
        setReplyText("")
        setReplyingTo(null)
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        // Check if the deleted comment is a top-level comment or a reply
        const isTopLevelComment = comments.some((comment) => comment._id === commentId)

        if (isTopLevelComment) {
          // If it's a top-level comment, simply filter it out
          const updatedComments = comments.filter((comment) => comment._id !== commentId)
          setComments(updatedComments)
        } else {
          // If it's a reply, we need to update the parent comment's replies
          const updatedComments = comments.map((comment) => {
            if (comment.replies && comment.replies.some((reply) => reply._id === commentId)) {
              // This is the parent comment, filter out the deleted reply
              return {
                ...comment,
                replies: comment.replies.filter((reply) => reply._id !== commentId),
              }
            }
            return comment
          })
          setComments(updatedComments)
        }
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleImageClick = (image: string) => {
    setModalImage(image)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  // Update quantity handling to respect product quantity limit
  const handleQuantityChange = (newQuantity: number) => {
    if (product && product.productQuantity) {
      // Ensure quantity is between 1 and product quantity
      const validQuantity = Math.min(Math.max(1, newQuantity), product.productQuantity)
      setQuantity(validQuantity)
    } else {
      // If no product quantity is set, just ensure it's at least 1
      setQuantity(Math.max(1, newQuantity))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 font-body text-gray-700">{t("loadingProductDetails")}</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-title font-bold text-primary-dark mb-4">{t("error")}</h2>
          <p className="font-body text-gray-700 mb-6">{error || t("productNotFound")}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            {t("returnToHome")}
          </button>
        </div>
      </div>
    )
  }

  // Update the handleAddToCart function to check stock limits
  const handleAddToCart = async () => {
    if (!id) return

    try {
      setAddingToCart(true)
      setCartMessage("")

      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: product._id,
          title: product.title,
          type: product.type || "Product",
          price: product.price,
          image: product.image,
          quantity: quantity,
        }),
      })

      if (response.status === 401) {
        navigate("/login")
        return
      }

      const data = await response.json()

      if (response.ok) {
        setCartMessage(t("productAdded"))
        setTimeout(() => setCartMessage(""), 3000)
      } else {
        // Check if the error is due to maximum stock reached
        if (data.message === "Maximum stock reached!") {
          setCartMessage(t("maxStockReached"))
        } else {
          setCartMessage(data.message || t("failedToAdd"))
        }
        setTimeout(() => setCartMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      setCartMessage(t("errorAddingToCart"))
    } finally {
      setAddingToCart(false)
    }
  }

  // Default values for missing fields
  const description = product.description || "No description available."
  const materials = product.materials || "Information not available."
  const sizes = product.sizes || ["S", "M", "L"]
  const shipping = product.shipping || "Standard shipping: 3-5 business days."
  const reviews = product.reviews || []
  const recommended = product.recommended || []
  const productQuantity = product.productQuantity || 1
  const averageRating = product.averageRating || 0
  const ratingCount = product.ratingCount || 0

  // Get all available images
  const images = product.images || [product.image, product.hoverImage].filter(Boolean)

  const handlePayPalCheckout = async () => {
    try {
      // Get user details
      const userResponse = await fetch(`${import.meta.env.VITE_SITE_URL}/get-user-details`, {
        credentials: "include",
      })

      if (userResponse.status === 401) {
        navigate("/login")
        return
      }

      const userData = await userResponse.json()

      // Create invoice data
      const invoice = {
        product: {
          name: product.title,
          price: product.price,
          selectedQuantity: quantity,
          description: description,
          material: materials,
          selectedSize: selectedSize,
          shipping: shipping,
        },
        customer: {
          username: userData.name,
          email: userData.email,
        },
        purchase: {
          date: new Date().toISOString(),
          id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      }

      // For now, just log the invoice
      console.log("PayPal Invoice:", invoice)

      // Show a message to the user
      setCartMessage(t("paypalInitiated"))
      setTimeout(() => setCartMessage(""), 5000)
    } catch (error) {
      console.error("Error creating invoice:", error)
      setCartMessage(t("errorProcessingPaypal"))
    }
  }

  // Update the onBack function to use the stored scroll position
  const handleBackToProducts = () => {
    // Store the current product ID in session storage before navigating back
    if (id) {
      sessionStorage.setItem("lastViewedProduct", id)
    }
    navigate("/")

    // The scroll position will be restored in the App.tsx component
    // when the home page loads
  }

  // Format date for comments
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-primary-light">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />

      <main className="container mx-auto px-4 py-8">
        {/* Replace the onBack prop with our new function */}
        <button onClick={handleBackToProducts} className="flex items-center text-gray-700 hover:text-primary-dark mb-8">
          <ArrowLeft size={20} className="mr-2" /> {t("backToProducts")}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="md:w-20 flex flex-row md:flex-col gap-2 order-2 md:order-1 overflow-x-auto pb-2 md:pb-0">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-md overflow-hidden cursor-pointer flex-shrink-0 w-20 h-20 ${
                    selectedImage === img ? "border-primary-dark" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(img ?? null)}
                >
                  <img
                    src={getImageUrl(img) || "/placeholder.svg"}
                    alt={`${product.title} - view ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = getPlaceholder(80, 80)
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Main image */}
            <div className="flex-1 order-1 md:order-2">
              <div
                className="rounded-lg shadow-lg overflow-hidden cursor-zoom-in h-[300px] sm:h-[400px] md:h-[500px] w-full"
                onClick={() => handleImageClick(selectedImage || product.image)}
              >
                <img
                  src={getImageUrl(selectedImage || product.image)}
                  alt={product.title}
                  className="w-full h-full object-contain bg-white"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = getPlaceholder(600, 600)
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-title font-bold mb-4">{product.title}</h1>
            <p className="text-2xl font-title font-[800] text-pricetxt text-[1.8rem] mb-6">${product.price} USD</p>

            {/* Product Rating */}
            <div className="mb-4 flex items-center">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={`cursor-pointer ${
                      (hoverRating || userRating) >= star
                        ? "text-primary-dark fill-primary-dark"
                        : averageRating >= star
                          ? "text-primary-dark fill-primary-dark"
                          : averageRating >= star - 0.5
                            ? "text-primary-dark fill-primary-dark"
                            : "text-gray-300"
                    }`}
                    onClick={() => handleRatingSubmit(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <span className="font-body text-gray-700">
                {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
              </span>
              {!isLoggedIn && (
                <span className="ml-2 text-sm font-body text-primary cursor-pointer" onClick={() => navigate("/login")}>
                  {t("login")}
                </span>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="block font-subtitle text-gray-700 mb-2">{t("quantity")}</label>
                <span className="text-sm font-body text-gray-500">
                  {t("available")}: {productQuantity}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-3 py-1 border rounded-l-md disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={productQuantity}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                  className="w-16 px-3 py-1 border-t border-b text-center font-body"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= productQuantity}
                  className="px-3 py-1 border rounded-r-md disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 bg-secondary text-gray-800 py-3 rounded-md hover:bg-secondary-light"
              >
                {addingToCart ? t("adding") : t("addToCart")}
              </button>
              <button
                className="flex-1 bg-primary-dark text-primary-light py-3 rounded-md hover:bg-secondary-light hover:text-gray-800 disabled:opacity-70"
                onClick={handlePayPalCheckout}
              >
                {t("buyWithPayPal")}
              </button>
            </div>
            <p className="text-center text-gray-500 text-sm mb-8">{t("otherPaymentMethods")}</p>

            {cartMessage && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-center font-body">{cartMessage}</div>
            )}

            <p className="font-body text-gray-700 mb-8">{description}</p>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-title font-semibold mb-2">{t("materials")}</h2>
                <p className="font-body text-gray-700">{materials}</p>
              </div>

              <div>
                <h2 className="text-xl font-title font-semibold mb-2">{t("sizes")}</h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 border rounded-md font-body ${
                        selectedSize === size ? "bg-primary-light text-black border-primary" : "hover:border-primary"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-title font-semibold mb-2">{t("shipping")}</h2>
                <p className="font-body text-gray-700">{shipping}</p>
              </div>

              <div>
                <h2 className="text-xl font-title font-semibold mb-2">{t("productStats")}</h2>
                <p className="font-body text-gray-700">
                  {t("views")}: {product.visits || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-title font-bold mb-6">{t("recommendedProducts")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                  onClick={() => {
                    // Save current scroll position before navigating
                    lastScrollPosition = window.scrollY
                    // Navigate to the recommended product
                    navigate(`/product/${item._id}`)
                  }}
                >
                  <img
                    src={getImageUrl(item.images && item.images[0] ? item.images[0] : item.image)}
                    alt={item.title}
                    className="w-full h-48 object-contain bg-white"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = getPlaceholder(300, 300)
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-title font-semibold mb-2">{item.title}</h3>
                    <p className="font-body text-gray-700">${item.price} USD</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-title font-bold mb-6">{t("comments")}</h2>

          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("writeComment")}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-body"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-secondary-light hover:text-black disabled:opacity-50 font-body"
              >
                {submittingComment ? t("posting") : t("postComment")}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-primary-light rounded-md text-center">
              <p className="font-body text-gray-700 mb-2">{t("needLogin")}</p>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-secondary-light font-body hover:text-black"
              >
                {t("login")}
              </button>
            </div>
          )}

          {loadingComments ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 font-body text-gray-700">{t("loadingComments")}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 bg-primary-light rounded-md">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 font-body text-gray-700">{t("noComments")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment._id} className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-subtitle font-medium">{comment.userId.name}</div>
                      <div className="text-sm font-body text-gray-500">{formatDate(comment.createdAt)}</div>
                    </div>
                    {isLoggedIn &&
                      (userData?._id === comment.userId._id ||
                        userData?.email === import.meta.env.VITE_ADMIN_USER_EMAIL) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-primary-dark hover:text-primary"
                          title="Delete comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                  </div>
                  <p className="mt-2 font-body text-gray-700">{comment.text}</p>

                  {isLoggedIn && (
                    <div className="mt-2">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        className="text-sm font-body text-primary hover:text-primary-dark flex items-center"
                      >
                        <Reply size={14} className="mr-1" />
                        {replyingTo === comment._id ? t("cancel") : t("reply")}
                      </button>
                    </div>
                  )}

                  {replyingTo === comment._id && (
                    <div className="mt-3 pl-6">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("writeReply")}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-body"
                        rows={2}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleReplySubmit(comment._id)}
                          disabled={submittingComment || !replyText.trim()}
                          className="px-3 py-1 bg-primary-dark text-white text-sm rounded-md hover:bg-primary-dark hover:text-black disabled:opacity-50 font-body"
                        >
                          {submittingComment ? t("posting") : t("postReply")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-subtitle font-medium">{reply.userId.name}</div>
                              <div className="text-sm font-body text-gray-500">{formatDate(reply.createdAt)}</div>
                            </div>
                            {isLoggedIn &&
                              (userData?._id === reply.userId._id ||
                                userData?.email === import.meta.env.VITE_ADMIN_USER_EMAIL) && (
                                <button
                                  onClick={() => handleDeleteComment(reply._id)}
                                  className="text-primary-dark hover:text-primary"
                                  title="Delete reply"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                          </div>
                          <p className="mt-1 font-body text-gray-700">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Full-screen image modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div className="absolute top-4 right-4">
            <button
              className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              onClick={closeModal}
            >
              <X size={24} />
            </button>
          </div>

          <div
            className="w-full max-w-4xl max-h-[90vh] relative"
            style={{ height: "min(600px, 80vh)", width: "min(800px, 90vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(modalImage ?? undefined) || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-contain bg-white"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = getPlaceholder(800, 800)
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = images.findIndex((img) => img === modalImage)
                    const prevIndex = (currentIndex - 1 + images.length) % images.length
                    setModalImage(images[prevIndex] ?? null)
                  }}
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = images.findIndex((img) => img === modalImage)
                    const nextIndex = (currentIndex + 1) % images.length
                    setModalImage(images[nextIndex] ?? null)
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
