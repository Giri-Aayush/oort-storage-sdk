// This test file is for testing the DeleteObjects functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testDeleteObjects() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const testBucketName = 'test-delete-objects-' + Date.now();
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    const objectKeys = ['object1.txt', 'object2.txt', 'object3.txt'];

    for (const key of objectKeys) {
      console.log(`Putting object ${key} into bucket ${testBucketName}`);
      await client.putObject(testBucketName, key, Buffer.from(`Content of ${key}`));
    }

    console.log(`Deleting objects ${objectKeys.join(', ')} from bucket ${testBucketName}`);
    await client.deleteObjects(testBucketName, objectKeys);

    console.log('Verifying object deletion...');
    const remainingObjects = await client.listObjectsV2(testBucketName);
    if (remainingObjects.Contents && remainingObjects.Contents.length > 0) {
      console.error('Error: Some objects still exist');
    } else {
      console.log('All objects successfully deleted');
    }

    console.log(`Cleaning up: deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testDeleteObjects();