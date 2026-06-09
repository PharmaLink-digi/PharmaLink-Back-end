import { Kafka } from 'kafkajs';

// TODO: Replace with actual Kafka broker address(es) provided by Data Engineer
const BROKERS = ["KAFKA_BROKER_HOST:PORT"];

// TODO: Replace with the actual Topic name provided by Data Engineer
const TOPIC = "YOUR_KAFKA_TOPIC_NAME";

// TODO: Replace with actual Authentication configuration if required by Data Engineer (e.g., SASL)
const SASL_CONFIG = undefined; 
// Example: { mechanism: 'plain', username: 'YOUR_USERNAME', password: 'YOUR_PASSWORD' }

// TODO: Replace with actual SSL configuration if required by Data Engineer
const SSL_CONFIG = false; 
// Example: true

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'simple-producer',
  brokers: BROKERS,
  ssl: SSL_CONFIG,
  sasl: SASL_CONFIG
});

// Create the producer instance
const producer = kafka.producer();

async function runProducer() {
  try {
    // 1. Connect to Kafka
    console.log("Connecting to Kafka producer...");
    await producer.connect();
    console.log("Successfully connected to Kafka!");

    // TODO: Replace with actual message schema/example payload provided by Data Engineer
    const sampleMessage = {
      id: 1,
      eventType: "user_signup",
      timestamp: new Date().toISOString()
    };

    // 2. Send a sample JSON message
    console.log(`Sending message to topic: ${TOPIC}`);
    await producer.send({
      topic: TOPIC,
      messages: [
        { value: JSON.stringify(sampleMessage) }
      ],
    });

    // 3. Log message delivery success
    console.log("Message delivered successfully!");

  } catch (error) {
    // 4. Handle and log errors
    console.error("Failed to produce message:", error);
  } finally {
    // 5. Disconnect properly
    console.log("Disconnecting producer...");
    await producer.disconnect();
    console.log("Producer disconnected.");
  }
}

// Execute the producer function
runProducer();
