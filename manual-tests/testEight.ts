// This test file is for testing the DeleteObject functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testDeleteObject() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const testBucketName = 'test-delete-object-' + Date.now();
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    const objectKey = 'object-to-delete.txt';
    const objectContent = 'This object will be deleted';

    console.log(`Putting object ${objectKey} into bucket ${testBucketName}`);
    await client.putObject(testBucketName, objectKey, Buffer.from(objectContent));

    console.log(`Deleting object ${objectKey} from bucket ${testBucketName}`);
    await client.deleteObject(testBucketName, objectKey);

    console.log('Verifying object deletion...');
    try {
      await client.getObject(testBucketName, objectKey);
      console.error('Error: Object still exists');
    } catch (error) {
      console.log('Object successfully deleted');
    }

    console.log(`Cleaning up: deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testDeleteObject();