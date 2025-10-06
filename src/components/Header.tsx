"use client"

import React, { useState, useEffect, useRef, useContext } from "react"
import {
  ShoppingCart,
  Search,
  ChevronDown,
  LogIn,
  Plus,
  Edit,
  Trash2,
  ImageIcon,
  Users,
  FileText,
  Home,
  Globe,
  DollarSign,
  Settings,
  User,
  UserCircle,
  Heart,
  ShoppingBag,
  Cog,
} from "lucide-react"
import type { Currency, Language } from "../App"
import { useNavigate } from "react-router-dom"
import { LanguageContext } from "../App"
// Add import for the API utility functions
import { getApiUrl } from "../utils/apiUtils"

interface HeaderProps {
  currency: Currency
  setCurrency: (currency: Currency) => void
  language: Language
  setLanguage: (language: Language) => void
}

interface ShippingInfo {
  shipping_name: string
  shipping_value: number
}

interface CartItem {
  _id: string
  title: string
  price: number
  image: string
  quantity: number
  productId: string
  shipping?: ShippingInfo[]
}

const Header: React.FC<HeaderProps> = ({ currency, setCurrency, language, setLanguage }) => {
  const { t } = useContext(LanguageContext)
  const [showCurrency, setShowCurrency] = useState(false)
  const [showLanguage, setShowLanguage] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [visibleCartItems, setVisibleCartItems] = useState(3)
  const [loading, setLoading] = useState(false)
  const [draftCount, setDraftCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSellerOrAdmin, setIsSellerOrAdmin] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [siteLogo, setSiteLogo] = useState<string>("/placeholder.png")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CartItem[]>([])
  const [visibleSearchResults, setVisibleSearchResults] = useState(9) // Limit visible results to 9

  // Function to show more search results
  const showMoreSearchResults = () => {
    setVisibleSearchResults((prev) => prev + 9)
  }

  const navigate = useNavigate()

  // Refs for dropdown menus
  const currencyRef = useRef<HTMLDivElement>(null)
  const languageRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const cartDropdownRef = useRef<HTMLDivElement>(null)

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(getApiUrl("get-user-details"), {
          credentials: "include",
        })
        if (response.ok) {
          const userData = await response.json()
          setIsLoggedIn(true)
          setUserEmail(userData.email)
          setUserName(userData.name)
          setUserAvatar(userData.avatar)

          // Check if user is admin
          const adminEmail = import.meta.env.VITE_ADMIN_USER_EMAIL
          setIsAdmin(userData.email === adminEmail)
          // Check seller or admin access
          try {
            const sellerRes = await fetch(getApiUrl("api/check-seller-or-admin"), { credentials: "include" })
            setIsSellerOrAdmin(sellerRes.ok)
          } catch {}
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const fetchCartData = async () => {
      if (isLoggedIn) {
        try {
          // Get cart count
          const countResponse = await fetch(getApiUrl("api/cart/count"), {
            credentials: "include",
          })
          if (countResponse.ok) {
            const countData = await countResponse.json()
            setCartCount(countData.count || 0)
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error)
        }
      }
    }

    fetchCartData()
  }, [isLoggedIn])

  // Fetch draft count when logged in
  useEffect(() => {
    const fetchDraftCount = async () => {
      if (isLoggedIn && isAdmin) {
        try {
          const response = await fetch(getApiUrl("api/drafts/count"), {
            credentials: "include",
          })
          if (response.ok) {
            const data = await response.json()
            setDraftCount(data.count || 0)
          }
        } catch (error) {
          console.error("Failed to fetch draft count:", error)
        }
      }
    }

    fetchDraftCount()
  }, [isLoggedIn, isAdmin])

  const fetchCartItems = async () => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    try {
      setLoading(true)
      const response = await fetch(getApiUrl("api/cart"), {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch cart items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!showCartDropdown) {
      await fetchCartItems()
    }

    setShowCartDropdown(!showCartDropdown)
  }

  const handleLogout = async () => {
    try {
      await fetch(getApiUrl("logout"), {
        method: "POST",
        credentials: "include",
      })
      setIsLoggedIn(false)
      setUserEmail("")
      setIsAdmin(false)
      navigate("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const showMoreCartItems = () => {
    setVisibleCartItems((prev) => prev + 3)
  }

  const calculateCartTotal = () => {
  return cartItems.reduce((total, item) => {
    const base = item.price * item.quantity
    let shipping = 0
    if (item.shipping && Array.isArray(item.shipping) && item.shipping.length > 0 && item.shipping[0].shipping_value) {
      const value = Number(item.shipping[0].shipping_value)
      if (!isNaN(value)) {
        shipping += value
      }
    }
    return total + base + shipping
  }, 0).toFixed(2)
}

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
  }

  // Function to fetch matching products
  const fetchSearchResults = async (query: string) => {
    try {
      const response = await fetch(getApiUrl(`api/products?search=${query}`))
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error)
    }
  }

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim()) {
      fetchSearchResults(query)
    } else {
      setSearchResults([])
    }
  }

  // Handle clicks outside of dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Currency dropdown
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrency(false)
      }

      // Language dropdown
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguage(false)
      }

      // User menu dropdown
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }

      // Admin menu dropdown
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false)
      }

      // Cart dropdown
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setShowCartDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Flag URLs
  const flagUrls: Record<Language, string> = {
    English: "https://flagcdn.com/w40/us.png",
    Español: "https://flagcdn.com/w40/ve.png",
  }

  // Fetch siteLogo from page settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`)
        if (response.ok) {
          const data = await response.json()
          if (data.siteLogo) {
            setSiteLogo(data.siteLogo)
          }
        }
      } catch (err) {
        setSiteLogo("/placeholder.png")
      }
    }
    fetchLogo()
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 shadow-md h-16" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {isMobile ? (
              <a
                href="/"
                className="text-2xl font-bold text-yellow-300 w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                CS
              </a>
            ) : (
              <a href="/" className="text-2xl font-bold text-yellow-300">
                <img
                  src={siteLogo || "/placeholder.png"}
                  alt="Logo"
                  className="h-10 w-40"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png" }}
                />
              </a>
            )}
            <nav className="flex space-x-6">
              {isMobile ? (
                // Mobile navigation with icons
                <>
                  <a href="/" className="text-textBanner group relative">
                    <Home size={20} className="transform transition-transform hover:scale-[1.001]" />
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-300 group-hover:w-full"></span>
                  </a>

                  <div className="relative" ref={currencyRef}>
                    <button onClick={() => setShowCurrency((prev) => !prev)} className="text-textBanner group relative">
                      <DollarSign size={20} className="transform transition-transform hover:scale-[1.001]" />
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                    {showCurrency && (
                      <div className="absolute top-full mt-2 w-24 bg-white shadow-lg rounded-md py-2 z-50">
                        {(["USD", "VES"] as Currency[]).map((curr) => (
                          <button
                            key={curr}
                            onClick={() => {
                              setCurrency(curr)
                              setShowCurrency(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            <img
                              src={curr === "USD" ? "/usd.png" : "/bcv.png"}
                              alt={`${curr} icon`}
                              className="w-5 h-5 mr-2"
                            />
                            {curr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={languageRef}>
                    <button onClick={() => setShowLanguage((prev) => !prev)} className="text-textBanner group relative">
                      <Globe size={20} className="transform transition-transform hover:scale-[1.001]" />
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                    {showLanguage && (
                      <div className="absolute top-full mt-2 w-32 bg-white shadow-lg rounded-md py-2 z-50">
                        {(["English", "Español"] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang)
                              setShowLanguage(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            <img
                              src={flagUrls[lang] || "/placeholder.svg"}
                              alt={`${lang} flag`}
                              className="w-5 h-auto mr-2"
                            />
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isSellerOrAdmin && !isAdmin && (
                    <a href="/upload" className="text-textBanner group relative">
                      Upload
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                  )}

                  {isAdmin && (
                    <div className="relative" ref={adminMenuRef}>
                      <button
                        onClick={() => setShowAdminMenu((prev) => !prev)}
                        className="text-textBanner group relative"
                      >
                        <Settings size={20} className="transform transition-transform hover:scale-[1.001]" />
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-300 group-hover:w-full"></span>
                      </button>
                      {showAdminMenu && (
                        <div className="absolute top-full mt-2 w-40 bg-white shadow-lg rounded-md py-2 z-50">
                          <button
                            onClick={() => navigate("/admin/create-product")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Plus size={16} className="mr-2 flex-shrink-0" /> {t("createProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/drafts")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <FileText size={16} className="mr-2 flex-shrink-0" /> {t("drafts")} ({draftCount})
                          </button>
                          <button
                            onClick={() => navigate("/admin/edit-products")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Edit size={16} className="mr-2 flex-shrink-0" /> {t("editProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/delete-products")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Trash2 size={16} className="mr-2 flex-shrink-0" /> {t("deleteProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/gallery")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <ImageIcon size={16} className="mr-2 flex-shrink-0" /> {t("gallery")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/users")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Users size={16} className="mr-2 flex-shrink-0" /> {t("users")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/settings")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Cog size={16} className="mr-2 flex-shrink-0" /> {t("settings")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Desktop navigation with text
                <>
                  <a href="/" className="text-textBanner group relative transform transition-transform hover:scale-[1.1]">
                    {t("home")}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                    style = {{
                      backgroundColor: "var(--color-background)"
                    }}
                    ></span>
                  </a>

                  <div className="relative" ref={currencyRef}>
                    <button
                      onClick={() => setShowCurrency((prev) => !prev)}
                      className="flex items-center text-textBanner group relative transform transition-transform hover:scale-[1.1]"
                    >
                      <img
                        src={currency === "USD" ? "/usd.png" : "/bcv.png"}
                        alt={`${currency} icon`}
                        className="w-5 h-5 mr-2"
                      />
                      {currency} <ChevronDown size={16} className="ml-1" />
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                      style = {{
                        backgroundColor: "var(--color-background)"
                      }}
                      ></span>
                    </button>
                    {showCurrency && (
                      <div className="absolute top-full mt-2 w-24 bg-white shadow-lg rounded-md py-2 z-50">
                        {(["USD", "VES"] as Currency[]).map((curr) => (
                          <button
                            key={curr}
                            onClick={() => {
                              setCurrency(curr)
                              setShowCurrency(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            <img
                              src={curr === "USD" ? "/usd.png" : "/bcv.png"}
                              alt={`${curr} icon`}
                              className="w-5 h-5 mr-2"
                            />
                            {curr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={languageRef}>
                    <button
                      onClick={() => setShowLanguage((prev) => !prev)}
                      className="flex items-center text-textBanner group relative transform transition-transform hover:scale-[1.1]"
                    >
                      <img
                        src={flagUrls[language] || "/placeholder.svg"}
                        alt={`${language} flag`}
                        className="w-5 h-auto mr-2"
                      />
                      {language} <ChevronDown size={16} className="ml-1" />
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                      style = {{
                        backgroundColor: "var(--color-background)"
                      }}
                      ></span>
                    </button>
                    {showLanguage && (
                      <div className="absolute top-full mt-2 w-32 bg-white shadow-lg rounded-md py-2 z-50">
                        {(["English", "Español"] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang)
                              setShowLanguage(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            <img
                              src={flagUrls[lang] || "/placeholder.svg"}
                              alt={`${lang} flag`}
                              className="w-5 h-auto mr-2"
                            />
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isSellerOrAdmin && !isAdmin && (
                    <a href="/upload" className="text-textBanner group relative transform transition-transform hover:scale-[1.1]">
                      Upload
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: "var(--color-background)" }}></span>
                    </a>
                  )}

                  {isAdmin && (
                    <div className="relative" ref={adminMenuRef}>
                      <button
                        onClick={() => setShowAdminMenu((prev) => !prev)}
                        className="flex items-center text-textBanner group relative transform transition-transform hover:scale-[1.1]"
                      >
                        {t("adminTools")} <ChevronDown size={16} className="ml-1" />
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                        style = {{
                          backgroundColor: "var(--color-background)"
                        }}
                        ></span>
                      </button>
                      {showAdminMenu && (
                        <div className="absolute top-full mt-2 w-40 bg-white shadow-lg rounded-md py-2 z-50">
                          <button
                            onClick={() => navigate("/admin/create-product")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Plus size={16} className="mr-2 flex-shrink-0" /> {t("createProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/drafts")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <FileText size={16} className="mr-2 flex-shrink-0" /> {t("drafts")} ({draftCount})
                          </button>
                          <button
                            onClick={() => navigate("/admin/edit-products")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Edit size={16} className="mr-2 flex-shrink-0" /> {t("editProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/delete-products")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Trash2 size={16} className="mr-2 flex-shrink-0" /> {t("deleteProduct")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/gallery")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <ImageIcon size={16} className="mr-2 flex-shrink-0" /> {t("gallery")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/users")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Users size={16} className="mr-2 flex-shrink-0" /> {t("users")}
                          </button>
                          <button
                            onClick={() => navigate("/admin/settings")}
                            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                          >
                            <Cog size={16} className="mr-2 flex-shrink-0" /> {t("settings")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={toggleSearch}
              className="text-textBanner group relative transform transition-transform hover:scale-[1.1]"
            >
              <Search size={20} />
              <span
                className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                style={{
                  backgroundColor: "var(--color-background)",
                }}
              ></span>
            </button>

            {/* Cart with dropdown */}
            <div className="relative" ref={cartDropdownRef}>
              <button
                onClick={handleCartClick}
                className="text-textBanner group relative transform transition-transform hover:scale-[1.1]"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                style = {{
                  backgroundColor: "var(--color-background)"
                }}
                ></span>
              </button>

              {showCartDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-medium">
                      {t("yourCart")} ({cartCount} {t("items")})
                    </h3>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">{t("loading")}...</p>
                      </div>
                    ) : cartItems.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-500">{t("emptyCart")}</p>
                      </div>
                    ) : (
                      <>
                        <ul className="divide-y divide-gray-200">
                          {cartItems.slice(0, visibleCartItems).map((item) => (
                            <li key={item._id} className="px-4 py-3 flex items-center">
                              <a
                                href={`/product/${item.productId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200"
                              >
                                <img
                                  src={`${item.image}` || "/placeholder.svg?height=100&width=100"}
                                  alt={item.title}
                                  className="h-full w-full object-cover object-center"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=100"
                                  }}
                                />
                              </a>
                              <div className="ml-3 flex-1">
                                <a
                                  href={`/product/${item.productId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-gray-900 truncate hover:text-gray-600"
                                >
                                  {item.title}
                                </a>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} x ${item.price.toFixed(2)}
                                  {item.shipping && Array.isArray(item.shipping) && item.shipping.length > 0 && item.shipping[0].shipping_value && (
                                    <>
                                      <br />
                                      <span>
                                        {item.shipping[0].shipping_name}: ${item.shipping[0].shipping_value}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                              {(() => {
                                const baseTotal = item.price * item.quantity
                                let shippingTotal = 0
                                if (item.shipping && Array.isArray(item.shipping) && item.shipping.length > 0 && item.shipping[0].shipping_value) {
                                  // Suma el valor del shipping (puede ser string o number)
                                  const value = Number(item.shipping[0].shipping_value)
                                  if (!isNaN(value)) {
                                    shippingTotal += value
                                  }
                                }
                                return `$${(baseTotal + shippingTotal).toFixed(2)}`
                              })()}
                            </div>
                            </li>
                          ))}
                        </ul>

                        {cartItems.length > visibleCartItems && (
                          <div className="px-4 py-2 text-center">
                            <button onClick={showMoreCartItems} className="text-sm text-blue-600 hover:text-gray-800">
                              {t("showMore")} ({cartItems.length - visibleCartItems} {t("remaining")})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{t("subtotal")}</span>
                      <span>${calculateCartTotal()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCartDropdown(false)
                        navigate("/cart")
                      }}
                      className="mt-3 w-full text-white py-2 px-4 rounded-md"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
                    >
                      {t("checkout")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              {isMobile ? (
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="text-textBanner group relative transform transition-transform hover:scale-[1.001]"
                >
                  {userAvatar ? (
                    <img
                      src={getApiUrl(`api/images/${userAvatar || "/placeholder.svg"}`)}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                      }}
                    />
                  ) : (
                    <User size={20} />
                  )}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                  style = {{
                    backgroundColor: "var(--color-secondary)"
                  }}
                  ></span>
                </button>
              ) : (
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center text-textBanner group relative transform transition-transform hover:scale-[1.001]"
                >
                  {userAvatar ? (
                    <img
                      src={getApiUrl(`api/images/${userAvatar || "/placeholder.svg"}`)}
                      alt="Avatar"
                      className="w-6 h-6 mr-2 rounded-full"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                      }}
                    />
                  ) : (
                    <UserCircle size={16} className="mr-2" />
                  )}
                  {isLoggedIn ? userName || userEmail : t("login")} <ChevronDown size={16} className="ml-1" />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                  style = {{
                    backgroundColor: "var(--color-background)"
                  }}
                  ></span>
                </button>
              )}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-50">
                  {isLoggedIn ? (
                    <>
                      <button
                        onClick={() => {
                          navigate("/profile")
                          setShowUserMenu(false)
                        }}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                      >
                        {userAvatar ? (
                          <img
                            src={getApiUrl(`api/images/${userAvatar || "/placeholder.svg"}`)}
                            alt="Avatar"
                            className="w-12 h-12 mr-2 rounded-full"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=64"
                            }}
                          />
                        ) : (
                          <UserCircle size={24} className="mr-2" />
                        )}
                        {t("profile")}
                      </button>
                      <button
                        onClick={() => {
                          navigate("/orders")
                          setShowUserMenu(false)
                        }}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                      >
                        <ShoppingBag size={20} className="mr-2" />
                        {t("orders")}
                      </button>
                      <button
                        onClick={() => {
                          navigate("/wishlist")
                          setShowUserMenu(false)
                        }}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                      >
                        <Heart size={20} className="mr-2" />
                        {t("wishlist")}
                      </button>
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 hover:bg-gray-100">
                        {t("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate("/login")}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                      >
                        <LogIn size={16} className="mr-2" /> {t("login")}
                      </button>
                      <button
                        onClick={() => navigate("/register")}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                      >
                        {t("register")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Side Menu */}
      {isSearchOpen && (
        <>
          {/* Semi-dark background */}
          <div
            onClick={closeSearch}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
          ></div>

          {/* Side Menu */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "300px",
              height: "100%",
              backgroundColor: "white",
              zIndex: 1000,
              boxShadow: "-4px 0 6px rgba(0, 0, 0, 0.1)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeSearch}
              style={{
                alignSelf: "flex-end",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✖
            </button>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "20px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)", // 3x3 grid
                  gap: "10px",
                }}
              >
                {searchResults.slice(0, visibleSearchResults).map((product) => (
                  <div
                    key={product._id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <a
                      href={`/product/${product._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "5px",
                        }}
                      />
                    </a>
                    <a
                      href={`/product/${product._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "12px",
                        margin: "5px 0",
                        textDecoration: "none",
                        color: "black",
                      }}
                    >
                      {product.title}
                    </a>
                    <p style={{ fontSize: "12px", fontWeight: "bold" }}>${product.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Show More Button */}
            {searchResults.length > visibleSearchResults && (
              <button
                onClick={showMoreSearchResults}
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Show More
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default Header
