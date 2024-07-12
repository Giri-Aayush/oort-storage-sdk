import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of deleting an object
 * from a bucket using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates a new test bucket
 * 3. Puts a test object into the bucket
 * 4. Deletes the object from the bucket
 * 5. Verifies that the object has been deleted
 * 6. Cleans up by deleting the test bucket
 */
async function testDeleteObject() {
  console.log('Starting DeleteObject functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: Create a new test bucket
    const testBucketName = 'test-delete-object-' + Date.now();
    console.log(`Step 2: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Step 3: Put a test object into the bucket
    const objectKey = 'object-to-delete.txt';
    const objectContent = 'This object will be deleted';
    console.log(`Step 3: Putting object ${objectKey} into bucket ${testBucketName}`);
    await client.putObject(testBucketName, objectKey, Buffer.from(objectContent));

    // Step 4: Delete the object from the bucket
    console.log(`Step 4: Deleting object ${objectKey} from bucket ${testBucketName}`);
    await client.deleteObject(testBucketName, objectKey);

    // Step 5: Verify that the object has been deleted
    console.log('Step 5: Verifying object deletion');
    try {
      await client.getObject(testBucketName, objectKey);
      console.error('Error: Object still exists');
    } catch (error) {
      console.log('Object successfully deleted');
    }

    // Step 6: Clean up
    console.log(`Step 6: Cleaning up - deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the DeleteObject test:', error);
  }

  console.log('DeleteObject functionality test completed');
}

testDeleteObject();