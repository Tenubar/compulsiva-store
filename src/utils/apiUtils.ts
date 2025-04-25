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

/**
 * Gets the product API URL for a specific product ID
 * @param productId The product ID
 * @returns The product API URL
 */
export const getProductApiUrl = (productId: string): string => {
  return getApiUrl(`products/${productId}`)
}

/**
 * Gets the products list API URL
 * @returns The products list API URL
 */
export const getProductsApiUrl = (): string => {
  return getApiUrl("products")
}
