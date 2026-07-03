export class CloudinaryService {
  static uploadImage(
    file: File,
    onProgress: (progress: number) => void
  ): { promise: Promise<string>; cancel: () => void } {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Missing Cloudinary configuration. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);


    const controller = new AbortController();
    const signal = controller.signal;

    const promise = new Promise<string>(async (resolve, reject) => {
      try {
        onProgress(5);

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal,
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} ${JSON.stringify(data)}`));
          return;
        }

        if (!data?.secure_url) {
          reject(new Error("Cloudinary upload succeeded but secure_url is missing."));
          return;
        }


        onProgress(100);
        resolve(data.secure_url);
      } catch (err: any) {
        if (err.name === "AbortError") {
          reject(new Error("Cloudinary upload cancelled."));
        } else {
          reject(new Error(err?.message || "Cloudinary upload failed due to a network error."));
        }
      }
    });

    return {
      promise,
      cancel: () => controller.abort(),
    };
  }
}
