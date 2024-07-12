import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

/**
 * This test function demonstrates the functionality of retrieving an object
 * from a bucket using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Lists all available buckets
 * 3. Lists objects in the first bucket
 * 4. Retrieves the first object from the bucket
 * 5. Displays the content of the retrieved object
 */
async function testGetObject() {
  console.log('Starting GetObject functionality test');

  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const buckets = await client.listBuckets();
    
    if (buckets.length > 0) {
      const bucket = buckets[0].Name;
      console.log(`Using bucket: ${bucket}`);

      const objects = await client.listObjectsV2(bucket);
      
      if (objects.Contents && objects.Contents.length > 0) {
        const objectKey = objects.Contents[0].Key;
        
        console.log(`Retrieving object: ${objectKey} from bucket: ${bucket}`);
        const object = await client.getObject(bucket, objectKey);
        
        console.log('Object content:');
        console.log(object.toString('utf-8'));
        console.log(`Object size: ${object.length} bytes`);
      } else {
        console.log('No objects found in the bucket');
      }
    } else {
      console.log('No buckets available');
    }
  } catch (error) {
    console.error('An error occurred during the GetObject test:', error);
  }

  console.log('GetObject functionality test completed');
}

/**
 * This test function demonstrates uploading multiple files to a bucket
 * and then retrieving them using the OortStorageClient. It performs the following steps:
 * 1. Initializes the OortStorageClient with credentials
 * 2. Creates a new test bucket
 * 3. Uploads multiple files to the bucket
 * 4. Lists the objects in the bucket
 * 5. Retrieves each uploaded object and displays its content
 * 6. Cleans up by deleting the test bucket and its contents
 */
async function testMultipleUploadAndGet() {
  console.log('Starting Multiple Upload and GetObject functionality test');

  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const testBucketName = 'test-multiple-upload-' + Date.now();

  try {
    // Step 2: Create a new test bucket
    console.log(`Step 2: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Step 3: Upload multiple files to the bucket
    console.log('Step 3: Uploading multiple files to the bucket');
    const filesToUpload = [
      { key: 'file1.txt', content: 'This is the content of file 1' },
      { key: 'file2.txt', content: 'File 2 has different content' },
      { key: 'file3.txt', content: 'And here\'s file 3 with its unique content' },
    ];

    for (const file of filesToUpload) {
      await client.putObject(testBucketName, file.key, Buffer.from(file.content));
      console.log(`Uploaded: ${file.key}`);
    }

    // Step 4: List the objects in the bucket
    console.log('Step 4: Listing objects in the bucket');
    const objects = await client.listObjectsV2(testBucketName);

    // Step 5: Retrieve each uploaded object and display its content
    console.log('Step 5: Retrieving and displaying content of each object');
    if (objects.Contents) {
      for (const obj of objects.Contents) {
        const retrievedObject = await client.getObject(testBucketName, obj.Key);
        console.log(`Content of ${obj.Key}:`);
        console.log(retrievedObject.toString('utf-8'));
        console.log('---');
      }
    }

    // Step 6: Clean up
    console.log('Step 6: Cleaning up - deleting test bucket and its contents');
    await client.deleteBucket(testBucketName);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('An error occurred during the Multiple Upload and GetObject test:', error);
  }

  console.log('Multiple Upload and GetObject functionality test completed');
}

// Run both test cases
async function runTests() {
  await testGetObject();
  console.log('\n--- Running next test ---\n');
  await testMultipleUploadAndGet();
}

runTests();