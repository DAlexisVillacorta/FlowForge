"use client";

import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";
import { Sparkles } from "lucide-react";

// ── Toaster con estilos del design system ─────────────────────────────────────

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "10px",
          fontSize: "14px",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontWeight: 500,
          padding: "12px 16px",
          boxShadow:
            "0 4px 16px -4px rgba(15,23,42,0.08), 0 8px 24px -8px rgba(15,23,42,0.06)",
          border: "1px solid",
          maxWidth: "380px",
        },
        success: {
          style: {
            background: "#F0FDF4",
            color: "#15803D",
            borderColor: "#BBF7D0",
          },
          iconTheme: {
            primary: "#16A34A",
            secondary: "#DCFCE7",
          },
        },
        error: {
          style: {
            background: "#FEF2F2",
            color: "#B91C1C",
            borderColor: "#FECACA",
          },
          iconTheme: {
            primary: "#DC2626",
            secondary: "#FEE2E2",
          },
        },
        loading: {
          style: {
            background: "#F8FAFC",
            color: "#334155",
            borderColor: "#E2E8F0",
          },
        },
      }}
    />
  );
}

// ── Re-export de toast con helper para IA ────────────────────────────────────

export { hotToast as toast };

export function toastAI(message: string) {
  return hotToast.custom(
    (t) => (
      <div
        style={{
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          background: "#F5F3FF",
          border: "1px solid #DDD6FE",
          borderRadius: "10px",
          padding: "12px 16px",
          maxWidth: "380px",
          boxShadow:
            "0 4px 16px -4px rgba(139,92,246,0.12), 0 8px 24px -8px rgba(139,92,246,0.08)",
          fontSize: "14px",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontWeight: 500,
          color: "#4C1D95",
        }}
      >
        <Sparkles
          style={{
            width: 18,
            height: 18,
            color: "#7C3AED",
            flexShrink: 0,
            marginTop: 1,
          }}
        />
        <span>{message}</span>
      </div>
    ),
    { duration: 5000 },
  );
}

export function toastInfo(message: string) {
  return hotToast.custom(
    (t) => (
      <div
        style={{
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.2s ease",
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "10px",
          padding: "12px 16px",
          maxWidth: "380px",
          boxShadow:
            "0 4px 16px -4px rgba(15,23,42,0.08)",
          fontSize: "14px",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontWeight: 500,
          color: "#1D4ED8",
        }}
      >
        {message}
      </div>
    ),
    { duration: 4000 },
  );
}
