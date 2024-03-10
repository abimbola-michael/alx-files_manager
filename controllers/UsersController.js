#!/usr/bin/node

import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    if (!req.body || !req.body.email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!req.body.password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    if (await dbClient.client.db().collection('users').findOne({ email: req.body.email })) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const user = await dbClient
      .client
      .db()
      .collection('users')
      .insertOne({ email: req.body.email, password: sha1(req.body.password) });
    return res.status(201).json({ email: user.ops[0].email, id: user.insertedId });
  }
}

export default UsersController;
