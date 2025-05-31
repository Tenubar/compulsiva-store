"use client"

import type React from "react"
import { useContext } from "react"
import { LanguageContext } from "../App"
import Header from "./Header"
import Footer from "./Footer"

const Returns: React.FC = () => {
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
          >{t("returnsTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("returnsOverview")}</h2>
            <p className="mb-4 text-gray-700">{t("returnsOverviewText")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("returnsEligibility")}</h2>
            <p className="mb-4 text-gray-700">{t("returnsEligibilityText")}</p>

            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>{t("returnsEligibilityItem1")}</li>
              <li>{t("returnsEligibilityItem2")}</li>
              <li>{t("returnsEligibilityItem3")}</li>
              <li>{t("returnsEligibilityItem4")}</li>
            </ul>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
              <p style = {{color:"var(--color-text-danger)"}}>{t("returnsNonReturnable")}</p>
              <ul className="list-disc pl-5 space-y-1 mt-2" style = {{color:"var(--color-text-danger)"}}>
                <li>{t("returnsNonReturnableItem1")}</li>
                <li>{t("returnsNonReturnableItem2")}</li>
                <li>{t("returnsNonReturnableItem3")}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("returnsProcess")}</h2>
            <p className="mb-4 text-gray-700">{t("returnsProcessText")}</p>

            <ol className="list-decimal pl-5 space-y-4 text-gray-700">
              <li>
                <p className="font-medium" style = {{color: "var(--color-text-header)"}}>{t("returnsProcessStep1")}</p>
                <p>{t("returnsProcessStep1Text")}</p>
              </li>
              <li>
                <p className="font-medium" style = {{color: "var(--color-text-header)"}}>{t("returnsProcessStep2")}</p>
                <p>{t("returnsProcessStep2Text")}</p>
              </li>
              <li>
                <p className="font-medium" style = {{color: "var(--color-text-header)"}}>{t("returnsProcessStep3")}</p>
                <p>{t("returnsProcessStep3Text")}</p>
              </li>
              <li>
                <p className="font-medium" style = {{color: "var(--color-text-header)"}}>{t("returnsProcessStep4")}</p>
                <p>{t("returnsProcessStep4Text")}</p>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4"
            style = {{
              color: "var(--color-text-header)"
            }}
            >{t("returnsContact")}</h2>
            <p className="mb-4 text-gray-700">{t("returnsContactText")}</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">{t("returnsEmail")}:</span> -
              </p>
              <p className="text-gray-700">
                <span className="font-medium">{t("returnsPhone")}:</span> -
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Returns
