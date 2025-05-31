"use client"

import { useEffect, useState, createContext, useContext, type ReactNode } from "react"


interface ThemeColors {
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

interface ThemeSettings {
  siteTypographyHeaders: string
  siteTypographyBody: string
  siteColors: ThemeColors
  isLoading: boolean
}

// Default theme settings
const defaultTheme: ThemeSettings = {
  siteTypographyHeaders: "Inter, sans-serif",
  siteTypographyBody: "Oxygen, sans-serif",
  siteColors: {
    primary: "#3b82f6",
    secondary: "#f59e0b",
    accent: "#ec4899",
    background: "#f9fafb",
    text: "#210012",
    textHeader: "#1a237e",
    textInfo: "#0288d1",
    textDanger: "#d32f2f",
    textWhite: "#ffffff",
    textBlack: "#000000",
    backgroundSuccess: "#99ff33",
    backgroundDanger: "#fee2e2", 
    textPrice: "#16a34a",
  },
  isLoading: true,
}

// Create context for theme settings
const ThemeContext = createContext<ThemeSettings>(defaultTheme)

// Hook to use theme settings anywhere in the app
export const useTheme = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)

  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/page-settings`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch theme settings: ${response.status}`)
        }

        const data = await response.json()

        // Extract typography and colors from the response
        if (data) {
          setTheme({
            siteTypographyHeaders: data.siteTypographyHeaders || defaultTheme.siteTypographyHeaders,
            siteTypographyBody: data.siteTypographyBody || defaultTheme.siteTypographyBody,
            siteColors: {
              primary: data.siteColors?.find((c: any) => c.name === "primary")?.value || defaultTheme.siteColors.primary,
              secondary: data.siteColors?.find((c: any) => c.name === "secondary")?.value || defaultTheme.siteColors.secondary,
              accent: data.siteColors?.find((c: any) => c.name === "accent")?.value || defaultTheme.siteColors.accent,
              background: data.siteColors?.find((c: any) => c.name === "background")?.value || defaultTheme.siteColors.background,
              text: data.siteColors?.find((c: any) => c.name === "text")?.value || defaultTheme.siteColors.text,
              textHeader: data.siteColors?.find((c: any) => c.name === "textHeader")?.value || defaultTheme.siteColors.textHeader,   
              textInfo: data.siteColors?.find((c: any) => c.name === "textInfo")?.value || defaultTheme.siteColors.textInfo,         
              textDanger: data.siteColors?.find((c: any) => c.name === "textDanger")?.value || defaultTheme.siteColors.textDanger,   
              textWhite: data.siteColors?.find((c: any) => c.name === "textWhite")?.value || defaultTheme.siteColors.textWhite,
              textBlack: data.siteColors?.find((c: any) => c.name === "textBlack")?.value || defaultTheme.siteColors.textBlack,
              textPrice: data.siteColors?.find((c: any) => c.name === "textPrice")?.value || defaultTheme.siteColors.textPrice,
              backgroundSuccess: data.siteColors?.find((c: any) => c.name === "backgroundSuccess")?.value || defaultTheme.siteColors.backgroundSuccess,
              backgroundDanger: data.siteColors?.find((c: any) => c.name === "backgroundDanger")?.value || defaultTheme.siteColors.backgroundDanger,
            },
            isLoading: false,
          })
        }
      } catch (err) {
        console.error("Error fetching theme settings:", err)
        // Use default theme if there's an error
        setTheme({ ...defaultTheme, isLoading: false })
      }
    }

    fetchThemeSettings()
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!theme.isLoading) {
      // Apply colors as CSS variables
      const root = document.documentElement
      root.style.setProperty("--color-primary", theme.siteColors.primary)
      root.style.setProperty("--color-secondary", theme.siteColors.secondary)
      root.style.setProperty("--color-accent", theme.siteColors.accent)
      root.style.setProperty("--color-background", theme.siteColors.background)
      root.style.setProperty("--color-text", theme.siteColors.text)
      root.style.setProperty("--color-text-header", theme.siteColors.textHeader)
      root.style.setProperty("--color-text-info", theme.siteColors.textInfo)
      root.style.setProperty("--color-text-danger", theme.siteColors.textDanger)
      root.style.setProperty("--color-text-white", theme.siteColors.textWhite)  
      root.style.setProperty("--color-text-black", theme.siteColors.textBlack)   
      root.style.setProperty("--color-text-price", theme.siteColors.textPrice)
      root.style.setProperty("--color-background-success", theme.siteColors.backgroundSuccess)
      root.style.setProperty("--color-background-danger", theme.siteColors.backgroundDanger)  

      // Apply typography to headers and body separately
      const headers = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
      headers.forEach((header) => {
        ;(header as HTMLElement).style.fontFamily = theme.siteTypographyHeaders
      })

      // Apply body typography
      document.body.style.fontFamily = theme.siteTypographyBody

      // Apply background color to body
      document.body.style.backgroundColor = theme.siteColors.background
      document.body.style.color = theme.siteColors.text
    }
  }, [theme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
