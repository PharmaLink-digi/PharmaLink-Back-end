import axios from 'axios';
import crypto from 'crypto';
import { supabase } from '../../database/supabase.js';

export const createPaymobPayment = async (req, res) => {
    try {
        const { amount, billing, merchant_order_id } = req.body;
        if (!amount) return res.status(400).json({ message: 'amount is required' });

        const PAYMOB_API_KEY      = process.env.PAYMOB_API_KEY;
        const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
        const PAYMOB_IFRAME_ID    = process.env.PAYMOB_IFRAME_ID;

        if (!PAYMOB_API_KEY) {
            return res.status(503).json({ message: 'Paymob not configured on this server' });
        }

        // Step 1: Auth token
        const { data: authData } = await axios.post(
            'https://accept.paymob.com/api/auth/tokens',
            { api_key: PAYMOB_API_KEY }
        );
        const token = authData.token;

        // Step 2: Register order
        const { data: orderData } = await axios.post(
            'https://accept.paymob.com/api/ecommerce/orders',
            {
                auth_token: token,
                delivery_needed: false,
                amount_cents: Math.round(Number(amount) * 100),
                currency: 'EGP',
                merchant_order_id: merchant_order_id ? String(merchant_order_id) : undefined,
                items: [],
            }
        );

        // Step 3: Get payment key
        const nameParts = (billing?.name || 'NA NA').split(' ');
        const { data: keyData } = await axios.post(
            'https://accept.paymob.com/api/acceptance/payment_keys',
            {
                auth_token: token,
                amount_cents: Math.round(Number(amount) * 100),
                expiration: 3600,
                order_id: orderData.id,
                billing_data: {
                    first_name:   nameParts[0] || 'NA',
                    last_name:    nameParts[1] || 'NA',
                    email:        billing?.email || 'NA',
                    phone_number: billing?.phone || 'NA',
                    street:       billing?.address || 'NA',
                    apartment: 'NA', building: 'NA', floor: 'NA',
                    city: 'Cairo', country: 'EG',
                    postal_code: 'NA', state: 'NA',
                },
                currency: 'EGP',
                integration_id: Number(PAYMOB_INTEGRATION_ID),
            }
        );

        res.json({
            payment_key: keyData.token,
            iframe_url: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${keyData.token}`,
        });
    } catch (err) {
        console.error('Paymob error:', err.response?.data || err.message);
        res.status(500).json({ message: 'Payment initialization failed' });
    }
};

// Paymob calls this after every transaction
// Body structure: { type: "TRANSACTION", obj: { ...transaction fields, order: { merchant_order_id, ... } } }
export const paymobWebhook = async (req, res) => {
    try {
        const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
        const hmacFromPaymob = req.query.hmac;
        const t = req.body?.obj; // transaction object

        if (!t) return res.sendStatus(200);

        // Verify HMAC — Paymob concatenates these fields in this exact order
        if (HMAC_SECRET && hmacFromPaymob) {
            const concat = [
                t.amount_cents, t.created_at, t.currency, t.error_occured,
                t.has_parent_transaction, t.id, t.integration_id,
                t.is_3d_secure, t.is_auth, t.is_capture, t.is_refunded,
                t.is_standalone_payment, t.is_voided, t.order?.id,
                t.owner, t.pending,
                t.source_data?.pan, t.source_data?.sub_type, t.source_data?.type,
                t.success,
            ].join('');
            const computed = crypto.createHmac('sha512', HMAC_SECRET).update(concat).digest('hex');
            if (computed !== hmacFromPaymob) {
                console.error('Paymob HMAC mismatch');
                return res.sendStatus(200); // don't return 401 — just ignore silently
            }
        }

        const merchantOrderId = t.order?.merchant_order_id;

        if (merchantOrderId) {
            let newStatus;
            if (t.success === true)       newStatus = 'processing';
            else if (t.pending === true)  newStatus = 'pending';
            else                          newStatus = 'Cancelled';

            await supabase.from('orders').update({ status: newStatus }).eq('order_id', merchantOrderId);
            console.log(`Order ${merchantOrderId} → ${newStatus}`);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook error:', err.message);
        res.sendStatus(200);
    }
};
