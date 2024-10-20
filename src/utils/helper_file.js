import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import dayjs from 'dayjs'
import sharp from 'sharp'
import path from 'path'

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE * 1024 * 1024; // 10MB in bytes

export function createFile(filename, content, callback) {
  fs.writeFile(filename, content, (err) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

export function checkFolderExists(path, callback) {
  fs.access(path, fs.constants.F_OK, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(null, false) // File does not exist
      } else {
        callback(err)
      }
    } else {
      callback(null, true) // File exists
    }
  })
}

export function removeFile(filename, callback) {
  fs.unlink(filename, (err) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

export async function isValidImage(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  if (!type) {
    return false;
  }

  const validImageTypes = ["jpg", "jpeg", "png"]; // Add other format if needed
  return validImageTypes.includes(type.ext);
}

export function generateImageFilename() {
  let ran = Math.floor((Math.random() * 300))
  let imageName = dayjs().format("YYYYMMDD-HHmmss") + "-" + ran
  return imageName
}

export function checkFileSize(base64Image) {
  var base64Data = base64Image.split(';base64,').pop()
  let dataBuffer = Buffer.from(base64Data, 'base64')

  // Check file size
  // console.log('dataBuffer.length: ', dataBuffer.length)
  if (dataBuffer.length > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the maximum limit of 10MB")
  }
  return true
}

export function checkBase64FileSize(dataBase64) { // check filesize in Kilobytes
  let sizeInKiloBytes = 3 * dataBase64.length / 4 / 1000
  return sizeInKiloBytes.toFixed(2)
}

export function toBase64(filePath) {
  const img = fs.readFileSync(filePath)
  const base64String = Buffer.from(img).toString('base64')
  const withPrefix = 'data:image/png;base64,' + base64String

  return withPrefix
}

/*
* ASYNC Function
*/
export async function uploadImage(FOLDER_PATH, base64Image, optionParams = {}) {
  let base64Data = base64Image.split(';base64,').pop();
  let originalFormat = base64Image.substring(base64Image.indexOf('/') + 1, base64Image.indexOf(';'));
  let dataBuffer = Buffer.from(base64Data, 'base64');

  const originalFilename = generateImageFilename();
  const originalFilePath = `${FOLDER_PATH}/${originalFilename}.${originalFormat}`;
  const compressFilePath = `${FOLDER_PATH}/compress/${originalFilename}.${originalFormat}`; // Keep the original format for compressed file

  // Check if the image is valid
  if (!isValidImage(dataBuffer)) {
    throw new Error("Invalid image format");
  }

  // Check file size
  if (dataBuffer.length > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the maximum limit of 10MB");
  }

  // Save the original image
  await ensureFolderExistsAsync(FOLDER_PATH);
  await writeFileAsync(originalFilePath, dataBuffer);

  // Image processing
  let image = await sharp(dataBuffer);
  let compressImageBuffer = image.clone();
  let metadata = await compressImageBuffer.metadata();

  // Check if the image largest side is greater than 1920px
  if (metadata.width > metadata.height && metadata.width > 1920) {
    // Resize the image to 1200px
    image = image.resize({ width: 1920 });
    compressImageBuffer = image.clone();
  } else if (metadata.height > metadata.width && metadata.height > 1920) {
    // Resize the image to 1200px
    image = image.resize({ height: 1920 });
    compressImageBuffer = image.clone();
  }

  // Check if compress option is provided
  if (optionParams.compress) {
    let compressOption = optionParams.compress;

    // Process and save compress the image
    let compressPath = `${FOLDER_PATH}/compress`;
    await ensureFolderExistsAsync(compressPath);

    // Apply compression options conditionally based on the image format
    compressImageBuffer = await compressImageBuffer
      .toFormat(originalFormat, {
        quality: compressOption.quality,
        progressive: true,
        ...(originalFormat === 'jpeg' || originalFormat === 'jpg' ? { mozjpeg: true } : {}) // Use mozjpeg only for JPEGs
      })
      .toBuffer();

    // Save the compressed image
    await writeFileAsync(compressFilePath, compressImageBuffer);
  }

  // return filename with convert format to force the image to be in the same format
  return originalFilename + '.' + originalFormat;
}

export async function compressImage(dirImages, filename, compressOption) {
  let dataBuffer = await readFileAsync(`${dirImages}/${filename}`);
  let format = path.extname(`${dirImages}/${filename}`).toLowerCase().replaceAll('.', '');

  let image = await sharp(dataBuffer);
  let compressImageBuffer = image.clone();
  let metadata = await compressImageBuffer.metadata();

  // Check if the image largest side is greater than 1920px
  if (metadata.width > metadata.height && metadata.width > 1920) {
    // Resize the image to 1200px
    image = image.resize({ width: 1920 });
    compressImageBuffer = image.clone();
  } else if (metadata.height > metadata.width && metadata.height > 1920) {
    // Resize the image to 1200px
    image = image.resize({ height: 1920 });
    compressImageBuffer = image.clone();
  }

  // Process and save compress the image
  let compressPath = `${dirImages}/compress`;
  await ensureFolderExistsAsync(compressPath);
  const compressFilePath = `${compressPath}/${filename}`;

  compressImageBuffer = await compressImageBuffer
    .toFormat(format, {
      quality: compressOption.quality,
      progressive: true,
      ...(format === 'jpeg' || format === 'jpg' ? { mozjpeg: true } : {}) // Use mozjpeg only for JPEGs
    })
    .toBuffer();

  // Save the compressed image
  await writeFileAsync(compressFilePath, compressImageBuffer);

  return compressImageBuffer;
}

export async function deleteFile(FOLDER_PATH, imageFilename) {
  let filePath = `${FOLDER_PATH}/${imageFilename}`
  let compressFilePath = `${FOLDER_PATH}/compress/${imageFilename}`
  try {
    if (await ensureFileExistsAsync(filePath)) {
      await deleteFileAsync(filePath)
    }
    if (await ensureFileExistsAsync(compressFilePath)) {
      await deleteFileAsync(compressFilePath)
    }
  } catch (error) {
    throw error
  }
}

export async function deleteFiles(files) {
  // this function purpose is to delete multiple files or single file from multer
  if (files) {
    // Check is input array or not
    if (Array.isArray(files)) {
      for (let file of files) {
        // Delete original file
        if (await ensureFileExistsAsync(file.path)) {
          await deleteFileAsync(file.path);
        }

        // Delete compress file
        if (await ensureFileExistsAsync(`${file.destination}/compress/${file.filename}`)) {
          await deleteFileAsync(`${file.destination}/compress/${file.filename}`);
        }
      }
    } else {
      // Delete original file
      if (await ensureFileExistsAsync(files.path)) {
        await deleteFileAsync(files.path);
      }

      // Delete compress file
      if (await ensureFileExistsAsync(`${files.destination}/compress/${files.filename}`)) {
        await deleteFileAsync(`${files.destination}/compress/${files.filename}`);
      }
    }
  }
}

export function ensureFolderExistsAsync(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, async (err) => {
      if (err && err.code === 'ENOENT') {
        // Folder does not exist, try to create it
        fs.mkdir(path, { recursive: true }, (err) => {
          if (err) reject(err)
          else resolve(true) // Folder has been created
        })
      } else if (err) {
        reject(err) // Some other error occurred
      } else {
        resolve(true) // Folder exists
      }
    })
  })
}

export function writeFileAsync(filename, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function ensureFileExistsAsync(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err)
    })
  })
}

export function deleteFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err)
      }

      resolve(data)
    })
  })
}

export async function readDirFileAsync(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err)
      }

      resolve(files)
    })
  })
}