import express from 'express';
import cors from 'cors'
import router from './modules/client/client.routes.js';
import { Kafka } from 'kafkajs'
import { pharmaciesDB } from './Database/DbConnection.js';
import clientRouter from './modules/client/client.routes.js';
const app = express();


app.listen(3000,()=>{

  
  console.log("server running now");
  
})



// Kafka config
// const kafka = new Kafka({
//   clientId: "express-app",
//   brokers: ["localhost:9092"], // Kafka broker
// });

// const producer = kafka.producer();

// // Connect producer once at startup
// async function start() {
//   await producer.connect();
//   console.log("Kafka connected");
  
//   app.listen(3000, () => {
//     console.log("Server running on port 3000");
//   });
// }

// start().catch(console.error);


// // Route to send message to Kafka
// app.post("/send", async (req, res) => {
//   try {
//     const message = req.body.message;

//     await producer.send({
//       topic: "test-topic",
//       messages: [
//         { value: message }
//       ],
//     });

//     res.json({ success: true, message: "Sent to Kafka" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });


// const consumer = kafka.consumer({ groupId: "my-group" });

// async function consumeMessages() {
//   await consumer.connect();
//   await consumer.subscribe({ topic: "test-topic" });

//   await consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       console.log(message.value.toString());
//     },
//   });
// }

// consumeMessages();


app.use(express.json())
app.use(cors())
app.use(clientRouter)
