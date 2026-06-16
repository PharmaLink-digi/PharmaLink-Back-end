import kafka from './kafkaClient.js';

const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';

const consumers = new Map();

export async function startConsumer(groupId, topics, handler) {
    if (!KAFKA_ENABLED) {
        console.log(`[Kafka] Disabled — skipping consumer [${groupId}]`);
        return null;
    }

    try {
        const consumer = kafka.consumer({ groupId });
        await consumer.connect();

        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
        }

        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const msg = JSON.parse(message.value.toString());
                    await handler(topic, msg.event_type, msg.payload);
                } catch (err) {
                    console.error(`[Kafka Consumer] Error processing message from ${topic}:`, err.message);
                }
            },
        });

        consumers.set(groupId, consumer);
        console.log(`[Kafka] Consumer [${groupId}] subscribed to: ${topics.join(', ')}`);
        return consumer;
    } catch (err) {
        console.warn(`[Kafka] Consumer [${groupId}] failed to start:`, err.message);
        return null;
    }
}

export async function stopAllConsumers() {
    if (!KAFKA_ENABLED) return;

    for (const [groupId, consumer] of consumers.entries()) {
        try {
            await consumer.disconnect();
        } catch (err) {
            console.warn(`[Kafka] Consumer [${groupId}] disconnect error:`, err.message);
        } finally {
            consumers.delete(groupId);
            console.log(`[Kafka] Consumer [${groupId}] disconnected`);
        }
    }
}
