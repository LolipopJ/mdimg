import type { PDFOptions } from "puppeteer";
import type { IOutputProcessor } from "../interfaces";
/**
 * Built-in output processor that generates a PDF from the rendered page via
 * Puppeteer's `page.pdf()`.
 *
 * @example
 * ```ts
 * import { createPdfOutputProcessor } from 'mdimg';
 *
 * await mdimg({
 *   inputText: '# Hello',
 *   outputFilename: 'hello.pdf',
 *   outputProcessor: createPdfOutputProcessor({ printBackground: true }),
 * });
 * ```
 *
 * @param pdfOptions  Optional Puppeteer `PDFOptions` passed to `page.pdf()`.
 *                    Do **not** set `path` here — mdimg handles disk I/O.
 *                    @see https://pptr.dev/api/puppeteer.pdfoptions
 */
export declare const createPdfOutputProcessor: (pdfOptions?: Omit<PDFOptions, "path">) => IOutputProcessor;
