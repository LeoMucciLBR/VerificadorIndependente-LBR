import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Limpeza (Ordem reversa de dependência)
  console.log('🧹 Limpando dados antigos...');
  
  // Limpar tabelas de junção e dependentes
  await prisma.formulaFase.deleteMany();
  await prisma.caracterizacaoFase.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.formula.deleteMany();
  await prisma.caracterizacao.deleteMany();
  await prisma.indicador.deleteMany();
  await prisma.variavel.deleteMany();
  await prisma.constante.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.fase.deleteMany();
  
  // Limpar tabelas principais
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.instituicao.deleteMany();


  // 2. Instituições
  console.log('🏢 Criando Instituições...');
  const instConcessionaria = await prisma.instituicao.create({
    data: {
      uuid: uuidv4(),
      nome: 'Concessionária ViaSul',
      nomeResponsavel: 'Roberto Diretor',
      emailResponsavel: 'roberto@viasul.com.br'
    }
  });

  const instAntt = await prisma.instituicao.create({
    data: {
      uuid: uuidv4(),
      nome: 'ANTT - Fiscalização',
      nomeResponsavel: 'Auditor Chefe',
      emailResponsavel: 'auditoria@antt.gov.br'
    }
  });


  // 3. Usuários
  console.log('👤 Criando Usuários...');
  const defaultPassword = await bcrypt.hash('123456', 10);
  const specificPassword = await bcrypt.hash('Mucci@190505', 10);

  // Admin Principal (Solicitado pelo usuário)
  const superAdmin = await prisma.user.create({
    data: {
      uuid: uuidv4(),
      name: 'Leonardo Mucci',
      email: 'leonardo.mucci@lbreng.com.br',
      passwordHash: specificPassword,
      role: "SUPER_ADMIN",
      podeCadastrar: true,
      isVerified: true,
      instituicaoId: instConcessionaria.id
    }
  });

  // Admin Genérico
  const admin = await prisma.user.create({
    data: {
      uuid: uuidv4(),
      name: 'Admin Sistema',
      email: 'admin@viasul.com',
      passwordHash: defaultPassword,
      role: "ADMIN",
      podeCadastrar: true,
      instituicaoId: instConcessionaria.id
    }
  });

  // Engenheiro
  const eng = await prisma.user.create({
    data: {
      uuid: uuidv4(),
      name: 'Engenheiro Carlos',
      email: 'engenharia@viasul.com',
      passwordHash: defaultPassword,
      role: "USER",
      podeCadastrar: true,
      instituicaoId: instConcessionaria.id
    }
  });

  // Fiscal
  const fiscal = await prisma.user.create({
    data: {
      uuid: uuidv4(),
      name: 'Fiscal Amanda',
      email: 'fiscal@antt.gov.br',
      passwordHash: defaultPassword,
      role: "AUDITOR",
      podeCadastrar: false,
      instituicaoId: instAntt.id
    }
  });


  // 4. Fases
  console.log('📅 Criando Fases...');
  const faseObras = await prisma.fase.create({
    data: {
      uuid: uuidv4(),
      nome: 'Fase de Trabalhos Iniciais',
      dataInicio: new Date('2024-01-01'),
      dataFim: new Date('2024-12-31'),
      criadoPor_user_id: superAdmin.id
    }
  });

  const faseRecup = await prisma.fase.create({
    data: {
      uuid: uuidv4(),
      nome: 'Fase de Recuperação',
      dataInicio: new Date('2024-06-01'),
      dataFim: new Date('2025-06-30'),
      criadoPor_user_id: superAdmin.id
    }
  });

  const faseManut = await prisma.fase.create({
    data: {
      uuid: uuidv4(),
      nome: 'Fase de Manutenção',
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2040-12-31'),
      criadoPor_user_id: superAdmin.id
    }
  });


  // 5. Grupos (Hierarquia)
  console.log('🌳 Criando Grupos...');
  
  // Grupo Pai: Pavimentação
  const gpPav = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Pavimentação e Melhorias',
      sigla: 'PV',
      peso: 0.6,
    }
  });

  // Subgrupos
  const gpCbuq = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Camada Asfáltica (CBUQ)',
      sigla: 'PV-CBUQ',
      peso: 0.5,
      grupoPai_id: gpPav.id
    }
  });

  const gpFresagem = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Fresagem e Reciclagem',
      sigla: 'PV-FRES',
      peso: 0.5,
      grupoPai_id: gpPav.id
    }
  });

  // Grupo Pai: Sinalização
  const gpSin = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Sinalização Viária',
      sigla: 'SN',
      peso: 0.3,
    }
  });

  const gpSinVert = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Sinalização Vertical',
      sigla: 'SN-VERT',
      peso: 0.5,
      grupoPai_id: gpSin.id
    }
  });
  
  const gpSinHor = await prisma.grupo.create({
    data: {
      uuid: uuidv4(),
      nome: 'Sinalização Horizontal',
      sigla: 'SN-HOR',
      peso: 0.5,
      grupoPai_id: gpSin.id
    }
  });


  // 6. Indicadores
  console.log('📊 Criando Indicadores...');
  
  const indVolume = await prisma.indicador.create({
    data: {
      uuid: uuidv4(),
      nome: 'Volume de CBUQ Aplicado',
      descricao: 'Total de massa asfáltica aplicada na pista de rolamento.',
      sigla: 'IND_CBUQ_VOL',
      unidadeMedida: 'ton',
      areaAtuacao: "INFRAESTRUTURA",
      grupo_id: gpCbuq.id
    }
  });

  const indPlacas = await prisma.indicador.create({
    data: {
      uuid: uuidv4(),
      nome: 'Placas Implantadas',
      descricao: 'Quantidade de placas de regulamentação ou advertência instaladas.',
      sigla: 'IND_PLACAS',
      unidadeMedida: 'unid',
      areaAtuacao: "INFRAESTRUTURA",
      grupo_id: gpSinVert.id
    }
  });

  const indIri = await prisma.indicador.create({
    data: {
      uuid: uuidv4(),
      nome: 'Índice de Irregularidade (IRI)',
      descricao: 'Medição do conforto ao rolamento.',
      sigla: 'IND_IRI',
      unidadeMedida: 'm/km',
      areaAtuacao: "QUALIDADE",
      grupo_id: gpPav.id
    }
  });


  // 7. Parâmetros (Constantes e Variáveis)
  console.log('🔢 Criando Parâmetros...');
  
  const constPreco = await prisma.constante.create({
    data: {
      uuid: uuidv4(),
      nome: 'CONST_PRECO_CBUQ',
      valor: 350.00
    }
  });

  const varMeta = await prisma.variavel.create({
    data: {
      uuid: uuidv4(),
      nome: 'META_CBUQ_MENSAL',
      valorPadrao: 5000.00
    }
  });
  
  // 8. Caracterizações (Vínculo técnico com fases)
  console.log('📝 Criando Caracterizações...');
  
  const caracCbuq = await prisma.caracterizacao.create({
    data: {
        uuid: uuidv4(),
        descricao: 'Aplicação de CBUQ Faixa C conforme norma DNIT 031/2006.',
        tipoRetorno: "NUMERICO",
        indicador_id: indVolume.id,
        caracterizacoes_fases: {
            create: [
                { fase_id: faseObras.id },
                { fase_id: faseRecup.id }
            ]
        }
    }
  });


  // 9. Fórmulas
  console.log('🧮 Criando Fórmulas...');
  
  const formDesempCbuq = await prisma.formula.create({
    data: {
        uuid: uuidv4(),
        nome: 'Índice de Execução de CBUQ',
        descricao: 'Mede o percentual atingido da meta mensal de pavimentação.',
        expressao: '({{IND_CBUQ_VOL}} / {META_CBUQ_MENSAL}) * 100',
        grupo_id: gpCbuq.id,
        isPrincipal: false,
        exigePeriodo: true,
        criadoPor_user_id: eng.id,
        formulas_fases: {
            create: [
                { fase_id: faseObras.id },
                { fase_id: faseRecup.id }
            ]
        }
    }
  });

  const formNotaGeral = await prisma.formula.create({
      data: {
          uuid: uuidv4(),
          nome: 'Nota de Avaliação Global',
          descricao: 'Média ponderada dos grupos principais.',
          expressao: '( {NOTA_PV} * 0.6 ) + ( {NOTA_SN} * 0.3 )',
          grupo_id: gpPav.id,
          isPrincipal: true,
          criadoPor_user_id: superAdmin.id,
          formulas_fases: {
              create: [ { fase_id: faseObras.id } ]
          }
      }
  });

  console.log('✅ Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
