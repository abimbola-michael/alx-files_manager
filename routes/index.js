#!/usr/bin/node

import AppController from '../controllers/AppController';

function indexRoute(app) {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
}

export default indexRoute;
