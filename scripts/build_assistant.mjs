import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['src/assistant-client.js'],bundle:true,format:'iife',globalName:'PlaybookAssistant',target:'es2022',write:false,legalComments:'none'});
const output=result.outputFiles[0].text;
if(process.argv.includes('--check')) {if(await readFile('assets/assistant.js','utf8')!==output)throw Error('Rebuild the AI client with npm run build:assistant.');}
else await writeFile('assets/assistant.js',output);
await mkdir('.qa-cache/assistant-tests',{recursive:true});
await build({entryPoints:['functions/api/assistant.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/server.mjs'});
await build({entryPoints:['src/assistant-contract.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/contract.mjs'});
await build({entryPoints:['src/assistant-grounding.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/grounding.mjs'});
console.log('AI client and test modules checked.');
