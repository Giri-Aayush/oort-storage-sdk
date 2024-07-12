import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import { CompletedPart } from '../src/types';

dotenv.config();

async function testMultipartUpload() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const bucketName = 'test-multipart-upload-' + Date.now();
  const objectKey = 'large-object.txt';

  try {
    console.log(`Creating test bucket: ${bucketName}`);
    await client.createBucket(bucketName);

    const largeObjectContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB object
    console.log(`Initiating multipart upload`);
    const { UploadId } = await client.createMultipartUpload(bucketName, objectKey);
    console.log(`Upload ID: ${UploadId}`);

    const partSize = 5 * 1024 * 1024; // 5MB part size
    const numParts = Math.ceil(largeObjectContent.length / partSize);
    const uploadedParts: CompletedPart[] = [];

    for (let i = 0; i < numParts; i++) {
      const partNumber = i + 1;
      const startByte = i * partSize;
      const endByte = Math.min((i + 1) * partSize - 1, largeObjectContent.length - 1);
      const partData = largeObjectContent.slice(startByte, endByte + 1);

      try {
        console.log(`Uploading part ${partNumber}`);
        const partETag = await client.uploadPart(bucketName, objectKey, UploadId, partNumber, partData);
        console.log(`Successfully uploaded part ${partNumber}, ETag: ${partETag}`);
        uploadedParts.push({ PartNumber: partNumber, ETag: partETag });
      } catch (error) {
        console.error(`Error uploading part ${partNumber}:`, error);
        if (typeof error === 'object' && error !== null) {
          console.error('Error name:', (error as Error).name);
          console.error('Error message:', (error as Error).message);
          console.error('Error stack:', (error as Error).stack);
        }
        throw error;
      }
    }

    console.log('Completing multipart upload');
    await client.completeMultipartUpload(bucketName, objectKey, UploadId, uploadedParts);
    console.log('Multipart upload completed successfully');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('Cleaning up: deleting bucket', bucketName);
    await client.deleteBucket(bucketName);
  } catch (error) {
    console.error('An error occurred:', error);
    if (typeof error === 'object' && error !== null) {
      console.error('Error name:', (error as Error).name);
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
    }
  }
}

testMultipartUpload();
