// This test file is for testing the UploadPartCopy functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import { CompletedPart } from '../src/types';

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

    const largeObjectContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB object
    console.log(`Putting large object (${largeObjectContent.length} bytes) into source bucket`);
    await client.putObject(sourceBucketName, sourceObjectKey, largeObjectContent);

    console.log('Initiating multipart upload');
    const { UploadId } = await client.createMultipartUpload(destBucketName, destObjectKey);
    console.log(`UploadId: ${UploadId}`);

    const partSize = 5 * 1024 * 1024; // 5MB part size
    const numParts = Math.ceil(largeObjectContent.length / partSize);
    const uploadedParts: CompletedPart[] = [];

    for (let i = 0; i < numParts; i++) {
      const startByte = i * partSize;
      const endByte = Math.min((i + 1) * partSize - 1, largeObjectContent.length - 1);
      const partNumber = i + 1;

      console.log(`Copying part ${partNumber} (bytes ${startByte}-${endByte})`);
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
      console.log(`Successfully copied part ${partNumber}, ETag: ${partETag}`);
      uploadedParts.push({ PartNumber: partNumber, ETag: partETag });
    }

    console.log('Completing multipart upload');
    await client.completeMultipartUpload(destBucketName, destObjectKey, UploadId, uploadedParts);

    console.log('UploadPartCopy completed successfully');

    console.log('Verifying copied object');
    const copiedObject = await client.getObject(destBucketName, destObjectKey);
    console.log('Copied object size:', copiedObject.length);

    console.log(`Cleaning up: deleting buckets ${sourceBucketName} and ${destBucketName}`);
    await client.deleteBucket(sourceBucketName);
    await client.deleteBucket(destBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testUploadPartCopy();