import express from "express";
import cors from "cors";
import 'dotenv/config';
import { connectProducer, disconnectProducer } from "./kafka/producer.js";

import clientRouter from "./modules/client/client.routes.js";
import pharmInfoRouter from "./modules/pharmInfo/pharmInfo.routes.js";
import medicationRouter from "./modules/medication/medication.routes.js";
import warehouseRouter from "./modules/warehouse/warehouse.routes.js";
import warehouseInventoryRouter from "./modules/warehouseInventory/warehouseInventory.routes.js";
import pharmInventoryRouter from "./modules/pharmInventory/pharmInventory.routes.js";
import ordersRouter from "./modules/orders/orders.routes.js";
import orderDetailsRouter from "./modules/orderDetails/orderDetails.routes.js";
import salesRouter from "./modules/sales/sales.routes.js";
import exchangePharmRouter from "./modules/exchangePharm/exchangePharm.routes.js";
import router from "./modules/search/search.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import paymentRouter from "./modules/payment/payment.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception — server stays up:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Rejection — server stays up:', reason?.message || reason);
});

app.use(express.json());
app.use(cors());

app.use(authRouter);
app.use(paymentRouter);
app.use(clientRouter);
app.use(pharmInfoRouter);
app.use("/medications/search", router);
app.use(medicationRouter);
app.use(warehouseRouter);
app.use(warehouseInventoryRouter);
app.use(pharmInventoryRouter);
app.use(ordersRouter);
app.use(orderDetailsRouter);
app.use(salesRouter);
app.use(exchangePharmRouter);

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.KAFKA_ENABLED === 'true') {
        try {
            await connectProducer();
        } catch (err) {
            console.warn('[Kafka] Startup connection failed — server continues without Kafka:', err.message);
        }
    }
});

process.on('SIGTERM', async () => {
    await disconnectProducer();
    process.exit(0);
});
