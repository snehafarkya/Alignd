"use client";

export async function extractTextFromPDF(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");

    // ✅ Use LOCAL worker (most reliable)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items.map((item) => item.str || "");
      fullText += strings.join(" ") + "\n";
    }

    if (!fullText.trim()) {
      throw new Error("No readable text found");
    }

    return fullText;
  } catch (error) {
    console.error("PDF PARSE ERROR:", error);
    throw error;
  }
}