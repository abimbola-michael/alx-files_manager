#!/usr/bin/node
import sha1 from 'sha1';
import dbClient from '../utils/db';
import Queue from 'bull';

const userQueue = new Queue('userQueue');

class UsersController {
  /**
   * registers a new user
   * @params {request} req express request object
   * @params {response} res express response object
   * @return {response} res express response object
   */
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
    try {
      const user = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne({ email: req.body.email, password: sha1(req.body.password) });
      userQueue.add({ userId: user.insertedId.toString() })
      return res.status(201).json({ email: user.ops[0].email, id: user.insertedId });
    } catch (err) {
      console.error('Create User Error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get user information
   * @params {request} req express request object
   * @params {response} res express response object
   * @returns {response} express response object
   */
  static async getMe(req, res) {
    const { user } = req;

    return res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}

export default UsersController;
