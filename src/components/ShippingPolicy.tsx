"use client"

import type React from "react"
import { useContext } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"

const ShippingPolicy: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6"
          style = {{
            color: "var(--color-text-header)"
          }}
          >{t("shippingTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("shippingProcessingTime")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingProcessingTimeText")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("shippingDomesticShipping")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingDomesticShippingText")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >Zoom</h3>
                <p className="text-gray-700">https://zoom.red/</p>
                <p className="font-medium mt-2">{t("deliveryTime")} 2-3 {t("businessDays")}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >MRW</h3>
                <p className="text-gray-700">https://mrwve.com/</p>
                <p className="font-medium mt-2">{t("deliveryTime")} 2-4 {t("businessDays")}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >Domesa</h3>
                <p className="text-gray-700">https://www.portal.domesa.com.ve/</p>
                <p className="font-medium mt-2">{t("deliveryTime")} 5-7 {t("businessDays")}</p>
            </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >Tealca</h3>
                <p className="text-gray-700">https://www.tealca.com/</p>
                <p className="font-medium mt-2">{t("deliveryTime")} 1-3 {t("businessDays")}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("shippingInternationalShipping")}</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="font-medium"
              style = {{
                color: "var(--color-text-danger)",
                fontWeight: "bold"
              }}
              >{t("shippingInternationalShippingText")}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("shippingTracking")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingTrackingText")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("shippingFaq")}</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >{t("shippingFaqQuestion1")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer1")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >{t("shippingFaqQuestion2")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer2")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >{t("shippingFaqQuestion3")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer3")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg"
                style = {{
                  color: "var(--color-text-header)"
                }}
                >{t("shippingFaqQuestion4")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer4")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ShippingPolicy
