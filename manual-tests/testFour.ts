// This test file is for testing the ListObjects (ListObjectsV2) functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testListObjects() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // First, let's create a bucket and add some objects to it
    const testBucketName = 'test-list-objects-' + Date.now();
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Add some test objects
    await client.putObject(testBucketName, 'test-object-1.txt', Buffer.from('Content of object 1'));
    await client.putObject(testBucketName, 'test-object-2.txt', Buffer.from('Content of object 2'));
    await client.putObject(testBucketName, 'test-object-3.txt', Buffer.from('Content of object 3'));

    console.log(`Added 3 test objects to ${testBucketName}`);

    // Now, let's list the objects in this bucket
    console.log(`Listing objects in bucket: ${testBucketName}`);
    const listResult = await client.listObjectsV2(testBucketName);

    if (listResult.Contents) {
      const objects = Array.isArray(listResult.Contents) ? listResult.Contents : [listResult.Contents];
      console.log('Objects in the bucket:');
      objects.forEach(obj => {
        console.log(`- ${obj.Key} (Size: ${obj.Size} bytes, Last Modified: ${obj.LastModified})`);
      });
    } else {
      console.log('No objects found in the bucket');
    }

    // Clean up: delete the test bucket and its contents
    console.log(`Cleaning up: deleting bucket ${testBucketName} and its contents`);
    await client.deleteBucket(testBucketName);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testListObjects();