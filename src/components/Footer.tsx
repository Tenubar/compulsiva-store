"use client"

import type React from "react"
import { useContext } from "react"
import { Facebook, Instagram } from "lucide-react"
import { TwitterIcon as TikTok } from "lucide-react"
import { LanguageContext } from "../App"

const Footer: React.FC = () => {
  const { t } = useContext(LanguageContext)
  return (
    <footer className="text-white pt-12 pb-6" style={{ backgroundColor: "var(--color-primary)" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">{t("aboutUs")}</h3>  
            <p
              style={{ color: "var(--color-text-white)" }}
            >{t("aboutUsText")}</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">{t("followMe")}</h3>
            <div className="flex space-x-4">
              <a href="#"
                style={{ 
                color: "var(--color-text-white)", 
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
              >
                <Facebook size={24} />
              </a>
              <a href="#"
                style={{
                color: "var(--color-text-white)",
                transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
              
              >
                <TikTok size={24} />
              </a>
              <a href="#"
              style = {{
                color: "var(--color-text-white)",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">{t("footerQuickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about"
                style = {{
                  color: "var(--color-text-white)",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
                >
                  {t("footerAboutUs")}
                </a>
              </li>
              <li>
                <a href="/contact"
                style = {{
                  color: "var(--color-text-white)",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
                >
                  {t("footerContact")}
                </a>
              </li>
              <li>
                <a href="/shipping"
                style = {{
                  color: "var(--color-text-white)",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
                >
                  {t("footerShippingPolicy")}
                </a>
              </li>
              <li>
                <a href="/returns"
                style  = {{
                  color: "var(--color-text-white)",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
                >
                  {t("footerReturns")}
                </a>
              </li>
              <li>
                <a href="/suggestions"
                style = {{
                  color: "var(--color-text-white)",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-white)")}
                >
                  {t("footerSuggestionBox")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p 
              style = {{
                color: "var(--color-text-white)",
              }}
              >Payment Methods</p>
              <div className="flex items-center mt-2">
                <img
                  src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                  alt="PayPal"
                  className="h-6"
                />
              </div>
            </div>
            <p
            style = {{
              color: "var(--color-text-white)",
            }}
            >Copyright © 2025 Compulsiva Store</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

// Removed the unused custom useContext function.
