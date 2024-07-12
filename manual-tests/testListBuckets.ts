import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of listing all buckets
 * using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Retrieves a list of all buckets
 * 3. Displays the parsed bucket information
 * 4. Reports on the number of buckets found and their details
 */
async function testListBuckets() {
  console.log('Starting ListBuckets functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // Step 2: Retrieve a list of all buckets
    console.log('Step 2: Retrieving list of all buckets');
    const buckets = await client.listBuckets();

    // Step 3: Display the parsed bucket information
    console.log('Step 3: Parsed bucket information:');
    console.log(JSON.stringify(buckets, null, 2));

    // Step 4: Report on the number of buckets found and their details
    if (buckets.length === 0) {
      console.log('Step 4: No buckets found. This could be normal if you haven\'t created any buckets yet.');
    } else {
      console.log(`Step 4: Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.Name} (created on ${bucket.CreationDate})`);
      });
    }
  } catch (error) {
    // Error handling: Log any errors that occur during the process
    console.error('An error occurred during the ListBuckets test:', error);
  }

  console.log('ListBuckets functionality test completed');
}

testListBuckets();