import type React from "react"
import { useState, useEffect } from "react"
import { X, Search, ImageIcon } from "lucide-react"
import { getImageUrl, getPlaceholder } from "../../utils/imageUtils"

interface ImageItem {
  _id: string
  filename: string
  path: string
  size: number
  mimetype: string
}

interface GalleryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imagePath: string) => void
}

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/images`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch images")
      }

      const data = await response.json()
      setImages(data)
    } catch (err) {
      console.error("Error fetching images:", err)
      setError("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = searchTerm
    ? images.filter(
        (img) =>
          img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          img.path.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : images

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Select Image from Gallery</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No images found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img._id}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => {
                    onSelect(img.path)
                    onClose()
                  }}
                >
                  <img
                    src={getImageUrl(img.path) || "/placeholder.svg"}
                    alt={img.filename}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = getPlaceholder(200, 200)
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GalleryModal 