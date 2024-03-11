#!/usr/bin/node

import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import { authConnect, xAuthConnect } from '../middleware/authentication';

function indexRoute(app) {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', UsersController.postNew);
  app.get('/users/me', xAuthConnect, UsersController.getMe);
  app.get('/connect', authConnect, AuthController.getConnect);
  app.get('/disconnect', xAuthConnect, AuthController.getDisconnect);
}

export default indexRoute;
