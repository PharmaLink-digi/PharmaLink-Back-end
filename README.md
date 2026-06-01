# PharmaLink — Backend API

> RESTful backend service for the PharmaLink platform, handling clients, medications, warehouses, pharmacy inventory, orders, and more.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Database](#database)
10. [Error Handling](#error-handling)
11. [Deployment Notes](#deployment-notes)

---

## Project Overview

PharmaLink is a digital pharmacy platform. This repository contains the **backend API only**, built with Node.js and Express. It exposes a RESTful interface consumed by PharmaLink front-end applications and external integrations.

All routes are mounted at the **root level** — there is no global `/api` or versioned prefix. The server starts on `PORT` (default `3000`).

---

## Features

- **Client Management** — full CRUD for platform client records
- **Medications** — manage the medications catalog
- **Pharmacy Info** — register and manage pharmacy profiles
- **Pharmacy Inventory** — track medication stock levels per pharmacy
- **Warehouses** — warehouse registration and management
- **Warehouse Inventory** — inventory tracking per warehouse
- **Orders** — full order lifecycle (create, read, update, delete)
- **Order Details** — line-item detail records per order
- **Sales** — sales record management
- **Exchange Pharm** — pharmacy-to-pharmacy exchange operations
- **Search** — medication search across the platform
- **Authentication** — login endpoint with welcome email dispatch
- **API Documentation** — Swagger UI (swagger-jsdoc + swagger-ui-express included as dependencies)
- **Event Streaming** — Kafka integration via KafkaJS for async processing
- **Email Notifications** — Nodemailer for transactional emails

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM — `"type": "module"`) |
| Framework | Express 5 |
| Primary Database | MongoDB via Mongoose 9 |
| Secondary Database | Supabase (PostgreSQL via `@supabase/supabase-js`) |
| Message Broker | Apache Kafka via KafkaJS |
| Email | Nodemailer |
| API Docs | swagger-jsdoc + swagger-ui-express |
| HTTP Client | Axios |
| Environment Config | dotenv |
| Dev Server | Nodemon |
| CORS | cors middleware |

---

## Folder Structure

```
pharmalink-back-end/
├── database/                        # DB clients and Mongoose model definitions
│   ├── dbclient.js                  # MongoDB connection setup
│   ├── supabase.js                  # Supabase client initialisation
│   ├── exchangePharm.js
│   ├── medication.js
│   ├── orderDetails.js
│   ├── orders.js
│   ├── pharmInfo.js
│   ├── pharmInventory.js
│   ├── sales.js
│   ├── warehouse.js
│   └── warehouseInventory.js
│
├── modules/                         # Feature modules — one folder per domain
│   ├── auth/
│   │   ├── auth.controller.js
│   │   └── auth.routes.js
│   ├── client/
│   │   ├── client.controller.js
│   │   └── client.routes.js
│   ├── exchangePharm/
│   │   ├── exchangePharm.controller.js
│   │   └── exchangePharm.routes.js
│   ├── medication/
│   │   ├── medication.controller.js
│   │   └── medication.routes.js
│   ├── orderDetails/
│   │   ├── orderDetails.controller.js
│   │   └── orderDetails.routes.js
│   ├── orders/
│   │   ├── orders.controller.js
│   │   └── orders.routes.js
│   ├── pharmInfo/
│   │   ├── pharmInfo.controller.js
│   │   └── pharmInfo.routes.js
│   ├── pharmInventory/
│   │   ├── pharmInventory.controller.js
│   │   └── pharmInventory.routes.js
│   ├── sales/
│   │   ├── sales.controller.js
│   │   └── sales.routes.js
│   ├── search/
│   │   ├── search.controller.js
│   │   └── search.routes.js
│   ├── warehouse/
│   │   ├── warehouse.controller.js
│   │   └── warehouse.routes.js
│   └── warehouseInventory/
│       ├── warehouseInventory.controller.js
│       └── warehouseInventory.routes.js
│
├── .env                             # Environment variables (not committed)
├── .gitignore
├── index.js                         # App entry point — mounts all routers
├── package.json
└── package-lock.json
```

> Each module follows a consistent two-file pattern: `<module>.controller.js` for business logic and `<module>.routes.js` for the Express router.

---

## Installation & Setup

### Prerequisites

- Node.js **v18+**
- npm **v9+**
- A running MongoDB instance (local or Atlas)
- A Supabase project (if relational features are used)
- Apache Kafka broker (if event streaming is active)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/PharmaLink-digi/PharmaLink-Back-end.git
cd PharmaLink-Back-end

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env with your actual values (see Environment Variables below)

# 4a. Start in production mode
npm start

# 4b. Start in development mode (auto-restart on changes)
npx nodemon index.js
```

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file.**

```env
# Server
PORT=3000

# MongoDB
MONGODB_URI=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Kafka
KAFKA_BROKER=
KAFKA_CLIENT_ID=
KAFKA_GROUP_ID=

# Email (Nodemailer)
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
```

> Verify exact variable names against `process.env.*` references in each controller file.

---

## API Endpoints

All routers are mounted at the **root** of the Express app with no global prefix (confirmed from `index.js`). The base URL is `http://localhost:3000` by default.

---

### Auth

Mounted via `app.use(authRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | `/login` | `authController.login` | Authenticate a user |
| POST | `/send-email` | `authController.sendWelcomeEmail` | Send a welcome email |

---

### Clients

Mounted via `app.use(clientRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/clients` | `getAllClients` | Retrieve all clients |
| GET | `/clients/:id` | `getClientById` | Retrieve a client by ID |
| POST | `/clients` | `insertClient` | Create a new client |
| PUT | `/clients/:id` | `updateClient` | Update a client by ID |
| DELETE | `/clients/:id` | `deleteClient` | Delete a client by ID |

---

### Medications

Mounted via `app.use(medicationRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/medications` | `getAllMedications` | Retrieve all medications |
| GET | `/medications/:id` | `getMedicationById` | Retrieve a medication by ID |
| POST | `/medications` | `insertMedication` | Add a new medication |
| PUT | `/medications/:id` | `updateMedication` | Update a medication by ID |
| DELETE | `/medications/:id` | `deleteMedication` | Delete a medication by ID |

---

### Pharmacy Info

Mounted via `app.use(pharmInfoRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/pharm-info` | `getAllPharmacies` | Retrieve all pharmacies |
| GET | `/pharm-info/:id` | `getPharmacyById` | Retrieve a pharmacy by ID |
| POST | `/pharm-info` | `insertPharmacy` | Register a new pharmacy |
| PUT | `/pharm-info/:id` | `updatePharmacy` | Update a pharmacy by ID |
| DELETE | `/pharm-info/:id` | `deletePharmacy` | Delete a pharmacy by ID |

---

### Pharmacy Inventory

Mounted via `app.use(pharmInventoryRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/pharm-inventory` | `getAllPharmInventory` | Retrieve all pharmacy inventory records |
| GET | `/pharm-inventory/:id` | `getPharmInventoryById` | Retrieve a pharmacy inventory record by ID |
| POST | `/pharm-inventory` | `insertPharmInventory` | Add a pharmacy inventory record |
| PUT | `/pharm-inventory/:id` | `updatePharmInventory` | Update a pharmacy inventory record by ID |
| DELETE | `/pharm-inventory/:id` | `deletePharmInventory` | Delete a pharmacy inventory record by ID |

---

### Warehouses

Mounted via `app.use(warehouseRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/warehouses` | `getAllWarehouses` | Retrieve all warehouses |
| GET | `/warehouses/:id` | `getWarehouseById` | Retrieve a warehouse by ID |
| POST | `/warehouses` | `insertWarehouse` | Create a new warehouse |
| PUT | `/warehouses/:id` | `updateWarehouse` | Update a warehouse by ID |
| DELETE | `/warehouses/:id` | `deleteWarehouse` | Delete a warehouse by ID |

---

### Warehouse Inventory

Mounted via `app.use(warehouseInventoryRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/warehouse-inventory` | `getAllWarehouseInventory` | Retrieve all warehouse inventory records |
| GET | `/warehouse-inventory/:id` | `getWarehouseInventoryById` | Retrieve a warehouse inventory record by ID |
| POST | `/warehouse-inventory` | `insertWarehouseInventory` | Add a warehouse inventory record |
| PUT | `/warehouse-inventory/:id` | `updateWarehouseInventory` | Update a warehouse inventory record by ID |
| DELETE | `/warehouse-inventory/:id` | `deleteWarehouseInventory` | Delete a warehouse inventory record by ID |

---

### Orders

Mounted via `app.use(ordersRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/orders` | `getAllOrders` | Retrieve all orders |
| GET | `/orders/:id` | `getOrderById` | Retrieve an order by ID |
| POST | `/orders` | `insertOrder` | Place a new order |
| PUT | `/orders/:id` | `updateOrder` | Update an order by ID |
| DELETE | `/orders/:id` | `deleteOrder` | Delete an order by ID |

---

### Order Details

Mounted via `app.use(orderDetailsRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/order-details` | `getAllOrderDetails` | Retrieve all order detail records |
| GET | `/order-details/:id` | `getOrderDetailById` | Retrieve an order detail record by ID |
| POST | `/order-details` | `insertOrderDetail` | Create an order detail record |
| PUT | `/order-details/:id` | `updateOrderDetail` | Update an order detail record by ID |
| DELETE | `/order-details/:id` | `deleteOrderDetail` | Delete an order detail record by ID |

---

### Sales

Mounted via `app.use(salesRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/sales` | `getAllSales` | Retrieve all sales records |
| GET | `/sales/:id` | `getSaleById` | Retrieve a sales record by ID |
| POST | `/sales` | `insertSale` | Create a sales record |
| PUT | `/sales/:id` | `updateSale` | Update a sales record by ID |
| DELETE | `/sales/:id` | `deleteSale` | Delete a sales record by ID |

---

### Exchange Pharm

Mounted via `app.use(exchangePharmRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/exchange-pharm` | `getAllExchanges` | Retrieve all pharmacy exchange records |
| GET | `/exchange-pharm/:id` | `getExchangeById` | Retrieve an exchange record by ID |
| POST | `/exchange-pharm` | `insertExchange` | Initiate a pharmacy exchange |
| PUT | `/exchange-pharm/:id` | `updateExchange` | Update an exchange record by ID |
| DELETE | `/exchange-pharm/:id` | `deleteExchange` | Delete an exchange record by ID |

---

### Search

Mounted via `app.use("/search", searchRouter)`.

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/search` | `searchMedicines` | Search for medications by query parameter |

---

## Authentication & Authorization

The `modules/auth/` module provides two endpoints: `POST /login` for user authentication and `POST /send-email` for dispatching welcome emails via Nodemailer.

**Current state (from `index.js`):**
- All routers are mounted directly with `app.use(router)` — **no authentication middleware is applied globally** at the `index.js` level.
- Route-level protection, if any, is enforced inside individual controller files.

> If JWT verification middleware exists in the controllers, it should be promoted to a shared middleware and applied per-router in `index.js` for consistency and clarity.

---

## Database

PharmaLink uses two database layers:

### MongoDB (Primary — via Mongoose)
- Connection initialised in `database/dbclient.js`
- Each domain has a dedicated Mongoose model file under `database/`
- Handles the main operational data store for all entities

### Supabase (Secondary — via `@supabase/supabase-js`)
- Client initialised in `database/supabase.js`
- Provides a PostgreSQL-backed relational store
- May be used for structured queries, auth helpers, or realtime features

### Apache Kafka (Event Streaming — via KafkaJS)
- Integrated for asynchronous event processing (e.g., order events, inventory updates)
- Broker connection configured via environment variables

---

## Error Handling

Express 5 automatically propagates async errors to error-handling middleware, eliminating the need for explicit `try/catch` in every route handler.

Standard HTTP response conventions used across controllers:

| Scenario | Status Code |
|---|---|
| Successful retrieval | `200 OK` |
| Successful creation | `201 Created` |
| Validation / bad input | `400 Bad Request` |
| Unauthenticated request | `401 Unauthorized` |
| Resource not found | `404 Not Found` |
| Server-side failure | `500 Internal Server Error` |

> A centralised error-handling middleware (the four-argument `(err, req, res, next)` pattern) should be registered as the last middleware in `index.js` to catch and format all unhandled errors consistently.

---

## Deployment Notes

- The project uses **ES Modules** (`"type": "module"`). Node.js **v18+** is required.
- All environment variables must be configured in your hosting platform's secrets manager before deploying.
- The production start command is:
  ```bash
  npm start   # runs: node index.js
  ```
- **CORS**: `app.use(cors())` is currently open (wildcard). Restrict allowed origins to your front-end domain(s) in production:
  ```js
  app.use(cors({ origin: "https://your-frontend-domain.com" }));
  ```
- **MongoDB Atlas**: Whitelist your server's outbound IP in the Atlas Network Access settings.
- **Supabase**: Review and harden Row-Level Security (RLS) policies before going live.
- **Kafka**: Ensure the broker is reachable from the deployment environment and topic names are consistent across services.

---

## Repository

- **Source**: [https://github.com/PharmaLink-digi/PharmaLink-Back-end](https://github.com/PharmaLink-digi/PharmaLink-Back-end)
- **Issues**: [https://github.com/PharmaLink-digi/PharmaLink-Back-end/issues](https://github.com/PharmaLink-digi/PharmaLink-Back-end/issues)
- **License**: ISC
