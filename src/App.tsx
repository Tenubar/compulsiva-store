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
import ThemeProvider from "./components/ThemeProvider"
// Add the import for AdminSettings component
import AdminSettings from "./components/admin/AdminSettings"


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
export type ProductType = "Other"

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
  const [siteFilters, setSiteFilters] = useState<ProductType[]>(["Other"])
  const [isChatOpen, setIsChatOpen] = useState(false)
  // Chat user state
  const [chatUser, setChatUser] = useState<{ name: string; email: string } | null>(null)
  const [chatLoading, setChatLoading] = useState(true)

  // Chat bubble states
  const [chatMessage, setChatMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatSent, setChatSent] = useState<"success"|"error"|null>(null);
  const [chatError, setChatError] = useState("");

  // Chat bubble limits
  const [messageCharLimit, setMessageCharLimit] = useState(2000)
  const [messagePerDay, setMessagePerDay] = useState(1)
  const [messagesSent, setMessagesSent] = useState(0)
  const [limitReached, setLimitReached] = useState(false)

  // Check login status for chat bubble y checar límite individual
  useEffect(() => {
    if (!isChatOpen) return;
    setChatLoading(true);
    // Checar usuario y límite individual
    Promise.all([
      fetch(`${import.meta.env.VITE_SITE_URL}/get-user-details`, { credentials: "include" }),
      fetch(`${import.meta.env.VITE_SITE_URL}/api/chat/check-limit`, { credentials: "include" })
    ])
      .then(async ([userRes, limitRes]) => {
        if (userRes.ok) {
          const user = await userRes.json();
          setChatUser({ name: user.name, email: user.email })
        } else {
          setChatUser(null)
        }
        if (limitRes.ok) {
          const data = await limitRes.json();
          setMessagePerDay(data.messagePerDay)
          setMessagesSent(data.messagesSent)
          setLimitReached(data.limitReached)
        } else {
          setMessagePerDay(1)
          setMessagesSent(0)
          setLimitReached(false)
        }
      })
      .catch(() => {
        setChatUser(null)
        setMessagePerDay(1)
        setMessagesSent(0)
        setLimitReached(false)
      })
      .finally(() => setChatLoading(false));
  }, [isChatOpen])

  useEffect(() => {
  const setFavicon = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`)
      if (response.ok) {
        const data = await response.json()
        const faviconUrl = data.siteIcon || "/iconPlaceholder.png"
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
        if (!link) {
          link = document.createElement("link")
          link.rel = "icon"
          document.head.appendChild(link)
        }
        link.href = faviconUrl
        console.log(faviconUrl)
      }
    } catch {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.head.appendChild(link)
      }
      link.href = "/iconPlaceholder.png"
    }
  }
  setFavicon()
}, [])

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

  // Fetch siteFilters from API on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`)
        if (response.ok) {
          const data = await response.json()
          let filters = data.siteFilters || ["Other"]
          // Always ensure "Other" is present
          if (!filters.some((f: string) => f.toLowerCase() === "other")) {
            filters = [...filters, "Other"]
          }
          setSiteFilters(filters)
        }
      } catch (err) {
        setSiteFilters(["Other"])
      }
    }
    fetchFilters()
  }, [])

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  // Send chat message to admin email
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatUser || chatMessage.trim().length < 15 || chatMessage.length > messageCharLimit || limitReached) return;
    setChatSending(true);
    setChatError("");
    setChatSent(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SITE_URL}/api/send-admin-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: chatMessage.trim() })
      });
      if (res.ok) {
        setChatSent("success");
        // Actualizar contador individual tras éxito
        setMessagesSent((prev) => prev + 1);
        if (messagesSent + 1 >= messagePerDay) setLimitReached(true);
      } else {
        const data = await res.json();
        setChatSent("error");
        setChatError(data?.message || "Hubo un error al enviar el mensaje");
      }
    } catch {
      setChatSent("error");
      setChatError("Hubo un error al enviar el mensaje");
    } finally {
      setChatSending(false);
    }
  };

  const handleChatOk = () => {
    setIsChatOpen(false);
    setChatSent(null);
    setChatMessage("");
    setChatError("");
  }

  // Cargar límites desde la API al abrir el chat
  useEffect(() => {
    if (!isChatOpen) return;
    const fetchLimits = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data.siteMessageLimits) && data.siteMessageLimits.length > 0) {
            setMessageCharLimit(Number(data.siteMessageLimits[0].messageCharLimit) || 2000)
            setMessagePerDay(Number(data.siteMessageLimits[0].messagePerDay) || 1)
          } else {
            setMessageCharLimit(2000)
            setMessagePerDay(1)
          }
        }
      } catch {
        setMessageCharLimit(2000)
        setMessagePerDay(1)
      }
    }
    fetchLimits()
  }, [isChatOpen])

  return (
    <ThemeProvider>
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
              {/* Add the route for AdminSettings in the Routes component (around line 100) */}
              {/* Find the Admin Routes section and add this route */}
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <AdminSettings />
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
                  <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
                    <Header
                      currency={currency}
                      setCurrency={setCurrency}
                      language={language}
                      setLanguage={setLanguage}
                    />
                    <main className="container mx-auto px-4 py-8 mt-20">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 ${viewMode === "grid" ? "text-primary" : "text-gray-600"}`}
                            style={{ color: viewMode === "grid" ? "var(--color-primary)" : undefined }}
                          >
                            <Grid size={20} />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 ${viewMode === "list" ? "text-primary" : "text-gray-600"}`}
                            style={{ color: viewMode === "list" ? "var(--color-primary)" : undefined }}
                          >
                            <List size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-6">
                        {siteFilters.map((type) => (
                          <button
                            key={type}
                            onClick={() => toggleProductType(type)}
                            className={`px-4 py-2 rounded-full`}
                            style={{
                              backgroundColor: selectedTypes.includes(type)
                                ? "var(--color-primary)"
                                : "var(--color-secondary)",
                              color: selectedTypes.includes(type) ? "var(--color-text-white)" : "var(--color-text-white)",
                            }}
                          >
                            {t(type)}
                          </button>
                        ))}
                        {selectedTypes.length > 0 && (
                          <button
                            onClick={clearFilters}
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-white)" }}
                          >
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

            {/* Chat Bubble */}
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1000,
              }}
            >
              {/* Chat Bubble Icon */}
              <button
                onClick={toggleChat}
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "50%",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <img
                  src="/chat_icon.png"
                  alt="Chat"
                  style={{ width: "30px", height: "30px" }}
                />
              </button>

              {/* Chat Form */}
              {isChatOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "80px",
                    right: "0",
                    width: "300px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>Have a question?</h4>
                    <button
                      onClick={toggleChat}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      ✖
                    </button>
                  </div>
                  {chatLoading ? (
                    <div style={{ color: '#888', textAlign: 'center', margin: '20px 0' }}>Cargando...</div>
                  ) : chatUser ? (
                    chatSent === "success" ? (
                      <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M8 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 18, marginTop: 10 }}>Mensaje Enviado</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>atención al cliente te responderá pronto</div>
                        <button onClick={handleChatOk} style={{ marginTop: 18, padding: '8px 24px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 500 }}>OK</button>
                      </div>
                    ) : chatSent === "error" ? (
                      <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 18, marginTop: 10 }}>Hubo un error al enviar el mensaje</div>
                        <button onClick={handleChatOk} style={{ marginTop: 18, padding: '8px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 500 }}>X</button>
                      </div>
                    ) : (
                      <form onSubmit={handleChatSend}>
                        <input
                          type="text"
                          placeholder="Name"
                          value={chatUser.name}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "10px",
                            margin: "10px 0",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            background: "#f5f5f5"
                          }}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={chatUser.email}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "10px",
                            margin: "10px 0",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            background: "#f5f5f5"
                          }}
                        />
                        <textarea
                          placeholder="Message"
                          rows={4}
                          value={chatMessage}
                          onChange={e => {
                            if (e.target.value.length <= messageCharLimit) setChatMessage(e.target.value)
                          }}
                          minLength={15}
                          maxLength={messageCharLimit}
                          required
                          style={{
                            width: "100%",
                            padding: "10px",
                            margin: "10px 0",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                          }}
                        ></textarea>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#bbb', marginBottom: 8 }}>
                          <span>Mensajes hoy: {messagesSent} / {messagePerDay}</span>
                          <span>{chatMessage.length} / {messageCharLimit}</span>
                        </div>
                        <button
                          type="submit"
                          disabled={chatSending || chatMessage.trim().length < 15 || chatMessage.length > messageCharLimit || limitReached}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: chatMessage.trim().length < 15 || chatMessage.length > messageCharLimit || limitReached ? '#ccc' : "var(--color-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: chatMessage.trim().length < 15 || chatMessage.length > messageCharLimit || limitReached ? 'not-allowed' : 'pointer',
                            opacity: chatSending ? 0.7 : 1
                          }}
                        >
                          {limitReached ? 'Límite diario alcanzado' : chatSending ? 'Enviando...' : 'Send'}
                        </button>
                      </form>
                    )
                  ) : (
                    <div
                      style={{
                        background: "#f3f4f6",
                        color: "#555",
                        borderRadius: "8px",
                        padding: "18px 10px",
                        textAlign: "center",
                        fontSize: "15px",
                        marginTop: "18px"
                      }}
                    >
                      Para enviarnos un mensaje por favor logeate,<br />¿no tienes cuenta? <a href="/register" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>registrate</a>.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Router>
        </ExchangeRateContext.Provider>
      </LanguageContext.Provider>
    </ThemeProvider>
  )
}

export default App