// Middleware handler for security headers (helmet).
// Intercepts and filters HTTP requests before they reach route handlers.

import helmet from "helmet";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(url => url.trim())
  : [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:4173"];

export const securityHeaders = (req, res, next) => {
  if (req.path.startsWith("/api-docs")) {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https://fastly.jsdelivr.net"],
          connectSrc: ["'self'"],
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })(req, res, next);
  } else {
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    helmet({
      contentSecurityPolicy: isDev ? false : {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.unsplash.com", "https://res.cloudinary.com", "https://*.razorpay.com", "https:", "http:"],
          connectSrc: ["*", "'self'", "ws:", "wss:", "http:", "https:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'", ...allowedOrigins],
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      frameguard: false, // Rely entirely on frameAncestors to permit framing from allowed origins
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })(req, res, next);
  }
};
