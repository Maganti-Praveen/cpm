import React, { useState, useEffect } from "react";

// Memory cache to keep track of loaded image sources to skip loading skeletons on subsequent renders
const imageCache = new Set();

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  wrapperClassName = "",
  aspectRatio,
  priority = false,
  style = {},
  ...props
}) {
  const hasCache = imageCache.has(src);
  const [isLoaded, setIsLoaded] = useState(hasCache);

  useEffect(() => {
    if (!src) return;
    if (imageCache.has(src)) {
      setIsLoaded(true);
      return;
    }

    // Preload image in memory
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageCache.add(src);
      setIsLoaded(true);
    };
  }, [src]);

  // Enforce container styling to reserve strict height/width layout space
  const containerStyle = {
    position: "relative",
    overflow: "hidden",
    display: "inline-block",
    ...style,
  };

  if (width) {
    containerStyle.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    containerStyle.height = typeof height === "number" ? `${height}px` : height;
  }
  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  return (
    <div
      className={`bg-slate-100/50 overflow-hidden ${wrapperClassName}`}
      style={containerStyle}
    >
      {/* Skeletons loader placeholder strictly matching layout space */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {/* Render actual image */}
      {src && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" } : {})}
          onLoad={() => {
            imageCache.add(src);
            setIsLoaded(true);
          }}
          className={`transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: style.objectFit || "cover",
            display: "block",
          }}
          {...props}
        />
      )}
    </div>
  );
}
