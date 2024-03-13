#!/usr/bin/node

import { createClient } from 'redis';
import utils, { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('Redis client error', err));
    this.connected = false;
    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    const value = await utils.promisify(this.client.GET).bind(this.client)(key);
    return value;
  }

  async set(key, value, duration) {
    // this.client.SETEX(key, duration, value);
    const setAsync = promisify(this.client.setex).bind(this.client);
    await setAsync(key, duration, value);
  }

  async del(key) {
    // this.client.DEL(key);
    const delAsync = promisify(this.client.del).bind(this.client);
    await delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
