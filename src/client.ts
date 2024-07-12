import axios, { AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { createHmac } from 'crypto';
import { ENDPOINTS, EndpointType } from './constants/endpoints';
import {
  OortStorageConfig,
  ListBucketsResponse,
  ListObjectsV2Response,
  MultipartUploadInfo,
  CompletedPart,
  SignedUrlOptions,
  Bucket,
} from './types';

const MAX_EXPIRATION_TIME = 12 * 60 * 60; // 12 hours in seconds

export class OortStorageClient {
  private client: AxiosInstance;
  private endpoint: string;

  constructor(private config: OortStorageConfig) {
    this.endpoint = ENDPOINTS[config.endpointType || 'STANDARD'];
    this.client = axios.create({ baseURL: this.endpoint });
  }

  private signRequest(method: string, path: string, headers: Record<string, string>, body?: any): Record<string, string> {
    const { accessKeyId, secretAccessKey } = this.config;
    const canonicalRequest = `${method}\n${path}\n\n${Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join('\n')}\n\n${Object.keys(headers).join(';')}\n${createHmac('sha256', secretAccessKey).update(body || '').digest('hex')}`;
    const stringToSign = `AWS4-HMAC-SHA256\n${headers['X-Amz-Date']}\n${headers['X-Amz-Date'].substr(0, 8)}/${
      this.config.region || 'us-east-1'
    }/s3/aws4_request\n${createHmac('sha256', secretAccessKey).update(canonicalRequest).digest('hex')}`;
    const signingKey = this.getSignatureKey(secretAccessKey, headers['X-Amz-Date'].substr(0, 8), this.config.region || 'us-east-1', 's3');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    return {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${headers['X-Amz-Date'].substr(0, 8)}/${
        this.config.region || 'us-east-1'
      }/s3/aws4_request, SignedHeaders=${Object.keys(headers).join(';')}, Signature=${signature}`,
    };
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string) {
    const kDate = createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(regionName).digest();
    const kService = createHmac('sha256', kRegion).update(serviceName).digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
  }

  private async request(method: string, path: string, headers: Record<string, string> = {}, body?: any): Promise<any> {
    const signedHeaders = this.signRequest(
      method,
      path,
      {
        ...headers,
        Host: new URL(this.client.defaults.baseURL!).host,
        'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      },
      body
    );

    console.log('Sending request with the following parameters:');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Headers:', JSON.stringify(signedHeaders, null, 2));
    console.log('Body length:', body ? body.length : 'No body');

    try {
      const response = await this.client.request({
        method,
        url: path,
        headers: signedHeaders,
        data: body,
        responseType: 'arraybuffer',
      });

      console.log('Response status:', response.status);


      if (response.headers['content-type']?.includes('xml')) {
        const parser = new XMLParser();
        response.data = parser.parse(response.data.toString());
      }
      return response;
    } catch (error) {
      console.error('Error in request:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', JSON.stringify((error as any).response, null, 2));
      }
      throw new Error(`OORT Storage Error: ${(error as Error).message}`);
    }
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  async createSignedUrl(operation: 'getObject' | 'putObject', params: { Bucket: string; Key: string }, options: SignedUrlOptions): Promise<string> {
    if (options.expiresIn <= 0) {
      throw new Error('Expiration time must be greater than 0 seconds');
    }
    if (options.expiresIn > MAX_EXPIRATION_TIME) {
      throw new Error(`Expiration time cannot exceed ${MAX_EXPIRATION_TIME} seconds (12 hours)`);
    }

    const timestamp = new Date();
    const dateString = timestamp.toISOString().slice(0, 8).replace(/-/g, '');
    const amzDate = timestamp.toISOString().replace(/[:\-]|\.\d{3}/g, '');

    const credential = `${this.config.accessKeyId}/${dateString}/${this.config.region || 'us-east-1'}/s3/aws4_request`;

    const signedHeaders = 'host';

    const canonicalQuerystring = Object.entries({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': options.expiresIn.toString(),
      'X-Amz-SignedHeaders': signedHeaders,
      'x-id': operation === 'getObject' ? 'GetObject' : 'PutObject',
    })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const canonicalHeaders = `host:${new URL(this.endpoint).host}\n`;
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      operation === 'getObject' ? 'GET' : 'PUT',
      `/${params.Bucket}/${params.Key}`,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateString}/${this.config.region || 'us-east-1'}/s3/aws4_request`,
      createHmac('sha256', '').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(this.config.secretAccessKey, dateString, this.config.region || 'us-east-1', 's3');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    return `${this.endpoint}/${params.Bucket}/${params.Key}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  }

  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    await this.request('PUT', `/${destBucket}/${destKey}`, {
      'x-amz-copy-source': `/${sourceBucket}/${sourceKey}`,
    });
  }

  async createBucket(bucketName: string): Promise<void> {
    await this.request('PUT', `/${bucketName}`);
  }

  public async listBuckets(): Promise<Bucket[]> {
    try {
      const response = await this.request('GET', '/');
      console.log('Raw listBuckets response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.ListAllMyBucketsResult) {
        const result = response.data.ListAllMyBucketsResult;
        const buckets = result.Buckets.Bucket;
        
        if (Array.isArray(buckets)) {
          return buckets.map((bucket: Bucket) => ({
            Name: bucket.Name,
            CreationDate: bucket.CreationDate,
          }));
        } else {
          console.warn('No buckets found or unexpected bucket format');
          return [];
        }
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Unexpected response format from listBuckets');
      }
    } catch (error) {
      console.error('Error in listBuckets:', error);
      throw error;
    }
  }

  async listObjectsV2(
    bucketName: string,
    prefix?: string,
    continuationToken?: string,
    maxKeys: number = 1000
  ): Promise<ListObjectsV2Response> {
    const params = new URLSearchParams({
      'list-type': '2',
      ...(prefix && { prefix }),
      ...(continuationToken && { 'continuation-token': continuationToken }),
      'max-keys': maxKeys.toString(),
    });
    const response = await this.request('GET', `/${bucketName}?${params.toString()}`);
  
    console.log('Raw List Objects V2 API response:', JSON.stringify(response.data, null, 2));
  
    if (response.data && response.data.ListBucketResult) {
      const result = response.data.ListBucketResult;
      return {
        Name: result.Name,
        Prefix: result.Prefix,
        KeyCount: parseInt(result.KeyCount, 10),
        MaxKeys: parseInt(result.MaxKeys, 10),
        IsTruncated: result.IsTruncated === 'true',
        Contents: Array.isArray(result.Contents) ? result.Contents : (result.Contents ? [result.Contents] : []),
        NextContinuationToken: result.NextContinuationToken,
      };
    } else {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected response format from listObjectsV2');
    }
  }

  async putObject(bucketName: string, objectKey: string, data: Buffer): Promise<void> {
    const response = await this.request('PUT', `/${bucketName}/${objectKey}`, { 'Content-Length': data.length.toString() }, data);
    console.log('PUT object response:', response);
  }

  async getObject(bucketName: string, objectKey: string): Promise<Buffer> {
    const response = await this.request('GET', `/${bucketName}/${objectKey}`);
    if (Buffer.isBuffer(response.data)) {
      return response.data;
    } else if (typeof response.data === 'string') {
      return Buffer.from(response.data);
    } else {
      throw new Error('Unexpected response format from getObject');
    }
  }

  async deleteObject(bucketName: string, objectKey: string): Promise<void> {
    await this.request('DELETE', `/${bucketName}/${objectKey}`);
  }

  async deleteObjects(bucketName: string, keys: string[]): Promise<void> {
    const body = `
      <Delete>
        ${keys.map((key) => `<Object><Key>${key}</Key></Object>`).join('')}
      </Delete>
    `;
    await this.request('POST', `/${bucketName}?delete`, { 'Content-Type': 'application/xml' }, body);
  }

  async deleteAllObjectsInBucket(bucketName: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      // Add a small delay to ensure objects are registered
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await this.listObjectsV2(bucketName, undefined, continuationToken);

      console.log('List Objects V2 response:', JSON.stringify(response, null, 2));

      if (response && response.Contents) {
        const objectInfos = Array.isArray(response.Contents) ? response.Contents : [response.Contents];

        for (const objectInfo of objectInfos) {
          await this.deleteObject(bucketName, objectInfo.Key);
          console.log(`Deleted object ${objectInfo.Key} from ${bucketName}`);
        }
      } else {
        console.log(`No Contents found in the response for bucket ${bucketName}`);
      }

      continuationToken = response?.NextContinuationToken;
    } while (continuationToken);
  }

  async deleteBucket(bucketName: string): Promise<void> {
    await this.deleteAllObjectsInBucket(bucketName);
    await this.request('DELETE', `/${bucketName}`);
    console.log(`Deleted bucket: ${bucketName}`);
  }

  async createMultipartUpload(bucketName: string, objectKey: string): Promise<MultipartUploadInfo> {
    const response = await this.request('POST', `/${bucketName}/${objectKey}?uploads`);

    console.log('Create Multipart Upload response:', response);
    console.log('Parsed response data:', response.data);

    if (response.data && response.data.InitiateMultipartUploadResult) {
      return {
        UploadId: response.data.InitiateMultipartUploadResult.UploadId,
        Key: response.data.InitiateMultipartUploadResult.Key,
      };
    } else {
      throw new Error('Failed to initiate multipart upload');
    }
  }

  async abortMultipartUpload(bucketName: string, objectKey: string, uploadId: string): Promise<void> {
    await this.request('DELETE', `/${bucketName}/${objectKey}?uploadId=${uploadId}`);
  }

  async uploadPart(bucketName: string, objectKey: string, uploadId: string, partNumber: number, data: Buffer): Promise<string> {
    try {
      console.log('Sending uploadPart request with the following parameters:');
      console.log('Bucket:', bucketName);
      console.log('Object Key:', objectKey);
      console.log('Upload ID:', uploadId);
      console.log('Part Number:', partNumber);
      console.log('Data length:', data.length);

      const response = await this.request('PUT', `/${bucketName}/${objectKey}?partNumber=${partNumber}&uploadId=${uploadId}`, { 'Content-Length': data.length.toString() }, data);

      console.log('Full response:', response.data ? JSON.stringify(response.data, null, 2) : 'No response body');
      console.log('Response headers:', JSON.stringify(response.headers, null, 2));
      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);

      const etag = response.headers?.etag || response.headers?.ETag;
      if (etag) {
        return etag;
      }

      throw new Error('Failed to get ETag from uploadPart response');
    } catch (error) {
      console.error('Error in uploadPart:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', JSON.stringify((error as any).response, null, 2));
      }
      throw error;
    }
  }

  async uploadPartCopy(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
    uploadId: string,
    partNumber: number,
    startByte: number,
    endByte: number
  ): Promise<string> {
    const response = await this.request('PUT', `/${destBucket}/${destKey}?partNumber=${partNumber}&uploadId=${uploadId}`, {
      'x-amz-copy-source': `/${sourceBucket}/${sourceKey}`,
      'x-amz-copy-source-range': `bytes=${startByte}-${endByte}`,
    });

    if (response && response.CopyPartResult && response.CopyPartResult.ETag) {
      return response.CopyPartResult.ETag.replace(/"/g, '');
    }

    console.error('Unexpected response format:', response);
    throw new Error('Failed to get ETag from uploadPartCopy response');
  }

  async completeMultipartUpload(bucketName: string, objectKey: string, uploadId: string, parts: CompletedPart[]): Promise<void> {
    const body = `<CompleteMultipartUpload>${parts
      .map((part) => `<Part><PartNumber>${part.PartNumber}</PartNumber><ETag>${part.ETag}</ETag></Part>`)
      .join('')}</CompleteMultipartUpload>`;
    await this.request('POST', `/${bucketName}/${objectKey}?uploadId=${uploadId}`, { 'Content-Type': 'application/xml' }, body);
  }
}
