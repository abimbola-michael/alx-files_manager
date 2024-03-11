#!/usr/bin/node

import { ObjectId } from 'mongodb';
import { uuid } from 'uuidv4';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  /**
   * Uses basic authentication to authenticate a user  and
   * generate token with uuidv4
   * @params {request} req express request object
   * @params {response} res express response object
   * @return {response} The response sent to user from server
   */
  static async getConnect(req, res) {
    if (!req.get('Authorization')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let authHeader = req.get('Authorization');
    authHeader = authHeader.split(' ');
    if (authHeader[0].toLowerCase() !== 'basic') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authStr = Buffer.from(authHeader[1], 'base64').toString('utf-8');
    const email = authStr.split(':')[0];
    const password = sha1(authStr.split(':')[1]);
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.db().collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuid();
    const tokenKey = `auth_${token}`;

    await redisClient.set(tokenKey, user._id, 24 * 60 * 60);
    return res.status(200).json({ token });
  }

  /**
   * unauthenticate a user
   * @params {request} req express request object
   * @params {response} res express response object
   * @return {response} express response object
   */
  static async getDisconnect(req, res) {
    if (!req.get('X-Token')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.get('X-Token');
    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(tokenKey);
    return res.status(204).json({});
  }
}

export default AuthController;
