import kafka from './kafkaClient.js';
import { v4 as uuidv4 } from 'uuid';

const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';

const producer = KAFKA_ENABLED ? kafka.producer() : null;
let connected = false;

export async function connectProducer() {
    if (!KAFKA_ENABLED) {
        console.log('[Kafka] Disabled — skipping producer connection');
        return;
    }
    if (connected) return;
    try {
        await producer.connect();
        connected = true;
        console.log('[Kafka] Producer connected');
    } catch (err) {
        connected = false;
        console.warn('[Kafka] Producer connection failed:', err.message);
        throw err;
    }
}

export async function disconnectProducer() {
    if (!KAFKA_ENABLED || !connected) return;
    try {
        await producer.disconnect();
    } catch (err) {
        console.warn('[Kafka] Producer disconnect error:', err.message);
    } finally {
        connected = false;
        console.log('[Kafka] Producer disconnected');
    }
}

export async function sendEvent(topic, eventType, key, payload) {
    if (!KAFKA_ENABLED) return;

    if (!connected) {
        try {
            await connectProducer();
        } catch {
            console.warn(`[Kafka] sendEvent skipped (producer not connected): ${topic}`);
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
        console.error(`[Kafka] Failed to send to ${topic}:`, err.message);
        try {
            await producer.send({
                topic: TOPICS.DLQ,
                messages: [{
                    key: String(key),
                    value: JSON.stringify({
                        error:          err.message,
                        original_topic: topic,
                        key:            String(key),
                        payload:        message,
                        ts:             new Date().toISOString(),
                    }),
                }],
            });
        } catch (dlqErr) {
            console.error('[Kafka] DLQ also failed:', dlqErr.message);
        }
    }
}

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
