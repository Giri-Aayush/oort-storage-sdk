import dotenv from 'dotenv';
import { OortStorageClient } from './src';

dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    // List and delete all existing buckets
    console.log('Listing and deleting all existing buckets...');
    const existingBuckets = await client.listBuckets();
    for (const bucket of existingBuckets) {
      console.log(`Deleting bucket: ${bucket.Name}`);
      await client.deleteBucket(bucket.Name);
    }

    // Create first bucket with one text file
    const bucket1Name = 'test-bucket-1-' + Date.now();
    console.log(`Creating bucket: ${bucket1Name}`);
    await client.createBucket(bucket1Name);
    await client.putObject(bucket1Name, 'file1.txt', Buffer.from('Content of file 1'));
    console.log(`Added file1.txt to ${bucket1Name}`);

    // Create second bucket with two text files
    const bucket2Name = 'test-bucket-2-' + Date.now();
    console.log(`Creating bucket: ${bucket2Name}`);
    await client.createBucket(bucket2Name);
    await client.putObject(bucket2Name, 'file2a.txt', Buffer.from('Content of file 2a'));
    await client.putObject(bucket2Name, 'file2b.txt', Buffer.from('Content of file 2b'));
    console.log(`Added file2a.txt and file2b.txt to ${bucket2Name}`);

    // Create third bucket, add a file, wait 5 minutes, then delete it
    const bucket3Name = 'test-bucket-3-' + Date.now();
    console.log(`Creating bucket: ${bucket3Name}`);
    await client.createBucket(bucket3Name);
    await client.putObject(bucket3Name, 'file3.txt', Buffer.from('Content of file 3'));
    console.log(`Added file3.txt to ${bucket3Name}`);
    
    console.log('Waiting 5 minutes before deleting file3.txt...');
    await delay(5 * 60 * 1000); // Wait for 5 minutes
    
    await client.deleteObject(bucket3Name, 'file3.txt');
    console.log(`Deleted file3.txt from ${bucket3Name}`);

    // List all buckets and their contents
    console.log('\nFinal state of buckets:');
    const finalBuckets = await client.listBuckets();
    for (const bucket of finalBuckets) {
      console.log(`\nBucket: ${bucket.Name}`);
      const objects = await client.listObjectsV2(bucket.Name);
      console.log('Objects:', JSON.stringify(objects, null, 2));
    }

    console.log('\nAll operations completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

runTest();