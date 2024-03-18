#!/usr/bin/node

import utils from 'util';
import redisClient from '../../utils/redis';
import { expect } from 'chai';

describe('test redisClient', () => {
  before(async () => {
    await redisClient.client.flushdb()
  })

  describe('#get', () => {
    it('test key not  in db', async () => {
      expect(await redisClient.get('not_in_db')).to.be.null;
    })

    it('test with key in db', async () => {
      redisClient.client.set('in_db', "Not Null");
      expect(await redisClient.get('in_db')).to.equal('Not Null');
    })
  })

  describe('#set', () => {
    it('set a key', async function () {
      redisClient.set('not_in_db', 'Not Null', 1000);

      expect(await redisClient.client.exists('not_in_db')).to.be.true;
      expect(await utils.promisify(redisClient.client.ttl).bind(redisClient.client)('not_in_db')).to.equal(1000);
    })
  })

  describe('#del', () => {
    redisClient.client.SET('new_key', 'my_key_value');

    it('delete a key', async () => {
      redisClient.del('new_key');
      expect(await redisClient.get('new_key')).to.be.null;
    })
  })
})
