import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, isS3Enabled } from "@/lib/s3";

/**
 * API endpoint to generate signed URLs for S3 objects
 * This is needed because S3 objects in a private bucket require signed URLs
 * 
 * GET /api/s3/signed-url?key=ocorrencias/123/photo.jpg
 * GET /api/s3/signed-url?key=ocorrencias/123/photo.jpg&redirect=1 (for img src)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const redirect = searchParams.get("redirect") === "1";

    if (!key) {
      return NextResponse.json(
        { error: "Missing 'key' parameter" },
        { status: 400 }
      );
    }

    // Generate signed URL (or return local path if using local storage)
    const url = await getFileUrl(key);

    // If redirect mode, redirect directly to the signed URL
    // This allows using this endpoint in img src attributes
    if (redirect) {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({
      success: true,
      url,
      storageMode: isS3Enabled() ? "s3" : "local",
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
