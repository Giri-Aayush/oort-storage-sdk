import { EndpointType } from '../constants/endpoints';

export interface OortStorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  endpointType?: EndpointType;
}

export interface Bucket {
  Name: string;
  CreationDate: string;
}

// export interface ListObjectsV2Response {
//   Contents: ObjectInfo[] | undefined;
//   Name: string;
//   Prefix: string;
//   KeyCount: number;
//   MaxKeys: number;
//   IsTruncated: boolean;
//   NextContinuationToken?: string;
// }

export interface ListObjectsV2Response {
  Contents?: ObjectInfo[];
  Name: string;
  Prefix: string;
  KeyCount: number;
  MaxKeys: number;
  IsTruncated: boolean;
  NextContinuationToken?: string;
}

export interface SignedUrlOptions {
  expiresIn: number; // in seconds
}

export interface ObjectInfo {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
}

export interface MultipartUploadInfo {
  UploadId: string;
  Key: string;
}

export interface CompletedPart {
  ETag: string;
  PartNumber: number;
}



/////
export interface ListBucketsResponse {
  ListAllMyBucketsResult: {
    Owner: {
      ID: string;
      DisplayName: string;
    };
    Buckets: {
      Bucket: Bucket[];
    };
  };
}
