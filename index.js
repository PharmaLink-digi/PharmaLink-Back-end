import express from 'express';
import cors from 'cors'
import router from './modules/client/client.router.js';
const app = express();

app.listen(5000, () => {
  console.log("welcome to the server");
});

app.use(express.json())
app.use(cors())
app.use(router)
