#!/usr/bin/node

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    res.status(200).json({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
  }
}

export default AppController;
