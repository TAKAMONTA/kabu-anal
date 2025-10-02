"use client";

import { useEffect } from "react";

interface A8netAdProps {
  adCode?: string;
  adId: string;
  size?: "small" | "medium" | "large";
  fallbackText?: string;
}

export default function A8netAd({
  adCode,
  adId,
  size = "medium",
  fallbackText = "A8.net広告",
}: A8netAdProps) {
  useEffect(() => {
    // A8.net広告の動的読み込み
    if (adCode) {
      const adContainer = document.getElementById(adId);
      if (adContainer) {
        adContainer.innerHTML = adCode;
      }
    }
  }, [adCode, adId]);

  const sizeClasses = {
    small: "w-16 h-12",
    medium: "w-24 h-16",
    large: "w-48 h-64",
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      <div id={adId} className="w-full h-full flex items-center justify-center">
        {!adCode && (
          <div className="text-xs text-gray-400 text-center">
            {fallbackText}
          </div>
        )}
      </div>
    </div>
  );
}
