#!/usr/bin/node

import Queue from 'bull';

export default function addJobToQueue(job) {
  const ImageQueue = new Queue('Generate Thumbnail');

  ImageQueue.add(job);
}
