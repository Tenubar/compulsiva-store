import { getApiUrl } from "./apiUtils"

/**
 * Utility functions for handling image URLs
 */

/**
 * Formats an image path to ensure it correctly points to the API
 * @param path The image path or URL
 * @returns A properly formatted image URL
 */
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder.svg"

  // If the path already includes the full URL, return it as is
  if (path.startsWith("http")) {
    return path
  }

  // If the path already includes /api/images, return it with the site URL
  if (path.includes("/api/images/")) {
    return getApiUrl(path.startsWith("/") ? path.substring(1) : path)
  }

  // If the path is just a filename, construct the full API URL
  if (!path.includes("/")) {
    return getApiUrl(`api/images/${path}`)
  }

  // For paths that include the filename with directory structure
  const filename = path.split("/").pop()
  if (filename) {
    return getApiUrl(`api/images/${filename}`)
  }

  // Fallback to placeholder if path is invalid
  return "/placeholder.svg"
}

/**
 * Gets a placeholder image URL with specified dimensions
 * @param width Width of the placeholder image
 * @param height Height of the placeholder image
 * @returns Placeholder image URL
 */
export const getPlaceholder = (width = 300, height = 300): string => {
  return `/placeholder.svg?height=${height}&width=${width}`
}
