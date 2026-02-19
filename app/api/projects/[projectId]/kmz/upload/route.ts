import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';
import { parseKMZ, extractMainLineString } from '@/lib/kmz-processor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('kmz') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.kmz') && !file.name.endsWith('.kml')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only KMZ and KML files are allowed' },
        { status: 400 }
      );
    }

    // Find project
    const project = await prisma.projects.findUnique({
      where: { uuid: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse KMZ/KML
    const processed = await parseKMZ(buffer);

    // Validate that we can extract a main line string
    // This uses the improved recursive search logic
    const mainLine = extractMainLineString(processed.geojson);

    if (!mainLine) {
       console.error('Upload rejected: valid LineString not found in KMZ');
       return NextResponse.json(
         { error: 'O arquivo KMZ não contém um traçado (linha) válido. Verifique se o arquivo contém linhas e não apenas pontos ou polígonos.' },
         { status: 400 }
       );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'kmz', 'projects', project.id.toString());
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const fileName = `complete.kmz`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Generate public URL
    const kmzUrl = `/uploads/kmz/projects/${project.id}/${fileName}`;

    // Update project with KMZ URL and GeoJSON
    const updatedProject = await prisma.projects.update({
      where: { id: project.id },
      data: {
        kmzUrl,
        geojson: processed.geojson as any, // Prisma Json type
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.uuid,
        kmzUrl: updatedProject.kmzUrl,
        lengthKm: processed.lengthKm,
        bounds: processed.bounds
      }
    });

  } catch (error) {
    console.error('Error uploading KMZ:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload KMZ' },
      { status: 500 }
    );
  }
}
