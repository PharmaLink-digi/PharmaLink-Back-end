import express from 'express';
const app = express();

app.listen(5000, () => {
  console.log("welcome to the server");
});

app.use(express.json())
app.use(cors())
