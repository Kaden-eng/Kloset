"use client";

import { useToast } from "@/components/ToastProvider";
import { X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50/95 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-800"
              : "bg-blue-50/95 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}