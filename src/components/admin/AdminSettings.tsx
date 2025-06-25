"use client"

import type React from "react"
import { useState, useEffect, useContext, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft,  Upload, Cog, Plus, Trash2, X, RefreshCw, ImageIcon, Edit, ArrowUp, ArrowDown } from "lucide-react"
import Header from "../Header"
import { LanguageContext } from "../../App"
import GalleryModal from "./GalleryModal"
import ConfirmationModal from "./ConfirmationModal"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"


// Define font combinations
const FONT_COMBINATIONS = [
  { label: "Inter + Oxygen", headers: "Inter, sans-serif", body: "Oxygen, sans-serif" },
  { label: "Roboto + Lora", headers: "Roboto, sans-serif", body: "Lora, serif" },
  { label: "Poppins + Merriweather", headers: "Poppins, sans-serif", body: "Merriweather, serif" },
  { label: "Montserrat + Source Serif Pro", headers: "Montserrat, sans-serif", body: "Source Serif Pro, serif" },
  { label: "Open Sans + Raleway", headers: "Open Sans, sans-serif", body: "Raleway, sans-serif" },
]

const COLOR_PRESETS = [
  {
    label: "Blue/Green",
    colors: {
      primary: "#3b82f6",
      secondary: "#10b981",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#374151",
      textHeader: "#343439",
      textInfo: "#595c5a",
      textDanger: "#d32f2f",
      textWhite: "#ffffff",
      textBlack: "#000000",
      textPrice: "#2c5bbf",
      backgroundSuccess: "#0dbf1f",
      backgroundDanger: "#e30242",
    },
  },
  {
    label: "Pink/Light Pink",
    colors: {
      primary: "#f48498",
      secondary: "#ffadbc",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#374151",
      textHeader: "#343439",
      textInfo: "#595c5a",
      textDanger: "#d32f2f",
      textWhite: "#ffffff",
      textBlack: "#000000",
      textPrice: "#f48498",
      backgroundSuccess: "#0dbf1f",
      backgroundDanger: "#e30242",
    },
  },
  {
    label: "Red/Purple/White",
    colors: {
      primary: "#e11d48",         // Red
      secondary: "#6e2ad5",       // Purple
      accent: "#f59e0b",          // Orange accent (can adjust)
      background: "#ffffff",      // White
      text: "#2d133b",            // Deep purple for text
      textHeader: "#2d133b",      // Purple for headers
      textInfo: "#433f46",        // Red for info
      textDanger: "#d32f2f",      // Red for danger
      textWhite: "#ffffff",
      textBlack: "#000000",
      textPrice: "#e11d48",       // Red for price
      backgroundSuccess: "#01b768",
      backgroundDanger: "#d32f2f",
    },
  },
  {
    label: "Navy/Coral/Mint/Yellow",
    colors: {
      primary: "#232F3B",         
      secondary: "#4D5E70",       
      accent: "#FF7B3B",          
      background: "#EFEFEF",      
      text: "#232F3B",            
      textHeader: "#000000",      
      textInfo: "#595c5a",        
      textDanger: "#FC2100",      
      textWhite: "#ffffff",
      textBlack: "#000000",
      textPrice: "#232F3B",       
      backgroundSuccess: "#35b135", 
      backgroundDanger: "#e52406", 
    },
  },
]

