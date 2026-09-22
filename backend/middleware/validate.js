// Request validation middleware using Zod.
// Validates body, query, and params schemas, returning standard 400 responses on errors.

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query;
    if (parsed.params !== undefined) req.params = parsed.params;
    next();
  } catch (error) {
    console.error("Validation failed for route:", req.originalUrl, "Body:", req.body, "Errors:", error.errors || error.message);
    const issues = error.issues || error.errors || [];
    const errorDetails = issues.map(err => ({
      field: err.path.slice(1).join("."),
      message: err.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorDetails,
    });
  }
};

export default validate;
