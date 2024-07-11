// This test file is for testing the Multipart Upload functionality (CreateMultipartUpload, UploadPart, CompleteMultipartUpload, AbortMultipartUpload)

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import { createReadStream } from 'fs';
import { basename } from 'path';

dotenv.config();

async function testMultipartUpload() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const testBucketName = 'test-multipart-upload-' + Date.now();
  const testFilePath = './large-test-file.txt'; // You need to create this large file
  const objectKey = basename(testFilePath);

  try {
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    console.log('Initiating multipart upload');
    const { UploadId } = await client.createMultipartUpload(testBucketName, objectKey);

    const partSize = 5 * 1024 * 1024; // 5MB part size
    const fileStream = createReadStream(testFilePath);
    let partNumber = 1;
    const uploadedParts = [];

    for await (const chunk of fileStream) {
      console.log(`Uploading part ${partNumber}`);
      const partETag = await client.uploadPart(testBucketName, objectKey, UploadId, partNumber, chunk);
      uploadedParts.push({ PartNumber: partNumber, ETag: partETag });
      partNumber++;
    }

    console.log('Completing multipart upload');
    await client.completeMultipartUpload(testBucketName, objectKey, UploadId, uploadedParts);

    console.log('Multipart upload completed successfully');

    // Test AbortMultipartUpload
    console.log('Testing AbortMultipartUpload');
    const { UploadId: abortUploadId } = await client.createMultipartUpload(testBucketName, 'abort-test.txt');
    await client.abortMultipartUpload(testBucketName, 'abort-test.txt', abortUploadId);
    console.log('Multipart upload aborted successfully');

    console.log(`Cleaning up: deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testMultipartUpload();