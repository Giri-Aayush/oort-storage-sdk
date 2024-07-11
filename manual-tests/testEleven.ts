// This test file is for testing the UploadPartCopy functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testUploadPartCopy() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const sourceBucketName = 'test-upload-part-copy-source-' + Date.now();
  const destBucketName = 'test-upload-part-copy-dest-' + Date.now();
  const sourceObjectKey = 'source-large-object.txt';
  const destObjectKey = 'dest-large-object.txt';

  try {
    console.log(`Creating source bucket: ${sourceBucketName} and destination bucket: ${destBucketName}`);
    await client.createBucket(sourceBucketName);
    await client.createBucket(destBucketName);

    // Create a large object in the source bucket
    const largeObjectContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB object
    await client.putObject(sourceBucketName, sourceObjectKey, largeObjectContent);

    // Initiate multipart upload in the destination bucket
    const { UploadId } = await client.createMultipartUpload(destBucketName, destObjectKey);

    // Perform UploadPartCopy
    const partSize = 5 * 1024 * 1024; // 5MB part size
    const numParts = Math.ceil(largeObjectContent.length / partSize);
    const uploadedParts = [];

    for (let i = 0; i < numParts; i++) {
      const startByte = i * partSize;
      const endByte = Math.min((i + 1) * partSize - 1, largeObjectContent.length - 1);
      const partNumber = i + 1;

      console.log(`Copying part ${partNumber}`);
      const partETag = await client.uploadPartCopy(
        sourceBucketName,
        sourceObjectKey,
        destBucketName,
        destObjectKey,
        UploadId,
        partNumber,
        startByte,
        endByte
      );
      uploadedParts.push({ PartNumber: partNumber, ETag: partETag });
    }

    // Complete the multipart upload
    await client.completeMultipartUpload(destBucketName, destObjectKey, UploadId, uploadedParts);

    console.log('UploadPartCopy completed successfully');

    // Verify the copied object
    const copiedObject = await client.getObject(destBucketName, destObjectKey);
    console.log('Copied object size:', copiedObject.length);

    console.log(`Cleaning up: deleting buckets ${sourceBucketName} and ${destBucketName}`);
    await client.deleteBucket(sourceBucketName);
    await client.deleteBucket(destBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testUploadPartCopy();