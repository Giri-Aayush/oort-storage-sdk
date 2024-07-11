import { createHmac } from 'crypto';
import { OortStorageConfig } from '../types';

export class AwsV4Signer {
  constructor(private config: OortStorageConfig) {}

  async signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<Record<string, string>> {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.slice(0, 8);

    const canonicalRequest = this.createCanonicalRequest(method, path, headers, body);
    const stringToSign = this.createStringToSign(timestamp, date, canonicalRequest);
    const signature = this.calculateSignature(date, stringToSign);

    return {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${date}/${
        this.config.region || 'us-east-1'
      }/s3/aws4_request, SignedHeaders=${Object.keys(headers)
        .sort()
        .join(';')
        .toLowerCase()}, Signature=${signature}`,
    };
  }

  private createCanonicalRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: string
  ): string {
    return [
      method,
      path,
      '',
      Object.entries(headers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k.toLowerCase()}:${v}`)
        .join('\n'),
      '',
      Object.keys(headers).sort().join(';').toLowerCase(),
      body
        ? createHmac('sha256', '').update(body).digest('hex')
        : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ].join('\n');
  }

  private createStringToSign(timestamp: string, date: string, canonicalRequest: string): string {
    return [
      'AWS4-HMAC-SHA256',
      timestamp,
      `${date}/${this.config.region || 'us-east-1'}/s3/aws4_request`,
      createHmac('sha256', '').update(canonicalRequest).digest('hex'),
    ].join('\n');
  }

  private calculateSignature(date: string, stringToSign: string): string {
    const kDate = createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(date).digest();
    const kRegion = createHmac('sha256', kDate)
      .update(this.config.region || 'us-east-1')
      .digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();

    return createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  }
}