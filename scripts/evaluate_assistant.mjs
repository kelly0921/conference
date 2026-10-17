// Offline fixtures are deterministic regression checks. Live runs are opt-in,
// bounded, use fictional inputs only, and never retry a provider request.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateInput,validateResult} from '../.qa-cache/assistant-tests/contract.mjs';
import {validateSchedule,inspectSchedule,interval} from '../.qa-cache/assistant-tests/grounding.mjs';
const fixtures=JSON.parse(await readFile('tests/fixtures/assistant-accuracy.json','utf8'));
const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
const live=args.includes('--live'),limit=Number(args.includes('--limit')?value('--limit'):4);
if(!Number.isInteger(limit)||limit<1||limit>6)throw Error('Use a live limit between one and six.');
const fingerprint=createHash('sha256');for(const path of ['functions/api/assistant.ts','src/assistant-contract.ts','src/assistant-grounding.ts'])fingerprint.update(await readFile(path));
const report={created:new Date().toISOString(),sourceFingerprint:fingerprint.digest('hex'),scope:'Fictional regression checks; not a population accuracy estimate.',offline:[],beforeAfter:[],live:[]};
for(const f of fixtures){
  let error=null;
  try{
    if(f.kind==='response')validateResult(f.result,validateInput(f.input));
    else{
      const schedule=validateSchedule(f.schedule);
      if(!f.expected.error){
        assert.deepEqual(inspectSchedule(schedule).map(x=>x.kind),f.expected.kinds);
        if(f.expected.durationMinutes!==undefined){const [a,b]=interval(schedule.sessions[0]);assert.equal((b-a)/60000,f.expected.durationMinutes);}
      }
    }
  }catch(e){error=e.message;}
  const passed=!!error===f.expected.error;
  report.offline.push({id:f.id,passed,expectedRejection:f.expected.error,...(error?{detail:error}:{})});
}
for(const f of fixtures.filter(f=>f.id.startsWith('regression-'))){
  const oldInput={...f.input,version:1};delete oldInput.schedule;
  const oldResult=structuredClone(f.result);delete oldResult.recommendedSessionIds;
  for(const s of oldResult.suggestions){delete s.evidenceQuotes;s.evidenceIds=['profile'];}
  let beforeAccepted=true;try{validateResult(oldResult,validateInput(oldInput));}catch{beforeAccepted=false;}
  let afterRejected=false;try{validateResult(f.result,validateInput(f.input));}catch{afterRejected=true;}
  report.beforeAfter.push({id:f.id,beforeAccepted,afterRejected,note:'Synthetic replay of an observed bad claim; not a fresh baseline model call.'});
}
if(live){
  if(!args.includes('--base'))throw Error('Live runs require --base pointing to the development preview.');
  const url=new URL(value('--base'));
  if(url.origin!=='https://develop-conference-playbook.conference-playbook.pages.dev')throw Error('Live evaluation is restricted to the development preview.');
  const cases=fixtures.filter(f=>f.live&&(!args.includes('--case')||f.id===value('--case'))).slice(0,limit);
  if(!cases.length)throw Error('No matching fictional live case.');
  for(const f of cases){
    const input=validateInput(f.input),start=performance.now();
    let status=0,body,passed=false,error='';
    try{
      const response=await fetch(new URL('/api/assistant',url),{method:'POST',headers:{Origin:url.origin,'Content-Type':'application/json','User-Agent':'Mozilla/5.0 Conference Playbook fictional evaluation'},body:JSON.stringify({consent:true,input}),signal:AbortSignal.timeout(40000)});
      status=response.status;body=await response.json();
      if(!response.ok)throw Error(body.error||'Endpoint unavailable.');
      validateResult(body.result,input);passed=true;
    }catch(e){error=e.message;}
    report.live.push({id:f.id,split:f.split||'development',status,passed,ms:Math.round(performance.now()-start),...(error?{error}:{}),input,response:body,manualReview:'Pending: goal relevance, unknown access/funding, invented opportunities and usefulness require human review.'});
    console.log(`${f.id}: HTTP ${status}, checked=${passed}${error?' ('+error+')':''}`);
    if(status===429||status===503)break;
  }
}
await mkdir('.qa-cache',{recursive:true});
const path='.qa-cache/assistant-accuracy-'+(live?'live':'offline')+'.json';
await writeFile(path,JSON.stringify(report,null,2)+'\n');
console.log(`${report.offline.filter(f=>f.passed).length}/${report.offline.length} offline fixtures; ${report.beforeAfter.length} baseline replays. Report: ${path}`);
if(report.offline.some(f=>!f.passed)||report.live.some(f=>!f.passed))process.exitCode=1;
