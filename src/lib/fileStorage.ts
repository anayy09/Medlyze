import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Ensure the encryption key is 32 bytes
const getEncryptionKey = (): Buffer => {
  const key = ENCRYPTION_KEY.slice(0, 64); // Use first 64 hex chars (32 bytes)
  return Buffer.from(key, 'hex');
};

/**
 * Initialize upload directory
 */
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('✓ Upload directory initialized');
  } catch (error) {
    console.error('Failed to initialize upload directory:', error);
    throw error;
  }
}

/**
 * Save encrypted file to disk
 * @param fileBuffer - The file content as a Buffer
 * @param originalFilename - Original filename for reference
 * @returns fileId - Unique identifier for the stored file
 */
export async function saveEncryptedFile(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<string> {
  try {
    await initializeStorage();
    
    // Generate unique file ID
    const fileId = crypto.randomUUID();
    
    // Generate IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
    
    // Encrypt the file
    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Combine IV and encrypted data
    const finalData = Buffer.concat([iv, encrypted]);
    
    // Save to disk
    const filePath = path.join(UPLOAD_DIR, fileId);
    await fs.writeFile(filePath, finalData);
    
    console.log(`✓ File saved and encrypted: ${fileId}`);
    return fileId;
  } catch (error) {
    console.error('Failed to save encrypted file:', error);
    throw new Error('Failed to save file');
  }
}

/**
 * Read and decrypt file from disk
 * @param fileId - Unique identifier of the stored file
 * @returns Decrypted file content as Buffer
 */
export async function readEncryptedFile(fileId: string): Promise<Buffer> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileId);
    
    // Read the file
    const data = await fs.readFile(filePath);
    
    // Extract IV and encrypted data
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    
    // Decrypt the file
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    console.error('Failed to read encrypted file:', error);
    throw new Error('Failed to read file');
  }
}

/**
 * Delete file from disk
 * @param fileId - Unique identifier of the stored file
 */
export async function deleteEncryptedFile(fileId: string): Promise<void> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileId);
    await fs.unlink(filePath);
    console.log(`✓ File deleted: ${fileId}`);
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Check if file exists
 * @param fileId - Unique identifier of the stored file
 */
export async function fileExists(fileId: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileId);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size
 * @param fileId - Unique identifier of the stored file
 * @returns File size in bytes
 */
export async function getFileSize(fileId: string): Promise<number> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileId);
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Failed to get file size:', error);
    throw new Error('Failed to get file size');
  }
}
