// This file configures the Swagger spec generator and documentation interface for the API.
// It integrates swagger-jsdoc and swagger-ui-express to serve documentation at /api-docs.

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Define configuration details for Swagger OpenAPI specs
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Client Project Management Portal API",
      version: "1.0.0",
      description: "Interactive API documentation and testing interface for the white-label CRM system.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your authorization JWT token in the format Bearer <token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI documentation annotations
  apis: ["./routes/*.js", "./server.js"],
};

// Generate final swagger specs document from configuration options
const specs = swaggerJsdoc(options);

/**
 * Registers Swagger UI middleware on the Express app instance
 * @param {object} app - The Express application instance
 */
export function setupSwagger(app) {
  // Bind live documentation assets and serve UI views
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  console.log("[Swagger] OpenAPI UI documentation running at http://localhost:5000/api-docs");
}
