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
    throw new Error('Missing fileId');
  }
  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  const { userId, fileId } = job.data;
  const file = dbClient.client.db().collection('file').findOne({ userId, _id: ObjectId(fileId) });

  if (!file) {
    throw new Error('File not found');
  }
  const path = realPath(file.localPath);
  const image = await fs.promises.open(path);
  const imageBuffer = await image.readFile();
  let imageThumbNail = await imageThumbnail(imageBuffer, { width: 500, responseType: 'base64' });
  await wDataToFile(`${path}_500`, imageThumbNail);
  job.progress((1 / 3) * 100);

  imageThumbNail = await imageThumbnail(imageBuffer, { width: 250, responseType: 'base64' });
  await wDataToFile(`${path}_250`, imageThumbNail);
  job.progress((2 / 3) * 100);

  imageThumbNail = await imageThumbnail(imageBuffer, { width: 100, responseType: 'base64' });
  await wDataToFile(`${path}_100`, imageThumbNail);
  job.progress((3 / 3) * 100);
  done();
});
