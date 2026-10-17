import {spawn} from 'node:child_process';
await import('./build_site.mjs');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','pages','dev','dist','--d1','AI_LIMITS','--binding','AI_ENABLED=false','--binding','AI_MODEL=gpt-5.4-mini','--compatibility-date','2026-10-13','--port','4174','--ip','127.0.0.1'],{stdio:'inherit'});
child.on('exit',code=>process.exit(code||0));
