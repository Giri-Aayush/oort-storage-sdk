import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of deleting multiple objects
 * from a bucket using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates a new test bucket
 * 3. Puts multiple test objects into the bucket
 * 4. Deletes all the test objects from the bucket in a single operation
 * 5. Verifies that all objects have been deleted
 * 6. Cleans up by deleting the test bucket
 */
async function testDeleteObjects() {
  console.log('Starting DeleteObjects functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: Create a new test bucket
    const testBucketName = 'test-delete-objects-' + Date.now();
    console.log(`Step 2: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Step 3: Put multiple test objects into the bucket
    const objectKeys = ['object1.txt', 'object2.txt', 'object3.txt'];
    console.log('Step 3: Putting test objects into the bucket');
    for (const key of objectKeys) {
      console.log(`Putting object ${key} into bucket ${testBucketName}`);
      await client.putObject(testBucketName, key, Buffer.from(`Content of ${key}`));
    }

    // Step 4: Delete all the test objects from the bucket
    console.log(`Step 4: Deleting objects ${objectKeys.join(', ')} from bucket ${testBucketName}`);
    await client.deleteObjects(testBucketName, objectKeys);

    // Step 5: Verify that all objects have been deleted
    console.log('Step 5: Verifying object deletion');
    const remainingObjects = await client.listObjectsV2(testBucketName);
    if (remainingObjects.Contents) {
      const objectInfos = Array.isArray(remainingObjects.Contents) 
        ? remainingObjects.Contents 
        : [remainingObjects.Contents];
      if (objectInfos.length > 0) {
        console.error('Error: Some objects still exist');
      } else {
        console.log('All objects successfully deleted');
      }
    } else {
      console.log('All objects successfully deleted');
    }

    // Step 6: Clean up
    console.log(`Step 6: Cleaning up - deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the DeleteObjects test:', error);
  }

  console.log('DeleteObjects functionality test completed');
}

testDeleteObjects();