import dotenv from 'dotenv';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

dotenv.config();

/**
 * This test function demonstrates the functionality of generating and using signed URLs
 * with OORT Storage's S3-compatible API using the AWS SDK. It performs the following steps:
 * 1. Initializes an S3Client with OORT Storage credentials and endpoint
 * 2. Lists existing buckets to verify connectivity
 * 3. Creates a new test bucket
 * 4. Lists buckets again to confirm the new bucket was created
 * 5. Uploads a test object to the new bucket
 * 6. Generates a signed URL for getting the uploaded object
 * 7. Attempts to access the object using the signed URL
 * 8. Logs the results of each step, including any errors encountered
 *
 * This test helps identify discrepancies between the AWS SDK's behavior
 * and our custom OortStorageClient implementation, particularly in how
 * signed URLs are generated and used.
 */
async function testGetSignedUrlAwsSdk() {
  console.log('Starting GetSignedUrl functionality test using AWS SDK');

  // Step 1: Initialize S3Client
  const client = new S3Client({
    region: 'us-east-1', // Ensure this matches your OORT Storage region
    endpoint: 'https://s3-standard.oortech.com',
    credentials: {
      accessKeyId: process.env.OORT_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  const bucketName = 'test-signed-url-' + Date.now();
  const objectKey = 'test-object.txt';
  const objectContent = 'This is a test object for signed URL';

  try {
    // Step 2: List existing buckets
    console.log('Step 2: Listing existing buckets');
    const listBucketsResponse = await client.send(new ListBucketsCommand({}));
    console.log(JSON.stringify(listBucketsResponse.Buckets, null, 2));

    // Step 3: Create a new test bucket
    console.log(`Step 3: Creating test bucket: ${bucketName}`);
    try {
      const createBucketResponse = await client.send(
        new CreateBucketCommand({ Bucket: bucketName })
      );
      console.log('Bucket created successfully:', createBucketResponse);
    } catch (createError: any) {
      console.error('Error creating bucket:', createError.message);
      if (createError.$metadata) {
        console.error('Error metadata:', JSON.stringify(createError.$metadata, null, 2));
      }
      throw createError;
    }

    // Step 4: List buckets again to confirm creation
    console.log('Step 4: Listing buckets after creation');
    const listBucketsAfterResponse = await client.send(new ListBucketsCommand({}));
    console.log(JSON.stringify(listBucketsAfterResponse.Buckets, null, 2));

    // Step 5: Upload a test object
    console.log(`Step 5: Putting object ${objectKey} into bucket ${bucketName}`);
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: objectContent,
      })
    );
    console.log('Object put successfully');

    // Step 6: Generate a signed URL
    console.log('Step 6: Generating signed URL for GET operation');
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const signedUrl = await s3GetSignedUrl(client, command, { expiresIn: 3600 });
    console.log('GET Signed URL:', signedUrl);

    // Step 7: Test the signed URL
    console.log('Step 7: Testing GET signed URL');
    try {
      const getResponse = await axios.get(signedUrl);
      console.log('GET response:', getResponse.data);
    } catch (error: any) {
      console.error('Error accessing signed URL:', error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Signed URL error response:', error.response.data);
        console.error('Signed URL error status:', error.response.status);
        console.error('Signed URL error headers:', error.response.headers);
      }
    }

    console.log('GetSignedUrl functionality test completed');
  } catch (error: any) {
    console.error('An error occurred during the GetSignedUrl test:', error.message);
    if (error.$metadata) {
      console.error('Error metadata:', JSON.stringify(error.$metadata, null, 2));
    }
  }
}

testGetSignedUrlAwsSdk();

/**
 * Difficulties and Future Improvements:
 * 
 * 1. SDK Compatibility: Our custom implementation doesn't use the AWS SDK directly,
 *    which might lead to inconsistencies in how requests are signed and sent.
 * 
 * 2. Object Handling: Our custom implementation uses a different method to put objects,
 *    which might not be fully compatible with OORT Storage's expectations.
 * 
 * 3. Signed URL Generation: Our custom getSignedUrl implementation might not be creating
 *    the signed URL in exactly the same way as the AWS SDK, leading to authentication issues.
 * 
 * 4. S3 Operations: Our custom implementation might not be handling all the necessary
 *    S3 operations (like creating buckets, listing objects, etc.) in a way that's
 *    fully compatible with OORT Storage's S3-compatible API.
 * 
 * 5. Error Handling: Error handling and response parsing in our custom implementation
 *    might not be as robust as the AWS SDK, leading to difficulties in diagnosing issues.
 * 
 * Future improvements:
 * 1. Consider using the AWS SDK directly in our OortStorageClient class
 * 2. If custom implementation is necessary, ensure it exactly mimics AWS SDK behavior
 * 3. Implement comprehensive error handling and logging
 * 4. Thoroughly test each S3 operation against OORT Storage to ensure compatibility
 * 5. Consider reaching out to OORT Storage support for any specific requirements
 *    or deviations from standard S3 behavior
 */