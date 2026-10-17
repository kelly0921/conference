import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=createHash('sha256');
for(const path of ['functions/api/assistant.ts','src/assistant-contract.ts','src/assistant-grounding.ts'])hash.update((await readFile(path,'utf8')).replace(/\r\n/g,'\n'));
const version=JSON.stringify({sourceFingerprint:hash.digest('hex')})+'\n';
if(process.argv.includes('--check')){if(await readFile('src/assistant-build.json','utf8')!==version)throw Error('Rebuild the AI source fingerprint with npm run build:assistant.');}
else await writeFile('src/assistant-build.json',version);
const result=await build({entryPoints:['src/assistant-client.js'],bundle:true,format:'iife',globalName:'PlaybookAssistant',target:'es2022',write:false,legalComments:'none'});
const output=result.outputFiles[0].text;
if(process.argv.includes('--check')) {if(await readFile('assets/assistant.js','utf8')!==output)throw Error('Rebuild the AI client with npm run build:assistant.');}
else await writeFile('assets/assistant.js',output);
await mkdir('.qa-cache/assistant-tests',{recursive:true});
await build({entryPoints:['functions/api/assistant.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/server.mjs'});
await build({entryPoints:['src/assistant-contract.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/contract.mjs'});
await build({entryPoints:['src/assistant-grounding.ts'],bundle:true,platform:'neutral',format:'esm',outfile:'.qa-cache/assistant-tests/grounding.mjs'});
console.log('AI client and test modules checked.');
