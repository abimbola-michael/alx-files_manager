#!/usr/bin/node

import chai from 'chai';
import dbClient from '../../utils/db';
const expect = chai.expect;


describe('DBClient', () => {
  before(function () {
    this.timeout(10000);
  })

  beforeEach(async () => {
    Promise.all([dbClient.client.db().collection('users').deleteMany(), dbClient.client.db().collection('files').deleteMany()]);
  })

  describe('#nbFiles', () => {
    it('test dbClient with nothing in db', async () => {
      expect(await dbClient.nbFiles()).to.equal(0);
    });

    it('test dbClient with one object in db', async () => {
      await dbClient.client.db().collection('files').insertOne({name: 'text.txt', type: 'file'});
      expect(await dbClient.nbFiles()).to.equal(1);
    })

    it('test dbClient with two object  added and one deleted', async () => {
      const insertFileOne = await dbClient.client.db().collection('files').insertOne({name: 'text.txt', type: 'file'});
      await dbClient.client.db().collection('files').insertOne({name: 'dbText.txt', type: 'file'});

      await dbClient.client.db().collection('files').deleteOne({ _id: insertFileOne.insertedId });
      expect(await dbClient.nbFiles()).to.equal(1);
    })
  })

 describe('#nbUsers', () => {
    it('test dbClient with nothing in db', async () => {
      expect(await dbClient.nbUsers()).to.equal(0);
    });

    it('test dbClient with one object in db', async () => {
      await dbClient.client.db().collection('users').insertOne({ name: 'somzzy', email: 'somzzy@gmail.com' });
      expect(await dbClient.nbUsers()).to.equal(1);
    })

    it('test dbClient with two object  added and one deleted', async () => {
      const insertFileOne = await dbClient.client.db().collection('users').insertOne({name: 'somzzy1', email: 'somzzy1@gmail.com'});
      await dbClient.client.db().collection('users').insertOne({ name: 'somzzy2', email: 'somzzy2@gmail.com' });

      await dbClient.client.db().collection('users').deleteOne({ _id: insertFileOne.insertedId });
      expect(await dbClient.nbUsers()).to.equal(1);
    })
  })
});
