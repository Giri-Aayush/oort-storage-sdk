import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import { CompletedPart } from '../src/types';

dotenv.config();

/**
 * This test function demonstrates the functionality of UploadPartCopy
 * using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates source and destination buckets
 * 3. Puts a large object in the source bucket
 * 4. Initiates a multipart upload in the destination bucket
 * 5. Copies the large object in parts from source to destination
 * 6. Completes the multipart upload
 * 7. Verifies the copied object
 * 8. Cleans up by deleting both buckets
 */
async function testUploadPartCopy() {
  console.log('Starting UploadPartCopy functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
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
    // Step 2: Create source and destination buckets
    console.log(`Step 2: Creating source bucket: ${sourceBucketName} and destination bucket: ${destBucketName}`);
    await client.createBucket(sourceBucketName);
    await client.createBucket(destBucketName);

    // Step 3: Put a large object in the source bucket
    const largeObjectContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB object
    console.log(`Step 3: Putting large object (${largeObjectContent.length} bytes) into source bucket`);
    await client.putObject(sourceBucketName, sourceObjectKey, largeObjectContent);

    // Step 4: Initiate a multipart upload in the destination bucket
    console.log('Step 4: Initiating multipart upload');
    const { UploadId } = await client.createMultipartUpload(destBucketName, destObjectKey);
    console.log(`UploadId: ${UploadId}`);

    // Step 5: Copy the large object in parts from source to destination
    console.log('Step 5: Copying object parts');
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

    // Step 6: Complete the multipart upload
    console.log('Step 6: Completing multipart upload');
    await client.completeMultipartUpload(destBucketName, destObjectKey, UploadId, uploadedParts);
    console.log('UploadPartCopy completed successfully');

    // Step 7: Verify the copied object
    console.log('Step 7: Verifying copied object');
    const copiedObject = await client.getObject(destBucketName, destObjectKey);
    console.log('Copied object size:', copiedObject.length);

    // Step 8: Clean up
    console.log(`Step 8: Cleaning up - deleting buckets ${sourceBucketName} and ${destBucketName}`);
    await client.deleteBucket(sourceBucketName);
    await client.deleteBucket(destBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the UploadPartCopy test:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  console.log('UploadPartCopy functionality test completed');
}

testUploadPartCopy();