#!/usr/bin/node

import express from 'express';
import indexRoute from './routes';

const PORT = process.env.PORT || 5000;
const app = express();

indexRoute(app);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
