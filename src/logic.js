import * as XLSX from 'xlsx';

// --- SEUS DADOS REAIS ---
const IDENTIFICADORES_ESPECIAIS = {
  GABRIEL_MARQUES: ['gabrielscm2005@gmail.com', '21971576860', 'gabriel'],
  GABI: ['gabiflutter@gmail.com', '21998409073', 'gabi']
};

const extrairNomeSobrenome = (nomeCompleto) => {
  if (!nomeCompleto) return "";
  const nomeLimpo = nomeCompleto.trim();
  const partes = nomeLimpo.split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
};

const identificarPessoa = (row, teamMap = null) => {
  const nomeOriginal = row['NOME'] || "";
  const email = String(row['ENDEREÇO DE E-MAIL'] || "").toLowerCase().trim();
  const cel = String(row['CELULAR (WHATSAPP)'] || "").replace(/\D/g, "");

  // 1. Procura no Team Map dinâmico (se fornecido)
  if (teamMap) {
    if (email && teamMap[email]) return teamMap[email];
    // Verifica números de telefone ou outros IDS se você adicionar esse campo no TeamManager
    // Por enquanto, o TeamManager salva 'email' como identificador genérico
  }

  // 2. Fallback para Hardcoded (Legacy)
  if (IDENTIFICADORES_ESPECIAIS.GABRIEL_MARQUES.some(id => email === id || cel === id)) {
    return "Gabriel Marques";
  }
  if (IDENTIFICADORES_ESPECIAIS.GABI.some(id => email === id || cel === id)) {
    return "Gabi";
  }
  return extrairNomeSobrenome(nomeOriginal);
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const MINISTERIOS_DEFAULT = {
  'PRODUÇÃO': 1,
  'FILMAGEM': 3,
  'PROJEÇÃO': 1,
  'TAKE': 2,
  'ILUMINAÇÃO': 1
};

// ROLE DEFENISIVA - Validação de "Quem é Quem"
// Mapeia nomes (retornados por identificarPessoa) para suas funções fixas.
// Se a pessoa marcar errado no Forms, o sistema corrige e avisa.
const KNOWN_VOLUNTEERS = {
  "Gabi": "TAKE",
  "Gabriel Marques": "PRODUÇÃO", // Exemplo, pode ser override manual
  // Adicione outros aqui: "Nome Sobrenome": "FILMAGEM"
};

export const lerPlanilha = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // raw: false força tudo como texto (evita datas virarem números como 45201)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const normalizedData = jsonData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            // Limpa o nome da coluna (remove quebras de linha e espaços duplos)
            const cleanKey = key.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").toUpperCase().trim();
            newRow[cleanKey] = row[key];
          });
          return newRow;
        });
        resolve(normalizedData);
      } catch (error) {
        reject("Erro ao processar arquivo Excel.");
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const gerarRascunho = (df, ministeriosAtivos = ['PRODUÇÃO', 'FILMAGEM', 'PROJEÇÃO', 'TAKE', 'ILUMINAÇÃO'], teamData = []) => {
  if (!df || df.length === 0) return { error: "Planilha vazia." };

  const warnings = []; // Lista de avisos de correção

  // --- PREPARAÇÃO DOS DADOS DA EQUIPE (Dynamic Source of Truth) ---
  const knownRolesMap = {}; // Nome -> Role
  const teamIdentifiersMap = {}; // Email/ID -> Nome

  // Se veio dados dinâmicos, usa eles. Se não, usa o hardcoded (fallback) estável.
  if (teamData && teamData.length > 0) {
    teamData.forEach(member => {
      if (member.name) {
        // se veio o "roles" (array) no teamData, usamos ele. Fallback para "role" (string, legacy).
        let knownRoles = [];
        if (member.roles && Array.isArray(member.roles)) {
          knownRoles = member.roles;
        } else if (member.role) {
          knownRoles = [member.role];
        }

        if (knownRoles.length > 0) knownRolesMap[member.name] = knownRoles;

        // Mapeia Identificadores (Email)
        if (member.email) {
          teamIdentifiersMap[member.email.toLowerCase().trim()] = member.name;
        }
      }
    });
  } else {
    // Fallback para hardcoded se a lista estiver vazia (primeiro uso)
    // Converte o objeto legacy { "Nome": "Role" } para { "Nome": ["Role"] }
    Object.keys(KNOWN_VOLUNTEERS).forEach(key => {
      knownRolesMap[key] = [KNOWN_VOLUNTEERS[key]];
    });
  }

  // --- MUDANÇA CRÍTICA: MAPEAMENTO DE TODAS AS COLUNAS ---
  // Antes olhava só a primeira linha (df[0]). Agora olha TODAS para achar colunas raras.
  const todasAsColunas = new Set();
  df.forEach(row => {
    Object.keys(row).forEach(key => todasAsColunas.add(key));
  });

  // Filtra as datas usando Radar (Regex DD/MM)
  const colunasDatas = [...todasAsColunas].filter(col => /\d{1,2}\s*\/\s*\d{1,2}/.test(col));

  // Fallback de segurança se não achar datas no formato padrão
  if (colunasDatas.length === 0) {
    const colunasIgnorar = ['CARIMBO', 'E-MAIL', 'CELULAR', 'WHATSAPP', 'NOME', 'ÁREA', 'ID', 'OBSERVAÇÕES'];
    const fallbackCols = [...todasAsColunas].filter(col => !colunasIgnorar.some(ig => col.includes(ig)));
    if (fallbackCols.length > 0) colunasDatas.push(...fallbackCols);
  }

  // Ordena as datas para não ficarem bagunçadas (ex: dia 22 aparecer antes do dia 5)
  // Tenta extrair o dia/mês para ordenar cronologicamente
  colunasDatas.sort((a, b) => {
    const getNum = (str) => {
      const match = str.match(/(\d{1,2})\/(\d{1,2})/);
      if (!match) return 99999;
      return parseInt(match[2]) * 100 + parseInt(match[1]); // Mês * 100 + Dia
    };
    return getNum(a) - getNum(b);
  });

  const numServidoresPorArea = {};
  ministeriosAtivos.forEach(min => {
    if (MINISTERIOS_DEFAULT[min]) numServidoresPorArea[min] = MINISTERIOS_DEFAULT[min];
  });

  const shiftsCount = {};
  const MAX_SHIFTS_AUTO = 4;

  const escalaFinalSlots = [];
  const availableServersPerDay = {};

  const GABRIEL = "Gabriel Marques";
  const GABI = "Gabi";
  const ORDEM_HIERARQUIA = ['PRODUÇÃO', 'FILMAGEM', 'PROJEÇÃO', 'TAKE', 'ILUMINAÇÃO'];

  colunasDatas.forEach(colunaData => {
    // Busca quem marcou SIM (flexível)
    const diaDf = df.filter(row => {
      const val = String(row[colunaData] || "").toUpperCase().trim();
      return val === 'SIM' || val === 'S' || val === 'YES' || val.includes('SIM');
    });

    // Lista 'TODOS'
    const todosDoDia = new Set();
    diaDf.forEach(row => {
      const nomeIdentificado = identificarPessoa(row, teamIdentifiersMap);
      if (nomeIdentificado) todosDoDia.add(nomeIdentificado);
    });
    availableServersPerDay[colunaData] = { 'TODOS': [...todosDoDia].sort() };

    // Listas do Robô
    const dailyAutoPool = {};
    const dailyFullList = {};

    Object.keys(numServidoresPorArea).forEach(areaKey => {
      const servidoresAreaAuto = [];
      const servidoresAreaFull = [];

      diaDf.forEach(row => {
        const areaAtuacaoSheet = String(row['ÁREA DE ATUAÇÃO'] || '').toUpperCase();
        const nomeIdentificado = identificarPessoa(row, teamIdentifiersMap);
        if (!nomeIdentificado) return;

        // --- LÓGICA DEFENSIVA ---
        // 1. Determina a ROLE REAL (Known > Sheet)
        // let roleDetermined = null; -> Não usamos mais single role determined para comparar direto

        // Verifica se é uma role conhecida fixa (Map Dinâmico)
        const knownRoles = knownRolesMap[nomeIdentificado]; // Agora é array

        if (knownRoles && knownRoles.length > 0) {
          // Se temos uma role fixa (ou várias), verificamos se a areaKey atual está nas roles permitidas dessa pessoa.
          if (knownRoles.includes(areaKey)) {
            // Ele pode servir nesta área!
            // Adiciona direto.
            servidoresAreaFull.push(nomeIdentificado);
            if ((shiftsCount[nomeIdentificado] || 0) < MAX_SHIFTS_AUTO) {
              const alreadySelectedForDay = dailyAutoPool['PRODUÇÃO']?.includes(nomeIdentificado) || // Check duplication across areas for same day? 
                // Simplificação: Se ele tem múltiplas skills, ele pode entrar no pool de todas.
                // A escolha final (escalaFinalSlots) vai remover ele de sorteios subsequentes.
                // Mas cuidado: allocatedForDay é por dia.
                true;

              servidoresAreaAuto.push(nomeIdentificado);
            }
            return; // Já processamos, next row.
          }
          // Se a areaKey NÃO está nas skills dele, ele não entra (mesmo que a planilha diga algo louco, confiamos no Map).
        } else {
          // Se não é known, tenta inferir da string da Sheet (Modo Legacy/Discovery)
          let roleInferred = null;
          const palavras = areaAtuacaoSheet.split(/\s+/);
          if (palavras.includes('PRODUÇÃO') || palavras.includes('PRODUCAO')) roleInferred = 'PRODUÇÃO';
          else if (palavras.some(p => p.startsWith('FILM'))) roleInferred = 'FILMAGEM';
          else if (palavras.some(p => p.startsWith('PROJE'))) roleInferred = 'PROJEÇÃO';
          else if (['TAKE', 'FOTO', 'FOTOGRAF'].some(k => palavras.some(p => p.includes(k)))) roleInferred = 'TAKE';
          else if (palavras.some(p => p.startsWith('ILUMIN') || p === 'LUZ')) roleInferred = 'ILUMINAÇÃO';

          if (roleInferred === areaKey) {
            servidoresAreaFull.push(nomeIdentificado);
            if ((shiftsCount[nomeIdentificado] || 0) < MAX_SHIFTS_AUTO) {
              servidoresAreaAuto.push(nomeIdentificado);
            }
          }
        }
      });

      dailyAutoPool[areaKey] = shuffleArray([...new Set(servidoresAreaAuto)]);
      dailyFullList[areaKey] = [...new Set(servidoresAreaFull)].sort();
    });

    availableServersPerDay[colunaData] = { ...availableServersPerDay[colunaData], ...dailyFullList };

    const allocatedForDay = new Set();
    const areaCounters = {};
    Object.keys(numServidoresPorArea).forEach(k => areaCounters[k] = 0);

    // Casal
    let casalAtivo = false;
    let gabrielArea = null;
    const gabrielInProd = dailyAutoPool['PRODUÇÃO']?.includes(GABRIEL);
    const gabrielInFilm = dailyAutoPool['FILMAGEM']?.includes(GABRIEL);
    const gabiInTake = dailyAutoPool['TAKE']?.includes(GABI);

    if ((gabrielInProd || gabrielInFilm) && gabiInTake && !allocatedForDay.has(GABRIEL) && !allocatedForDay.has(GABI)) {
      casalAtivo = true;
      gabrielArea = gabrielInProd ? 'PRODUÇÃO' : 'FILMAGEM';
      allocatedForDay.add(GABRIEL);
      allocatedForDay.add(GABI);
      shiftsCount[GABRIEL] = (shiftsCount[GABRIEL] || 0) + 1;
      shiftsCount[GABI] = (shiftsCount[GABI] || 0) + 1;
    }

    // Alocação
    ORDEM_HIERARQUIA.forEach(area => {
      if (!numServidoresPorArea[area]) return;

      const maxSlots = numServidoresPorArea[area];
      const pool = dailyAutoPool[area] || [];
      let slotsPreenchidos = 0;

      if (casalAtivo && area === gabrielArea) {
        let funcao = area;
        if (area === 'FILMAGEM') funcao = `Câmera ${slotsPreenchidos + 1}`;
        escalaFinalSlots.push({ Data: colunaData, Funcao: funcao, Voluntario: GABRIEL, AreaOriginal: area });
        slotsPreenchidos++;
      }

      if (casalAtivo && area === 'TAKE') {
        let funcao = slotsPreenchidos === 0 ? "Fotografo" : "Suporte";
        escalaFinalSlots.push({ Data: colunaData, Funcao: funcao, Voluntario: GABI, AreaOriginal: area });
        slotsPreenchidos++;
      }

      for (let i = slotsPreenchidos; i < maxSlots; i++) {
        let funcao = area;
        if (area === 'TAKE') funcao = i === 0 ? "Fotografo" : "Suporte";
        else if (area === 'FILMAGEM') funcao = `Câmera ${i + 1}`;

        let voluntarioEscolhido = "Não designado";
        const candidato = pool.find(v => !allocatedForDay.has(v));

        if (candidato) {
          voluntarioEscolhido = candidato;
          allocatedForDay.add(candidato);
          shiftsCount[candidato] = (shiftsCount[candidato] || 0) + 1;
          const idx = pool.indexOf(candidato);
          if (idx > -1) pool.splice(idx, 1);
        }

        escalaFinalSlots.push({ Data: colunaData, Funcao: funcao, Voluntario: voluntarioEscolhido, AreaOriginal: area });
      }
    });
  });

  return { rascunho: escalaFinalSlots, disponiveis: availableServersPerDay, warnings };
};
