const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info: (msg, meta = "") => {
    if (isProduction) {
      console.log(JSON.stringify({ level: "info", message: msg, timestamp: new Date().toISOString(), ...meta }));
    } else {
      console.log(`[INFO] ${msg}`, meta);
    }
  },
  warn: (msg, meta = "") => {
    if (isProduction) {
      console.warn(JSON.stringify({ level: "warn", message: msg, timestamp: new Date().toISOString(), ...meta }));
    } else {
      console.warn(`[WARN] ${msg}`, meta);
    }
  },
  error: (msg, meta = "") => {
    if (isProduction) {
      console.error(JSON.stringify({ level: "error", message: msg, timestamp: new Date().toISOString(), ...meta }));
    } else {
      console.error(`[ERROR] ${msg}`, meta);
    }
  },
  debug: (msg, meta = "") => {
    if (!isProduction) {
      console.log(`[DEBUG] ${msg}`, meta);
    }
  }
};

export default logger;
