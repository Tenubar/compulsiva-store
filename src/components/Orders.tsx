"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, ShoppingBag, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"
import { getApiUrl } from "../utils/apiUtils"
import { useCurrencyConversion } from "../utils/currencyUtils"

interface Order {
  _id: string
  productId: string
  title: string
  price: number // Base price of the product
  sizePrice?: number // Price for the selected size (optional)
  quantity: number
  paypalTransactionId: string
  paypalOrderId?: string
  payerEmail?: string
  payerName?: string
  shippingMethod?: {
    name: string
    price: number
  }
  shipping?: Array<{ 
    name: string
    price: number
  }>
  status: string
  createdAt: string
  sizes?: { size: string; sizePrice: number }[] // Added sizes property
}

const Orders: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)
  const { formatPrice } = useCurrencyConversion()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [waitingForIPN, setWaitingForIPN] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<{
    productId?: string
    title?: string
    price?: string
    sizePrice?: string
    quantity?: string
    txnId?: string
    shipping?: Array<{ name: string; price: number }>
    size?: string
  } | null>(null)

  const navigate = useNavigate()
  const location = useLocation()

  // Check for query parameters (from PayPal success)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get("success");

    if (success === "true") {
      const sizes = queryParams.get("sizes") ? JSON.parse(decodeURIComponent(queryParams.get("sizes")!)) : undefined;
      let purchasedSizePrice: string | undefined = undefined;
      let purchasedSize: string | undefined = undefined;
      if (Array.isArray(sizes)) {
        const purchased = sizes.find((s: any) => s.quantity > 0);
        if (purchased) {
          purchasedSizePrice = purchased.sizePrice?.toString();
          purchasedSize = purchased.size;
        }
      }
      const paymentData = {
        productId: queryParams.get("productId") || undefined,
        title: queryParams.get("title") ? decodeURIComponent(queryParams.get("title")!) : undefined,
        price: queryParams.get("price") || undefined,
        quantity: queryParams.get("quantity") || undefined,
        txnId: queryParams.get("tx") || undefined,
        type: queryParams.get("type") || undefined,
        sizes,
        size: purchasedSize, // Add purchased size
        sizePrice: purchasedSizePrice, // Use the purchased sizePrice
        shipping: queryParams.get("shipping") ? JSON.parse(decodeURIComponent(queryParams.get("shipping")!)) : undefined,
        description: queryParams.get("description") ? decodeURIComponent(queryParams.get("description")!) : undefined,
        image: queryParams.get("image") ? decodeURIComponent(queryParams.get("image")!) : undefined,
        hoverImage: queryParams.get("hoverImage") ? decodeURIComponent(queryParams.get("hoverImage")!) : undefined,
        additionalImages: queryParams.get("additionalImages") ? JSON.parse(decodeURIComponent(queryParams.get("additionalImages")!)) : undefined,
      };

      setPaymentInfo(paymentData);
      setWaitingForIPN(true);
      setSuccessMessage(t("paymentSuccessful"));

      navigate("/orders", { replace: true });

      setTimeout(() => {
        fetchOrders();
        setWaitingForIPN(false);
      }, 5000);
    } else {
      fetchOrders();
    }
  }, [location, navigate, t])

  // Fetch user's orders
  const fetchOrders = async () => {
    console.log("Fetching orders for the user.");
    try {
      setLoading(true);
      const response = await fetch(getApiUrl("api/orders"), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Orders fetched successfully:", data.orders);

        // Safely handle orders and sizes
        interface Size {
          size: string;
          sizePrice: number;
        }

        interface ApiOrder {
          _id: string;
          productId: string;
          title: string;
          price: number;
          sizePrice?: number;
          quantity: number;
          paypalTransactionId: string;
          paypalOrderId?: string;
          payerEmail?: string;
          payerName?: string;
          shippingMethod?: {
            name: string;
            price: number;
          };
          shipping?: Array<{ 
            name: string
            price: number
          }>
          
          status: string;
          createdAt: string;
          sizes?: Size[];
        }
        interface ApiResponse {
          orders: ApiOrder[];
        }

        const processedOrders: Order[] = (data as ApiResponse).orders.map((order: ApiOrder): Order => ({
          ...order,
          sizes: order.sizes?.map((size: Size): Size => ({
            ...size,
            sizePrice: size.sizePrice ?? order.price, // Use price if sizePrice is undefined
          })),
        }));

        setOrders(processedOrders || []);
      } else if (response.status === 401) {
        console.log("User not logged in. Redirecting to login.");
        navigate("/login");
      } else {
        console.error("Error fetching orders:", response.statusText);
        setError(t("errorFetchingOrders"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(t("errorFetchingOrders"));
    } finally {
      setLoading(false);
    }
  }

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

  console.log("PaymentInfo:", paymentInfo);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center">
            <button onClick={() => navigate("/")} className="flex items-center"
              style = {{
                color: "var(--color-text-info)",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-info)")}
              >
              <ArrowLeft size={20} className="mr-2" /> {t("backToHome")}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-6 w-6 text-gray-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">{t("myOrders")}</h1>
                </div>
                <button
                  onClick={() => fetchOrders()}
                  className="flex items-center"
                   style={{ color: "var(--color-primary)", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--color-primary)")}
                  title={t("refreshOrders")}
                >
                  <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
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
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-5 sm:p-6">
              {waitingForIPN ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-gray-500">{t("processingPayment")}</p>
                  {paymentInfo && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md max-w-md mx-auto">
                      <h3 className="font-medium text-blue-800">{t("paymentDetails")}</h3>
                      <p className="text-sm text-blue-700 mt-1">{paymentInfo.title}</p>
                      {paymentInfo.size && (
                        <p className="text-sm text-blue-700">
                          {t("size")}: {paymentInfo.size}
                        </p>
                      )}
                      <p className="text-sm text-blue-700">
                        {t("quantity")}: {paymentInfo.quantity}
                      </p>
                      <p className="text-sm text-blue-700">
                        {t("total")}: $
                        {paymentInfo &&
                        ((paymentInfo.sizePrice ?? paymentInfo.price) && paymentInfo.quantity)
                          ? (
                              parseFloat(paymentInfo.sizePrice ?? paymentInfo.price ?? "0") *
                              parseInt(paymentInfo.quantity, 10)
                            ).toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-sm text-blue-700">
                      {t("shippingPrice")}: $
                      {paymentInfo.shipping
                        ? Array.isArray(paymentInfo.shipping)
                          ? paymentInfo.shipping[0]?.price?.toFixed(2) ?? "0.00"
                          : (typeof paymentInfo.shipping === "object" && paymentInfo.shipping !== null && "price" in paymentInfo.shipping)
                            ? (paymentInfo.shipping as { price: number }).price?.toFixed(2)
                            : "0.00"
                        : "0.00"}
                    </p>
                    </div>
                  )}
                </div>
              ) : loading ? (
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
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}                      
                    >
                      {t("startShopping")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto">
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
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{order.title}</div>
                                <div className="text-sm text-gray-500">
                                  {t("quantity")}: {order.quantity}
                                </div>
                                <div className="text-sm text-gray-500 truncate">ID: {order.paypalTransactionId}</div>
                                {order.shippingMethod && (
                                  <div className="text-sm text-gray-500 truncate">
                                    {t("shipping")}: {order.shippingMethod.name} (${order.shippingMethod.price.toFixed(2)})
                                  </div>
                                )}
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
                          {formatPrice(
                            ((order.price || 0) * (order.quantity || 1)) +
                              (order.shipping?.[0]?.price || 0),
                            currency
                          )}
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
