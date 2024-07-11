// This test file is for testing the PutObject functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testPutObject() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const testBucketName = 'test-put-object-' + Date.now();
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    const objectKey = 'test-object.txt';
    const objectContent = 'This is a test object content';

    console.log(`Putting object ${objectKey} into bucket ${testBucketName}`);
    await client.putObject(testBucketName, objectKey, Buffer.from(objectContent));

    console.log('Object put successfully. Verifying...');
    const retrievedObject = await client.getObject(testBucketName, objectKey);
    console.log('Retrieved object content:', retrievedObject.toString());

    console.log(`Cleaning up: deleting bucket ${testBucketName} and its contents`);
    await client.deleteBucket(testBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testPutObject();