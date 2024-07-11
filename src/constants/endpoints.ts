export const ENDPOINTS = {
    STANDARD: 'https://s3-standard.oortech.com',
    ARCHIVE: 'https://s3-archive.oortech.com',
  } as const;
  
  export type EndpointType = keyof typeof ENDPOINTS;