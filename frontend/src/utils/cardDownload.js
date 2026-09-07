import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadCardAs(node, format, filenameBase = 'business-card') {
  if (!node) throw new Error('Card is not ready yet.');
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

  if (format === 'pdf') {
    const imgData = canvas.toDataURL('image/png');
    const orientation = canvas.width >= canvas.height ? 'l' : 'p';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filenameBase}.pdf`);
    return;
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, 0.95);
  triggerDownload(dataUrl, `${filenameBase}.${format === 'jpeg' ? 'jpg' : 'png'}`);
}
