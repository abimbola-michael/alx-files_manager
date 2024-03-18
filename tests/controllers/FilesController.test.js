#!/usr/bin/node

import sha1 from 'sha1';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

chai.use(chaiHttp);

describe('test FilesController', () => {
  let requester;

  before(async function () {
    this.timeout(10000);
    await dbClient.client.db().collection('files').deleteMany({});
    await dbClient.client.db().collection('users').deleteMany({});
    redisClient.client.flushdb();
  })

  beforeEach(() => {
    requester = chai.request(app).keepOpen();
  })

  describe('/files', () => {
    beforeEach(async () => {
      await dbClient.client.db().collection('users').insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });
    })

    afterEach(() => {
      redisClient.client.flushdb()
    })

    it('upload a file', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({type: 'file', data: 'V2UgYXJlIHRlc3Rpbmc=', name: 'testing.txt' })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(201);
              expect(res.body).to.have.keys(['id', 'isPublic', 'parentId', 'name', 'type', 'userId']);
              requester.close();
              done();
            })
        })
    })

    it('upload a folder', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'folder', 'name': 'images', isPublic: true })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(201);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.includes({ name: 'images', type: 'folder', isPublic: true, parentId: 0 })
              requester.close();
              done();
            })
        })
    })

    it('upload a file without data', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'file', isPublic: true, name: 'test.txt' })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(400);
              expect(res.body).to.be.a('object');
              expect(res.body).to.eqls({ error: 'Missing data' })
              requester.close();
              done();
            })
        })
    })
    it('upload a file without type', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ isPublic: true, name: 'test.txt', data: 'V2UgYXJlIHRlc3Rpbmc=' })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(400);
              expect(res.body).to.be.a('object');
              expect(res.body).to.eqls({ error: 'Missing type' })
              requester.close();
              done();
            })
        })
    })

    it('upload a file without name', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'file', isPublic: true, data: 'V2UgYXJlIHRlc3Rpbmc=' })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(400);
              expect(res.body).to.be.a('object');
              expect(res.body).to.eqls({ error: 'Missing name' })
              requester.close();
              done();
            })
        })
    })

    it('upload a file to a parent folder', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'folder', 'name': 'images', isPublic: true })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(201);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.includes({ name: 'images', type: 'folder', isPublic: true, parentId: 0 })
              const parentId = res.body.id;

              requester
                .post('/files')
                .set('X-Token', token)
                .send({ type: 'file', 'name': 'test.txt', isPublic: true, data: 'V2UgYXJlIHRlc3Rpbmc=', parentId })
                .end((err, res) => {
                  expect(err).to.be.null;
                  expect(res).to.have.status(201);
                  expect(res.body).to.be.a('object');
                  expect(res.body).to.deep.include({ type: 'file', name: 'test.txt', isPublic: true, parentId })
                  requester.close();
                  done();
                })
            })
        })
    })

    it("upload a file to a parent folder that doesn't exist", function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;
          const parentId = '65f846880d400c189917af89';

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'file', 'name': 'test.txt', isPublic: true, data: 'V2UgYXJlIHRlc3Rpbmc=', parentId })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(400);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.include({ error: 'Parent not found' })
              requester.close();
              done();
            })
        })
    })
  })

  describe('/files/:id', () => {
    beforeEach(async () => {
      await dbClient.client.db().collection('users').insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });
    })

    afterEach(() => {
      redisClient.client.flushdb()
    })

    it('retrieve private file information for a user', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .post('/files')
            .set('X-Token', token)
            .send({ type: 'file', data: 'V2UgYXJlIHRlc3Rpbmc=', name: 'testing.txt', isPublic: false })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(201);
              expect(res.body).to.have.keys(['id', 'isPublic', 'parentId', 'name', 'type', 'userId']);
              const fileId = res.body.id;

              requester
                .get(`/files/${fileId}`)
                .set('X-Token', token)
                .end((err, res) => {
                  expect(err).to.be.null;
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.a('object');
                  expect(res.body).to.deep.includes({name: 'testing.txt', isPublic: false, type: 'file'});
                  requester.close();
                  done();
                })
            })
        })
    })

    it('retrieve a file not connected to user', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .get('/files/65f846880d400c189917af89')
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(404);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.includes({ error: 'Not found' });
              requester.close();
              done();
            })
        })
    })
  })
})
