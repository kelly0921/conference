// Fictional inputs only. Local test credentials never enter reports or request bodies.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateInput,validateResult,validateProviderResult,redact} from '../.qa-cache/assistant-tests/contract.mjs';
import {validateSchedule,inspectSchedule,interval} from '../.qa-cache/assistant-tests/grounding.mjs';
import {providerRequest,extractResult,readBounded,failureCode} from '../.qa-cache/assistant-tests/server.mjs';
const preview='https://develop-conference-playbook.conference-playbook.pages.dev';
const model='gpt-5.4-mini';
// Official model rates verified 2026-10-17. Charge cached input at the full rate.
const inputRate=0.75/1e6,outputRate=4.50/1e6;
export function options(args){
  const flags=new Set(['--live','--direct']),values=new Set(['--base','--case','--cases','--limit','--repeat','--suite','--budget-usd']),parsed={};
  for(let i=0;i<args.length;i++){
    const key=args[i];if(Object.hasOwn(parsed,key))throw Error('Duplicate evaluation option.');
    if(flags.has(key))parsed[key]=true;
    else if(values.has(key)&&args[i+1]&&!args[i+1].startsWith('--'))parsed[key]=args[++i];
    else throw Error('Unsupported or missing evaluation option.');
  }
  const direct=!!parsed['--direct'],live=!!parsed['--live'],limit=Number(parsed['--limit']??4),repeat=Number(parsed['--repeat']??1),budget=Number(parsed['--budget-usd']??0.5),suite=parsed['--suite']||'regression';
  if(direct&&!live)throw Error('--direct requires an explicit --live.');
  if(!Number.isInteger(limit)||limit<1||limit>(direct?24:6))throw Error('Use at most six preview attempts or twenty-four direct test attempts.');
  if(!Number.isInteger(repeat)||repeat<1||repeat>3)throw Error('Use one to three repeats.');
  if(!Number.isFinite(budget)||budget<=0||budget>1)throw Error('The direct evaluation budget must be above zero and at most USD 1.');
  if(!['regression','quality'].includes(suite))throw Error('Unknown evaluation suite.');
  if(parsed['--case']&&parsed['--cases'])throw Error('Choose --case or --cases.');
  if(live&&!direct&&parsed['--base']!==preview)throw Error('Hosted evaluation requires the exact development preview --base.');
  return {live,direct,limit,repeat,budget,suite,ids:String(parsed['--cases']||parsed['--case']||'').split(',').filter(Boolean)};
}
export function costBound(payload){return (Buffer.byteLength(JSON.stringify(payload),'utf8')+1024)*inputRate+payload.max_output_tokens*outputRate;}
function actualCost(usage,bound){
  if(!usage||!Number.isInteger(usage.input_tokens)||!Number.isInteger(usage.output_tokens)||usage.input_tokens<0||usage.output_tokens<0)return bound;
  return Math.max(usage.input_tokens*inputRate+usage.output_tokens*outputRate,0);
}
export async function runLive(cases,config,fetcher=fetch,onProgress=async()=>{}){
  const report={sourceFingerprint:config.sourceFingerprint,target:config.direct?'direct-openai':'hosted-preview',model,budgetUsd:config.direct?config.budget:null,conservativeSpendUsd:0,live:[],stopReason:null};
  if(!config.direct){
    const response=await fetcher(preview+'/api/assistant',{headers:{'User-Agent':'Mozilla/5.0 Conference Playbook evaluation'},signal:AbortSignal.timeout(8000),redirect:'error'});
    const capability=JSON.parse(await readBounded(response.body,8192));
    if(!response.ok||!capability.available||capability.sourceFingerprint!==config.sourceFingerprint)throw Error('Preview unavailable or source fingerprint differs. Deploy the tested code before evaluating it.');
  }
  outer:for(let iteration=1;iteration<=config.repeat;iteration++)for(const f of cases){
    if(report.live.length>=config.limit){report.stopReason='attempt_limit';break outer;}
    if(config.suite==='quality'&&f.fictional!==true)throw Error('Only the checked-in fictional quality cases may be sent.');
    const input=validateInput(f.input);
    if(redact(JSON.stringify(input))!==JSON.stringify(input))throw Error('Remove private details from the fictional evaluation fixture.');
    const payload=providerRequest(input,model),bound=costBound(payload);
    if(config.direct&&report.conservativeSpendUsd+bound>config.budget){report.stopReason='budget_limit';break outer;}
    const start=performance.now();let status=0,body,result,error='',code='',providerRaw;
    try{
      const response=await fetcher(config.direct?'https://api.openai.com/v1/responses':preview+'/api/assistant',{
        method:'POST',headers:config.direct?{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'}:{Origin:preview,'Content-Type':'application/json','User-Agent':'Mozilla/5.0 Conference Playbook fictional evaluation'},
        body:JSON.stringify(config.direct?payload:{consent:true,input}),signal:AbortSignal.timeout(config.direct?25000:40000),redirect:'error'
      });status=response.status;
      if(config.direct&&!response.ok){await response.body?.cancel();code='provider_http_'+status;throw Error('Provider request failed. Response body was discarded to protect credentials.');}
      body=JSON.parse(await readBounded(response.body,131072));
      if(!response.ok){code=body.code||'endpoint_http_'+status;throw Error(body.error||'Endpoint unavailable.');}
      if(config.direct){providerRaw=body;result=validateProviderResult(extractResult(body),input);}else result=validateResult(body.result,input);
    }catch(e){code=code||failureCode(e);error=config.direct?'Direct test request or response validation failed ('+code+').':e.message;}
    if(config.direct)report.conservativeSpendUsd+=actualCost(providerRaw?.usage,bound);
    const record={id:f.id,iteration,split:f.split||'development',status,passed:!!result,contractAccepted:!!result,ms:Math.round(performance.now()-start),...(error?{error,code}:{}),input,response:result?{result,model:config.direct?(body.model||model):body.model}:body,...(providerRaw?{providerRaw}:{}),manualReview:{status:'pending',criteria:f.rubric||['Goal relevance','Unverified access and funding','Invented opportunities','Usefulness']}};
    if(config.direct&&!providerRaw)delete record.response;
    report.live.push(record);await onProgress(report,record);
    if([401,403,429,503].includes(status)){report.stopReason='service_or_quota';break outer;}
  }
  return report;
}
async function main(){
  const config=options(process.argv.slice(2));
  const fixtures=JSON.parse(await readFile('tests/fixtures/assistant-accuracy.json','utf8'));
  const sourceFingerprint=JSON.parse(await readFile('src/assistant-build.json','utf8')).sourceFingerprint;
  const report={created:new Date().toISOString(),sourceFingerprint,scope:'Fictional checks; acceptance is not a correctness rate.',offline:[],beforeAfter:[],live:[]};
  for(const f of fixtures){
    let error=null;
    try{
      if(f.kind==='response')validateResult(f.result,validateInput(f.input));
      else{const s=validateSchedule(f.schedule);if(!f.expected.error){assert.deepEqual(inspectSchedule(s).map(x=>x.kind),f.expected.kinds);if(f.expected.durationMinutes!==undefined){const [a,b]=interval(s.sessions[0]);assert.equal((b-a)/60000,f.expected.durationMinutes);}}}
    }catch(e){error=e.message;}
    report.offline.push({id:f.id,passed:!!error===f.expected.error,expectedRejection:f.expected.error,...(error?{detail:error}:{})});
  }
  for(const f of fixtures.filter(f=>f.id.startsWith('regression-'))){
    const i={...f.input,version:1};delete i.schedule;delete i.sourceLinks;const r=structuredClone(f.result);delete r.recommendedSessionIds;
    for(const s of r.suggestions){delete s.evidenceQuotes;s.evidenceIds=['profile'];}
    let beforeAccepted=true,afterRejected=false;try{validateResult(r,validateInput(i));}catch{beforeAccepted=false;}try{validateResult(f.result,validateInput(f.input));}catch{afterRejected=true;}
    report.beforeAfter.push({id:f.id,beforeAccepted,afterRejected,note:'Constructed validator replay, not a fresh baseline model call.'});
  }
  const folder='.qa-cache/assistant-evals/'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
  await mkdir(folder,{recursive:true});const path=folder+'/report.json';
  const save=()=>writeFile(path,JSON.stringify(report,null,2)+'\n');await save();
  if(config.live){
    const suite=config.suite==='quality'?JSON.parse(await readFile('tests/fixtures/assistant-quality.json','utf8')):fixtures.filter(f=>f.live);
    const cases=config.ids.length?suite.filter(f=>config.ids.includes(f.id)):suite;
    if(!cases.length||config.ids.some(id=>!cases.some(f=>f.id===id)))throw Error('No matching fictional evaluation case.');
    let apiKey;
    if(config.direct){
      try{const file=await readFile('.dev.vars','utf8');if(file.length>16384)throw Error();apiKey=parseEnv(file).OPENAI_API_KEY;if(!apiKey)throw Error();}
      catch{throw Error('Add a private test OPENAI_API_KEY to .dev.vars. Do not paste it into chat.');}
    }
    Object.assign(report,await runLive(cases,{...config,apiKey,sourceFingerprint},fetch,async(partial,record)=>{
      Object.assign(report,partial);await save();console.log(`${record.id} #${record.iteration}: HTTP ${record.status}, checked=${record.passed}${record.code?', '+record.code:''}`);
    }));await save();
  }
  console.log(`${report.offline.filter(f=>f.passed).length}/${report.offline.length} offline fixtures; ${report.beforeAfter.length} validator replays. Report: ${path}`);
  if(report.offline.some(f=>!f.passed)||report.live.some(f=>!f.passed))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
