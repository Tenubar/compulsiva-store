/**
 * Utility functions for API calls
 */

/**
 * Gets the base API URL from environment variables
 * @returns The base API URL
 */
export const getApiBaseUrl = (): string => {
    return import.meta.env.VITE_SITE_URL || ""
  }
  
  /**
   * Constructs a full API URL
   * @param endpoint The API endpoint (without leading slash)
   * @returns The full API URL
   */
  export const getApiUrl = (endpoint: string): string => {
    const baseUrl = getApiBaseUrl()
    // Ensure there's exactly one slash between base URL and endpoint
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
    return `${baseUrl}/${normalizedEndpoint}`
  }
  
  /**
   * Gets the frontend base URL
   * This is useful for constructing frontend URLs (like product detail pages)
   * @returns The frontend base URL
   */
  export const getFrontendBaseUrl = (): string => {
    // In a production environment, this would be your frontend domain
    // For local development, it might be the same as the API URL
    return window.location.origin
  }
  
  /**
   * Constructs a frontend URL
   * @param path The path (without leading slash)
   * @returns The full frontend URL
   */
  export const getFrontendUrl = (path: string): string => {
    const baseUrl = getFrontendBaseUrl()
    const normalizedPath = path.startsWith("/") ? path.substring(1) : path
    return `${baseUrl}/${normalizedPath}`
  }
  