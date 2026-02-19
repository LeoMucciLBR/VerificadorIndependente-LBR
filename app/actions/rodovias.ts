"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { serialize } from "@/lib/serialize";


const RodoviaSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    codigo: z.string().optional(),
    concessionaria: z.string().optional(),
    extensao: z.string().transform(v => parseFloat(v) || 0).optional(),
    kmlUrl: z.string().optional(),
    shpUrl: z.string().optional(),
});

const MarcoSchema = z.object({
    rodovia_id: z.string(),
    nome: z.string().min(1),
    km: z.string().transform(v => parseFloat(v)),
    latitude: z.number(),
    longitude: z.number(),
    segmento_origem: z.string().optional()
});

const SegmentoHomogeneoSchema = z.object({
    rodovia_id: z.string(),
    nome: z.string().min(1),
    descricao: z.string().optional(),
    kmInicial: z.string().transform(v => parseFloat(v)),
    kmFinal: z.string().transform(v => parseFloat(v)),
});



export async function getRodovias() {
    try {
        const rodovias = await prisma.rodovia.findMany({
            orderBy: { nome: 'asc' },
            include: {
                _count: {
                    select: {
                         marcos_quilometricos: true,
                         segmentos_homogeneos: true
                    }
                }
            }
        });
        return { success: true, data: serialize(rodovias) };
    } catch (error) {
        console.error("Erro ao buscar rodovias:", error);
        return { success: false, error: "Erro ao buscar rodovias" };
    }
}

export async function getRodoviasWithSegments(projectSlug?: string) {
  noStore(); // Prevent caching
  try {
    console.log("[rodovias.ts] getRodoviasWithSegments called with slug:", projectSlug);

    if (!projectSlug) {
      console.log("[rodovias.ts] No project slug provided, returning empty.");
      return { success: true, data: [] };
    }

    const project = await prisma.projects.findFirst({
      where: { 
          OR: [
              { slug: projectSlug },
              { codigo: projectSlug }
          ]
      },
      select: { id: true, project_rodovias: { select: { rodovia_id: true } } }
    });

    if (!project) {
      console.log("[rodovias.ts] Project NOT found for slug:", projectSlug);
      return { success: true, data: [] };
    }

    console.log("[rodovias.ts] Project found:", project.id);
    const linkedRodoviaIds = project.project_rodovias.map((pr: any) => pr.rodovia_id);
    console.log("[rodovias.ts] Linked rodovia IDs:", linkedRodoviaIds);
    
    // Explicitly construct the query here to avoid any chance of an empty where clause
    const rodovias = await prisma.rodovia.findMany({
      where: {
        OR: [
          { project_id: project.id },
          { id: { in: linkedRodoviaIds } }
        ]
      },
      orderBy: { nome: 'asc' },
      include: {
        segmentos_homogeneos: {
           orderBy: { kmInicial: 'asc' },
           select: { id: true, nome: true, kmInicial: true, kmFinal: true }
        }
      }
    });

    return { success: true, data: serialize(rodovias) };
  } catch (error) {
    console.error("Erro ao buscar rodovias com segmentos:", error);
    return { success: false, error: "Erro ao buscar dados" };
  }
}

export async function createRodovia(formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { success: false, error: "Não autorizado" };

        const rawData = {
            nome: formData.get("nome"),
            codigo: formData.get("codigo"),
            concessionaria: formData.get("concessionaria"),
            extensao: formData.get("extensao"),
            kmlUrl: formData.get("kmlUrl"),
            shpUrl: formData.get("shpUrl"),
        };

        const validated = RodoviaSchema.parse(rawData);

        const rodovia = await prisma.rodovia.create({
            data: {
                uuid: uuidv4(),
                nome: validated.nome,
                codigo: validated.codigo || null,
                concessionaria: validated.concessionaria || null,
                extensao: validated.extensao || 0,
                kmlUrl: validated.kmlUrl || null,
                shpUrl: validated.shpUrl || null
            }
        });

        revalidatePath("/(dashboard)/execucoes");
        revalidatePath("/settings");

        return { success: true, data: serialize(rodovia) };
    } catch (error: any) {
        console.error("Create Rodovia Error:", error);
        return { success: false, error: error.message || "Erro ao criar rodovia" };
    }
}

