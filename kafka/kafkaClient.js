import { Kafka } from 'kafkajs';
import 'dotenv/config';

let kafka = null;

if (process.env.KAFKA_ENABLED === 'true') {
    if (!process.env.KAFKA_BROKERS) {
        throw new Error('[Kafka] KAFKA_ENABLED is true but KAFKA_BROKERS is not set');
    }
    kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'pharmalink-backend',
        brokers: process.env.KAFKA_BROKERS.split(','),
    });
}

export default kafka;
