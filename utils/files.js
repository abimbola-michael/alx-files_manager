#!/usr/bin/node
import fs, { promises } from 'fs';
import utils from 'util';
import { v4 as uuidv4 } from 'uuid';

const FolderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
let folderExist = false;

/**
 * @functin wDataToFile - create a directory is not exist
 * @async
 * @params {string} path - path to directory to create
 * @return {Promise<string|null>} - name of file written or null
 */
export default async function wDataToFile(data) {
  try {
    if (!folderExist) {
      const exist = fs.existsSync(FolderPath);
      if (!exist) {
        const dirCreated = await utils
          .promisify(fs.mkdir).bind(fs)(FolderPath, { recursive: true });

        if (dirCreated) {
          folderExist = true;
        }
      }
    }
    const fileName = `${FolderPath}/${uuidv4()}`;
    const file = await promises.open(fileName, 'w');

    await file.writeFile(Buffer.from(data, 'base64'));
    await file.close();
    return fileName;
  } catch (err) {
    console.error(err);
    return null;
  }
}
