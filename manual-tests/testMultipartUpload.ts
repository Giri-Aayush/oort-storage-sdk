import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import { CompletedPart } from '../src/types';

dotenv.config();

/**
 * This test function demonstrates the functionality of multipart upload
 * using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates a new test bucket
 * 3. Initiates a multipart upload for a large object
 * 4. Uploads the object in multiple parts
 * 5. Completes the multipart upload
 * 6. Cleans up by deleting the test bucket
 */
async function testMultipartUpload() {
  console.log('Starting MultipartUpload functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const bucketName = 'test-multipart-upload-' + Date.now();
  const objectKey = 'large-object.txt';

  try {
    // Step 2: Create a new test bucket
    console.log(`Step 2: Creating test bucket: ${bucketName}`);
    await client.createBucket(bucketName);

    // Step 3: Initiate a multipart upload for a large object
    const largeObjectContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB object
    console.log(`Step 3: Initiating multipart upload`);
    const { UploadId } = await client.createMultipartUpload(bucketName, objectKey);
    console.log(`Upload ID: ${UploadId}`);

    // Step 4: Upload the object in multiple parts
    console.log('Step 4: Uploading object parts');
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

    // Step 5: Complete the multipart upload
    console.log('Step 5: Completing multipart upload');
    await client.completeMultipartUpload(bucketName, objectKey, UploadId, uploadedParts);
    console.log('Multipart upload completed successfully');

    // Wait for 10 seconds to ensure the upload is fully processed
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 6: Clean up
    console.log(`Step 6: Cleaning up - deleting bucket ${bucketName}`);
    await client.deleteBucket(bucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the MultipartUpload test:', error);
    if (typeof error === 'object' && error !== null) {
      console.error('Error name:', (error as Error).name);
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
    }
  }

  console.log('MultipartUpload functionality test completed');
}

testMultipartUpload();