interface SiteSettings {
  icon: string
  logo: string
  typographyHeaders: string
  typographyBody: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    textHeader: string
    textInfo: string
    textDanger: string
    textWhite: string 
    textBlack: string 
    textPrice: string
    backgroundSuccess: string
    backgroundDanger: string  
  }
  filters: string[]
  // Añadido para los límites de mensajes
  messagePerDay: string
  messageCharLimit: string
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useContext(LanguageContext)

  const [settings, setSettings] = useState<SiteSettings>({
    icon: "/logoico.png",
    logo: "/logo.png",
    typographyHeaders: "Inter, sans-serif",
    typographyBody: "Oxygen, sans-serif",
    colors: {
      primary: "#1a365d",
      secondary: "#2d3748",
      accent: "#f6ad55",
      background: "#f7fafc",
      text: "#1a202c",
      textHeader: "#1a237e",
      textInfo: "#0288d1",
      textDanger: "#d32f2f",
      textWhite: "#ffffff",
      textBlack: "#000000",
      textPrice: "#16a34a",
      backgroundSuccess: "#99ff33",
      backgroundDanger: "#fee2e2",
    },
    filters: ["Shirt", "Pants", "Shoes", "Bracelet", "Collar", "Other"],
    messagePerDay: "1",
    messageCharLimit: "2000",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [selectedImageField, setSelectedImageField] = useState<"icon" | "logo" | null>(null)
  const [newFilter, setNewFilter] = useState("")
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null)
  const [editingFilterValue, setEditingFilterValue] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [filterToDeleteIndex, setFilterToDeleteIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFontCombination, setSelectedFontCombination] = useState(0)
  const [colorPicker, setColorPicker] = useState<{
    key: string | null
    x: number
    y: number
  }>({
    key: null,
    x: 0,
    y: 0
  })

  const colorInputRef = useRef<HTMLInputElement>(null)
  const colorInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Fetch settings on component mount
   useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`)

        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()

        // Find the font combination index
        const headersFont = data.siteTypographyHeaders || "Inter, sans-serif"
        const bodyFont = data.siteTypographyBody || "Oxygen, sans-serif"
        const loadedFilters = data.siteFilters || ["Shirt", "Pants", "Shoes", "Bracelet", "Collar", "Other"]
        const filtersWithOther: string[] = loadedFilters.some((f: string) => f.toLowerCase() === "other")
          ? loadedFilters
          : [...loadedFilters, "Other"]

        const fontIndex = FONT_COMBINATIONS.findIndex(
          (combo) => combo.headers === headersFont && combo.body === bodyFont,
        )

        // Transform the data to match our component state structure
        setSettings({
          icon: data.siteIcon || "/logoico.png",
          logo: data.siteLogo || "/logo.png",
          typographyHeaders: data.siteTypographyHeaders || "Inter, sans-serif",
          typographyBody: data.siteTypographyBody || "Oxygen, sans-serif",
          colors: {
            primary: data.siteColors?.find((c: any) => c.name === "primary")?.value || "#1a365d",
            secondary: data.siteColors?.find((c: any) => c.name === "secondary")?.value || "#2d3748",
            accent: data.siteColors?.find((c: any) => c.name === "accent")?.value || "#f6ad55",
            background: data.siteColors?.find((c: any) => c.name === "background")?.value || "#f7fafc",
            text: data.siteColors?.find((c: any) => c.name === "text")?.value || "#1a202c",
            textHeader: data.siteColors?.find((c: any) => c.name === "textHeader")?.value || "#1a237e",   
            textInfo: data.siteColors?.find((c: any) => c.name === "textInfo")?.value || "#0288d1",       
            textDanger: data.siteColors?.find((c: any) => c.name === "textDanger")?.value || "#d32f2f",   
            textWhite: data.siteColors?.find((c: any) => c.name === "textWhite")?.value || "#ffffff", 
            textBlack: data.siteColors?.find((c: any) => c.name === "textBlack")?.value || "#000000",
            textPrice: data.siteColors?.find((c: any) => c.name === "textPrice")?.value || "#16a34a",
            backgroundSuccess: data.siteColors?.find((c: any) => c.name === "backgroundSuccess")?.value || "#d1fae5",
            backgroundDanger: data.siteColors?.find((c: any) => c.name === "backgroundDanger")?.value || "#fee2e2",
          },
          filters: filtersWithOther,
          messagePerDay: data.siteMessageLimits?.[0]?.messagePerDay || "1",
          messageCharLimit: data.siteMessageLimits?.[0]?.messageCharLimit || "2000",
        })

        // Set the selected font combination
        setSelectedFontCombination(fontIndex !== -1 ? fontIndex : 0)
      } catch (err) {
        console.error("Error fetching settings:", err)
        setError("Failed to load settings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Example: Set CSS variables dynamically in your main App or Layout component
  useEffect(() => {
    document.documentElement.style.setProperty('--site-typography-headers', settings.typographyHeaders)
    document.documentElement.style.setProperty('--site-typography-body', settings.typographyBody)
  }, [settings.typographyHeaders, settings.typographyBody])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")

      // Transform the settings to match the API structure
      const apiSettings = {
        siteIcon: settings.icon,
        siteLogo: settings.logo,
        siteTypographyHeaders: settings.typographyHeaders,
        siteTypographyBody: settings.typographyBody,
        siteColors: [
          { name: "primary", value: settings.colors.primary },
          { name: "secondary", value: settings.colors.secondary },
          { name: "accent", value: settings.colors.accent },
          { name: "background", value: settings.colors.background },
          { name: "text", value: settings.colors.text },
          { name: "textHeader", value: settings.colors.textHeader },   
          { name: "textInfo", value: settings.colors.textInfo },       
          { name: "textDanger", value: settings.colors.textDanger }, 
          { name: "textWhite", value: settings.colors.textWhite },
          { name: "textBlack", value: settings.colors.textBlack },
          { name: "textPrice", value: settings.colors.textPrice },
          { name: "backgroundSuccess", value: settings.colors.backgroundSuccess },
          { name: "backgroundDanger", value: settings.colors.backgroundDanger }, 
        ],
        siteFilters: settings.filters,
        siteMessageLimits: [
          {
            messagePerDay: settings.messagePerDay,
            messageCharLimit: settings.messageCharLimit,
          },
        ],
      }

      // Send the request with credentials to include cookies
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This is important to include cookies
        body: JSON.stringify(apiSettings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save settings")
      }

      setSuccess("Settings saved successfully! Refreshing the page...")
      setTimeout(() => {
        setSuccess("")
        window.location.reload()
      }, 3000)
    } catch (err) {
      console.error("Error saving settings:", err)
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleFontCombinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number.parseInt(e.target.value)
    setSelectedFontCombination(index)

    // Update the typography settings
    setSettings({
      ...settings,
      typographyHeaders: FONT_COMBINATIONS[index].headers,
      typographyBody: FONT_COMBINATIONS[index].body,
    })
  }

  const handleFileUpload = async (file: File, field: "icon" | "logo") => {
    if (!file || (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/svg+xml")) {
      setError("Please select a valid JPG, PNG, or SVG image")
      return
    }

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/upload/productImage`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Uploaded:", data)

      // Get the image path
      const imagePath = data.image.path

      // Update the state with the image path
      setSettings({
        ...settings,
        [field]: imagePath,
      })
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleGallerySelect = (imagePath: string) => {
    if (selectedImageField) {
      setSettings({
        ...settings,
        [selectedImageField]: imagePath,
      })
    }
    setIsGalleryModalOpen(false)
  }
  
  const handleAddFilter = () => {
    const trimmed = newFilter.trim()
    if (
      trimmed &&
      trimmed.toLowerCase() !== "other" &&
      !settings.filters.some(f => f.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSettings({
        ...settings,
        filters: [...settings.filters, trimmed],
      })
      setNewFilter("")
    }
  }

  const handleEditFilter = (index: number) => {
    setEditingFilterIndex(index)
    setEditingFilterValue(settings.filters[index])
  }

  const handleSaveFilter = () => {
    if (editingFilterIndex !== null && editingFilterValue.trim()) {
      const newFilters = [...settings.filters]
      newFilters[editingFilterIndex] = editingFilterValue.trim()
      setSettings({
        ...settings,
        filters: newFilters,
      })
      setEditingFilterIndex(null)
      setEditingFilterValue("")
    }
  }

  const handleDeleteFilter = (index: number) => {
    setFilterToDeleteIndex(index)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteFilter = () => {
    if (filterToDeleteIndex !== null) {
      const newFilters = settings.filters.filter((_, i) => i !== filterToDeleteIndex)
      setSettings({
        ...settings,
        filters: newFilters,
      })
      setIsDeleteModalOpen(false)
      setFilterToDeleteIndex(null)
    }
  }

  const handleColorChange = (colorKey: keyof typeof settings.colors, value: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [colorKey]: value,
      },
    })
  }

  const moveFilter = (index: number, direction: "up" | "down") => {
    // Prevent moving out of bounds
    if (index === 0 && direction === "up") return
    if (index === settings.filters.length - 1 && direction === "down") return
    const newFilters = [...settings.filters]
    const swapWith = direction === "up" ? index - 1 : index + 1
    // Prevent moving if swapWith is out of bounds
    if (swapWith < 0 || swapWith >= newFilters.length) return
    // Swap positions
    ;[newFilters[index], newFilters[swapWith]] = [newFilters[swapWith], newFilters[index]]
    setSettings({ ...settings, filters: newFilters })
  }

  const handleColorRectClick = (e: React.MouseEvent, key: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setColorPicker({
      key,
      x: rect.left + window.scrollX,
      y: rect.top + rect.height + window.scrollY,
    })
    setTimeout(() => {
      colorInputRef.current?.focus()
    }, 0)
  }

  const handleColorChangeAndClose = (key: keyof typeof settings.colors, value: string) => {
    handleColorChange(key, value)
    setColorPicker({ key: null, x: 0, y: 0 })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency="USD" setCurrency={() => {}} language={language} setLanguage={setLanguage} />
      <div className="py-32 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/")}
          className="absolute top-24 left-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
        </button>

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-primary)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
              >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {error && <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 space-y-6">

              {/* Site Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Icon (17x17)</label>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mr-4">
                    {settings.icon ? (
                      <img
                        src={getImageUrl(settings.icon) || "/placeholder.svg"}
                        alt="Site Icon"
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = getPlaceholder(17, 17)
                        }}
                      />
                    ) : (
                      <Cog className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={settings.icon}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div className="ml-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageField("icon")
                        setIsGalleryModalOpen(true)
                      }}
                      className="px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      style={{
                          color: "var(--color-text-white)",
                          backgroundColor: "var(--color-background-success)",
                          transition: "background-color 0.2s, filter 0.2s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.filter = "brightness(0.9)"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.filter = "none"
                        }}
                    >
                      Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.createElement("input")
                        fileInput.type = "file"
                        fileInput.accept = "image/jpeg, image/png, image/svg+xml"
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            handleFileUpload(file, "icon")
                          }
                        }
                        fileInput.click()
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                     style={{
                      backgroundColor: "var(--color-primary)",
                      transition: "background-color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <RefreshCw size={16} className="mr-1 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Upload size={16} className="mr-1" /> Upload
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Site Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Logo (400x100)</label>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-40 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mr-4">
                    {settings.logo ? (
                      <img
                        src={getImageUrl(settings.logo) || "/placeholder.svg"}
                        alt="Site Logo"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = getPlaceholder(400, 100)
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={settings.logo}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div className="ml-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageField("logo")
                        setIsGalleryModalOpen(true)
                      }}
                     className="px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      style={{
                          color: "var(--color-text-white)",
                          backgroundColor: "var(--color-background-success)",
                          transition: "background-color 0.2s, filter 0.2s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.filter = "brightness(0.9)"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.filter = "none"
                        }}
                    >
                      Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.createElement("input")
                        fileInput.type = "file"
                        fileInput.accept = "image/jpeg, image/png, image/svg+xml"
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            handleFileUpload(file, "logo")
                          }
                        }
                        fileInput.click()
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{
                      backgroundColor: "var(--color-primary)",
                      transition: "background-color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
                      >
                      {uploading ? (
                        <span className="flex items-center">
                          <RefreshCw size={16} className="mr-1 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Upload size={16} className="mr-1" /> Upload
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Site Typography */}
              <div>
                <label htmlFor="site-typography" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Typography
                </label>
                <select
                  id="site-typography"
                  value={selectedFontCombination}
                  onChange={handleFontCombinationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {FONT_COMBINATIONS.map((combo, index) => (
                    <option key={index} value={index}>
                      {combo.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Headers:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded" style={{ fontFamily: settings.typographyHeaders }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Body:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded" style={{ fontFamily: settings.typographyBody }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </div>

              {/* Site Colors */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Site Colors</h3>
                {/* Color Presets */}
                <div className="flex gap-4 mb-8">
                  {COLOR_PRESETS.slice(0, 5).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={preset.label}
                      onClick={() => setSettings({
                        ...settings,
                        colors: { ...settings.colors, ...preset.colors }
                      })}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "2px solid #e5e7eb",
                        padding: 0,
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)",
                        transition: "box-shadow 0.2s",
                        transform: "rotate(45deg)",
                      }}
                    >
                      <div style={{
                        width: "50%",
                        height: "100%",
                        background: preset.colors.primary,
                        display: "inline-block"
                      }} />
                      <div style={{
                        width: "50%",
                        height: "100%",
                        background: preset.colors.secondary,
                        display: "inline-block"
                      }} />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(settings.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      {/* Color name */}
                      <label
                        htmlFor={`color-${key}`}
                        className="block text-sm font-medium text-gray-700 w-1/3 capitalize"
                      >
                        {key}
                      </label>
                      {/* Color rectangle and input */}
                      <div className="flex items-center w-2/3" style={{ position: "relative" }}>
                        {/* Clickable color rectangle */}
                        <div
                          className="w-10 h-10 rounded-md mr-2 border border-gray-300 cursor-pointer"
                          style={{ backgroundColor: value, display: "inline-block" }}
                          title="Click to change color"
                          onClick={() => colorInputRefs.current[key]?.click()}
                        />
                        {/* Hidden color input (but not display: none, so it can open) */}
                        <input
                          ref={el => (colorInputRefs.current[key] = el)}
                          type="color"
                          id={`color-picker-${key}`}
                          value={value}
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            opacity: 0,
                            width: 40,
                            height: 40,
                            pointerEvents: "none",
                          }}
                          onChange={e => handleColorChange(key as keyof typeof settings.colors, e.target.value)}
                          tabIndex={-1}
                        />
                        {/* Hex value input */}
                        <input
                          type="text"
                          id={`color-${key}`}
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof typeof settings.colors, e.target.value)}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Site Filters */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Site Filters</h3>
                <p className="text-sm text-gray-500 mb-3">
                  These filters will be used for product categorization throughout the site.
                </p>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newFilter}
                      onChange={(e) => setNewFilter(e.target.value)}
                      placeholder="Add new filter"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFilter}
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
                  >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {settings.filters.map((filter, index) => {
                    const isOther = filter.toLowerCase() === "other"
                    return (
                      <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md">
                        {/* Up/Down buttons */}
                        <div className="flex flex-col mr-2">
                          <button
                            type="button"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => moveFilter(index, "up")}
                            className={`p-1 rounded ${index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"}`}
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            disabled={index === settings.filters.length - 1}
                            onClick={() => moveFilter(index, "down")}
                            className={`p-1 rounded mt-1 ${index === settings.filters.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"}`}
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        {isOther ? (
                          <span className="flex-grow font-semibold text-gray-700">Other</span>
                        ) : editingFilterIndex === index ? (
                          <>
                            <input
                              type="text"
                              value={editingFilterValue}
                              onChange={(e) => setEditingFilterValue(e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveFilter}
                              className="ml-2 p-2 text-green-600 hover:text-green-800"
                            >
                              {/* ...check icon... */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFilterIndex(null)
                                setEditingFilterValue("")
                              }}
                              className="ml-1 p-2 text-gray-600 hover:text-gray-800"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-grow">{filter}</span>
                            <button
                              type="button"
                              onClick={() => handleEditFilter(index)}
                              className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                              style={{ color: "var(--color-primary)", transition: "color 0.2s", filter: "brightness(0.8)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-primary)")}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFilter(index)}
                              className="ml-1 p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* LÍMITES DE MENSAJES DEL CHAT */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">Límites del chat</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mensajes por día</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={settings.messagePerDay}
                      onChange={e => setSettings(s => ({ ...s, messagePerDay: e.target.value.replace(/[^0-9]/g, '').slice(0,2) }))}
                      className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Límite de caracteres por mensaje</label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.messageCharLimit}
                      onChange={e => setSettings(s => ({ ...s, messageCharLimit: e.target.value.replace(/[^0-9]/g, '').slice(0,5) }))}
                      className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false)
          setSelectedImageField(null)
        }}
        onSelect={handleGallerySelect}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setFilterToDeleteIndex(null)
        }}
        onConfirm={confirmDeleteFilter}
        title="Delete Filter"
        message={`Are you sure you want to delete this filter? This may affect existing products.`}
      />
    </div>
  )
}

export default AdminSettings