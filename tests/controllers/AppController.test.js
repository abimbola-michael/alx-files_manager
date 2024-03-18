#!/usr/bin/node

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

chai.use(chaiHttp);

describe('test AppController', () => {
  let requester;
  before(async function () {
    this.timeout(10000);
    await dbClient.client.db().collection('files').deleteMany({});
    await dbClient.client.db().collection('users').deleteMany({});
    await redisClient.client.flushdb();
  })

  beforeEach(() => {
    requester = chai.request(app);
  })

  describe('/status', () => {
    it('Test both redisClient and  dbClient are connected', () => {
      requester
        .get('/status')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.json;
          expect(res).to.have.status(200);
          expect(res.body).to.eqls({redis: true, db: true});
        })
    })


  })

  describe('/stats', () => {
    it('Test stats endpoint when db is empty', () => {
      requester
        .get('/stats')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.json;
          expect(res).to.have.status(200);
          expect(res.body).to.eqls({ files: 0, users: 0 });
        })
    })
    it('Test stats endpoint with both users and files in db', async () => {
      await dbClient.client.db().collection('files').insertOne({ name: 'myText.txt', isPublic: true });
      await dbClient.client.db().collection('users').insertOne({ name: 'somzzy', email: 'somzzy@gmail.com' });

      requester
        .get('/stats')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.json;
          expect(res).to.have.status(200);
          expect(res.body).to.eqls({ files: 1, users: 1 })
        })
    })
  })
})
