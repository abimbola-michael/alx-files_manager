#!/usr/bin/node
import { v4 as uuidv4 } from 'uuid';
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
    const { user } = req;

    const token = uuidv4();
    const tokenKey = `auth_${token}`;

    await redisClient.set(tokenKey, user._id.toString(), 24 * 60 * 60);
    return res.status(200).json({ token });
  }

  /**
   * unauthenticate a user
   * @params {request} req express request object
   * @params {response} res express response object
   * @return {response} express response object
   */
  static async getDisconnect(req, res) {
    const { tokenKey } = req;

    await redisClient.del(tokenKey);
    return res.status(204).json({});
  }
}

export default AuthController;
