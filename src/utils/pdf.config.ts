// src/utils/pdf.config.ts
import * as pdfMakeModule from 'pdfmake/build/pdfmake';
// ¡Importamos el objeto de fuentes directamente!
// Basado en el contenido de vfs_fonts.js, este módulo exporta 'vfs' directamente.
import * as vfsFontsData from 'pdfmake/build/vfs_fonts'; // Cambiamos el nombre para mayor claridad

import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

// Extendemos el tipo para incluir vfs y createPdf
interface PdfMakeWithVFS {
  vfs: TFontDictionary;
  createPdf: (docDefinition: TDocumentDefinitions) => {
    getBuffer: (callback: (buffer: Uint8Array) => void) => void;
    download: (defaultFileName?: string) => void;
    open: () => void;
  };
}

// Creamos la instancia con tipado correcto
const pdfMake = pdfMakeModule as unknown as PdfMakeWithVFS;

// --- ¡ESTA ES LA CORRECCIÓN FINAL! ---
// Asignamos el objeto de fuentes directamente, ya que `vfs_fonts.js`
// exporta `vfs` a través de `module.exports = vfs;`
pdfMake.vfs = vfsFontsData as TFontDictionary; // Casteamos a TFontDictionary para el tipado correcto

export default pdfMake;
