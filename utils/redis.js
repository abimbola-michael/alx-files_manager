#!/usr/bin/node

import { createClient } from 'redis';
import utils from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('Redis client error', err));
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await utils.promisify(this.client.GET).bind(this.client)(key);
    return value;
  }

  async set(key, value, duration) {
    this.client.SETEX(key, duration, value);
  }

  async del(key) {
    this.client.DEL(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
