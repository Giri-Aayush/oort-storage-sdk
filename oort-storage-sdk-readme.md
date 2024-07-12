# OORT Storage SDK

The OORT Storage SDK is an open-source contribution to the OORT ecosystem, developed by Aayush Giri. This SDK provides a simple and efficient way to interact with OORT Storage, an S3-compatible object storage service. It allows you to perform various operations such as creating buckets, uploading and downloading objects, and managing multipart uploads.

## About

This project is a community-driven effort to enhance the OORT ecosystem. It is not officially associated with or endorsed by OORT, but aims to provide value to OORT users and developers.

**Developer**: Aayush Giri

## Installation

To install the OORT Storage SDK, use npm:

```bash
npm install oort-storage-sdk
```

## Basic Usage

First, import the SDK and create a client:

```typescript
import { OortStorageClient } from 'oort-storage-sdk';

const client = new OortStorageClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  endpointType: 'STANDARD', // or 'ARCHIVE'
  region: 'us-east-1' // optional, defaults to 'us-east-1'
});
```

## Available Methods

### Bucket Operations

#### Create a Bucket

```typescript
await client.createBucket('my-bucket');
```

#### List Buckets

```typescript
const buckets = await client.listBuckets();
console.log(buckets);
```

#### Delete a Bucket

```typescript
await client.deleteBucket('my-bucket');
```

To force deletion of a non-empty bucket:

```typescript
await client.deleteBucket('my-bucket', { force: true });
```

### Object Operations

#### Put Object

```typescript
const data = Buffer.from('Hello, OORT!');
await client.putObject('my-bucket', 'hello.txt', data);
```

#### Get Object

```typescript
const object = await client.getObject('my-bucket', 'hello.txt');
console.log(object.toString());
```

#### Delete Object

```typescript
await client.deleteObject('my-bucket', 'hello.txt');
```

#### Delete Multiple Objects

```typescript
await client.deleteObjects('my-bucket', ['file1.txt', 'file2.txt']);
```

#### List Objects

```typescript
const objects = await client.listObjectsV2('my-bucket');
console.log(objects);
```

### Multipart Upload Operations

#### Create Multipart Upload

```typescript
const { UploadId, Key } = await client.createMultipartUpload('my-bucket', 'large-file.dat');
```

#### Upload Part

```typescript
const partNumber = 1;
const data = Buffer.alloc(5 * 1024 * 1024); // 5MB part
const etag = await client.uploadPart('my-bucket', 'large-file.dat', UploadId, partNumber, data);
```

#### Complete Multipart Upload

```typescript
const parts = [
  { PartNumber: 1, ETag: 'etag1' },
  { PartNumber: 2, ETag: 'etag2' },
];
await client.completeMultipartUpload('my-bucket', 'large-file.dat', UploadId, parts);
```

#### Abort Multipart Upload

```typescript
await client.abortMultipartUpload('my-bucket', 'large-file.dat', UploadId);
```

### Other Operations

#### Copy Object

```typescript
await client.copyObject('source-bucket', 'source-key', 'dest-bucket', 'dest-key');
```

#### Create Signed URL

```typescript
const signedUrl = await client.createSignedUrl('getObject', {
  Bucket: 'my-bucket',
  Key: 'my-object.txt'
}, {
  expiresIn: 3600 // 1 hour
});
```

## Error Handling

All methods can throw errors. It's recommended to use try-catch blocks:

```typescript
try {
  await client.createBucket('my-bucket');
} catch (error) {
  console.error('Error creating bucket:', error);
}
```

## Advanced Usage

For more advanced usage and detailed API documentation, please refer to the source code and inline comments.

## Contributing

Contributions are welcome! This is an open-source project aimed at improving the OORT ecosystem. If you'd like to contribute, please feel free to submit a Pull Request.

## License

This SDK is released under the MIT License.

## Acknowledgments

Special thanks to the OORT community and all contributors who help improve this SDK.

---

Developed with ❤️ by Aayush Giri for the OORT ecosystem.
