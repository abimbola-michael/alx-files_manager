#!/usr/bin/node

import express from 'express';
// import indexRoute from './routes';
import router from './routes';

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
// indexRoute(app);
app.use('/', router);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
