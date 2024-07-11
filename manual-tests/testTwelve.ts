// This test file is for testing the GetSignedUrl functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import axios from 'axios';

dotenv.config();

async function testGetSignedUrl() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const testBucketName = 'test-signed-url-' + Date.now();
  const objectKey = 'test-object.txt';
  const objectContent = 'This is a test object for signed URL';

  try {
    console.log(`Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    console.log(`Putting object ${objectKey} into bucket ${testBucketName}`);
    await client.putObject(testBucketName, objectKey, Buffer.from(objectContent));

    // Get signed URL for GET operation
    console.log('Generating signed URL for GET operation');
    const getSignedUrl = await client.getSignedUrl('GET', { Bucket: testBucketName, Key: objectKey });
    console.log('GET Signed URL:', getSignedUrl);

    // Test the GET signed URL
    console.log('Testing GET signed URL');
    const getResponse = await axios.get(getSignedUrl);
    console.log('GET response:', getResponse.data);

    // Get signed URL