#!/usr/bin/node

import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import { authConnect, xAuthConnect, xUserGet } from '../middleware/authentication';

const router = Router();
// function indexRoute(app) {
//   app.get('/status', AppController.getStatus);
//   app.get('/stats', AppController.getStats);
//   app.post('/users', UsersController.postNew);
//   app.get('/users/me', xAuthConnect, UsersController.getMe);
//   app.get('/connect', authConnect, AuthController.getConnect);
//   app.get('/disconnect', xAuthConnect, AuthController.getDisconnect);
//   app.post('/files', xAuthConnect, FilesController.postUpload);
//   app.get('/files/:id', xAuthConnect, FilesController.getShow);
//   app.get('/files', xAuthConnect, FilesController.getIndex);
//   app.put('/files/:id/publish', xAuthConnect, FilesController.putPublish);
//   app.put('/files/:id/unPublish', xAuthConnect, FilesController.putUnPublish);
// }
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/users/me', xAuthConnect, UsersController.getMe);
router.get('/connect', authConnect, AuthController.getConnect);
router.get('/disconnect', xAuthConnect, AuthController.getDisconnect);
router.post('/files', xAuthConnect, FilesController.postUpload);
router.get('/files/:id', xAuthConnect, FilesController.getShow);
router.get('/files', xAuthConnect, FilesController.getIndex);
router.put('/files/:id/publish', xAuthConnect, FilesController.putPublish);
router.put('/files/:id/unPublish', xAuthConnect, FilesController.putUnPublish);
router.get('/files/:id/data', xUserGet, FilesController.getFile);

// export default indexRoute;
export default router;
