"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ShoppingBag, Package, Truck, MapPin, CreditCard, User, Mail, ExternalLink, AlertTriangle } from "lucide-react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"
import { getApiUrl } from "../utils/apiUtils"
import { useCurrencyConversion } from "../utils/currencyUtils"

interface PaymentDetails {
  mc_gross?: string
}

interface OrderDetail {
  paymentDetails?: PaymentDetails
}

interface OrderDetail {
  _id: string
  productId: string
  title: string
  price: number
  quantity: number
  shippingCost?: number
  paypalTransactionId: string
  paypalOrderId?: string
  payerEmail?: string
  payerName?: string
  shippingAddress?: {
    name?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  shippingMethod?: {
    name: string
    price: number
  }
  shipping?: Array<{
    name: string
    price: number
  }>
  sizes?: { size: string; sizePrice: number }[] // Added sizes property
  status: string
  createdAt: string
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const { formatPrice } = useCurrencyConversion()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await fetch(getApiUrl(`api/orders/${id}`), {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        } else if (response.status === 401) {
          // If not logged in, redirect to login
          navigate("/login")
        } else if (response.status === 404) {
          setError(t("orderNotFound"))
        } else {
          setError(t("errorFetchingOrderDetails"))
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
        setError(t("errorFetchingOrderDetails"))
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetail()
  }, [id, navigate, t])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Calculate estimated delivery date (7 days from order date)
  const getEstimatedDelivery = (dateString: string) => {
    if (!dateString) return ""
    const orderDate = new Date(dateString)
    const deliveryDate = new Date(orderDate)
    deliveryDate.setDate(deliveryDate.getDate() + 7)

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(deliveryDate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center">
            <button onClick={() => navigate("/orders")} className="flex items-center text-gray-600 hover:text-blue-600">
              <ArrowLeft size={20} className="mr-2" /> {t("backToOrders")}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center">
                <ShoppingBag className="h-6 w-6 text-gray-500 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">{t("orderDetails")}</h1>
              </div>
              {order && (
                <p className="mt-1 text-sm text-gray-500">
                  {t("orderPlacedOn")} {formatDate(order.createdAt)}
                </p>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-500">{t("loadingOrderDetails")}</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={() => navigate("/orders")}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t("backToOrders")}
                </button>
              </div>
            ) : order ? (
              <div className="px-4 py-5 sm:p-6">
                {/* Order Status */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t("orderStatus")}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {order.status}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {t("estimatedDelivery")}: {getEstimatedDelivery(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t("orderItems")}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start">
                        <Package className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{order.title}</h3>
                          <p className="text-sm text-gray-500">
                            {t("quantity")}: {order.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(
                          order.price * order.quantity + (order.shippingCost ?? 0),
                          currency
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t("paymentInformation")}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{t("paymentMethod")}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">PayPal</p>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">{t("transactionId")}</span>
                        </div>
                        <p className="text-sm text-gray-500">{order.paypalTransactionId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t("customerInformation")}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{t("customerName")}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">{order.payerName || "John Doe"}</p>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <Mail className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{t("customerEmail")}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">{order.payerEmail || "customer@example.com"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t("shippingInformation")}</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <Truck className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{t("shippingMethod")}</span>
                        </div>
                        {order.shippingMethod ? (
                          <p className="text-sm text-gray-500 ml-7">
                            {order.shippingMethod.name} ({formatPrice(order.shippingMethod.price, currency)})
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 ml-7">{t("standardShipping")}</p>
                        )}
                      </div>
                      {order.shippingAddress && (
                        <div>
                          <div className="flex items-center mb-2">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{t("shippingAddress")}</span>
                          </div>
                          <div className="text-sm text-gray-500 ml-7">
                            {order.shippingAddress.name && <p>{order.shippingAddress.name}</p>}
                            {order.shippingAddress.addressLine1 && <p>{order.shippingAddress.addressLine1}</p>}
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderDetail
