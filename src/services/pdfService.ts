import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTime } from '../utils/timeUtils';

export const generatePDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Relatório PDI Homo', pageWidth / 2, 20, { align: 'center' });
  
  // Info Section
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Data: ${data.date || new Date().toLocaleDateString('pt-BR')}`, 14, 32);
  doc.text(`Fila: ${data.queue}`, 14, 38);
  doc.text(`Responsável: ${data.responsible || 'N/A'}`, 14, 44);
  
  doc.text(`Modelo: ${data.model || 'N/A'}`, pageWidth / 2, 32);
  doc.text(`Chassi Inicial: ${data.chassiInitial || 'N/A'}`, pageWidth / 2, 38);
  doc.text(`Chassi Final: ${data.chassiFinal || 'N/A'}`, pageWidth / 2, 44);

  if (data.recordedStartTime) {
    doc.setFontSize(10);
    doc.text(`Início da Operação: ${data.recordedStartTime}${data.recordedEndTime ? ` - Fim: ${data.recordedEndTime}` : ''}`, 14, 48);
  }

  // Summary Section
  doc.setDrawColor(241, 245, 249); // slate-100
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(14, 52, pageWidth - 28, 40, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('RESUMO DE TEMPOS', 18, 57);
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${formatTime(data.leadTime)}`, 18, 66);
  doc.setFontSize(8);
  doc.text('Tempo de Operação', 18, 70);

  doc.setFontSize(11);
  doc.text(`${formatTime(data.totalTime)}`, 65, 66);
  doc.setFontSize(8);
  doc.text('Tempo das Atividades', 65, 70);

  doc.setFontSize(11);
  doc.text(`${formatTime(data.idleTime)}`, 115, 66);
  doc.setFontSize(8);
  doc.text('Tempo Ocioso', 115, 70);

  doc.setFontSize(11);
  doc.text(`${data.capacity}`, 165, 66);
  doc.setFontSize(8);
  doc.text('Capacidade (v/d)', 165, 70);

  // Row 2 of Summary Section
  doc.setFontSize(11);
  doc.text(`${data.queueCarsCount || 10}`, 18, 81);
  doc.setFontSize(8);
  doc.text('Carros na Fila', 18, 85);

  const avgTime = data.averageTimePerCar !== undefined ? data.averageTimePerCar : (data.queueCarsCount ? (data.totalTime / data.queueCarsCount) : (data.totalTime / 10));
  doc.setFontSize(11);
  doc.text(`${formatTime(avgTime)}`, 65, 81);
  doc.setFontSize(8);
  doc.text('Tempo Médio / Carro', 65, 85);

  // Table
  autoTable(doc, {
    startY: 98,
    head: [['#', 'Atividade', 'Tempo (MM:SS)']],
    body: data.activities.map((a: any) => [a.etapa, a.description, formatTime(a.duration)]),
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 98 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  const fileName = `PDI_${data.queue}_${data.model || 'Veiculo'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
