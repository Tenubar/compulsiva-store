"use client"

import React from "react"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { Grid, List } from "lucide-react"
import ProductGrid from "./components/ProductGrid"
import ProductList from "./components/ProductList"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ProductDetail from "./components/ProductDetail"
import Login from "./components/Login"
import Register from "./components/Register"
import CreateProduct from "./components/admin/CreateProduct"
import EditProducts from "./components/admin/EditProducts"
import DeleteProducts from "./components/admin/DeleteProducts"
import AdminGallery from "./components/admin/AdminGallery"
import AdminUsers from "./components/admin/AdminUsers"
import Cart from "./components/Cart"
import EditDraft from "./components/admin/EditDraft"
import Drafts from "./components/admin/Drafts"
import AdminRoute from "./components/AdminRoute"
import Unauthorized from "./components/Unauthorized"
import { translations, type LanguageType } from "./translations"
import Profile from "./components/Profile"
import Wishlist from "./components/Wishlist"
import AboutMe from "./components/AboutMe"
import Contact from "./components/Contact"
import ShippingPolicy from "./components/ShippingPolicy"
import Returns from "./components/Returns"
import SuggestionBox from "./components/SuggestionBox"
import Orders from "./components/Orders"
import OrderDetail from "./components/OrderDetail"

// Add this function to restore scroll position
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // If we're on the home page and have a stored scroll position
    if (pathname === "/" && typeof window !== "undefined") {
      const lastScrollPosition = sessionStorage.getItem("scrollPosition")
      if (lastScrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, Number.parseInt(lastScrollPosition, 10))
          // Clear the stored position after using it
          sessionStorage.removeItem("scrollPosition")
        }, 100)
      }
    } else {
      // For other pages, scroll to top
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}

export type ViewMode = "grid" | "list"
export type Currency = "USD" | "EUR" | "VES"
export type Language = LanguageType
export type ProductType = "Shirt" | "Pants" | "Shoes" | "Bracelet" | "Collar" | "Other"

// Create a language context to be used throughout the app
export const LanguageContext = React.createContext<{
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  currency: Currency
  setCurrency: (currency: Currency) => void
}>({
  language: "English",
  setLanguage: () => {},
  t: (key: string) => key,
  currency: "USD",
  setCurrency: () => {},
})

// Create exchange rate context
export const ExchangeRateContext = React.createContext<{
  exchangeRate: number
}>({
  exchangeRate: 1,
})

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [currency, setCurrency] = useState<Currency>(() => {
    const savedCurrency = localStorage.getItem("currency") as Currency
    return savedCurrency || "USD"
  })
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    return savedLanguage || "Español"
  })
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([])
  const [exchangeRate, setExchangeRate] = useState(1)

  // Save currency and language to localStorage when they change
  useEffect(() => {
    localStorage.setItem("currency", currency)
  }, [currency])

  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  // Connect to exchange rate event source
  useEffect(() => {
    const eventSource = new EventSource("https://solartech.onrender.com/info1")

    eventSource.onmessage = (event) => {
      const rate = Number.parseFloat(event.data)
      if (!isNaN(rate)) {
        setExchangeRate(rate)
      }
    }

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Translation function
  const t = (key: string): string => {
    const translation = translations[language][key as keyof (typeof translations)[typeof language]]
    return typeof translation === "string" ? translation : key
  }

  // Add effect to store scroll position when navigating to product detail
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.location.pathname === "/") {
        sessionStorage.setItem("scrollPosition", window.scrollY.toString())
      }
    }

    // Store scroll position when clicking on a product
    const handleProductClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const productLink = target.closest('a[href^="/product/"]')
      if (productLink) {
        sessionStorage.setItem("scrollPosition", window.scrollY.toString())
      }
    }

    window.addEventListener("click", handleProductClick)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("click", handleProductClick)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const toggleProductType = (type: ProductType) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const clearFilters = () => {
    setSelectedTypes([])
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currency, setCurrency }}>
      <ExchangeRateContext.Provider value={{ exchangeRate }}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />

            {/* Admin Routes */}
            <Route
              path="/admin/gallery"
              element={
                <AdminRoute>
                  <AdminGallery />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/create-product"
              element={
                <AdminRoute>
                  <CreateProduct />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/edit-products"
              element={
                <AdminRoute>
                  <EditProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/delete-products"
              element={
                <AdminRoute>
                  <DeleteProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/drafts"
              element={
                <AdminRoute>
                  <Drafts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/edit-draft/:id"
              element={
                <AdminRoute>
                  <EditDraft />
                </AdminRoute>
              }
            />

            <Route path="/product/:id" element={<ProductDetail onBack={() => window.history.back()} />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/suggestions" element={<SuggestionBox />} />
            <Route
              path="/"
              element={
                <div className="min-h-screen bg-gray-50">
                  <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
                  <main className="container mx-auto px-4 py-8 mt-20">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-2 ${viewMode === "grid" ? "text-blue-600" : "text-gray-600"}`}
                        >
                          <Grid size={20} />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-2 ${viewMode === "list" ? "text-blue-600" : "text-gray-600"}`}
                        >
                          <List size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6">
                      {(["Shirt", "Pants", "Shoes", "Bracelet", "Collar", "Other"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleProductType(type)}
                          className={`px-4 py-2 rounded-full ${
                            selectedTypes.includes(type) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {t(type)}
                        </button>
                      ))}
                      {selectedTypes.length > 0 && (
                        <button onClick={clearFilters} className="px-4 py-2 rounded-full bg-red-600 text-white">
                          {t("clearAll")}
                        </button>
                      )}
                    </div>

                    {viewMode === "grid" ? (
                      <ProductGrid
                        selectedTypes={selectedTypes}
                        onProductClick={(productId) => console.log("Product clicked:", productId)}
                        currency={currency}
                      />
                    ) : (
                      <ProductList
                        selectedTypes={selectedTypes}
                        onProductClick={(productId) => console.log("Product clicked:", productId)}
                        currency={currency}
                      />
                    )}
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </Router>
      </ExchangeRateContext.Provider>
    </LanguageContext.Provider>
  )
}

export default App
