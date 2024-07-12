import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand, ListBucketsCommand, CreateBucketCommand, DeleteObjectCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from 'axios';

dotenv.config();

async function testGetSignedUrlAwsSdk() {
  console.log('Starting GetSignedUrl functionality test using AWS SDK');

  const client = new S3Client({
    region: 'us-east-1',
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
    console.log('Step 1: Listing existing buckets');
    const listBucketsResponse = await client.send(new ListBucketsCommand({}));
    console.log('Existing buckets:', listBucketsResponse.Buckets);

    console.log(`Step 2: Creating test bucket: ${bucketName}`);
    await client.send(new CreateBucketCommand({ Bucket: bucketName }));

    console.log(`Step 3: Putting object ${objectKey} into bucket ${bucketName}`);
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: objectContent,
    }));

    console.log('Step 4: Generating signed URL for GET operation');
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log('GET Signed URL:', signedUrl);

    console.log('Step 5: Testing GET signed URL');
    const getResponse = await axios.get(signedUrl);
    console.log('GET response:', getResponse.data);

    console.log('Step 6: Cleaning up - deleting object and bucket');
    await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }));
    await client.send(new DeleteBucketCommand({ Bucket: bucketName }));

    console.log('GetSignedUrl test completed successfully');
  } catch (error) {
    console.error('An error occurred during the GetSignedUrl test:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testGetSignedUrlAwsSdk();