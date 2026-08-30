import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import authRouter from './auth.js';
import demoRouter from './demo.js';
import jobsRouter from './jobs.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/demo', demoRouter);
app.use('/api/jobs', jobsRouter);

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.statusCode || error.status || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
