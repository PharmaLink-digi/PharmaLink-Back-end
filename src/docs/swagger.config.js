import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PharmaLink API',
      version: '1.0.0',
      description: 'API documentation for the PharmaLink Backend Project',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js', './src/app.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);
