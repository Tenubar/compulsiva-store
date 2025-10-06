"use client"

import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Header from "./Header"

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [status, setStatus] = useState<"idle"|"sending"|"verifying">("idle")
  const [message, setMessage] = useState<string>("")
  const navigate = useNavigate()

  useEffect(() => {
    const e = searchParams.get("email")
    if (e) setEmail(e)
  }, [searchParams])

  const requestCode = async () => {
    if (!email) {
      setMessage("Please enter your email.")
      return
    }
    try {
      setStatus("sending")
      setMessage("")
      const res = await fetch(`${import.meta.env.VITE_SITE_URL}/api/verify/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to send code")
      setMessage("Verification code sent to your email.")
    } catch (e:any) {
      setMessage(e.message || "Failed to send code")
    } finally {
      setStatus("idle")
    }
  }

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code) {
      setMessage("Email and code are required.")
      return
    }
    try {
      setStatus("verifying")
      setMessage("")
      const res = await fetch(`${import.meta.env.VITE_SITE_URL}/api/verify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Invalid code")
      setMessage("Verification successful. You can now select your role.")
      // Redirect to home; App will show RoleSelectionModal if role not set
      setTimeout(() => navigate("/"), 700)
    } catch (e:any) {
      setMessage(e.message || "Verification failed")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header placeholder; full Header expects LanguageContext which exists in App route not here */}
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Verify your account</h1>
        <div className="bg-white shadow rounded p-6 max-w-md">
          {message && (
            <div className="mb-4 text-sm text-gray-700">{message}</div>
          )}
          <form onSubmit={confirmCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{6}"
                maxLength={6}
                value={code}
                onChange={(e)=>setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
                className="w-full border rounded px-3 py-2 tracking-widest"
                placeholder="123456"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status!=="idle"}
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: "var(--color-primary)", opacity: status!=="idle"?0.7:1 }}
              >Verify</button>
              <button
                type="button"
                onClick={requestCode}
                disabled={status!=="idle"}
                className="px-4 py-2 rounded border"
              >Resend code</button>
              <button
                type="button"
                onClick={()=>navigate("/")}
                className="ml-auto px-4 py-2 rounded border"
              >Back</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Verify
