declare module "jspdf" {
  export const jsPDF: any;
}

declare module "docx" {
  export const Document: any;
  export const Packer: any;
  export const Paragraph: any;
  export const TextRun: any;
  export const Table: any;
  export const TableRow: any;
  export const TableCell: any;
  export const WidthType: any;
  export const AlignmentType: any;
  export const BorderStyle: any;
}

interface Window {
  deleteDepSupp: (id: string) => void;
  showAddDepSuppModal: (extIdOverride?: string) => void;
  saveDepSupp: () => void;
  addOffreRow: (type: string) => void;
  removeOffreRow: (btn: HTMLButtonElement) => void;
  exportDimesBilan: () => void;
  addNvRow: () => void;
  removeNvRow: (idx: number) => void;
  _currentDepSuppExtId?: string;
}
