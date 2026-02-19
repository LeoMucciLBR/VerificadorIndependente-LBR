/**
 * Hook to resolve photo URLs from S3 keys
 * Fetches signed URLs for S3 objects and caches them
 */
import { useState, useEffect } from "react";

type PhotoUrlMap = Record<string, string>;

export function usePhotoUrls(photos: { caminhoArquivo: string }[]) {
  const [resolvedUrls, setResolvedUrls] = useState<PhotoUrlMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photos || photos.length === 0) return;

    const fetchUrls = async () => {
      setLoading(true);
      const newUrls: PhotoUrlMap = {};

      for (const photo of photos) {
        const path = photo.caminhoArquivo;
        if (!path) continue;

        // Skip if already resolved
        if (resolvedUrls[path]) {
          newUrls[path] = resolvedUrls[path];
          continue;
        }

        // Check if it's already a full URL (http/https)
        if (path.startsWith("http")) {
          newUrls[path] = path;
          continue;
        }

        // Check if it's a local path (starts with / or uploads/)
        if (path.startsWith("/") || path.startsWith("/uploads")) {
          newUrls[path] = path.startsWith("/") ? path : "/" + path;
          continue;
        }

        // Assume it's an S3 key - fetch signed URL
        try {
          const res = await fetch(`/api/s3/signed-url?key=${encodeURIComponent(path)}`);
          const data = await res.json();
          if (data.success && data.url) {
            newUrls[path] = data.url;
          } else {
            // Fallback to original path
            newUrls[path] = path.startsWith("/") ? path : "/" + path;
          }
        } catch (error) {
          console.error("Error fetching signed URL for:", path, error);
          // Fallback to original path
          newUrls[path] = path.startsWith("/") ? path : "/" + path;
        }
      }

      setResolvedUrls((prev) => ({ ...prev, ...newUrls }));
      setLoading(false);
    };

    fetchUrls();
  }, [photos]);

  // Helper function to get URL for a specific path
  const getUrl = (path: string): string => {
    if (!path) return "";
    if (resolvedUrls[path]) return resolvedUrls[path];
    // Fallback for unresolved paths
    if (path.startsWith("http")) return path;
    return path.startsWith("/") ? path : "/" + path;
  };

  return { resolvedUrls, getUrl, loading };
}
