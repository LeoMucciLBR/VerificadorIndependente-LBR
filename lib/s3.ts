// Módulo de storage: suporta upload para S3 ou sistema de arquivos local
// Configurável via STORAGE_MODE no .env ('s3' ou 'local')

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const STORAGE_MODE = process.env.STORAGE_MODE || "local";
const AWS_REGION = process.env.AWS_REGION || "sa-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";

// Cliente S3 instanciado sob demanda
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}


interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

/**
 * Faz upload de arquivo para S3 ou storage local.
 * @param file - Arquivo ou Buffer para upload
 * @param key - Caminho/chave de armazenamento (ex: 'ocorrencias/uuid/foto.jpg')
 * @param contentType - Tipo MIME do arquivo
 */
export async function uploadFile(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<UploadResult> {
  try {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const mimeType = contentType || (file instanceof File ? file.type : "application/octet-stream");

    if (STORAGE_MODE === "s3") {
      // Upload para S3
      const client = getS3Client();
      const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await client.send(command);

      return {
        success: true,
        key,
        url: `s3://${AWS_S3_BUCKET}/${key}`, // Internal reference
      };
    } else {
      // Storage local: usa posix path para compatibilidade cross-platform
      const uploadDir = join(process.cwd(), "public", "uploads");
      const fullPath = join(uploadDir, key).replace(/\\/g, '/');
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(fullPath, buffer);

      return {
        success: true,
        key,
        url: `/uploads/${key}`,
      };
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Remove arquivo do S3 ou storage local.
 * @param key - Caminho/chave do arquivo a ser removido
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (STORAGE_MODE === "s3") {
      const client = getS3Client();
      const command = new DeleteObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
      });

      await client.send(command);
    } else {
      const fullPath = join(process.cwd(), "public", "uploads", key);
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Erro na exclusão:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Gera URL assinada para acesso a objeto privado no S3.
 * No modo local, retorna o caminho público direto.
 * @param key - Caminho/chave do arquivo
 * @param expiresIn - Expiração em segundos (padrão: 1 hora)
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (STORAGE_MODE === "s3") {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } else {
    // Storage local — retorna caminho público direto
    return `/uploads/${key}`;
  }
}

/** Verifica se o modo S3 está configurado */
export function isS3Enabled(): boolean {
  return STORAGE_MODE === "s3" && !!AWS_S3_BUCKET && !!process.env.AWS_ACCESS_KEY_ID;
}

/** Retorna informações do modo de storage atual */
export function getStorageInfo(): { mode: string; bucket?: string; region?: string } {
  if (STORAGE_MODE === "s3") {
    return {
      mode: "s3",
      bucket: AWS_S3_BUCKET,
      region: AWS_REGION,
    };
  }
  return { mode: "local" };
}
