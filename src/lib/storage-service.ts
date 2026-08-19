export interface StorageService {
  getSignedUrl(mediaPathOrUrl: string, expiresInSeconds?: number): string;
  uploadPoster(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string>;
}

class DevStorageService implements StorageService {
  private cfDomain: string;

  constructor() {
    this.cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN || "https://d1111111111111.cloudfront.net";
  }

  getSignedUrl(mediaPathOrUrl: string, expiresInSeconds: number = 3600): string {
    if (mediaPathOrUrl.startsWith("http://") || mediaPathOrUrl.startsWith("https://")) {
      const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const delimiter = mediaPathOrUrl.includes("?") ? "&" : "?";
      return `${mediaPathOrUrl}${delimiter}Signature=mock_cf_sig_${expires}&Expires=${expires}`;
    }

    const cleanPath = mediaPathOrUrl.startsWith("/") ? mediaPathOrUrl : `/${mediaPathOrUrl}`;
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${this.cfDomain}${cleanPath}?Signature=mock_cf_sig_${expires}&Expires=${expires}`;
  }

  async uploadPoster(_fileBuffer: Buffer, fileName: string, _contentType: string): Promise<string> {
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const mockKey = `posters/${timestamp}_${safeName}`;
    return `${this.cfDomain}/${mockKey}`;
  }
}

export const storageService: StorageService = new DevStorageService();
