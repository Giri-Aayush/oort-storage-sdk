// This test file is for testing the DeleteBucket functionality for one bucket

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testDeleteBucket() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const buckets = await client.listBuckets();
    if (buckets.length > 0) {
      const bucketToDelete = buckets[0].Name;
      console.log(`Deleting bucket: ${bucketToDelete}`);
      await client.deleteBucket(bucketToDelete);
      console.log(`Successfully deleted bucket: ${bucketToDelete}`);
    } else {
      console.log('No buckets to delete');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testDeleteBucket();