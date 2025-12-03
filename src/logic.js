import * as XLSX from 'xlsx';

// --- CONFIGURAÇÃO DE IDENTIDADE ÚNICA ---
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

const identificarPessoa = (row) => {
  const nomeOriginal = row['NOME'] || "";
  const email = String(row['ENDEREÇO DE E-MAIL'] || "").toLowerCase().trim();
  const cel = String(row['CELULAR (WHATSAPP)'] || "").replace(/\D/g, "");

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

export const lerPlanilha = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const normalizedData = jsonData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            newRow[key.toUpperCase().trim()] = row[key];
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

export const gerarRascunho = (df, ministeriosAtivos = ['PRODUÇÃO', 'FILMAGEM', 'PROJEÇÃO', 'TAKE', 'ILUMINAÇÃO']) => {
  if (!df || df.length === 0) return { error: "Planilha vazia." };
  
  const sampleRow = df[0];
  if (!('ÁREA DE ATUAÇÃO' in sampleRow)) return { error: "Coluna 'ÁREA DE ATUAÇÃO' não encontrada." };

  const numServidoresPorArea = {};
  ministeriosAtivos.forEach(min => {
    if (MINISTERIOS_DEFAULT[min]) numServidoresPorArea[min] = MINISTERIOS_DEFAULT[min];
  });

  const shiftsCount = {};
  const MAX_SHIFTS_AUTO = 4; 

  const colunasIgnorar = ['CARIMBO DE DATA/HORA', 'ENDEREÇO DE E-MAIL', 'CELULAR (WHATSAPP)', 'NOME', 'ÁREA DE ATUAÇÃO', 'ID'];
  const colunasDatas = Object.keys(sampleRow).filter(col => !colunasIgnorar.includes(col));
  
  const escalaFinalSlots = [];
  const availableServersPerDay = {}; 

  const GABRIEL = "Gabriel Marques";
  const GABI = "Gabi";
  const ORDEM_HIERARQUIA = ['PRODUÇÃO', 'FILMAGEM', 'PROJEÇÃO', 'TAKE', 'ILUMINAÇÃO'];

  colunasDatas.forEach(colunaData => {
    const diaDf = df.filter(row => String(row[colunaData]).toUpperCase().trim() === 'SIM');
    
    // Listas separadas: Uma pro Robô (limitada), uma para Você (completa por área)
    const dailyAutoPool = {}; 
    const dailyFullList = {}; 

    Object.keys(numServidoresPorArea).forEach(areaKey => {
      const servidoresAreaAuto = [];
      const servidoresAreaFull = [];
      
      diaDf.forEach(row => {
        const areaAtuacao = String(row['ÁREA DE ATUAÇÃO'] || '').toUpperCase();
        const nomeIdentificado = identificarPessoa(row);
        if (!nomeIdentificado) return;

        const palavras = areaAtuacao.split(/\s+/);
        let match = false;

        if (areaKey === 'PRODUÇÃO') match = palavras.includes('PRODUÇÃO') || palavras.includes('PRODUCAO');
        else if (areaKey === 'FILMAGEM') match = palavras.some(p => p.startsWith('FILM'));
        else if (areaKey === 'PROJEÇÃO') match = palavras.some(p => p.startsWith('PROJE'));
        else if (areaKey === 'TAKE') match = ['TAKE', 'FOTO', 'FOTOGRAF'].some(k => palavras.some(p => p.includes(k)));
        else if (areaKey === 'ILUMINAÇÃO') match = palavras.some(p => p.startsWith('ILUMIN') || p === 'LUZ');

        if (match) {
          // Adiciona na lista COMPLETA dessa área (Sem limites) -> Vai pro Dropdown
          servidoresAreaFull.push(nomeIdentificado);

          // Adiciona na lista do ROBÔ (Com limites)
          if ((shiftsCount[nomeIdentificado] || 0) < MAX_SHIFTS_AUTO) {
            servidoresAreaAuto.push(nomeIdentificado);
          }
        }
      });
      
      dailyAutoPool[areaKey] = shuffleArray([...new Set(servidoresAreaAuto)]);
      dailyFullList[areaKey] = [...new Set(servidoresAreaFull)].sort();
    });

    // Salva as listas categorizadas
    availableServersPerDay[colunaData] = dailyFullList;
    
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

    // Alocação Geral
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

  return { rascunho: escalaFinalSlots, disponiveis: availableServersPerDay };
};