"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, ShoppingBag, ExternalLink, AlertTriangle } from "lucide-react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"
import { getApiUrl } from "../utils/apiUtils"

interface Order {
  _id: string
  productId: string
  title: string
  price: number
  quantity: number
  paypalTransactionId: string
  paypalOrderId?: string
  payerEmail?: string
  payerName?: string
  status: string
  createdAt: string
}

const Orders: React.FC = () => {
  const { t, language, setLanguage } = useContext(LanguageContext)
  const [currency, setCurrency] = useState<"USD" | "EUR" | "VES">("USD")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [orderCreationAttempted, setOrderCreationAttempted] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search)
    const success = queryParams.get("success")
    const txnId = queryParams.get("txn_id")

    // Only attempt to create an order if:
    // 1. We haven't tried already
    // 2. The success parameter is true
    // 3. The txn_id is NOT "IPN_HANDLED" (which indicates IPN will handle it)
    if (!orderCreationAttempted && success === "true" && txnId !== "IPN_HANDLED") {
      createOrderFromQueryParams(queryParams)
      setOrderCreationAttempted(true)
    }
  }, [location, orderCreationAttempted])

  interface QueryParams {
    get: (key: string) => string | null
  }

  interface CreateOrderResponse {
    duplicate?: boolean
  }

  const createOrderFromQueryParams = async (queryParams: QueryParams): Promise<void> => {
    try {
      const productId = queryParams.get("productId")
      const title = queryParams.get("title")
      const price = queryParams.get("price")
      const quantity = queryParams.get("quantity")
      const txnId = queryParams.get("tx") // PayPal adds this parameter

      if (!productId || !title || !price || !quantity || !txnId) {
        console.error("Missing required parameters for order creation")
        return
      }

      const response = await fetch(getApiUrl("api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          title,
          price: Number.parseFloat(price),
          quantity: Number.parseInt(quantity),
          paypalTransactionId: txnId,
          // Add other fields as needed
        }),
      })

      const data: CreateOrderResponse = await response.json()

      // If the order was already created by IPN, that's fine
      if (data.duplicate) {
        console.log("Order was already created by IPN")
      }
      fetchOrders() // Refresh the orders list
    } catch (error) {
      console.error("Error creating order:", error)
    }
  }

  // Check for query parameters (from PayPal success)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const success = queryParams.get("success")

    if (success === "true") {
      const productId = queryParams.get("productId")
      const title = queryParams.get("title")
      const price = queryParams.get("price")
      const quantity = queryParams.get("quantity")

      if (productId && title && price && quantity) {
        // Create a new order
        createOrder(productId, decodeURIComponent(title), Number.parseFloat(price), Number.parseInt(quantity))
      }

      // Clear the URL parameters
      navigate("/orders", { replace: true })
    }
  }, [location, navigate])

  // Create a new order from PayPal success
  const createOrder = async (productId: string, title: string, price: number, quantity: number) => {
    try {
      // Generate a mock PayPal transaction ID (in a real app, this would come from PayPal)
      const paypalTransactionId = `PAYPAL-${Date.now()}-${Math.floor(Math.random() * 1000000)}`

      const response = await fetch(getApiUrl("api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          title,
          price,
          quantity,
          paypalTransactionId,
          payerEmail: "customer@example.com", // In a real app, this would come from PayPal
          payerName: "John Doe", // In a real app, this would come from PayPal
          shippingAddress: {
            name: "John Doe",
            addressLine1: "123 Main St",
            city: "Anytown",
            state: "CA",
            postalCode: "12345",
            country: "US",
          },
        }),
      })

      if (response.ok) {
        setSuccessMessage(t("orderCreatedSuccess"))
        fetchOrders() // Refresh the orders list
      } else {
        setError(t("orderCreationFailed"))
      }
    } catch (error) {
      console.error("Error creating order:", error)
      setError(t("orderCreationFailed"))
    }
  }

  // Fetch user's orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl("api/orders"), {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else if (response.status === 401) {
        // If not logged in, redirect to login
        navigate("/login")
      } else {
        setError(t("errorFetchingOrders"))
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError(t("errorFetchingOrders"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [navigate, t])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center">
            <button onClick={() => navigate("/")} className="flex items-center text-gray-600 hover:text-blue-600">
              <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center">
                <ShoppingBag className="h-6 w-6 text-gray-500 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">{t("myOrders")}</h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">{t("viewYourOrderHistory")}</p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-gray-500">{t("loadingOrders")}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t("noOrders")}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t("startShoppingToSeeOrders")}</p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate("/")}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t("startShopping")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("orderDetails")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("status")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("date")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("total")}
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">{t("view")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.title}</div>
                                <div className="text-sm text-gray-500">
                                  {t("quantity")}: {order.quantity}
                                </div>
                                <div className="text-sm text-gray-500">ID: {order.paypalTransactionId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(order.price * order.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              {t("viewOrder")} <ExternalLink size={16} className="ml-1" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Orders
