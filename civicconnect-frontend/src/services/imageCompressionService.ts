import imageCompression from "browser-image-compression";

export class ImageCompressionService {
  static async compressImage(file: File): Promise<File> {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      return file;
    }

    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error("Image compression failed, using original file:", error);
      return file;
    }
  }
}
