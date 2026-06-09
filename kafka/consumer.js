import { Kafka } from 'kafkajs';

// TODO: Replace with actual Kafka broker address(es) provided by Data Engineer
const BROKERS = ["KAFKA_BROKER_HOST:PORT"];

// TODO: Replace with the actual Topic name provided by Data Engineer
const TOPIC = "YOUR_KAFKA_TOPIC_NAME";

// TODO: Replace with the actual Consumer group ID provided by Data Engineer
const GROUP_ID = "YOUR_CONSUMER_GROUP_ID";

// TODO: Replace with actual Authentication configuration if required by Data Engineer (e.g., SASL)
const SASL_CONFIG = undefined; 
// Example: { mechanism: 'plain', username: 'YOUR_USERNAME', password: 'YOUR_PASSWORD' }

// TODO: Replace with actual SSL configuration if required by Data Engineer
const SSL_CONFIG = false; 
// Example: true

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'simple-consumer',
  brokers: BROKERS,
  ssl: SSL_CONFIG,
  sasl: SASL_CONFIG
});

// Create the consumer instance and assign it to a consumer group
const consumer = kafka.consumer({ groupId: GROUP_ID });

async function runConsumer() {
  try {
    // 1. Connect to Kafka
    console.log("Connecting to Kafka consumer...");
    await consumer.connect();
    console.log("Successfully connected to Kafka!");

    // 2. Subscribe to the topic (start reading from the beginning if no previous offset exists)
    console.log(`Subscribing to topic: ${TOPIC}`);
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

    // 3. Listen continuously for new messages
    console.log("Listening for messages... (Press Ctrl+C to exit)");
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // 4. Print received messages to the console
        try {
          // Convert the message value buffer to a string
          const messageValue = message.value.toString();
          
          console.log(`\n--- New Message Received ---`);
          console.log(`Topic: ${topic}`);
          console.log(`Partition: ${partition}`);
          console.log(`Payload: ${messageValue}`);
        } catch (parseError) {
          console.error("Error parsing the received message:", parseError);
        }
      },
    });

  } catch (error) {
    // 5. Handle and log errors
    console.error("Failed to consume messages:", error);
  }
}

// Execute the consumer function
runConsumer();
