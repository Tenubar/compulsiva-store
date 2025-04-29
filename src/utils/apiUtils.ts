/**
 * Utility functions for API URLs
 */

// Get the base API URL from environment variable
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_SITE_URL || "https://compulsiva-store-server.onrender.com"
}

/**
 * Constructs a full API URL from a path
 * @param path The API path (without leading slash)
 * @returns The full API URL
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path
  return `${baseUrl}/${normalizedPath}`
}

// Add a function to ensure we're getting the latest product data
export const getProductApiUrl = (id: string) => {
  return `${import.meta.env.VITE_SITE_URL}/products/${id}`
}

// Add a new function to force refresh product data
export const getProductApiUrlWithRefresh = (id: string) => {
  return `${import.meta.env.VITE_SITE_URL}/products/${id}?refresh=true&t=${Date.now()}`
}

/**
 * Gets the products list API URL
 * @returns The products list API URL
 */
export const getProductsApiUrl = (): string => {
  return getApiUrl("products")
}
