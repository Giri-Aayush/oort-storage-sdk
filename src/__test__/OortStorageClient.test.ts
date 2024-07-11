import nock from 'nock';
import { OortStorageClient } from '../src/client';
import { ENDPOINTS } from '../src/constants/endpoints';

describe('OortStorageClient', () => {
  const client = new OortStorageClient({
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    endpointType: 'STANDARD',
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  it('should create a bucket', async () => {
    const bucketName = 'test-bucket';
    
    nock(ENDPOINTS.STANDARD)
      .put(`/${bucketName}`)
      .reply(200);

    await expect(client.createBucket(bucketName)).resolves.not.toThrow();
  });

  it('should list buckets', async () => {
    const mockResponse = {
      ListAllMyBucketsResult: {
        Buckets: {
          Bucket: [
            { Name: 'bucket1', CreationDate: '2023-01-01T00:00:00.000Z' },
            { Name: 'bucket2', CreationDate: '2023-01-02T00:00:00.000Z' },
          ],
        },
      },
    };

    nock(ENDPOINTS.STANDARD)
      .get('/')
      .reply(200, mockResponse);

    const buckets = await client.listBuckets();
    expect(buckets).toHaveLength(2);
    expect(buckets[0].Name).toBe('bucket1');
    expect(buckets[1].Name).toBe('bucket2');
  });

  it('should put an object', async () => {
    const bucketName = 'test-bucket';
    const objectKey = 'test-object';
    const objectContent = Buffer.from('Hello, World!');

    nock(ENDPOINTS.STANDARD)
      .put(`/${bucketName}/${objectKey}`)
      .reply(200);

    await expect(client.putObject(bucketName, objectKey, objectContent)).resolves.not.toThrow();
  });

  it('should get an object', async () => {
    const bucketName = 'test-bucket';
    const objectKey = 'test-object';
    const objectContent = 'Hello, World!';

    nock(ENDPOINTS.STANDARD)
      .get(`/${bucketName}/${objectKey}`)
      .reply(200, objectContent);

    const result = await client.getObject(bucketName, objectKey);
    expect(result.toString()).toBe(objectContent);
  });

  // Add more tests for other methods...
});