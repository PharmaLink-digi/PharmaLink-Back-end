import kafka from './kafkaClient.js';

const consumers = new Map();

// ── Start a consumer group ────────────────────────────────────────────────────

export async function startConsumer(groupId, topics, handler) {
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
                    console.error(`[Kafka Consumer] Error in [${groupId}] on ${topic}:`, err.message);
                }
            },
        });

        consumers.set(groupId, consumer);
        console.log(`[Kafka] Consumer [${groupId}] subscribed to: ${topics.join(', ')}`);
        return consumer;
    } catch (err) {
        console.error(`[Kafka] Consumer [${groupId}] failed to start:`, err.message);
        return null;
    }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

export async function stopAllConsumers() {
    const stops = [...consumers.entries()].map(async ([groupId, consumer]) => {
        try {
            await consumer.disconnect();
            console.log(`[Kafka] Consumer [${groupId}] disconnected`);
        } catch (err) {
            console.error(`[Kafka] Consumer [${groupId}] disconnect error:`, err.message);
        } finally {
            consumers.delete(groupId);
        }
    });
    await Promise.allSettled(stops);
}
