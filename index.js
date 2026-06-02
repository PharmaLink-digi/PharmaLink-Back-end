import express from "express";
import cors from "cors";

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

import authRouter from "./modules/auth/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use(authRouter);
app.use(clientRouter);
app.use(pharmInfoRouter);
app.use("/medications/search", searchRouter);
app.use(medicationRouter);
app.use(warehouseRouter);
app.use(warehouseInventoryRouter);
app.use(pharmInventoryRouter);
app.use(ordersRouter);
app.use(orderDetailsRouter);
app.use(salesRouter);
app.use(exchangePharmRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
