"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quotation } from "@/types";
import { format } from "date-fns";

// Utility to fetch an image from public and convert to base64
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const generatePdf = async (data: Quotation, customHeaderImage?: string | null) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let lastY = 10;

  // Load images from public directory
  let headerImage: string | null = null;
  let signatureImage: string | null = null;
  
  // Use custom header image if provided, otherwise try to load default
  if (customHeaderImage) {
    headerImage = customHeaderImage;
  } else {
    try {
      headerImage = await fetchImageAsBase64('/header.png');
    } catch (e) {
      console.warn('Could not load header.png, will use text header.');
    }
  }
  try {
    signatureImage = await fetchImageAsBase64('/Signature.png');
  } catch (e) {
    console.warn('Could not load Signatue.png, will skip signature image.');
  }

  const addTextHeader = () => {
    doc.setFontSize(18).setFont("times", "bold");
    doc.text(data.companyName, pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10).setFont("times", "normal");
    doc.text("All Kinds of Industrial & Decorative Painting, Sand & Shot Blasting & All Types of Labour Job Works.", pageWidth / 2, 22, { align: "center" });
    lastY = 35;
  };

  const addHeader = () => {
    if (headerImage) {
      try {
        // Determine image format from the data URL
        const imageFormat = headerImage.startsWith('data:image/jpeg') ? 'JPEG' : 
                           headerImage.startsWith('data:image/png') ? 'PNG' : 
                           headerImage.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        
        // Calculate image dimensions while maintaining aspect ratio
        const imageWidth = 190;
        let imageHeight = imageWidth * (68 / 767); // Default aspect ratio
        
        // For custom uploaded images, we'll use a reasonable height
        if (customHeaderImage) {
          imageHeight = 30; // Fixed height for custom images
        }
        
        doc.addImage(headerImage, imageFormat, 10, 5, imageWidth, imageHeight);
        lastY = 5 + imageHeight + 10; // Added extra space here
      } catch (error) {
        console.error("Error adding header image:", error);
        addTextHeader();
      }
    } else {
      addTextHeader();
    }
  };
  
  const addFooter = () => {
      // Calculate height needed for text to make box dynamic
      doc.setFontSize(9).setFont("times", "normal");
      const addressLines = doc.splitTextToSize(`Add: ${data.companyAddress}`, pageWidth - 25);
      const contactLine = `Email- ${data.companyEmail || ''} (M) ${data.companyPhone || ''}`;
      
      const textHeight = (addressLines.length * 4) + 4; // 4mm per line for address, 4mm for contact
      const rectHeight = textHeight + 6; // 3mm padding top/bottom
      const rectY = pageHeight - rectHeight - 5;

      // Draw the box
      doc.setDrawColor(0);
      doc.rect(10, rectY, pageWidth - 20, rectHeight, 'S');
      
      let textY = rectY + 5;

      // Center the address lines
      doc.text(addressLines, pageWidth / 2, textY, { align: 'center' });
      textY += (addressLines.length * 4);
      
      // Center the contact line
      doc.text(contactLine, pageWidth / 2, textY, { align: 'center' });
  };


  addHeader();

  const rightX = pageWidth - 15;
  doc.setFontSize(11).setFont("times", "normal");
  doc.text(`Date: ${format(data.quoteDate, "dd-MM-yyyy")}`, rightX, lastY, { align: "right" });

  doc.text("To,", 15, lastY);
  lastY += 6;
  
  doc.setFontSize(12); // Increase font size for customer details
  const customerBlockWidth = 100; // Increased width for text wrapping

  doc.setFont("times", "bold");
  const customerNameLines = doc.splitTextToSize(data.customerName, customerBlockWidth);
  doc.text(customerNameLines, 15, lastY);
  lastY += (Math.max(1, customerNameLines.length) * 5);
  
  doc.setFont("times", "normal");
  const customerAddressLines = doc.splitTextToSize(data.customerAddress, customerBlockWidth);
  doc.text(customerAddressLines, 15, lastY);
  lastY += (customerAddressLines.length * 5);
  
  doc.setFontSize(11); // Reset font size for subsequent sections

  if (data.kindAttention) {
    lastY += 2;
    doc.setFont("times", "bold");
    doc.text("Kind Attention:-", 15, lastY);
    doc.setFont("times", "normal");
    doc.text(data.kindAttention, 45, lastY);
    lastY += 5;
  }

  lastY += 5;
  doc.setFont("times", "bold");
  doc.text("Sub:-", 15, lastY);
  doc.setFont("times", "normal");
  const subjectLines = doc.splitTextToSize(data.subject, 160);
  doc.text(subjectLines, 27, lastY);
  lastY += (subjectLines.length * 5) + 5;
  
  doc.text("Dear Sir,", 15, lastY);
  lastY += 7;

  const tableData = data.lineItems.map((item, index) => [
    index + 1,
    item.description,
    (item.quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    item.unit,
    (item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
  ]);
  const total = data.lineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.rate || 0), 0);
  
  tableData.push(['', '', '', '', '', total.toLocaleString('en-IN', { minimumFractionDigits: 2 })]);

  autoTable(doc, {
      startY: lastY,
      head: [["Sr. No.", "Description", "Qty", "Unit", "Rate", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: {
          fillColor: [255, 255, 255],
          textColor: 0,
          fontStyle: 'bold',
          lineColor: 0,
          lineWidth: 0.1,
          font: 'times',
          halign: 'center',
      },
      styles: {
          lineColor: 0,
          lineWidth: 0.1,
          textColor: 0,
          fontSize: 10,
          font: 'times',
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
      didDrawCell: (hookData) => {
        if (hookData.section === 'body' && hookData.row.index === data.lineItems.length) {
          doc.setDrawColor(0);
          doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
          if (hookData.column.index === 5) {
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
      willDrawCell: (hookData) => {
        if(hookData.section === 'body' && hookData.row.index === data.lineItems.length && hookData.column.index < 5) {
            hookData.cell.text = [''];
        }
      }
  });

  let finalY = (doc as any).lastAutoTable.finalY;
  
  const checkPageOverflow = (y: number) => {
      if (y > pageHeight - 40) { // 40mm margin from bottom
          doc.addPage();
          addHeader();
          return 20; // Start Y on new page
      }
      return y;
  }

  finalY = checkPageOverflow(finalY);
  finalY += 10;
  
  doc.setFontSize(10).setFont("times", "bold");
  doc.text("Term's & Condition :-", 15, finalY);
  finalY += 5;
  
  doc.setFontSize(9).setFont("times", "normal");
  const termsLines = doc.splitTextToSize(data.terms, 180);

  // Check for page overflow before printing terms
  if (finalY + (termsLines.length * 4) > pageHeight - 40) {
      doc.addPage();
      addHeader();
      finalY = lastY; // Reset Y on new page
  }
  
  doc.text(termsLines, 15, finalY);
  finalY += (termsLines.length * 4) + 10;
  finalY = checkPageOverflow(finalY);
  
  doc.setFontSize(11).setFont("times", "bold");
  doc.text(`For, ${data.companyName}`, 15, finalY);

  // Add signature image
  try {
      if (signatureImage) {
        // Signature aspect ratio from image properties is 289x68
        const imageWidth = 45; 
        const imageHeight = imageWidth * (68 / 289);
        finalY += 2; // space before signature
        doc.addImage(signatureImage, "PNG", 15, finalY, imageWidth, imageHeight);
        finalY += imageHeight;
      } else {
        finalY += 15; // fallback space
      }
  } catch (e) {
      console.error("Error adding signature image", e);
      finalY += 15; // fallback space
  }
  
  finalY = checkPageOverflow(finalY);
  doc.text(data.authorisedSignatory, 15, finalY);

  addFooter();
  doc.save(`${data.quoteName}.pdf`);
};
    
