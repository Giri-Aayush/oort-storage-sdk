import dotenv from 'dotenv';
import { OortStorageClient } from '../src'; // Adjust the import path as necessary

// Load environment variables from .env file
dotenv.config();

/**
 * This test function demonstrates the functionality of creating a new bucket
 * using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Generates a unique bucket name
 * 3. Attempts to create the bucket
 * 4. Reports the result of the operation
 */
async function testCreateBucket() {
  console.log('Starting CreateBucket functionality test');

  // Step 1: Initialize the OortStorageClient with necessary credentials
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  // Step 2: Generate a unique bucket name using the current timestamp
  const bucketName = 'test-bucket-' + Date.now();
  console.log(`Step 2: Generated unique bucket name: ${bucketName}`);

  try {
    // Step 3: Attempt to create the bucket
    console.log('Step 3: Attempting to create the bucket');
    await client.createBucket(bucketName);

    // Step 4: Report successful bucket creation
    console.log(`Step 4: Successfully created bucket: ${bucketName}`);
  } catch (error) {
    // Step 4 (alternative): Log any errors that occur during bucket creation
    console.error('An error occurred while creating the bucket:', error);
  }

  console.log('CreateBucket functionality test completed');
}

// Execute the test function
testCreateBucket();