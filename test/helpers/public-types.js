module.exports = `
import { mdimg, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } from 'mdimg';
import type {
  IConvertOptions, IConvertResponse, IConvertTypeOption, IConvertEncodingOption,
  IOutputProcessor, IOutputProcessorContext, IOutputProcessorResult,
  IHighlightJsTheme, IExtensionOptions, IExtensionContext,
  IExtensionInjectResult, IExtension, IHooks, IPlugin,
} from 'mdimg';

const theme: IHighlightJsTheme = 'base16/dracula';
const plugin: IPlugin = { name: 'consumer' };
const html: IOutputProcessor = createHtmlOutputProcessor();
const options: IConvertOptions = { inputText: '# Consumer', plugins: [plugin], extensions: { highlightJs: { theme, language: 'typescript', ignoreIllegals: true }, mermaid: { theme: 'default', securityLevel: 'strict', flowchart: { htmlLabels: true }, dompurifyConfig: { ADD_TAGS: ['custom-tag'] } } }, outputProcessor: html };
const response: Promise<IConvertResponse> = mdimg(options);
mdimg({ inputText: '# HTML', outputFilename: 'out.html', outputProcessor: html });
mdimg({ inputText: '# PDF', outputFilename: 'out.pdf', outputProcessor: createPdfOutputProcessor({ format: 'A4' }) });
void [response, createImageOutputProcessor('png', undefined, 'binary')];
// @ts-expect-error Highlight.js options must retain their type errors.
mdimg({ extensions: { highlightJs: { language: 123 } } });
// @ts-expect-error Mermaid options must retain their type errors.
mdimg({ extensions: { mermaid: { securityLevel: 'invalid' } } });
// @ts-expect-error Mermaid's nested DOMPurify options must retain their type errors.
mdimg({ extensions: { mermaid: { dompurifyConfig: { ADD_TAGS: [123] } } } });
// @ts-expect-error Invalid encoding must retain its type error.
mdimg({ inputText: '# Consumer', encoding: 'utf8' });
// @ts-expect-error mdimg owns disk writes; PDF options cannot set path.
createPdfOutputProcessor({ path: 'out.pdf' });
// @ts-expect-error Internal runtime modules are not package entry points.
import { createMathJaxExtension } from 'mdimg/lib/extensions';
// @ts-expect-error Internal runtime modules are not package entry points.
import { createHtmlOutputProcessor as internalHtml } from 'mdimg/lib/output';
// @ts-expect-error Internal source paths are not package entry points.
import 'mdimg/src/mdimg.ts';
`;
