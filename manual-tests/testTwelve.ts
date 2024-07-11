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
    const getSignedUrl = client.getSignedUrl('GET', { Bucket: testBucketName, Key: objectKey });
    console.log('GET Signed URL:', getSignedUrl);

    // Test the GET signed URL
    console.log('Testing GET signed URL');
    const getResponse = await axios.get(getSignedUrl);
    console.log('GET response:', getResponse.data);

    // Get signed URL for PUT operation
    console.log('Generating signed URL for PUT operation');
    const putSignedUrl = client.getSignedUrl('PUT', { Bucket: testBucketName, Key: 'new-object.txt' });
    console.log('PUT Signed URL:', putSignedUrl);

    // Test the PUT signed URL
    console.log('Testing PUT signed URL');
    const newContent = 'This is a new object uploaded via signed URL';
    const putResponse = await axios.put(putSignedUrl, newContent, {
      headers: { 'Content-Type': 'text/plain' }
    });
    console.log('PUT response status:', putResponse.status);

    // Verify the new object
    const newObject = await client.getObject(testBucketName, 'new-object.txt');
    console.log('New object content:', newObject.toString());

    console.log(`Cleaning up: deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);

    console.log('GetSignedUrl test completed successfully');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testGetSignedUrl();