import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of deleting a bucket
 * using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Lists all available buckets
 * 3. If buckets exist, attempts to delete the first bucket in the list
 * 4. Reports the result of the operation
 */
async function testDeleteBucket() {
  console.log('Starting DeleteBucket functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: List all available buckets
    console.log('Step 2: Listing all available buckets');
    const buckets = await client.listBuckets();

    if (buckets.length > 0) {
      // Step 3: Attempt to delete the first bucket in the list
      const bucketToDelete = buckets[0].Name;
      console.log(`Step 3: Attempting to delete bucket: ${bucketToDelete}`);
      await client.deleteBucket(bucketToDelete);

      // Step 4: Report successful bucket deletion
      console.log(`Step 4: Successfully deleted bucket: ${bucketToDelete}`);
    } else {
      // Step 4 (alternative): Report if no buckets are available to delete
      console.log('Step 4: No buckets available to delete');
    }
  } catch (error) {
    // Error handling: Log any errors that occur during the process
    console.error('An error occurred during the DeleteBucket test:', error);
  }

  console.log('DeleteBucket functionality test completed');
}

testDeleteBucket();