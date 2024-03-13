#!/usr/bin/node

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    // res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.json({ redis: true, db: true });
      res.end();
    }
  }

  static getStats(req, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()]).then(
      ([users, files]) => {
        res.status(200).json({ users, files });
      },
    );
  }
}

export default AppController;
