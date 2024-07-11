import dotenv from 'dotenv';
import { OortStorageClient } from './src';

dotenv.config();

async function runTest() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // List buckets
    console.log('Listing buckets...');
    const buckets = await client.listBuckets();
    console.log('Buckets:', JSON.stringify(buckets, null, 2));

    // Create a bucket
    const testBucketName = 'test-bucket-' + Date.now();
    console.log(`Creating bucket ${testBucketName}...`);
    await client.createBucket(testBucketName);

    // Put an object
    const testObjectKey = 'test-object.txt';
    const testObjectContent = Buffer.from('Hello, OORT Storage!');
    console.log(`Putting object ${testObjectKey} into ${testBucketName}...`);
    await client.putObject(testBucketName, testObjectKey, testObjectContent);

    // List objects in the bucket
    console.log(`Listing objects in ${testBucketName}...`);
    const objects = await client.listObjectsV2(testBucketName);
    console.log('Objects:', JSON.stringify(objects, null, 2));

    // Get the object
    console.log(`Getting object ${testObjectKey} from ${testBucketName}...`);
    const retrievedObject = await client.getObject(testBucketName, testObjectKey);
    console.log('Retrieved object content:', retrievedObject.toString());

    // Delete the object
    console.log(`Deleting object ${testObjectKey} from ${testBucketName}...`);
    await client.deleteObject(testBucketName, testObjectKey);

    console.log('All operations completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

runTest();