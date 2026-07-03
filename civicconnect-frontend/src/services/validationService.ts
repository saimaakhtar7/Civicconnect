export class ValidationService {
  static ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  static ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-matroska"];

  static MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
  static MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  static validateFile(file: File): { valid: boolean; error?: string } {
    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: "Unsupported file format. Please upload JPEG, PNG, WEBP, or MP4/MOV video.",
      };
    }

    if (isImage && file.size > this.MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: "Image file is too large. Maximum allowed size is 15MB.",
      };
    }

    if (isVideo && file.size > this.MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        error: "Video file is too large. Maximum allowed size is 50MB.",
      };
    }

    return { valid: true };
  }
}
