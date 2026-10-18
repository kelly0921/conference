// Explicit public assets only. Server sources, local state, dependencies and secrets never enter dist.
import {cp,mkdir,rm,readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dest=resolve(root,'dist');
if(relative(root,dest)!=='dist')throw Error('Unexpected output directory.');
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
for(const file of ['index.html','_routes.json'])await cp(resolve(root,file),resolve(dest,file));
for(const folder of ['assets','design','output/pdf'])await cp(resolve(root,folder),resolve(dest,folder),{recursive:true});
await readFile(resolve(dest,'assets/assistant.js'));
console.log('Built public Pages assets in dist.');
