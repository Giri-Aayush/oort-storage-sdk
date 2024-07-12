import dotenv from 'dotenv';
import { OortStorageClient } from '../src';
import assert from 'assert';

dotenv.config();

async function testBasicOperations() {
  console.log('Starting BasicOperations functionality test');

  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  const testBucketName = 'test-bucket-' + Date.now();
  const testObjectKey = 'test-object.txt';
  const testObjectContent = Buffer.from('Hello, OORT Storage!');

  try {
    // Step 1: List existing buckets
    console.log('Step 1: Listing existing buckets');
    const initialBuckets = await client.listBuckets();
    console.log('Initial buckets:', initialBuckets);

    // Step 2: Create a new test bucket
    console.log(`Step 2: Creating test bucket: ${testBucketName}`);
    await client.createBucket(testBucketName);

    // Step 3: Verify bucket creation
    console.log('Step 3: Verifying bucket creation');
    const bucketsAfterCreation = await client.listBuckets();
    assert(bucketsAfterCreation.some(b => b.Name === testBucketName), 'Newly created bucket not found in the list');

    // Step 4: Put an object into the bucket
    console.log(`Step 4: Putting object ${testObjectKey} into ${testBucketName}`);
    await client.putObject(testBucketName, testObjectKey, testObjectContent);

    // Step 5: List objects in the bucket
    console.log(`Step 5: Listing objects in ${testBucketName}`);
    const objects = await client.listObjectsV2(testBucketName);
    console.log('Objects:', objects);
    assert(objects.Contents?.some(obj => obj.Key === testObjectKey), 'Newly created object not found in the list');

    // Step 6: Get the object
    console.log(`Step 6: Getting object ${testObjectKey} from ${testBucketName}`);
    const retrievedObject = await client.getObject(testBucketName, testObjectKey);
    assert(retrievedObject.toString() === testObjectContent.toString(), 'Retrieved object content does not match');

    // Step 7: Delete the object
    console.log(`Step 7: Deleting object ${testObjectKey} from ${testBucketName}`);
    await client.deleteObject(testBucketName, testObjectKey);

    // Step 8: Verify object deletion
    console.log('Step 8: Verifying object deletion');
    const objectsAfterDeletion = await client.listObjectsV2(testBucketName);
    assert(!objectsAfterDeletion.Contents?.some(obj => obj.Key === testObjectKey), 'Deleted object still found in the list');

    // Step 9: Delete the bucket
    console.log(`Step 9: Deleting bucket ${testBucketName}`);
    await client.deleteBucket(testBucketName);

    // Step 10: Verify bucket deletion
    console.log('Step 10: Verifying bucket deletion');
    const finalBuckets = await client.listBuckets();
    assert(!finalBuckets.some(b => b.Name === testBucketName), 'Deleted bucket still found in the list');

    console.log('All basic operations completed successfully!');
  } catch (error) {
    console.error('An error occurred during the BasicOperations test:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  console.log('BasicOperations functionality test completed');
}

testBasicOperations();