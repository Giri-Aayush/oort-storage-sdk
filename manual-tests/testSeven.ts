// This test file is for testing the CopyObject functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testCopyObject() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const sourceBucketName = 'test-copy-source-' + Date.now();
    const destBucketName = 'test-copy-dest-' + Date.now();
    
    console.log(`Creating source bucket: ${sourceBucketName} and destination bucket: ${destBucketName}`);
    await client.createBucket(sourceBucketName);
    await client.createBucket(destBucketName);

    const sourceObjectKey = 'source-object.txt';
    const destObjectKey = 'dest-object.txt';
    const objectContent = 'This is the content to be copied';

    console.log(`Putting object ${sourceObjectKey} into source bucket`);
    await client.putObject(sourceBucketName, sourceObjectKey, Buffer.from(objectContent));

    console.log(`Copying object from ${sourceBucketName}/${sourceObjectKey} to ${destBucketName}/${destObjectKey}`);
    await client.copyObject(sourceBucketName, sourceObjectKey, destBucketName, destObjectKey);

    console.log('Verifying copied object...');
    const copiedObject = await client.getObject(destBucketName, destObjectKey);
    console.log('Copied object content:', copiedObject.toString());

    console.log(`Cleaning up: deleting buckets ${sourceBucketName} and ${destBucketName}`);
    await client.deleteBucket(sourceBucketName);
    await client.deleteBucket(destBucketName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testCopyObject();