//commited
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
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

export default app;

// the above code is the main application file for an Express.js server. It sets up middleware for logging, CORS, and JSON parsing, defines routes for listings and users, and includes error handling for not found routes and general server errors.
