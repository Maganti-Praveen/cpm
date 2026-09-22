// Configures the Vite build environment, proxy redirects, and build aliases.
// Specifies optimization presets and server ports.


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Vite plugin: Convert render-blocking CSS <link> tags to async-loaded CSS.
 * Uses the media="print" onload="this.media='all'" pattern recommended by
 * web.dev for eliminating render-blocking stylesheets.
 * Also adds a <noscript> fallback for accessibility.
 */
function cssAsyncPlugin() {
  return {
    name: "vite-plugin-css-async",
    enforce: "post",
    transformIndexHtml(html) {
      let newHtml = html.replace(
        /<link rel="stylesheet"([^>]*) href="([^"]+)"[^>]*>/g,
        (match, attrs, href) => {
          return `<link rel="preload" as="style"${attrs} href="${href}" onload="this.rel='stylesheet'"><noscript><link rel="stylesheet"${attrs} href="${href}"></noscript>`;
        }
      );
      
      const preloadMatches = [];
      newHtml = newHtml.replace(/<link rel="modulepreload"[^>]*>/g, (match) => {
        preloadMatches.push(match);
        return "";
      });
      
      let scriptTag = "";
      newHtml = newHtml.replace(/<script type="module"[^>]*><\/script>/g, (match) => {
        scriptTag = match;
        return "";
      });
      
      const headInjection = [
        ...preloadMatches,
        scriptTag
      ].filter(Boolean).join("\n  ");
      
      if (headInjection) {
        newHtml = newHtml.replace("<head>", `<head>\n  ${headInjection}`);
      }
      
      return newHtml;
    },
  };
}

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://*.razorpay.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://localhost:5000 ws://localhost:5000 wss://localhost:5000 https://*.razorpay.com https://crp-backend-u945.onrender.com wss://crp-backend-u945.onrender.com; frame-src 'self' about: data: blob: http://localhost:5000 https://crp-backend-u945.onrender.com https://res.cloudinary.com https://*.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === "build" ? [cssAsyncPlugin()] : [])
  ],
  root: ".",
  build: {
    target: "esnext",
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".woff2")) {
            return "assets/[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  },
  server: {
    port: 5173,
    headers: securityHeaders,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    headers: securityHeaders,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  }
}));
