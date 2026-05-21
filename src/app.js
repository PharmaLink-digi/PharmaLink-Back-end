import express from "express";
import cors from "cors";
import helmet from "helmet";
import xss from "xss-clean";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from './modules/auth/auth.routes.js';
import clientRouter from './modules/client/client.routes.js';
import pharmacyRouter from './modules/pharmacy/pharmacy.routes.js';
import medicationRouter from './modules/medication/medication.routes.js';
import warehouseRouter from './modules/warehouse/warehouse.routes.js';
import warehouseInventoryRouter from './modules/warehouseInventory/warehouseInventory.routes.js';
import pharmInventoryRouter from './modules/pharmInventory/pharmInventory.routes.js';
import orderRouter from './modules/order/order.routes.js';
import saleRouter from './modules/sale/sale.routes.js';
import exchangeRouter from './modules/exchange/exchange.routes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.config.js';

const app = express();


// Security Middleware
app.use(helmet());
app.use(cors());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data compression
app.use(compression());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Default Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to PharmaLink API",
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/pharmacies', pharmacyRouter);
app.use('/api/v1/medications', medicationRouter);
app.use('/api/v1/warehouses', warehouseRouter);
app.use('/api/v1/warehouse-inventory', warehouseInventoryRouter);
app.use('/api/v1/pharmacy-inventory', pharmInventoryRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/sales', saleRouter);
app.use('/api/v1/exchanges', exchangeRouter);


// Handle undefined Routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
