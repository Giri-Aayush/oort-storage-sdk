// This test file is for testing the ListBuckets functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testListBuckets() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    console.log('Listing all buckets:');
    const buckets = await client.listBuckets();
    console.log(JSON.stringify(buckets, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testListBuckets();