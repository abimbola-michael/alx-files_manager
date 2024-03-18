#!/usr/bin/node

import sha1 from 'sha1';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

chai.use(chaiHttp);

describe('test UsersController', () => {
  let requester;

  before(async function () {
    this.timeout(10000);
    await dbClient.client.db().collection('files').deleteMany({});
    await dbClient.client.db().collection('users').deleteMany({});
    redisClient.client.flushdb();
  })

  beforeEach(() => {
    requester = chai.request(app);
  })

  describe('/users', () => {
    beforeEach(async () => {
      await dbClient.client.db().collection('users').deleteMany({});
    })
    it('post a new user to the db', () => {
      requester
        .post('/users')
        .send({ email: 'somzzy@gmail.com', password: sha1('somzzy') })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body).to.have.keys(['email', 'id']);
        })
    })

    it('post a user without an email', () => {
      requester
        .post('/users')
        .send({ password: 'somzzy1234' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Missing email' })
        })
    })

    it('post  a user without a password', () => {
      requester
        .post('/users')
        .send({ email: 'somzzy@gmail.com'})
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Missing password' })
        })
    })

    it('post a user that with email already in db', async () => {
      await dbClient.client.db().collection('users').insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });

      requester
        .post('/users')
        .send({ email: 'somzzy@gmail.com', password: 'somzzy1' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.eqls({ error: 'Already exist' });
        })
    })
  })

  describe('/user/me', () => {
    beforeEach(async () => {
      requester = chai.request(app).keepOpen();
      await dbClient.client.db().collection('users').insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });
    })

    afterEach(async () => {
      redisClient.client.flushdb();
    })

    it('get current user by token', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;
          requester
            .get('/users/me')
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.have.keys(['email', 'id'])
              requester.close()
              done()
            })
        })
    })
  })
})
