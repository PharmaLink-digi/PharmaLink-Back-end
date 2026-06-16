import kafka from './kafkaClient.js';
import { v4 as uuidv4 } from 'uuid';

export const TOPICS = {
    SALES:               'pharmacy.sales',
    ORDERS:              'pharmacy.orders',
    ORDER_DETAILS:       'pharmacy.order.details',
    PHARM_INVENTORY:     'pharmacy.inventory.updates',
    EXPIRY_ALERTS:       'pharmacy.expiry.alerts',
    EXCHANGE:            'pharmacy.exchange',
    WAREHOUSE_INVENTORY: 'warehouse.inventory.updates',
    DLQ:                 'pharmacy.dlq',
};

const producer = kafka.producer({ allowAutoTopicCreation: true });

let connected  = false;
let connecting = false;

// ── Connection management ─────────────────────────────────────────────────────

export async function connectProducer() {
    if (connected)  return;
    if (connecting) return;
    connecting = true;
    try {
        await producer.connect();
        connected = true;
        console.log('[Kafka] Producer connected');
    } catch (err) {
        connected = false;
        console.error('[Kafka] Producer connection failed:', err.message);
        throw err;
    } finally {
        connecting = false;
    }
}

export async function disconnectProducer() {
    if (!connected) return;
    try {
        await producer.disconnect();
        console.log('[Kafka] Producer disconnected');
    } catch (err) {
        console.error('[Kafka] Producer disconnect error:', err.message);
    } finally {
        connected = false;
    }
}

// ── Internal send (runs in background) ───────────────────────────────────────

async function _doSend(topic, eventType, key, payload) {
    if (!connected) {
        try {
            await connectProducer();
        } catch {
            console.warn(`[Kafka] sendEvent skipped — producer not connected [topic: ${topic}]`);
            return;
        }
    }

    const message = {
        event_id:   uuidv4(),
        event_type: eventType,
        producer:   'pharmalink-backend',
        ts:         new Date().toISOString(),
        payload,
    };

    try {
        await producer.send({
            topic,
            messages: [{ key: String(key), value: JSON.stringify(message) }],
        });
    } catch (err) {
        connected = false; // force reconnect on next call
        console.error(`[Kafka] Failed to send to ${topic}:`, err.message);
        _sendToDLQ(topic, key, message, err.message);
    }
}

async function _sendToDLQ(originalTopic, key, message, errorMessage) {
    try {
        await producer.send({
            topic: TOPICS.DLQ,
            messages: [{
                key: String(key),
                value: JSON.stringify({
                    error:          errorMessage,
                    original_topic: originalTopic,
                    key:            String(key),
                    payload:        message,
                    ts:             new Date().toISOString(),
                }),
            }],
        });
    } catch (dlqErr) {
        console.error('[Kafka] DLQ send also failed:', dlqErr.message);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────
//
// Fire-and-forget: callers may `await sendEvent(...)` — it resolves immediately
// while the actual Kafka publish runs in the background.
// Errors are logged; they never reach the caller or block the HTTP response.

export function sendEvent(topic, eventType, key, payload) {
    _doSend(topic, eventType, key, payload).catch(err => {
        console.error(`[Kafka] Unhandled background error [${topic}]:`, err.message);
    });
}
