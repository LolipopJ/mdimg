import{resolve as e,basename as t,dirname as r}from"path";import{accessSync as n,constants as i,readFileSync as s,existsSync as o,statSync as a,writeFileSync as l,mkdirSync as d,rmSync as c}from"fs";import m from"puppeteer";import{marked as p}from"marked";import{load as h}from"cheerio";const g=async e=>{const t=new p.Renderer;return t.code=({text:e,lang:t})=>"mermaid"==t?`<pre class="mermaid">${e}</pre>`:`<pre><code class="language-${t}">${e}</code></pre>`,p.parse(e,{renderer:t})},f=async({inputText:p,inputFilename:f,mdText:$,mdFile:y,outputFilename:b,type:x="png",width:T=800,height:_=600,encoding:v="binary",quality:j=100,htmlText:E,cssText:S,htmlTemplate:M="default",cssTemplate:H="default",theme:k="light",log:U=!1,puppeteerProps:F={}})=>{const L=["jpeg","png","webp"],q=["base64","binary","blob"],I={html:"",data:"base64"===v?"":Uint8Array.from([]),path:void 0};let W="";const A=f||y,C=p||$;if(A){const t=e(A);if(!o(t))throw new Error(`Error: input file ${t} is not exists.\n`);if(!a(t).isFile())throw new Error("Error: input is not a file.\n");W=s(t).toString(),U&&process.stderr.write(`Info: start to convert file ${t} to an image...\n`)}else{if(!C)throw new Error("Error: text or file is required to be converted.\n");W=C,U&&process.stderr.write("Info: start to convert text to an image...\n")}const D=v,O="binary"===D;if(!q.includes(D))throw new Error(`Error: encoding type ${D} is not supported. Valid types: ${q.join(", ")}.\n`);let R=x;if(!L.includes(R))throw new Error(`Error: output file type ${R} is not supported. Valid types: ${L.join(", ")}.\n`);let V,z="";if(O)if(b){const n=t(b),i=r(b),s=n.split("."),o=s.length;if(o<=1)z=e(i,`${n}.${R}`);else{const t=s[o-1];L.includes(t)?(R=t,z=e(b)):(U&&process.stderr.write(`Warning: output file type must be one of 'jpeg', 'png' or 'webp'. Use '${R}' type.\n`),z=e(i,`${n}.${R}`))}}else z=e("mdimg_output",function(e){const t=new Date;return`mdimg_${t.getFullYear()}_${w(t.getMonth()+1,2)}_${w(t.getDate(),2)}_${w(t.getHours(),2)}_${w(t.getMinutes(),2)}_${w(t.getSeconds(),2)}_${w(t.getMilliseconds(),3)}.${e}`}(R));"png"!==R&&(V=j>0&&j<=100?j:100);const K=(({inputHtml:t,htmlText:r,cssText:o,htmlTemplate:a,cssTemplate:l,theme:d,log:c})=>{let m=r,p=o;if(!m){let t=e(__dirname,"../template/html",`${a}.html`);try{n(t,i.R_OK)}catch(r){c&&process.stderr.write(`Warning: HTML template ${t} is not found or unreadable. Use default HTML template.\n${r}\n`),t=e(__dirname,"../template/html/default.html")}m=s(t).toString()}if(!p){let t=e(__dirname,"../template/css",`${l}.css`);try{n(t,i.R_OK)}catch(r){c&&process.stderr.write(`Warning: CSS template ${t} is not found or unreadable. Use default CSS template.\n${r}\n`),t=e(__dirname,"../template/css/default.css")}p=s(t).toString()}const g=h(m);return g("head").append(`<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>mdimg rendering preview</title>\n<style>${p}</style>\n\n\x3c!-- highlight.js --\x3e\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/atom-one-${d}.min.css">\n<script defer="defer" src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js" onload="hljs.highlightAll();"><\/script>\n\n\x3c!-- MathJax --\x3e\n<script defer="defer" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>\n\n\x3c!-- Mermaid --\x3e\n<script defer="defer" type="module">\n  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';\n  mermaid.initialize({ startOnLoad: true, theme: ${"dark"===d?"dark":void 0} });\n<\/script>`),g(".markdown-body").html(t),g.html()})({inputHtml:await g(W),htmlText:E,cssText:S,htmlTemplate:u(M),cssTemplate:u(H),theme:k,log:U});I.html=K;const P=await m.launch({defaultViewport:{width:T,height:_},args:[`--window-size=${T},${_}`],...F}),B=A?r(e(A)):process.cwd(),J=e(B,`.mdimg_temp_${(new Date).getTime()}_${w(Math.floor(1e4*Math.random()),4)}.html`);try{l(J,K)}catch(e){process.stderr.write(`Warning: write temporary local HTML file failed, local files may not display correctly. ${e}\n`)}const Y=o(J);try{const e=await P.newPage();Y?await e.goto(`file://${J}`,{waitUntil:"networkidle0"}):await e.setContent(K,{waitUntil:"networkidle0"});const t=await e.$("#mdimg-body");if(!t)throw new Error(`Error: missing HTML element with id: mdimg-body.\nHTML template ${M} is not valid.\n`);if("binary"===D||"blob"===D){O&&function(e){const t=r(e);try{d(t,{recursive:!0}),l(e,"")}catch(t){throw new Error(`Error: create new file ${e} failed.\n${String(t)}\n`)}}(z);const e=await t.screenshot({path:O?z:void 0,type:R,quality:V,encoding:"binary"});U&&process.stderr.write(`Info: convert to image${O?` and saved as ${z}`:""} successfully!\n`),I.data=e,I.path=O?z:void 0}else if("base64"===D){const e=await t.screenshot({type:R,quality:V,encoding:"base64"});U&&process.stderr.write("Info: convert to BASE64 encoded string successfully!\n"),I.data=e}}catch(e){throw new Error(String(e))}finally{await(async()=>{Y&&c(J),await P.close()})()}return I};function u(e){return e.split(".")[0]}function w(e,t){return String(e).padStart(t,"0")}export{f as convert2img,f as mdimg};
