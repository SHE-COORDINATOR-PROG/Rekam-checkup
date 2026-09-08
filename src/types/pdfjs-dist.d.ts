// pdfjs-dist tidak menyertakan deklarasi tipe untuk path "pdfjs-dist/build/pdf"
// yang dipakai lewat dynamic import di src/lib/pdf-extract.ts. File ini
// memberi tahu TypeScript agar modul tersebut diperlakukan sebagai `any`,
// supaya tidak gagal saat type-check di build Vercel.
declare module "pdfjs-dist/build/pdf";
