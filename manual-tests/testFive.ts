// This test file is for testing the GetObject functionality

import dotenv from 'dotenv';
import { OortStorageClient } from '../src';

dotenv.config();

async function testGetObject() {
  const client = new OortStorageClient({
    accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    endpointType: 'STANDARD',
  });

  try {
    const buckets = await client.listBuckets();
    if (buckets.length > 0) {
      const bucket = buckets[0].Name;
      const objects = await client.listObjectsV2(bucket);
      if (objects.Contents) {
        const objectInfos = Array.isArray(objects.Contents) ? objects.Contents : [objects.Contents];
        if (objectInfos.length > 0) {
          const objectKey = objectInfos[0].Key;
          console.log(`Getting object: ${objectKey} from bucket: ${bucket}`);
          const object = await client.getObject(bucket, objectKey);
          console.log('Object content:', object.toString());
        } else {
          console.log('No objects found in the bucket');
        }
      } else {
        console.log('No objects found in the bucket');
      }
    } else {
      console.log('No buckets available');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

testGetObject();