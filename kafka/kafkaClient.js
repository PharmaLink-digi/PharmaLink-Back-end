import { Kafka, logLevel } from 'kafkajs';
import 'dotenv/config';

const brokers = process.env.KAFKA_BROKERS;
const clientId = process.env.KAFKA_CLIENT_ID || 'pharmalink-backend';

if (!brokers) {
    throw new Error(
        '[Kafka] KAFKA_BROKERS is required but not set. ' +
        'Add KAFKA_BROKERS=host1:port,host2:port to your environment.'
    );
}

const kafka = new Kafka({
    clientId,
    brokers: brokers.split(',').map(b => b.trim()),
    connectionTimeout: 3000,
    requestTimeout: 25000,
    retry: {
        initialRetryTime: 300,
        retries: 8,
        factor: 0.2,
        multiplier: 1.5,
        maxRetryTime: 30000,
    },
    logLevel: logLevel.ERROR,
});

export default kafka;
