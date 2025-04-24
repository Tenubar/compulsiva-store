"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, ShoppingBag } from "lucide-react"

interface CartItem {
  _id: string
  productId: string
  title: string
  type: string
  price: number
  image: string
  quantity: number
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/cart`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch cart items")
      }

      const data = await response.json()
      setCartItems(data.items || [])
    } catch (err) {
      setError("Error loading cart items")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setCartItems(cartItems.filter((item) => item._id !== itemId))
      } else {
        setError("Failed to remove item from cart")
      }
    } catch (err) {
      setError("Error removing item from cart")
      console.error(err)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch(`${import.meta.env.VITE_SITE_URL}/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.ok) {
        setCartItems(cartItems.map((item) => (item._id === itemId ? { ...item, quantity: newQuantity } : item)))
      } else {
        setError("Failed to update quantity")
      }
    } catch (err) {
      setError("Error updating quantity")
      console.error(err)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Loading your cart...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Shopping
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Your Shopping Cart</h1>

        {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Items in your cart</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item._id} className="px-6 py-4 flex items-center">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                      <p className="text-base font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.type}</p>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        className="text-gray-500 focus:outline-none focus:text-gray-600 p-1"
                      >
                        <span className="text-lg">-</span>
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        readOnly
                        className="mx-2 border text-center w-12 rounded-md"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        className="text-gray-500 focus:outline-none focus:text-gray-600 p-1"
                      >
                        <span className="text-lg">+</span>
                      </button>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button onClick={() => handleRemoveItem(item._id)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>${calculateTotal()}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
              <div className="mt-6">
                <button className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Checkout
                </button>
              </div>
              <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                <p>
                  or{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-medium hover:text-blue-500"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping<span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
