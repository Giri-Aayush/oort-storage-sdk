// This test file is for testing the CreateBucket functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testCreateBucket() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const bucketName = 'test-bucket-' + Date.now();
    console.log(`Creating bucket: ${bucketName}`);
    await client.createBucket(bucketName);
    console.log(`Successfully created bucket: ${bucketName}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testCreateBucket();