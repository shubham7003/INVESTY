"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      // @ts-ignore
      const detail = e.detail || {};
      const t: Toast = { id: Date.now(), message: String(detail.message || ""), type: detail.type };
      setToasts((s) => [...s, t]);
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 4000);
    }
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-root" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || "success"}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
}