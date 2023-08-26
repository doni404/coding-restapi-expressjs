import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';


export async function saveBase64ImageToPath(base64Image, dirPath) {
    // Ensure the directory exists, if not, create it recursively
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Convert base64 image to a buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Check the image extension
    const type = await fileTypeFromBuffer(imageBuffer);

    if (!type) {
        throw new Error("Unsupported file type");
    }

    // Use the detected extension for the file name
    const imagePath = path.join(dirPath, `${Date.now()}.${type.ext}`);

    // Save the image
    fs.writeFileSync(imagePath, imageBuffer);

    // Extracting the filename from the full path (if you already have the full path)
    const extractedFilename = path.basename(imagePath);

    return extractedFilename;
}

export async function deleteImage(filename, dirPath) {
    try {
        const filePath = path.join(dirPath, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        throw error;
    }
}