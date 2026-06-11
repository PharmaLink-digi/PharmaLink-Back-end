import kafka from './kafkaClient.js';

const consumers = new Map();

/**
 * @param {string} groupId
 * @param {string[]} topics
 * @param {(topic: string, eventType: string, payload: object) => void} handler
 */
export async function startConsumer(groupId, topics, handler) {
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
    console.log(`Kafka consumer [${groupId}] subscribed to: ${topics.join(', ')}`);
    return consumer;
}

export async function stopAllConsumers() {
    for (const [groupId, consumer] of consumers.entries()) {
        await consumer.disconnect();
        consumers.delete(groupId);
        console.log(`Kafka consumer [${groupId}] disconnected`);
    }
}
