"use client"

import type React from "react"
import { useState, useEffect, useRef, useContext } from "react"
import axios from "axios"
import {
  ArrowLeft,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  Reply,
  Heart,
  LogIn,
  UserPlus,
  FileText,
  Edit,
} from "lucide-react"
import Header from "./Header"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import Footer from "./Footer"
import { LanguageContext } from "../App"
import { getImageUrl, getPlaceholder } from "../utils/imageUtils"
import { getProductApiUrl, getApiUrl } from "../utils/apiUtils"
import { useCurrencyConversion } from "../utils/currencyUtils"

interface ProductDetailProps {
  onBack?: () => void
}

// Update the Product interface to include the legacy color field
interface Product {
  _id: string
  title: string
  price: number
  description?: string
  materials?: string
  sizes?: Array<{
    size: string
    quantity: number
    colors?: string[]
    color?: string // Add support for legacy color field
    sizePrice?: number // Optional price for this size
  }>
  shipping?: Array<{ name: string; price: number }>
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

interface UserData {
  _id: string
  name: string
  email: string
  firstName: string
  lastName: string
  phone: string
  id: string
  avatar?: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// Add a global variable to store scroll position
let lastScrollPosition = 0

const ProductDetail: React.FC<ProductDetailProps> = ({ onBack }): JSX.Element => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistMessage, setWishlistMessage] = useState("")
  const [hasPurchased, setHasPurchased] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showPayPalPreview, setShowPayPalPreview] = useState(false)
  const [previewAddress, setPreviewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })
  const [previewPhone, setPreviewPhone] = useState("")
  const [previewId, setPreviewId] = useState("")
  const [previewFirstName, setPreviewFirstName] = useState("")
  const [previewLastName, setPreviewLastName] = useState("")

  const navigate = useNavigate()
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState("")

  const visitIncremented = useRef(false)
  const lastFetchTime = useRef<number>(0)

  // Check if we're returning from a purchase
  const isReturningFromPurchase = useRef(false)

  const [selectedShipping, setSelectedShipping] = useState<{ name: string; price: number } | null>(null)

  const { formatPrice } = useCurrencyConversion()

  useEffect(() => {
    // Check if we're returning from a successful purchase
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.get("success") === "true") {
      isReturningFromPurchase.current = true
    }
  }, [location])

  // Update the fetchProduct function to handle both color and colors fields
  const fetchProduct = async (forceRefresh = false) => {
    if (!id) {
      setError("Product ID is missing")
      setLoading(false)
      return
    }

    try {
      // Always set loading state when fetching
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Add a timestamp to prevent browser caching
      const timestamp = Date.now()
      const response = await axios.get(`${getProductApiUrl(id)}?t=${timestamp}`, {
        // Disable axios caching
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      // Ensure productQuantity is properly parsed as a number
      const productData = {
        ...response.data,
        productQuantity: response.data.productQuantity != null ? Number(response.data.productQuantity) : 1,
      }

      // Normalize sizes to ensure colors are properly handled
      if (productData.sizes && Array.isArray(productData.sizes)) {
        productData.sizes = productData.sizes.map(
          (size: { size: string; quantity: number; colors?: string[]; color?: string }) => {
            // If size has a color field but no colors array, convert it
            if (size.color && (!size.colors || !size.colors.length)) {
              return {
                ...size,
                colors: [size.color],
              }
            }
            // Ensure colors is at least an empty array if undefined
            if (!size.colors) {
              return {
                ...size,
                colors: [],
              }
            }
            return size
          },
        )
      }

      setProduct(productData)
      lastFetchTime.current = timestamp
      isReturningFromPurchase.current = false

      // Set the first image as selected by default
      if (productData.images && productData.images.length > 0) {
        setSelectedImage(productData.images[0])
      } else if (productData.image) {
        setSelectedImage(productData.image)
      }

      // Set the first shipping option as selected by default
      if (productData.shipping && productData.shipping.length > 0) {
        setSelectedShipping(productData.shipping[0])
      }

      // Initialize selected size when product loads - choose first available size
      if (productData && productData.sizes && productData.sizes.length > 0) {
        // Group sizes by name
        const sizeGroups = new Map()
        productData.sizes.forEach((sizeObj: { size: string; quantity: number; colors?: string[]; color?: string }) => {
          const sizeLower = sizeObj.size.toLowerCase()
          // Handle both color and colors fields
          const colorArray = Array.isArray(sizeObj.colors) ? sizeObj.colors : sizeObj.color ? [sizeObj.color] : []

          if (!sizeGroups.has(sizeLower)) {
            sizeGroups.set(sizeLower, {
              size: sizeObj.size,
              quantity: sizeObj.quantity,
              colors: colorArray,
            })
          } else {
            const existingSize = sizeGroups.get(sizeLower)
            existingSize.quantity += sizeObj.quantity
            if (colorArray.length > 0) {
              existingSize.colors = [...new Set([...existingSize.colors, ...colorArray])]
            }
          }
        })

        // Convert map to array
        const mergedSizes = Array.from(sizeGroups.values())

        // Find first size that has quantity > 0
        const availableSize = mergedSizes.find((sizeObj) => sizeObj.quantity > 0)

        if (availableSize) {
          setSelectedSize(availableSize.size)
          // Set first available color if any
          if (availableSize.colors && availableSize.colors.length > 0) {
            setSelectedColor(availableSize.colors[0])
          } else {
            setSelectedColor("")
          }
        } else {
          setSelectedSize(mergedSizes[0].size) // Default to first size even if out of stock
          // Set first available color if any
          if (mergedSizes[0].colors && mergedSizes[0].colors.length > 0) {
            setSelectedColor(mergedSizes[0].colors[0])
          } else {
            setSelectedColor("")
          }
        }
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
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Check if we're returning from a successful purchase
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.get("success") === "true") {
      isReturningFromPurchase.current = true
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
          fetchUserRating(id || "")
          // Check if product is in wishlist
          checkWishlist(id || "")
          // Check if user has purchased this product
          checkPurchaseHistory(id || "")
        } else {
          setIsLoggedIn(false)
          setHasPurchased(false) // Reset purchase status when logged out
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsLoggedIn(false)
      }
    }

    // Always fetch fresh data
    fetchProduct(isReturningFromPurchase.current)
    checkAuth()
    fetchComments(id || "")

    // Reset the component state when the ID changes
    return () => {
      visitIncremented.current = false
      lastFetchTime.current = 0
    }
  }, [id, location.search])

  // Add effect for login status changes
  useEffect(() => {
    if (isLoggedIn && id) {
      fetchUserRating(id)
      checkWishlist(id)
      checkPurchaseHistory(id)
    }
  }, [isLoggedIn, id])

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
    if (!isLoggedIn) return

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

  const checkWishlist = async (productId: string) => {
    if (!isLoggedIn) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/wishlist/check/${productId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setInWishlist(data.inWishlist)
        setWishlistItemId(data.itemId)
      }
    } catch (error) {
      console.error("Error checking wishlist:", error)
    }
  }

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!product) return

    setWishlistLoading(true)
    try {
      if (inWishlist && wishlistItemId) {
        // Remove from wishlist
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/wishlist/${wishlistItemId}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (response.ok) {
          setInWishlist(false)
          setWishlistItemId(null)
          setWishlistMessage(t("removedFromWishlist"))
          setTimeout(() => setWishlistMessage(""), 3000)
        }
      } else {
        // Add to wishlist
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/wishlist`, {
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
            description: product.description,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setInWishlist(true)
          setWishlistItemId(data.item._id)
          setWishlistMessage(t("addedToWishlist"))
          setTimeout(() => setWishlistMessage(""), 3000)
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    } finally {
      setWishlistLoading(false)
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

  // Enhance the checkPurchaseHistory function to be more robust
  // and add better logging for debugging
  const checkPurchaseHistory = async (productId: string) => {
    if (!isLoggedIn) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/user/has-purchased/${productId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setHasPurchased(data.hasPurchased)

        // If the user has purchased the product, log it for clarity
        if (data.hasPurchased) {
         
        }
      }
    } catch (error) {
      console.error("Error checking purchase history:", error)
    }
  }

  // Remove the stock check from the handleRatingSubmit function
  const handleRatingSubmit = async (rating: number) => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!id) return

    // Check if user has purchased the product
    if (!hasPurchased) {
      alert(t("purchaseRequiredForRating"))
      return
    }

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
    if (product && product.sizes && product.sizes.length > 0) {
      // Find the selected size and color combination to get its quantity
      const colorObj = getColorsForSelectedSize().find((c) => c.color === selectedColor)
      const maxQuantity = colorObj?.quantity || 0

      // Ensure quantity is between 1 and available quantity for the selected size and color
      const validQuantity = Math.min(Math.max(1, newQuantity), maxQuantity)
      setQuantity(validQuantity)
    } else if (product) {
      // Use productQuantity when sizes are not used
      const maxQuantity = product.productQuantity || 0
      const validQuantity = Math.min(Math.max(1, newQuantity), maxQuantity)
      setQuantity(validQuantity)
    }
  }

  // Add console logging to debug the colors issue
  const getColorsForSelectedSize = (sizeParam?: string) => {
    if (!product) return []
    const sizeToUse = sizeParam || selectedSize
    if (!sizeToUse) return []

    // Find all size objects with the same size name
    const sizeObjs =
      product.sizes?.filter(
        (sizeObj: { size: string; quantity: number; colors?: string[] }) =>
          sizeObj.size.toLowerCase() === sizeToUse.toLowerCase(),
      ) || []

    // Create a map to store color and its quantity
    const colorMap = new Map()

    // Combine colors from all matching size objects
    sizeObjs.forEach((sizeObj) => {
      // Handle both string and array formats for colors
      const colorArray = Array.isArray(sizeObj.colors) ? sizeObj.colors : sizeObj.color ? [sizeObj.color] : [] // Support legacy 'color' field

      if (colorArray && colorArray.length > 0) {
        colorArray.forEach((color: string) => {
          // If color already exists, add the quantity
          if (colorMap.has(color)) {
            colorMap.set(color, colorMap.get(color) + sizeObj.quantity)
          } else {
            colorMap.set(color, sizeObj.quantity)
          }
        })
      }
    })

    // Convert map to array of objects with color and quantity
    return Array.from(colorMap).map(([color, quantity]) => ({ color, quantity }))
  }

    const getSelectedSizePrice = () => {
    if (product && product.sizes && selectedSize) {
      // Find the size object that matches both size and color
      const sizeObj = product.sizes.find(
        (s) =>
          s.size.toLowerCase() === selectedSize.toLowerCase() &&
          (
            (Array.isArray(s.colors) && s.colors.includes(selectedColor)) ||
            (typeof s.color === "string" && s.color.toLowerCase() === selectedColor.toLowerCase())
          )
      )
      if (sizeObj && typeof sizeObj.sizePrice === "number") {
        return sizeObj.sizePrice
      }
      // fallback: if not found, return the first matching size (legacy behavior)
      const fallback = product.sizes.find(
        (s) => s.size.toLowerCase() === selectedSize.toLowerCase()
      )
      if (fallback && typeof fallback.sizePrice === "number") {
        return fallback.sizePrice
      }
    }
    return product?.price || 0
  }

  // Add a manual refresh function
  // const handleRefresh = () => {
  //   fetchProduct(true)
  // }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
      style = {{
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-black)",
      }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 font-body text-gray-700">{t("loadingProductDetails")}</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center"
      style ={{
        backgroundColor: "var(--color-secondary)",
        color: "var(--color-text-black)",
      }}
      >
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-title font-bold mb-4"
            style={{ color: "var(--color-primary)" }}
          >{t("error")}</h2>
          <p className="font-body text-gray-700 mb-6">{error || t("productNotFound")}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-md"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-white)",
              transition: "background-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--color-secondary)"
              e.currentTarget.style.color = "var(--color-text-white)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "var(--color-primary)"
              e.currentTarget.style.color = "var(--color-text-white)"
            }}
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

      // Check stock based on whether sizes are used or not
      if (product.sizes && product.sizes.length > 0) {
        // Find the quantity for the selected color
        const colorObj = getColorsForSelectedSize().find((c) => c.color.toLowerCase() === selectedColor.toLowerCase())

        // Check if selected color is available
        if (!colorObj || colorObj.quantity <= 0) {
          setCartMessage(t("colorOutOfStock"))
          setTimeout(() => setCartMessage(""), 3000)
          setAddingToCart(false)
          return
        }
      } else {
        // Check if product is in stock when not using sizes
        if ((product.productQuantity || 0) <= 0) {
          setCartMessage(t("productOutOfStock"))
          setTimeout(() => setCartMessage(""), 3000)
          setAddingToCart(false)
          return
        }
      }

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
          size: selectedSize || "",
          color: selectedColor || "",
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

        // Refresh product data to get updated stock
        fetchProduct(true)
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
  // Remove the materials default
  // Remove the sizes default
  const shipping = product.shipping || []
  const reviews = product.reviews || []
  const recommended = product.recommended || []
  const productQuantity = product.productQuantity || 1
  const averageRating = product.averageRating || 0
  const ratingCount = product.ratingCount || 0

  // Get all available images
  const allImages = product.images || [product.image, product.hoverImage].filter(Boolean)
  // Use a Set to remove duplicate URLs
  const uniqueImageUrls = new Set(allImages)
  const images = Array.from(uniqueImageUrls)

  // Add this function to check if all required fields are filled
  const isFormValid = () => {
    return (
      previewFirstName.trim() !== "" &&
      previewLastName.trim() !== "" &&
      previewPhone.trim() !== "" &&
      previewId.trim() !== "" &&
      previewAddress.street.trim() !== "" &&
      previewAddress.city.trim() !== "" &&
      previewAddress.state.trim() !== "" &&
      previewAddress.postalCode.trim() !== "" &&
      previewAddress.country.trim() !== ""
    )
  }

  const priceToUse =
  product.sizes && product.sizes.length > 0
    ? getSelectedSizePrice()
    : product.price

  // Add this function to handle preview form submission
  const handlePreviewSubmit = async () => {
    try {
      const response = await fetch(getApiUrl("update-user"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: userData?.name,
          email: userData?.email,
          avatar: userData?.avatar,
          phone: previewPhone,
          id: previewId,
          firstName: previewFirstName,
          lastName: previewLastName,
          address: previewAddress,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUserData(updatedUser)
        // Submit the PayPal form
        const form = document.getElementById("paypal-form") as HTMLFormElement
        if (form) {
          form.submit()
        }
      }
    } catch (error) {
      console.error("Error updating user data:", error)
    }
  }

  // Update the handlePayPalCheckout function
  const handlePayPalCheckout = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    // Check stock based on whether sizes are used or not
    if (product.sizes && product.sizes.length > 0) {
      // Check if selected size is available
      const selectedSizeObj = product.sizes?.find(
        (sizeObj: { size: string; quantity: number; colors?: string[] }) => sizeObj.size === selectedSize,
      )
      if (!selectedSizeObj || selectedSizeObj.quantity <= 0) {
        setCartMessage(t("sizeOutOfStock"))
        setTimeout(() => setCartMessage(""), 3000)
        return
      }
    } else {
      // Check if product is in stock when not using sizes
      if ((product.productQuantity || 0) <= 0) {
        setCartMessage(t("productOutOfStock"))
        setTimeout(() => setCartMessage(""), 3000)
        return
      }
    }

    // Initialize preview form with current user data
    if (userData) {
      setPreviewFirstName(userData.firstName || "")
      setPreviewLastName(userData.lastName || "")
      setPreviewPhone(userData.phone || "")
      setPreviewId(userData.id || "")
      setPreviewAddress(
        userData.address || {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      )
    }

    setShowPayPalPreview(true)
  }

  // Update the onBack function to use the stored scroll position
  const handleBackToProducts = () => {
    // Store the current product ID in session storage before navigating back
    if (id) {
      sessionStorage.setItem("lastViewedProduct", id)
    }
    navigate("/")
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
    <div className="min-h-screen"
    style = {{
      backgroundColor: "var(--color-background)",
      color: "var(--color-text-black)",
    }}
    >
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />

      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Back button */}
        <div className="mb-8">
          <button onClick={handleBackToProducts} className="flex items-center"
          style = {{
            color: "var(--color-text-info)",
            fontWeight: "400",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-info)"
          }}
          >
            <ArrowLeft size={20} className="mr-2" /> {t("backToProducts")}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="md:w-20 flex flex-row md:flex-col gap-2 order-2 md:order-1 overflow-x-auto pb-2 md:pb-0">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-md overflow-hidden cursor-pointer flex-shrink-0 w-20 h-20`}
                  style={{
                    borderColor: selectedImage === img ? "var(--color-primary)" : "#e5e7eb",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => {
                    if (selectedImage !== img) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-secondary)"
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      selectedImage === img ? "var(--color-primary)" : "#e5e7eb"
                  }}
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
            <h1 className="text-3xl font-title font-bold mb-4"
            style= {{
              color: "var(--color-text-header)",
            }}
            >{product.title}</h1>
            <p className="text-2xl font-title font-[800] text-[1.8rem] mb-6"
              style={{
                color: "var(--color-text-price)",
              }}
            >
               {formatPrice(
                product.sizes && product.sizes.length > 0
                  ? getSelectedSizePrice()
                  : product.price,
                currency
              )}
            </p>

            {/* Update the star rating component to allow rating if purchased, regardless of stock */}
            <div className="mb-4">
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={`${!isLoggedIn || !hasPurchased ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      style={
                        (hoverRating || userRating) >= star
                          ? { color: "var(--color-text-black)", fill: "var(--color-text-black)" }
                          : averageRating >= star - 0.5
                            ? { color: "var(--color-text-black)", fill: "var(--color-text-black)" }
                            : { color: "#d1d5db", fill: "#d1d5db" }
                      }
                      onClick={() => handleRatingSubmit(star)}
                      onMouseEnter={() => (isLoggedIn && hasPurchased ? setHoverRating(star) : null)}
                      onMouseLeave={() => (isLoggedIn && hasPurchased ? setHoverRating(0) : null)}
                    />
                  ))}
                </div>
                <span className="font-body text-gray-700">
                  {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
                </span>
              </div>

              {isLoggedIn && !hasPurchased && (
                <div className="mt-2">
                  <p className="text-sm text-amber-600" 
                  style={{
                    color: "var(--color-accent)",
                  }}
                  >{t("purchaseRequiredForRating")}</p>
                </div>
              )}

              {!isLoggedIn && (
                <p className="text-sm text-primary mt-1">
                  <span className="cursor-pointer" onClick={() => navigate("/login")}>
                    {t("loginToRate")}
                  </span>
                </p>
              )}
            </div>

            {/* Update the quantity handling section to check for sizes and use productQuantity when sizes are empty */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="block font-subtitle text-gray-700 mb-2">{t("quantity")}</label>
                {!product.sizes || product.sizes.length === 0 ? (
                  <span
                    className={`text-sm font-body ${
                      (product.productQuantity || 0) <= 0 ? "text-red-600 font-bold" : "text-gray-500"
                    }`}
                  >
                    {(product.productQuantity || 0) <= 0
                      ? t("outOfStock")
                      : `${t("available")}: ${product.productQuantity || 0}`}
                  </span>
                ) : (
                  selectedSize &&
                  selectedColor && (
                    <span
                      className={`text-sm font-body ${
                        getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity <= 0
                          ? "text-red-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      {getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity <= 0
                        ? t("outOfStock")
                        : `${t("available")}: ${getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0}`}
                    </span>
                  )
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={
                    quantity <= 1 ||
                    (product.sizes && product.sizes.length > 0
                      ? !selectedColor ||
                        (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) <= 0
                      : (product.productQuantity || 0) <= 0)
                  }
                  className="px-3 py-1 border rounded-l-md disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={
                    product.sizes && product.sizes.length > 0
                      ? getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0
                      : product.productQuantity || 0
                  }
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                  disabled={
                    product.sizes && product.sizes.length > 0
                      ? !selectedColor ||
                        (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) <= 0
                      : (product.productQuantity || 0) <= 0
                  }
                  className="w-16 px-3 py-1 border-t border-b text-center font-body disabled:bg-gray-100"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    product.sizes && product.sizes.length > 0
                      ? !selectedColor ||
                        quantity >=
                          (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) ||
                        (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) <= 0
                      : quantity >= (product.productQuantity || 0) || (product.productQuantity || 0) <= 0
                  }
                  className="px-3 py-1 border rounded-r-md disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Wishlist button */}
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 py-3 rounded-md hover:bg-gray-50 mb-4"
            >
              <Heart size={20} className={inWishlist ? "text-red-500 fill-red-500" : "text-gray-500"} />
              {inWishlist ? t("removeFromWishlist") : t("addToWishlist")}
            </button>

            {wishlistMessage && (
              <div className="mt-2 mb-4 p-2 bg-green-50 text-green-700 rounded-md text-center font-body">
                {wishlistMessage}
              </div>
            )}

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 text-gray-800 py-3 rounded-md-light"
                  style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-black)",
                  transition: "background-color 0.2s, color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-secondary)"
                  e.currentTarget.style.color = "var(--color-text-white)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-background)"
                  e.currentTarget.style.color = "var(--color-text-black)"
                }}
              >
                {addingToCart ? t("adding") : t("addToCart")}
              </button>

              {/* Update the Buy with PayPal button to be disabled if selected size is out of stock */}
              <button
                className="flex-1 py-3 rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-white)",
                  transition: "background-color 0.2s, color 0.2s",
                }}
                onMouseEnter={e => {
                  if (!(e.currentTarget as HTMLButtonElement).disabled) {
                    e.currentTarget.style.backgroundColor = "var(--color-secondary)"
                    e.currentTarget.style.color = "var(--color-text-white)"
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-primary)"
                  e.currentTarget.style.color = "var(--color-text-white)"
                }}
                onClick={handlePayPalCheckout}
                disabled={
                  product.sizes && product.sizes.length > 0
                    ? !selectedSize ||
                      !selectedColor ||
                      (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) <= 0
                    : (product.productQuantity || 0) <= 0
                }
              >
                {product.sizes && product.sizes.length > 0
                  ? !selectedSize ||
                    !selectedColor ||
                    (getColorsForSelectedSize().find((c) => c.color === selectedColor)?.quantity || 0) <= 0
                    ? t("outOfStock")
                    : t("buyWithPayPal")
                  : (product.productQuantity || 0) <= 0
                    ? t("outOfStock")
                    : t("buyWithPayPal")}
              </button>
            </div>
            <p className="text-center text-gray-500 text-sm mb-8">{t("otherPaymentMethods")}</p>

            {cartMessage && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-center font-body">{cartMessage}</div>
            )}

            <p className="font-body text-gray-700 mb-8">{description}</p>

            <div className="space-y-6">
              {product.materials && (
                <div>
                  <h2 className="text-xl font-title font-semibold mb-2"
                  style={{
                    color: "var(--color-text-header)",
                  }}
                  >{t("materials")}</h2>
                  <p className="font-body text-gray-700">{product.materials}</p>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h2 className="text-xl font-title font-semibold mb-2"
                  style={{
                    color: "var(--color-text-header)",
                  }}
                  >{t("sizes")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Group sizes by name (case insensitive)
                      const sizeGroups = new Map()
                      product.sizes.forEach((sizeObj: { size: string; quantity: number; colors?: string[] }) => {
                        const sizeLower = sizeObj.size.toLowerCase()
                        if (!sizeGroups.has(sizeLower)) {
                          sizeGroups.set(sizeLower, {
                            size: sizeObj.size, // Keep original case for display
                            quantity: sizeObj.quantity,
                            colors: sizeObj.colors || [],
                          })
                        } else {
                          const existingSize = sizeGroups.get(sizeLower)
                          existingSize.quantity += sizeObj.quantity
                          // Combine colors
                          if (sizeObj.colors && sizeObj.colors.length > 0) {
                            existingSize.colors = [...new Set([...existingSize.colors, ...sizeObj.colors])]
                          }
                        }
                      })

                      // Convert map to array
                      const mergedSizes = Array.from(sizeGroups.values())

                      return mergedSizes.map((sizeObj, index) => (
                        <button
                          key={index}
                          className={`px-4 py-2 rounded-md font-body ${
                            selectedSize.toLowerCase() === sizeObj.size.toLowerCase()
                              ? "border-primary border"
                              : sizeObj.quantity > 0
                                ? "bg-gray-200 text-gray-700 border border-gray-300 hover:border-primary"
                                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          }`}
                          style={
                            selectedSize.toLowerCase() === sizeObj.size.toLowerCase()
                              ? {
                                  backgroundColor: "var(--color-primary)",
                                  color: "var(--color-text-white)",
                                  border: "1px solid var(--color-primary)",
                                }
                              : undefined
                          }
                          onClick={() => {
                            if (sizeObj.quantity > 0) {
                              setSelectedSize(sizeObj.size)
                              // Use colors from the clicked sizeObj, not from getColorsForSelectedSize()
                              const colorOptions = getColorsForSelectedSize(sizeObj.size)
                              const firstAvailableColor = colorOptions.find((c) => c.quantity > 0)
                              setSelectedColor(
                                firstAvailableColor ? firstAvailableColor.color : colorOptions[0]?.color || "",
                              )
                            }
                          }}
                          disabled={sizeObj.quantity <= 0}
                        >
                          <div className="flex flex-col items-center">
                            <span>{sizeObj.size}</span>
                            <span className="text-xs mt-1">
                              {sizeObj.quantity <= 0 ? `(${t("outOfStock")})` : `(${sizeObj.quantity})`}
                            </span>
                            {/* Color indicators */}
                            {sizeObj.colors && sizeObj.colors.length > 0 && (
                              <div className="flex mt-1 gap-1 flex-wrap justify-center">
                                {sizeObj.colors.map((color: string, colorIndex: number) => (
                                  <span
                                    key={colorIndex}
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor: color.toLowerCase(),
                                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                                    }}
                                    title={color}
                                  ></span>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && getColorsForSelectedSize().length > 0 && (
                <div>
                  <h2 className="text-xl font-title font-semibold mb-2"
                  style={{
                    color: "var(--color-text-header)",
                  }}
                  >{t("colors")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {getColorsForSelectedSize().map((colorObj, index) => (
                      <button
                        key={index}
                        className={`px-4 py-2 rounded-md font-body flex items-center ${
                          selectedColor === colorObj.color
                            ? "text-black border-primary border"
                            : "bg-gray-200 text-gray-700 border border-gray-300 hover:border-primary"
                        }`}
                        style={
                          selectedColor === colorObj.color
                            ? { backgroundColor: "var(--color-background)" }
                            : undefined
                        }
                        onClick={() => setSelectedColor(colorObj.color)}
                      >
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor: colorObj.color.toLowerCase(),
                            border: "1px solid #ccc",
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                          }}
                        ></span>
                        {colorObj.color} <span className="ml-2 text-xs">({colorObj.quantity})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-title font-semibold mb-2"
                style={{
                    color: "var(--color-text-header)",
                  }}
                >{t("shipping")}</h2>
                <div className="mb-4">
                  <select
                    value={selectedShipping ? JSON.stringify(selectedShipping) : ""}
                    onChange={(e) => setSelectedShipping(e.target.value ? JSON.parse(e.target.value) : null)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-body"
                  >
                    {product.shipping?.map((option, index) => (
                      <option key={index} value={JSON.stringify(option)}>
                        {option.name} (${option.price})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedShipping && (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span className="font-body text-gray-700">{selectedShipping.name}</span>
                    <div
                      className={`px-3 py-1 rounded-md ${selectedShipping.price === 0 ? "bg-green-500" : "bg-orange-500"}`}
                    >
                      <span className="text-white font-medium">
                        {selectedShipping.price === 0 ? t("free") : `$${selectedShipping.price}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-title font-semibold mb-2"
                style={{
                    color: "var(--color-text-header)",
                  }}
                >{t("productStats")}</h2>
                <p className="font-body text-gray-700">
                  {t("views")}: {product.visits || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-title font-bold mb-6"
            style={{
              color: "var(--color-text-header)",
            }}
            >{t("recommendedProducts")}</h2>
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
                    <p className="font-body text-gray-700">{formatPrice(item.price, currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-title font-bold mb-6"
          style = {{
            color: "var(--color-text-header)",
          }}
          >{t("comments")}</h2>

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
                className="px-4 py-2 rounded-md disabled:opacity-80 font-body"
                style={{
                  color: "var(--color-text-white)",
                  backgroundColor: "var(--color-primary)",
                  transition: "background-color 0.2s, color 0.2s",
                }}
                onMouseEnter={e => {
                  if ((e.currentTarget as HTMLButtonElement).disabled) {
                    e.currentTarget.style.color = "var(--color-text-black)"
                    e.currentTarget.style.backgroundColor = "var(--color-primary)"
                  } else {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)"
                    e.currentTarget.style.color = "var(--color-text-black)"
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-primary)"
                  e.currentTarget.style.color = "var(--color-text-white)"
                }}
              >
                {submittingComment ? t("posting") : t("postComment")}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 rounded-md text-center"
            style = {{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-black)",
            }}
            >
              <p className="font-body text-gray-700 mb-2">{t("needLogin")}</p>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-white rounded-md font-body hover:text-black"
                style={{
                  backgroundColor: "var(--color-primary)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
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
            <div className="text-center py-8 rounded-md"
            style = {{
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-black)",
            }}
            >
              <MessageSquare className="mx-auto h-12 w-12"
              style = {{
                color: "var(--color-primary)",
              }}
              />
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
                          style={{ color: "var(--color-primary)", transition: "color 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-primary)")}
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
                        className="text-sm font-body flex items-center"
                        style={{ color: "var(--color-primary)", transition: "color 0.2s" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--color-primary)")}
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
                          className="px-3 py-1 text-white text-sm rounded-md hover:text-black disabled:opacity-50 font-body"
                          style={{
                            backgroundColor: "var(--color-primary)",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
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
                                  style={{
                                  color: "var(--color-primary)",
                                  transition: "color 0.2s",
                                  }}
                                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--color-secondary)")}
                                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--color-primary)")}
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

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-end">
              <button onClick={() => setShowLoginPrompt(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl mb-2"
              style={{
                fontWeight: "bold",
                color: "var(--color-text-header)",
              }}
              >{t("loginRequired")}</h3>
              <p className="text-gray-600">{t("loginRequiredForPurchase")}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowLoginPrompt(false)
                  navigate("/login")
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-white)",
                  transition: "background-color 0.2s, color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-secondary)"
                  e.currentTarget.style.color = "var(--color-text-white)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "var(--color-primary)"
                  e.currentTarget.style.color = "var(--color-text-white)"
                }}
              >
                <LogIn size={20} />
                {t("login")}
              </button>

              <div className="text-center">
                <p className="text-sm mb-2"
                style ={{
                  color: "var(--color-text-info)",
                }}
                >{t("dontHaveAccount")}</p>
                <button
                  onClick={() => {
                    setShowLoginPrompt(false)
                    navigate("/register")
                  }}
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
                >
                  <UserPlus size={18} />
                  {t("signUp")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayPal Preview Form */}
      {showPayPalPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 mr-2" 
                  style = {{
                    color: "var(--color-primary)"
                  }}
                  />
                  <h2 className="text-2xl font-bold text-gray-900">{t("invoicePreview")}</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("modify")}
                  </button>
                  <button
                    onClick={() => setShowPayPalPreview(false)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                    style ={{
                      backgroundColor: "var(--color-background-danger)",
                      transition: "filter 0.2s",
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.filter = "brightness(0.9)"
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.filter = "none"
                      }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t("shippingInformation")}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("firstName")}</label>
                        <input
                          type="text"
                          value={previewFirstName}
                          onChange={(e) => setPreviewFirstName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("lastName")}</label>
                        <input
                          type="text"
                          value={previewLastName}
                          onChange={(e) => setPreviewLastName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t("phone")}</label>
                      <input
                        type="tel"
                        value={previewPhone}
                        onChange={(e) => setPreviewPhone(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t("id")}</label>
                      <input
                        type="text"
                        value={previewId}
                        onChange={(e) => setPreviewId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t("street")}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={previewAddress.street}
                          onChange={(e) => setPreviewAddress({ ...previewAddress, street: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                        {selectedShipping && (
                          <div className="mt-1 text-sm text-gray-600">{t(`placeShippingAddress`)}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("city")}</label>
                        <input
                          type="text"
                          value={previewAddress.city}
                          onChange={(e) => setPreviewAddress({ ...previewAddress, city: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("state")}</label>
                        <input
                          type="text"
                          value={previewAddress.state}
                          onChange={(e) => setPreviewAddress({ ...previewAddress, state: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("postalCode")}</label>
                        <input
                          type="text"
                          value={previewAddress.postalCode}
                          onChange={(e) => setPreviewAddress({ ...previewAddress, postalCode: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t("country")}</label>
                        <input
                          type="text"
                          value={previewAddress.country}
                          onChange={(e) => setPreviewAddress({ ...previewAddress, country: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t("orderSummary")}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <p className="text-gray-600">{product?.title}</p>
                      <p className="text-gray-900">{formatPrice(priceToUse, currency)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">{t("size")}</p>
                      <p className="text-gray-900">{selectedSize}</p>
                    </div>
                    {selectedColor && (
                      <div className="flex justify-between">
                        <p className="text-gray-600">{t("color")}</p>
                        <div className="flex items-center">
                          <span
                            className="w-4 h-4 rounded-full mr-2"
                            style={{
                              backgroundColor: selectedColor.toLowerCase(),
                              border: "1px solid #ccc",
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                            }}
                          ></span>
                          <p className="text-gray-900">{selectedColor}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <p className="text-gray-600">{t("quantity")}</p>
                      <p className="text-gray-900">{quantity}</p>
                    </div>
                    {selectedShipping && (
                      <div className="flex justify-between">
                        <p className="text-gray-600">{selectedShipping.name}</p>
                        <p className="text-gray-900">{formatPrice(selectedShipping.price, currency)}</p>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <p className="text-lg font-medium text-gray-900">{t("total")}</p>
                        <p className="text-lg font-medium text-gray-900">
                          {formatPrice(
                            selectedShipping
                            ? priceToUse * quantity + selectedShipping.price
                            : priceToUse * quantity,
                          currency
                          )}
                        </p>
                      </div>

                      {/* PayPal Button */}
                      <div className="mt-4">
                        <button
                          onClick={handlePreviewSubmit}
                          disabled={!isFormValid()}
                          className="w-full px-6 py-3 rounded-md text-white"
                          style={{
                            backgroundColor: isFormValid() ? "var(--color-primary)" : "#d1d5db", // Tailwind gray-300
                            color: isFormValid() ? "white" : "#6b7280", // Tailwind gray-500
                            cursor: isFormValid() ? "pointer" : "not-allowed",
                            transition: "background-color 0.2s, color 0.2s",
                          }}
                          onMouseEnter={e => {
                            if (isFormValid()) e.currentTarget.style.backgroundColor = "var(--color-secondary)"
                          }}
                          onMouseLeave={e => {
                            if (isFormValid()) e.currentTarget.style.backgroundColor = "var(--color-primary)"
                          }}
                        >
                          {t("proceedToPayPal")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayPal form with return URL that redirects to orders page */}
      <form
        // action="https://www.paypal.com/cgi-bin/webscr"
        action="https://www.sandbox.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
        className="hidden"
        id="paypal-form"
      >
        <input type="hidden" name="cmd" value="_xclick" />
        <input type="hidden" name="business" value={import.meta.env.VITE_ADMIN_USER_EMAIL_PP} />
        <input
          type="hidden"
          name="item_name"
          value={`${product.title} - ${selectedSize}${selectedColor ? ` - ${selectedColor}` : ""}`}
        />
        <input type="hidden" name="item_number" value={product._id} />
        <input
          type="hidden"
          name="amount"
          value={
            selectedShipping && selectedShipping.price > 0
              ? (priceToUse + selectedShipping.price).toFixed(2)
              : priceToUse
          }
        />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="currency_code" value="USD" />
        <input type="hidden" name="custom" value={`${userData ? userData._id : ""}|${selectedSize}|${selectedColor}`} />
        <input type="hidden" name="no_shipping" value="1" />
        <input type="hidden" name="no_note" value="1" />
        <input type="hidden" name="tax" value="0" />
        <input
          type="hidden"
          name="return"
          value={`${window.location.origin}/orders?success=true&productId=${product._id}&title=${encodeURIComponent(product.title)}&price=${product.price}&quantity=${quantity}&shipping=${selectedShipping ? selectedShipping.price : 0}&size=${selectedSize}&color=${encodeURIComponent(selectedColor)}`}
        />
        <input type="hidden" name="cancel_return" value={`${window.location.origin}/product/${product._id}`} />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif"
          name="submit"
          alt="PayPal - The safer, easier way to pay online!"
        />
      </form>
    </div>
  )
}

export default ProductDetail
