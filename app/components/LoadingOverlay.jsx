"use client";

import { useEffect, useState } from "react";
import { loadingMessages } from "../../lib/loadingMessages";

export default function LoadingOverlay({ show }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
  if (show) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}, [show]);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">

      <div className="text-center px-6">

        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-zinc-600 border-t-white rounded-full animate-spin mx-auto mb-6"></div>

        {/* Animated Text */}
        <p className="text-lg text-zinc-200 transition-all duration-500">
          {loadingMessages[index]}
        </p>

      </div>
    </div>
  );
}