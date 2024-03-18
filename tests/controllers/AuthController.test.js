#!/usr/bin/node

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';
import sha1 from 'sha1'

chai.use(chaiHttp);

describe('test authController', () => {
  let requester;
  before(async function () {
    this.timeout(10000);
    await dbClient.client.db().collection('files').deleteMany({});
    await dbClient.client.db().collection('users').deleteMany({});
    redisClient.client.flushdb();
  })

  beforeEach(async () => {
    requester = chai.request(app);
    await dbClient.client.db().collection('users').insertOne({email: 'somzzy@gmail.com', password: sha1('somzzy')})
  })

  afterEach(async () => {
    await dbClient.client.db().collection('users').deleteMany({});
    redisClient.client.flushdb();
  })

  describe('/connect', () => {
    it('with email and password', () => {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.keys(['token']);
        })
    })

    it('without authorization token', () => {
      requester
        .get('/connect')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(401);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Unauthorized' });
        })
    })

    it('with wrong email and password encoded in token', () => {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5MUBnbWFpbC5jb206c29tenp5MQ==')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(401);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Unauthorized' });
        })
    })

    it('with wrong base64 token', () => {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5MUBnbWFpbC5jb21zb216enkx')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(401);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Unauthorized' })
        })
    })
  })

  describe('/disconnect', () => {
    beforeEach(async function () {
      requester = chai.request(app).keepOpen();
    })

    it('disconnect with token', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          const token = res.body.token;
          expect(await redisClient.get(`auth_${token}`)).to.be.ok;
          requester
            .get('/disconnect')
            .set('X-Token', token)
            .end(async (err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(204);
              expect(res.body).to.eqls({});
              expect(await redisClient.get(`auth_${token}`)).to.be.null;
              requester.close()
              done();
            })
        })
    })

    it('disconnect with wrong token', function (done){
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          const token = res.body.token + '1adf';
          expect(await redisClient.get(`auth_${token}`)).to.be.null;
          requester
            .get('/disconnect')
            .set('X-Token', token)
            .end(async (err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(401);
              expect(res.body).to.eqls({error: 'Unauthorized'});
              expect(await redisClient.get(`auth_${token}`)).to.be.null;
              requester.close()
              done();
            })
        })
    })
  })
})
