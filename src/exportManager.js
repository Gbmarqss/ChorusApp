import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Função para remover emojis do texto (PDF não suporta emojis nativamente)
const cleanTextForPDF = (text) => {
  if (!text) return "";
  return text
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Remove emojis
    .trim(); // Remove espaços extras
};

export const exportarPDF = (dados) => {
  const doc = new jsPDF();
  
  // --- 1. CABEÇALHO DO DOCUMENTO (Visual Profissional) ---
  // Faixa Azul no Topo
  doc.setFillColor(63, 81, 181); // Azul Indigo
  doc.rect(0, 0, 210, 30, 'F'); 
  
  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("ESCALA WEBSHIFT", 105, 18, { align: 'center' }); // Centralizado
  
  // Subtítulo (Data)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Gerado em: ${dataGeracao}`, 105, 25, { align: 'center' });

  // --- 2. AGRUPAR DADOS ---
  const dadosAgrupados = {};
  const datasOrdenadas = [];
  
  dados.forEach(row => {
    if (!dadosAgrupados[row.Data]) {
      dadosAgrupados[row.Data] = [];
      datasOrdenadas.push(row.Data);
    }
    dadosAgrupados[row.Data].push(row);
  });

  // --- 3. GERAR TABELAS POR DIA ---
  let finalY = 40; // Começa após o cabeçalho azul

  datasOrdenadas.forEach((data) => {
    const itensDoDia = dadosAgrupados[data];
    
    // Limpa o texto da data (Remove emojis que quebram o PDF)
    const tituloData = cleanTextForPDF(data).toUpperCase();

    // Verifica espaço na página
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    // --- DESENHA O CARTÃO DO DIA ---
    
    // 1. Cabeçalho do Dia (Estilo Cartão)
    autoTable(doc, {
      startY: finalY,
      head: [[tituloData]], // Texto limpo sem emoji
      body: [],
      theme: 'plain',
      headStyles: {
        fillColor: [240, 242, 245], // Fundo Cinza Claro
        textColor: [63, 81, 181],   // Texto Azul
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: { top: 6, bottom: 6, left: 10 }
      },
      margin: { left: 14, right: 14 },
    });

    // 2. Corpo da Tabela (Lista de Voluntários)
    const rows = itensDoDia.map(item => {
      // Limpa emojis também dos nomes e funções se houver
      const funcaoLimpa = cleanTextForPDF(item.Funcao).toUpperCase();
      const voluntarioLimpo = cleanTextForPDF(item.Voluntario);
      
      return [funcaoLimpa, voluntarioLimpo];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY, // Cola na tabela de cima
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { 
            fontStyle: 'bold', 
            textColor: [100, 100, 100], // Cargo em cinza
            cellWidth: 70 
        }, 
        1: { 
            textColor: [0, 0, 0], // Nome em preto
            fontStyle: 'normal'
        }
      },
      head: [], // Sem cabeçalho repetido
      margin: { left: 14, right: 14 },
      
      // Zebra Striping (Linhas alternadas)
      didParseCell: function(data) {
        if (data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [255, 255, 255];
        } else {
          data.cell.styles.fillColor = [252, 252, 253]; // Cinza quase imperceptível
        }
        
        // Estiliza "Não designado"
        if (data.row.raw[1] === "Não designado") {
            if (data.column.index === 1) {
                data.cell.styles.textColor = [180, 180, 180]; // Cinza claro
                data.cell.styles.fontStyle = 'italic';
            }
        }
      }
    });

    // Espaço para o próximo dia
    finalY = doc.lastAutoTable.finalY + 8;
  });

  doc.save('escala_webshift.pdf');
};

export const exportarExcel = (dados) => {
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Escala");
  XLSX.writeFile(wb, "escala_webshift.xlsx");
};

export const exportarICS = (dados) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WebShift//App//PT\n";
  dados.forEach(row => {
    if (row.Voluntario === "Não designado") return;
    
    const match = row.Data.match(/(\d{1,2})\/(\d{1,2})/);
    if (!match) return;

    const [_, dia, mes] = match;
    const ano = new Date().getFullYear();
    const pad = (n) => n < 10 ? '0'+Number(n) : n;
    
    // Ajuste simples de horário (pode ser refinado depois)
    const dtStart = `${ano}${pad(mes)}${pad(dia)}T190000`;
    const dtEnd = `${ano}${pad(mes)}${pad(dia)}T220000`;

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `SUMMARY:WebShift - ${row.Funcao}\n`;
    icsContent += `DESCRIPTION:Voluntário: ${row.Voluntario}\n`;
    icsContent += `DTSTART;TZID=America/Sao_Paulo:${dtStart}\n`;
    icsContent += `DTEND;TZID=America/Sao_Paulo:${dtEnd}\n`;
    icsContent += "END:VEVENT\n";
  });
  icsContent += "END:VCALENDAR";
  
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  saveAs(blob, "escala_webshift.ics");
};

export const copiarWhatsApp = async (dados) => {
  if (!dados.length) throw new Error("Nenhuma escala para copiar.");
  
  const agrupado = Object.groupBy ? Object.groupBy(dados, ({ Data }) => Data) : dados.reduce((acc, item) => {
      (acc[item.Data] = acc[item.Data] || []).push(item);
      return acc;
  }, {});

  let texto = "*🗓️ ESCALA WEBSHIFT*\n\n";
  
  Object.keys(agrupado).forEach(data => {
    texto += `*${data}*\n`;
    agrupado[data].forEach(row => {
      // Aqui mantemos os emojis porque o WhatsApp suporta!
      let icone = "👤";
      if (row.Funcao.includes("PRODUÇÃO")) icone = "🎬";
      if (row.Funcao.includes("Câmera") || row.Funcao.includes("FILMAGEM")) icone = "🎥";
      if (row.Funcao.includes("Fotografo") || row.Funcao.includes("TAKE")) icone = "📸";
      if (row.Funcao.includes("ILUMINAÇÃO")) icone = "💡";
      if (row.Funcao.includes("PROJEÇÃO")) icone = "💻";

      const nome = row.Voluntario === "Não designado" ? "_Vago_" : `*${row.Voluntario}*`;
      texto += `${icone} ${row.Funcao}: ${nome}\n`;
    });
    texto += "──────────────────\n";
  });

  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (err) {
    throw new Error("Falha ao acessar área de transferência");
  }
};