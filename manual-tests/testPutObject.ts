import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of putting an object
 * into a bucket using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates a new test bucket
 * 3. Puts a test object into the bucket
 * 4. Retrieves the object to verify its content
 * 5. Cleans up by deleting the test bucket and its contents
 */
async function testPutObject() {
  console.log('Starting PutObject functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: Create a new test bucket
    const testBucketName = 'test-put-object-' + Date.now();
    console.log(`Step 2: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Step 3: Put a test object into the bucket
    const objectKey = 'test-object.txt';
    const objectContent = 'This is a test object content';
    console.log(`Step 3: Putting object ${objectKey} into bucket ${testBucketName}`);
    await client.putObject(testBucketName, objectKey, Buffer.from(objectContent));

    // Step 4: Retrieve the object to verify its content
    console.log('Step 4: Verifying object content');
    const retrievedObject = await client.getObject(testBucketName, objectKey);
    console.log('Retrieved object content:', retrievedObject.toString());

    // Step 5: Clean up
    console.log(`Step 5: Cleaning up - deleting bucket ${testBucketName} and its contents`);
    await client.deleteBucket(testBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the PutObject test:', error);
  }

  console.log('PutObject functionality test completed');
}

testPutObject();