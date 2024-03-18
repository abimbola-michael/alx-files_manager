#!/usr/bin/node

import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

/**
 * get user from request
 * @params {request} req - express request object
 */
export async function getUserBasicAuth(req) {
  try {
    const auth = req.get('Authorization');

    if (auth.split(' ')[0].toLowerCase() !== 'basic') {
      return null;
    }

    let emailPassword = Buffer.from(auth.split(' ')[1], 'base64').toString('utf-8');
    emailPassword = emailPassword.split(':');
    const email = emailPassword[0];
    const password = sha1(emailPassword[1]);
    if (!email || !password) {
      return null;
    }

    const user = await dbClient.client.db().collection('users').findOne({ email, password });

    if (!user) {
      return null;
    }
    return user;
  } catch (err) {
    return null;
  }
}

export async function getUserFromToken(req) {
  const token = req.get('X-Token');
  if (!token) {
    return null;
  }

  const tokenKey = `auth_${token}`;
  const userId = await redisClient.get(tokenKey);
  if (!userId) {
    return null;
  }

  const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return null;
  }

  return [user, tokenKey];
}
