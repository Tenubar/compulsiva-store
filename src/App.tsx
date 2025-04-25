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
export type ProductType = "Shirt" | "Pants" | "Shoes" | "Bracelet" | "Collar"

// Create a language context to be used throughout the app
export const LanguageContext = React.createContext<{
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}>({
  language: "Spanish", // Default language
  setLanguage: () => {},
  t: (key) => key,
})

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [language, setLanguage] = useState<Language>("Spanish") // Default to Spanish
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([])

  // Translation function
  const t = (key: string) => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
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
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

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
                    {(["Shirt", "Pants", "Shoes", "Bracelet", "Collar"] as ProductType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleProductType(type)}
                        className={`px-4 py-2 rounded-full ${
                          selectedTypes.includes(type) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                    {selectedTypes.length > 0 && (
                      <button onClick={clearFilters} className="px-4 py-2 rounded-full bg-red-600 text-white">
                        Clear All
                      </button>
                    )}
                  </div>

                  {viewMode === "grid" ? (
                    <ProductGrid
                      selectedTypes={selectedTypes}
                      onProductClick={(productId) => console.log("Product clicked:", productId)}
                    />
                  ) : (
                    <ProductList
                      selectedTypes={selectedTypes}
                      onProductClick={(productId) => console.log("Product clicked:", productId)}
                    />
                  )}
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </LanguageContext.Provider>
  )
}

export default App
