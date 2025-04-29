"use client"

import type React from "react"
import { useState, useContext } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"

const ShippingPolicy: React.FC = () => {
  const { t, language, setLanguage } = useContext(LanguageContext)
  const [currency, setCurrency] = useState<"USD" | "EUR" | "VES">("USD")

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-primary-dark">{t("shippingTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("shippingProcessingTime")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingProcessingTimeText")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("shippingDomesticShipping")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingDomesticShippingText")}</p>

            <div className="border-t border-b border-gray-200 py-4 my-4">
              <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("shippingStandardShipping")}</h3>
              <p className="text-gray-700">{t("shippingStandardShippingText")}</p>
              <p className="font-medium mt-2">{t("shippingStandardShippingCost")}</p>
            </div>

            <div className="border-b border-gray-200 py-4 mb-4">
              <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("shippingExpressShipping")}</h3>
              <p className="text-gray-700">{t("shippingExpressShippingText")}</p>
              <p className="font-medium mt-2">{t("shippingExpressShippingCost")}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("shippingInternationalShipping")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingInternationalShippingText")}</p>

            <div className="border-t border-b border-gray-200 py-4 my-4">
              <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("shippingInternationalStandard")}</h3>
              <p className="text-gray-700">{t("shippingInternationalStandardText")}</p>
              <p className="font-medium mt-2">{t("shippingInternationalStandardCost")}</p>
            </div>

            <div className="border-b border-gray-200 py-4 mb-4">
              <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("shippingInternationalExpress")}</h3>
              <p className="text-gray-700">{t("shippingInternationalExpressText")}</p>
              <p className="font-medium mt-2">{t("shippingInternationalExpressCost")}</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-yellow-700">{t("shippingInternationalNote")}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("shippingTracking")}</h2>
            <p className="mb-4 text-gray-700">{t("shippingTrackingText")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("shippingFaq")}</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-primary-dark">{t("shippingFaqQuestion1")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer1")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-primary-dark">{t("shippingFaqQuestion2")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer2")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-primary-dark">{t("shippingFaqQuestion3")}</h3>
                <p className="text-gray-700 mt-1">{t("shippingFaqAnswer3")}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-primary-dark">{t("shippingFaqQuestion4")}</h3>
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
