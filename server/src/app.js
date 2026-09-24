import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import listingRoutes from './routes/listings.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  // A malformed ObjectId or a schema violation that slipped past Joi is the
  // client's mistake, so it's a 400 — reporting it as a 500 blames the server
  // for a bad request body.
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

export default app;
