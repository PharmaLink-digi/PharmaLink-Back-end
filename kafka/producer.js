import kafka from './kafkaClient.js';
import { v4 as uuidv4 } from 'uuid';

const producer = kafka.producer();
let connected = false;

export async function connectProducer() {
    if (!connected) {
        await producer.connect();
        connected = true;
        console.log('Kafka producer connected');
    }
}

export async function disconnectProducer() {
    if (connected) {
        await producer.disconnect();
        connected = false;
    }
}

export async function sendEvent(topic, eventType, key, payload) {
    if (!connected) await connectProducer();

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
