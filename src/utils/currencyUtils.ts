import { useContext } from "react"
import { ExchangeRateContext } from "../App"
import type { Currency } from "../App"

export const useCurrencyConversion = () => {
  const { exchangeRate } = useContext(ExchangeRateContext)

  const convertPrice = (price: number, currency: Currency) => {
    if (currency === "USD") {
      return price
    }
    return price * exchangeRate
  }

  const formatPrice = (price: number, currency: Currency) => {
    const convertedPrice = convertPrice(price, currency)
    return currency === "USD" 
      ? `$${convertedPrice.toFixed(2)}`
      : `Bs. ${convertedPrice.toFixed(2)}`
  }

  return { convertPrice, formatPrice }
} 