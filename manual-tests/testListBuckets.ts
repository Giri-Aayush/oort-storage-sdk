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
    console.log('Parsed buckets:', JSON.stringify(buckets, null, 2));

    if (buckets.length === 0) {
      console.log('No buckets found. This could be normal if you haven\'t created any buckets yet.');
    } else {
      console.log(`Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.Name} (created on ${bucket.CreationDate})`);
      });
    }
  } catch (error) {
    console.error('An error occurred while listing the buckets:', error);
  }
}

testListBuckets();