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

  afterEach(async function () {
    await dbClient.client.db().collection('files').deleteMany({});
    await dbClient.client.db().collection('users').deleteMany({});
    redisClient.client.flushdb();
  })
  describe('POST/files', () => {
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

  describe('GET/files', async () => {
    beforeEach(async () => {
      const user = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });
      for (let i = 0; i < 40; i++) {
        const insertFile = await dbClient
          .client
          .db()
          .collection('files')
          .insertOne({
            type: 'file', name: `name${i}.txt`, data: 'dGVzdCBjb250ZW50', userId: user.insertedId, parentId: 0, isPublic: true,
          });
      }
    })

    afterEach(async () => {
      await dbClient.client.db().collection('users').deleteMany({});
      await dbClient.client.db().collection('files').deleteMany({});
      redisClient.client.flushdb()
    })

    it('Get all file by a user paginated', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;
          requester
            .get('/files')
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(200);
              expect(res.body).to.be.a('Array');
              expect(res.body).to.have.length(20);
              requester.close()
              done();
            })
        })
    })
  })

  describe('PUT/files/:id/publish', () => {
    let fileId;

    beforeEach(async () => {
      const user = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });

      const file = await dbClient
        .client
        .db()
        .collection('files')
        .insertOne({ isPublic: false, type: 'file', parentId: 0, name: 'name.txt', isPublic: false, userId: user.insertedId })
      fileId = file.insertedId.toString();
    })

    afterEach(async () => {
      await dbClient.client.db().collection('users').deleteMany({});
      await dbClient.client.db().collection('files').deleteMany({});
      redisClient.client.flushdb()
    })

    it('publish a file', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .put(`/files/${fileId}/publish`)
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(200);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.includes({ isPublic: true });
              requester.close();
              done();
            })
        })
    })

    it("publish a file that doesn't exist", function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .put('/files/65f8c0e0d01fa83071776785/publish')
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(404);
              expect(res.body).to.be.a('object');
              expect(res.body).to.eqls({ error: 'Not found' });
              requester.close();
              done();
            })
        })
    })
  })
  describe('PUT/files/:id/unpublish', () => {
    let fileId;

    beforeEach(async () => {
      const user = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });

      const file = await dbClient
        .client
        .db()
        .collection('files')
        .insertOne({ isPublic: false, type: 'file', parentId: 0, name: 'name.txt', isPublic: false, userId: user.insertedId })
      fileId = file.insertedId.toString();
    })

    afterEach(async () => {
      await dbClient.client.db().collection('users').deleteMany({});
      await dbClient.client.db().collection('files').deleteMany({});
      redisClient.client.flushdb()
    })

    it('unpublish a file', function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .put(`/files/${fileId}/unpublish`)
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(200);
              expect(res.body).to.be.a('object');
              expect(res.body).to.deep.includes({ isPublic: false });
              requester.close();
              done();
            })
        })
    })

    it("unpublish a file that doesn't exist", function (done) {
      requester
        .get('/connect')
        .set('Authorization', 'Basic c29tenp5QGdtYWlsLmNvbTpzb216enk=')
        .end(async (err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          const token = res.body.token;

          requester
            .put('/files/65f8c0e0d01fa83071776785/publish')
            .set('X-Token', token)
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(404);
              expect(res.body).to.be.a('object');
              expect(res.body).to.eqls({ error: 'Not found' });
              requester.close();
              done();
            })
        })
    })
  })

  describe('GET/files/:id/data', () => {
    beforeEach(async () => {
      await dbClient
        .client
        .db()
        .collection('users')
        .insertOne({ email: 'somzzy@gmail.com', password: sha1('somzzy') });
    })

    afterEach(async () => {
      await dbClient.client.db().collection('users').deleteMany({});
      await dbClient.client.db().collection('files').deleteMany({});
      redisClient.client.flushdb()
    })
    it('Get a private file', function (done) {
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
            .send({ name: 'test.txt', type: 'file', data: 'SGVsbG8gVGVzdCEgKCpfKik=', isPublic: false })
            .end((err, res) => {
              expect(err).to.be.null;
              expect(res).to.have.status(201);
              expect(res.body).to.be.a('object');
              const fileId = res.body.id;

              requester
                .get(`/files/${fileId}/data`)
                .set('X-Token', token)
                .end((err, res) => {
                  expect(err).to.be.null;
                  expect(res).to.have.status(200);
                  expect(res).to.have.header('Content-Type', /text\/plain/);
                  requester.close();
                  done();
                })
            })
        })
    })
  })
})
