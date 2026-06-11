import express from 'express';
import { createPaymobPayment, paymobWebhook } from './payment.controller.js';

const paymentRouter = express.Router();

paymentRouter.post('/payment/paymob', createPaymobPayment);
paymentRouter.post('/payment/paymob/callback', paymobWebhook);

export default paymentRouter;
