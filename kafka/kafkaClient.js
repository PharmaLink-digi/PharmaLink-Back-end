import { Kafka } from 'kafkajs';
import 'dotenv/config';

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'pharmalink-backend',
    brokers: process.env.KAFKA_BROKERS.split(','),
});

export default kafka;