export async function updateRodovia(id: string, formData: FormData) {
     try {
        const session = await getSession();
        if (!session) return { success: false, error: "Não autorizado" };

        const rawData = {
            nome: formData.get("nome"),
            codigo: formData.get("codigo"),
            concessionaria: formData.get("concessionaria"),
            extensao: formData.get("extensao"),
            kmlUrl: formData.get("kmlUrl"),
            shpUrl: formData.get("shpUrl"),
        };

        const validated = RodoviaSchema.parse(rawData);

        const rodovia = await prisma.rodovia.update({
            where: { id: BigInt(id) },
            data: {
                nome: validated.nome,
                codigo: validated.codigo || null,
                concessionaria: validated.concessionaria || null,
                extensao: validated.extensao,
                kmlUrl: validated.kmlUrl,
                shpUrl: validated.shpUrl
            }
        });

        revalidatePath("/settings");
        return { success: true, data: serialize(rodovia) };

     } catch (error: any) {
         return { success: false, error: error.message };
     }
}

export async function getRodoviaDetails(id: string) {
    try {
        const rodovia = await prisma.rodovia.findUnique({
            where: { id: BigInt(id) },
            include: {
                marcos_quilometricos: {
                    orderBy: { km: 'asc' }
                },
                segmentos_homogeneos: {
                    orderBy: { kmInicial: 'asc' }
                }
            }
        });
        if(!rodovia) return { success: false, error: "Rodovia não encontrada" };
        return { success: true, data: serialize(rodovia) };
    } catch (error) {
        return { success: false, error: "Erro ao buscar detalhes" };
    }
}



export async function createMarco(formData: FormData) {
    try {
         const rawData = {
            rodovia_id: formData.get("rodovia_id"),
            nome: formData.get("nome"),
            km: formData.get("km"),
            latitude: parseFloat(formData.get("latitude") as string),
            longitude: parseFloat(formData.get("longitude") as string),
            segmento_origem: formData.get("segmento_origem"),
        };

        const validated = MarcoSchema.parse(rawData);

        const marco = await prisma.marcoQuilometrico.create({
            data: {
                uuid: uuidv4(),
                rodovia_id: BigInt(validated.rodovia_id),
                nome: validated.nome,
                km: validated.km,
                latitude: validated.latitude,
                longitude: validated.longitude,
                segmento_origem: validated.segmento_origem || null
            }
        });
        
        revalidatePath("/settings");
        return { success: true, data: serialize(marco) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}



export async function createSegmentoHomogeneo(formData: FormData) {
    try {
         const rawData = {
            rodovia_id: formData.get("rodovia_id"),
            nome: formData.get("nome"),
            descricao: formData.get("descricao"),
            kmInicial: formData.get("kmInicial"),
            kmFinal: formData.get("kmFinal"),
        };
        
        const validated = SegmentoHomogeneoSchema.parse(rawData);

        // Geometria requer raw query devido ao tipo Unsupported do Prisma



        const uuid = uuidv4();
        await prisma.$executeRaw`
            INSERT INTO segmentos_homogeneos (uuid, rodovia_id, nome, descricao, kmInicial, kmFinal, geom, createdAt, updatedAt)
            VALUES (
                ${uuid}, 
                ${BigInt(validated.rodovia_id)}, 
                ${validated.nome}, 
                ${validated.descricao || null}, 
                ${validated.kmInicial}, 
                ${validated.kmFinal}, 
                ST_GeomFromText('LINESTRING(0 0, 1 1)'), -- Placeholder geometry
                NOW(), 
                NOW()
            )
        `;

        return { success: true, message: "Segmento criado com sucesso (Geometria placeholder)" };

    } catch (error: any) {
        console.error("Erro ao criar segmento:", error);
        return { success: false, error: error.message };
    }
}
