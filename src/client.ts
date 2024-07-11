import axios, { AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { createHmac } from 'crypto';
import { ENDPOINTS, EndpointType } from './constants/endpoints';
import {
  OortStorageConfig,
  Bucket,
  ListObjectsV2Response,
  MultipartUploadInfo,
  CompletedPart,
} from './types';

export class OortStorageClient {
  private client: AxiosInstance;
  private endpoint: string;

  constructor(private config: OortStorageConfig) {
    this.endpoint = ENDPOINTS[config.endpointType || 'STANDARD'];
    this.client = axios.create({ baseURL: this.endpoint });
  }

  private async signRequest(method: string, path: string, headers: Record<string, string>, body?: string): Promise<Record<string, string>> {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.slice(0, 8);
    const region = this.config.region || 'us-east-1';

    const canonicalRequest = [
      method,
      path,
      '',
      Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k.toLowerCase()}:${v}`).join('\n'),
      '',
      Object.keys(headers).sort().join(';').toLowerCase(),
      body ? createHmac('sha256', '').update(body).digest('hex') : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      `${date}/${region}/s3/aws4_request`,
      createHmac('sha256', '').update(canonicalRequest).digest('hex')
    ].join('\n');

    const kDate = createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(date).digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();

    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${date}/${region}/s3/aws4_request, SignedHeaders=${Object.keys(headers).sort().join(';').toLowerCase()}, Signature=${signature}`
    };
  }
  private getSigningKey(dateStamp: string): Buffer {
    const kDate = createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(this.config.region || 'us-east-1').digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    return createHmac('sha256', kService).update('aws4_request').digest();
  }

  getSignedUrl(operation: string, params: Record<string, string>, expiresIn: number = 900): string {
    const timestamp = new Date();
    const dateString = timestamp.toISOString().slice(0, 8).replace(/-/g, '');
    
    const credential = `${this.config.accessKeyId}/${dateString}/${this.config.region || 'us-east-1'}/s3/aws4_request`;
    
    const signedHeaders = 'host';
    
    const canonicalQuerystring = Object.entries({
      ...params,
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': timestamp.toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-SignedHeaders': signedHeaders
    })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    
    const canonicalRequest = [
      operation,
      `/${params.Key || ''}`,
      canonicalQuerystring,
      `host:${new URL(this.endpoint).host}\n`,
      '',
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n');
    
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp.toISOString().replace(/[:-]|\.\d{3}/g, ''),
      `${dateString}/${this.config.region || 'us-east-1'}/s3/aws4_request`,
      createHmac('sha256', '').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    const signingKey = this.getSigningKey(dateString);
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    return `${this.endpoint}/${params.Key || ''}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  }


  private async request(method: string, path: string, headers: Record<string, string> = {}, body?: any): Promise<any> {
    const signedHeaders = await this.signRequest(method, path, {
      ...headers,
      Host: new URL(this.endpoint).host,
      'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    }, body);

    try {
      const response = await this.client.request({
        method,
        url: path,
        headers: signedHeaders,
        data: body,
        responseType: 'arraybuffer'
      });

      if (response.headers['content-type']?.includes('xml')) {
        const parser = new XMLParser();
        return parser.parse(response.data.toString());
      }
      return response.data;
    } catch (error) {
      throw new Error(`OORT Storage Error: ${(error as Error).message}`);
    }
  }
  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    await this.request('PUT', `/${destBucket}/${destKey}`, {
      'x-amz-copy-source': `/${sourceBucket}/${sourceKey}`
    });
  }

  async createBucket(bucketName: string): Promise<void> {
    await this.request('PUT', `/${bucketName}`);
  }

  async listBuckets(): Promise<Bucket[]> {
    const response = await this.request('GET', '/');
    return response.ListAllMyBucketsResult.Buckets.Bucket;
  }

  async listObjectsV2(bucketName: string, prefix?: string, continuationToken?: string, maxKeys: number = 1000): Promise<ListObjectsV2Response> {
    const params = new URLSearchParams({
      'list-type': '2',
      ...(prefix && { prefix }),
      ...(continuationToken && { 'continuation-token': continuationToken }),
      'max-keys': maxKeys.toString()
    });
    const response = await this.request('GET', `/${bucketName}?${params.toString()}`);
    return response.ListBucketResult;
  }

  async putObject(bucketName: string, objectKey: string, data: Buffer): Promise<void> {
    const response = await this.request('PUT', `/${bucketName}/${objectKey}`, { 'Content-Length': data.length.toString() }, data);
    console.log('PUT object response:', response);
  }

  async getObject(bucketName: string, objectKey: string): Promise<Buffer> {
    return await this.request('GET', `/${bucketName}/${objectKey}`);
  }

  async deleteObject(bucketName: string, objectKey: string): Promise<void> {
    await this.request('DELETE', `/${bucketName}/${objectKey}`);
  }
  async deleteObjects(bucketName: string, keys: string[]): Promise<void> {
    const body = `
      <Delete>
        ${keys.map(key => `<Object><Key>${key}</Key></Object>`).join('')}
      </Delete>
    `;
    await this.request('POST', `/${bucketName}?delete`, { 'Content-Type': 'application/xml' }, body);
  }

  async deleteAllObjectsInBucket(bucketName: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      const listResult = await this.listObjectsV2(bucketName, undefined, continuationToken);
      if (listResult.Contents) {
        const objectInfos = Array.isArray(listResult.Contents) 
          ? listResult.Contents 
          : [listResult.Contents];

        for (const objectInfo of objectInfos) {
          await this.deleteObject(bucketName, objectInfo.Key);
          console.log(`Deleted object ${objectInfo.Key} from ${bucketName}`);
        }
      }
      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);
  }

  async deleteBucket(bucketName: string): Promise<void> {
    await this.deleteAllObjectsInBucket(bucketName);
    await this.request('DELETE', `/${bucketName}`);
    console.log(`Deleted bucket: ${bucketName}`);
  }

  async createMultipartUpload(bucketName: string, objectKey: string): Promise<MultipartUploadInfo> {
    const response = await this.request('POST', `/${bucketName}/${objectKey}?uploads`);
    return {
      UploadId: response.InitiateMultipartUploadResult.UploadId,
      Key: response.InitiateMultipartUploadResult.Key
    };
  }
  async abortMultipartUpload(bucketName: string, objectKey: string, uploadId: string): Promise<void> {
    await this.request('DELETE', `/${bucketName}/${objectKey}?uploadId=${uploadId}`);
  }


  async uploadPart(bucketName: string, objectKey: string, uploadId: string, partNumber: number, data: Buffer): Promise<string> {
    const response = await this.request('PUT', `/${bucketName}/${objectKey}?partNumber=${partNumber}&uploadId=${uploadId}`, { 'Content-Length': data.length.toString() }, data);
    return response.headers['etag'];
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
      'x-amz-copy-source-range': `bytes=${startByte}-${endByte}`
    });
  
    if (response && response.CopyPartResult && response.CopyPartResult.ETag) {
      return response.CopyPartResult.ETag.replace(/"/g, '');
    }
  
    console.error('Unexpected response format:', response);
    throw new Error('Failed to get ETag from uploadPartCopy response');
  }
  

  async completeMultipartUpload(bucketName: string, objectKey: string, uploadId: string, parts: CompletedPart[]): Promise<void> {
    const body = `<CompleteMultipartUpload>${parts.map(part => `<Part><PartNumber>${part.PartNumber}</PartNumber><ETag>${part.ETag}</ETag></Part>`).join('')}</CompleteMultipartUpload>`;
    await this.request('POST', `/${bucketName}/${objectKey}?uploadId=${uploadId}`, { 'Content-Type': 'application/xml' }, body);
  }
}