import { NextRequest, NextResponse } from "next/server";
import { uploadFile, getFileUrl, isS3Enabled } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/vnd.google-earth.kmz", "application/vnd.google-earth.kml+xml"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".kmz") && !file.name.endsWith(".kml")) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido" },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = file.name.split(".").pop() || "bin";
    const uniqueId = uuidv4();
    const key = `${folder}/${uniqueId}.${ext}`;

    // Upload file
    const result = await uploadFile(file, key, file.type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao fazer upload" },
        { status: 500 }
      );
    }

    // Get accessible URL
    const url = await getFileUrl(key);

    return NextResponse.json({
      success: true,
      key: result.key,
      url,
      storageMode: isS3Enabled() ? "s3" : "local",
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    storageMode: isS3Enabled() ? "s3" : "local",
    message: "Use POST to upload files",
  });
}
