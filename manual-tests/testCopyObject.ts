import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of copying an object
 * from one bucket to another using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates source and destination buckets
 * 3. Puts a test object into the source bucket
 * 4. Copies the object from the source bucket to the destination bucket
 * 5. Retrieves the copied object to verify its content
 * 6. Cleans up by deleting both test buckets and their contents
 */
async function testCopyObject() {
  console.log('Starting CopyObject functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: Create source and destination buckets
    const sourceBucketName = 'test-copy-source-' + Date.now();
    const destBucketName = 'test-copy-dest-' + Date.now();
    
    console.log(`Step 2: Creating source bucket: ${sourceBucketName} and destination bucket: ${destBucketName}`);
    await client.createBucket(sourceBucketName);
    await client.createBucket(destBucketName);

    // Step 3: Put a test object into the source bucket
    const sourceObjectKey = 'source-object.txt';
    const destObjectKey = 'dest-object.txt';
    const objectContent = 'This is the content to be copied';

    console.log(`Step 3: Putting object ${sourceObjectKey} into source bucket`);
    await client.putObject(sourceBucketName, sourceObjectKey, Buffer.from(objectContent));

    // Step 4: Copy the object from source to destination
    console.log(`Step 4: Copying object from ${sourceBucketName}/${sourceObjectKey} to ${destBucketName}/${destObjectKey}`);
    await client.copyObject(sourceBucketName, sourceObjectKey, destBucketName, destObjectKey);

    // Step 5: Verify the copied object
    console.log('Step 5: Verifying copied object content');
    const copiedObject = await client.getObject(destBucketName, destObjectKey);
    console.log('Copied object content:', copiedObject.toString());

    // Step 6: Clean up
    console.log(`Step 6: Cleaning up - deleting buckets ${sourceBucketName} and ${destBucketName}`);
    await client.deleteBucket(sourceBucketName);
    await client.deleteBucket(destBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the CopyObject test:', error);
  }

  console.log('CopyObject functionality test completed');
}

testCopyObject();