#!/usr/bin/node

import Queue from 'bull';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import utils from 'util';
import imageThumbnail from 'image-thumbnail';

import dbClient from './utils/db';
import wDataToFile from './utils/files';

const queue = new Queue('Generate Thumbnail');
const realPath = utils.promisify(fs.realpath).bind(fs);

queue.process(async (job, done) => {
  job.progress(0);

  if (!job.data.fileId) {
    done(new Error('Missing fileId'));
  }
  if (!job.data.userId) {
    done(new Error('Missing userId'));
  }

  const { userId, fileId } = job.data;
  const file = await dbClient.client.db().collection('files').findOne({ userId: ObjectId(userId), _id: ObjectId(fileId) });

  if (!file) {
    done(new Error('File not found'));
  }
  try {
    const path = await realPath(file.localPath);

    let imageThumbNail = await imageThumbnail(path, { width: 500, responseType: 'base64' });
    await wDataToFile(imageThumbNail, `${path}_500`);
    job.progress((1 / 3) * 100);

    imageThumbNail = await imageThumbnail(path, { width: 250, responseType: 'base64' });
    await wDataToFile(imageThumbNail, `${path}_250`);
    job.progress((2 / 3) * 100);

    imageThumbNail = await imageThumbnail(path, { width: 100, responseType: 'base64' });
    await wDataToFile(imageThumbNail, `${path}_100`);
    job.progress((3 / 3) * 100);
    done();
  } catch (err) {
    done(err);
  }
});

const userQueue = new Queue('userQueue');
userQueue.process(async (job, done) => {
  job.progress(0);

  if (!job.data.userId) {
    return done(new Error('Missing userId'))
  }

  const user = await dbClient
    .client
    .db()
    .collection('users')
    .findOne({ _id: ObjectId(job.data.userId) });
  if (!user) {
    return done(new Error('User not found'))
  }

  job.progress(50);
  console.log(`Welcome ${user.email}`);
  job.progress(100);
  done();
})
