import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import userRoutes from './routes/users.js';
import listingRoutes from './routes/listings.js';

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

export default app;