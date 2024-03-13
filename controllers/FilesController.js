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

    parentId = parentId ? ObjectId(parentId) : 0;
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

  /**
   * Get a file or folder by id
   * @static
   * @async
   * @function
   * @params {request} req - express request object
   * @params {response} res - express response object
   */
  static async getShow(req, res) {
    const { user } = req;
    const { id } = req.params;

    const file = await dbClient.client.db().collection('files').findOne({ userId: user._id, _id: ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const {
      _id, userId, name, type, isPublic, parentId,
    } = file;
    return res.status(200).json({
      id: _id.toString(), userId, name, type, isPublic, parentId,
    });
  }

  /**
   * Get files for a paticular user based on a parentId
   * @static
   * @params
   * @function - get files for a particular user based on parentId
   * @params {request} req - express request object
   * @params {response} res - express response object
   */
  static async getIndex(req, res) {
    const { user } = req;

    const { page = 0 } = req.query;
    let { parentId = 0 } = req.query;
    parentId = parentId ? ObjectId(parentId) : parentId;
    const pageLimit = 20;
    let filter = {};
    if (parentId) {
      filter = { parentId, userId: user._id };
    } else {
      filter = { userId: user._id };
    }
    const files = await dbClient.client.db().collection('files').aggregate(
      [
        { $match: filter },
        { $addFields: { id: '$_id' } },
        { $project: { _id: 0 } },
        { $skip: page * pageLimit },
        { $limit: pageLimit },
      ],
    ).toArray();
    return res.status(200).json(files);
  }
}
