import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of the OortStorageClient
 * for listing objects in a bucket. It performs the following steps:
 * 1. Creates a new test bucket
 * 2. Adds three test objects to the bucket
 * 3. Lists the objects in the bucket
 * 4. Cleans up by deleting the test bucket and its contents
 */
async function testListObjects() {
  console.log('Starting ListObjects (ListObjectsV2) functionality test');

  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 1: Create a new test bucket
    const testBucketName = 'test-list-objects-' + Date.now();
    console.log(`Step 1: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);
    console.log('Test bucket created successfully');

    // Step 2: Add test objects to the bucket
    console.log('Step 2: Adding test objects to the bucket');
    const testObjects = [
      { key: 'test-object-1.txt', content: 'Content of object 1' },
      { key: 'test-object-2.txt', content: 'Content of object 2' },
      { key: 'test-object-3.txt', content: 'Content of object 3' },
    ];

    for (const obj of testObjects) {
      await client.putObject(testBucketName, obj.key, Buffer.from(obj.content));
      console.log(`Added object: ${obj.key}`);
    }

    // Step 3: List objects in the bucket
    console.log('Step 3: Listing objects in the bucket');
    const listResult = await client.listObjectsV2(testBucketName);

    console.log(`Found ${listResult.KeyCount} objects in the bucket:`);
    if (listResult.Contents && listResult.Contents.length > 0) {
      listResult.Contents.forEach(obj => {
        console.log(`- ${obj.Key} (Size: ${obj.Size} bytes, Last Modified: ${obj.LastModified})`);
      });
    } else {
      console.log('No objects found in the bucket.');
    }

    // Step 4: Clean up
    console.log('Step 4: Cleaning up - deleting test bucket and its contents');
    await client.deleteBucket(testBucketName);
    console.log('Cleanup completed successfully');

    console.log('ListObjects functionality test completed successfully');
  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
}

testListObjects();