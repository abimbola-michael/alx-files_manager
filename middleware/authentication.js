#!/usr/bin/node

import { getUserBasicAuth, getUserFromToken } from '../utils/auth';

/**
 *Register a user to the application
 * @params {request} req - express request object
 * @params {response} res - express request object
 * @params {nextFunction} next - next function
 */
export async function authConnect(req, res, next) {
  const user = await getUserBasicAuth(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}

/**
 * Authenticate a user with api token
 * @params {request} req - express request object
 * @params {response} res - express response object
 * @params {nextFunction} next - express response object
 */
export async function xAuthConnect(req, res, next) {
  const tokenAndUser = await getUserFromToken(req);

  if (!tokenAndUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const [user, tokenKey] = tokenAndUser;
  req.user = user;
  req.tokenKey = tokenKey;
  return next();
}
