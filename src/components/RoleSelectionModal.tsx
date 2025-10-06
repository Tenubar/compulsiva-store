"use client"

import React, { useState } from "react"

interface Props {
  visible: boolean
  onConfirm: (role: "seller" | "buyer", acceptPrivacy: boolean) => void
  onLogout: () => void
}

const RoleSelectionModal: React.FC<Props> = ({ visible, onConfirm, onLogout }) => {
  const [selected, setSelected] = useState<"seller" | "buyer" | null>(null)
  const [accept, setAccept] = useState(false)

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "90vw",
          height: "90vh",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flex: 1 }}>
          <button
            onClick={() => setSelected("seller")}
            style={{
              flex: 1,
              border: "none",
              background: selected === "seller" ? "#f3f4f6" : "#fff",
              cursor: "pointer",
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Seller</h2>
            <p>Sell products and upload new items. New accounts: 1 item/day, admin approval required.</p>
          </button>
          <button
            onClick={() => setSelected("buyer")}
            style={{
              flex: 1,
              border: "none",
              background: selected === "buyer" ? "#f3f4f6" : "#fff",
              cursor: "pointer",
              padding: 24,
              borderLeft: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Buyer</h2>
            <p>Browse and purchase approved items. No upload access.</p>
          </button>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>I accept the privacy conditions.</span>
          </label>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={() => selected && onConfirm(selected, accept)}
              disabled={!selected || !accept}
              className="px-4 py-2 rounded text-white"
              style={{
                backgroundColor: (!selected || !accept) ? "#9ca3af" : "var(--color-primary)",
                opacity: (!selected || !accept) ? 0.8 : 1,
              }}
            >
              Confirm
            </button>
            <button onClick={onLogout} className="px-4 py-2 rounded border">Logout</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSelectionModal
