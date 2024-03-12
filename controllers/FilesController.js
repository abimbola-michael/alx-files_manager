#!/usr/bin/node

import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import wDataToFile from '../utils/files';

const FileType = ['folder', 'image', 'file'];

/**
 * Defines controller for files endpoint
 */
export default class FileController {
  /**
   * upload a file to db
   */
  static async postUpload(req, res) {
    const { user } = req;
    let { parentId, isPublic } = req.body;
    const { name, type, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !FileType.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent not a folder' });
      }
    }

    parentId = parentId || 0;
    isPublic = isPublic || false;
    if (type === 'folder') {
      let folder = await dbClient.client.db().collection('files').insertOne({
        name, type, parentId, isPublic, userId: user._id,
      });
      folder = {
        name, type, parentId, isPublic, userId: user._id, id: folder.insertedId.toString(),
      };
      return res.status(201).json(folder);
    }

    const localPath = await wDataToFile(data);
    const newFile = {
      userId: user._id, name, type, isPublic, parentId, localPath,
    };

    const fileInserted = await dbClient.client.db().collection('files').insertOne(newFile);
    return res.status(201).json({
      userId: user._id, name, isPublic, id: fileInserted.insertedId.toString(), parentId, type,
    });
  }
}
