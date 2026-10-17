import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {options,runLive} from '../scripts/evaluate_assistant.mjs';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/assistant-accuracy.json',import.meta.url),'utf8'));
const fixture=fixtures.find(f=>f.id==='learning-goal-with-unknown-access');
const sample={...fixture,fictional:true,rubric:['Check usefulness manually.']};
const preview='https://develop-conference-playbook.conference-playbook.pages.dev';
const secret='fictional-evaluation-secret-not-real';
const direct={...options(['--live','--direct','--suite','quality','--limit','2','--repeat','3']),apiKey:secret,sourceFingerprint:'test-version'};
const completed=result=>{const r=structuredClone(result);for(const s of r.suggestions)delete s.evidenceIds;return Response.json({status:'completed',model:'gpt-5.4-mini-test',usage:{input_tokens:100,output_tokens:100},output:[{content:[{type:'output_text',text:JSON.stringify(r)}]}]});};

test('evaluation arguments bound paid attempts, repeats, budget and destination',()=>{
  for(const args of [['--direct'],['--live','--direct','--limit','25'],['--repeat','4'],['--budget-usd','1.01'],['--live','--base','https://conference-playbook.pages.dev'],['--unknown'],['--live','--live']])assert.throws(()=>options(args));
});
test('hosted evaluation refuses a different deployed source before any POST',async()=>{
  let calls=0;
  await assert.rejects(()=>runLive([sample],{...direct,direct:false},async(_url,init)=>{calls++;assert.equal(init.method,undefined);return Response.json({available:true,sourceFingerprint:'other-version'});}));
  assert.equal(calls,1);
});
test('explicit repeats respect the total cap, preserve review status and exclude credentials',async()=>{
  let calls=0,progress=0;
  const report=await runLive([sample],direct,async(url,init)=>{
    calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer '+secret);
    assert.equal(JSON.parse(init.body).store,false);assert.ok(!init.body.includes(secret));return completed(sample.result);
  },async()=>{progress++;});
  assert.equal(calls,2);assert.equal(progress,2);assert.deepEqual(report.live.map(r=>r.iteration),[1,2]);assert.equal(report.stopReason,'attempt_limit');
  assert.ok(report.live.every(r=>r.contractAccepted&&r.manualReview.status==='pending'));assert.ok(!JSON.stringify(report).includes(secret));
});
test('a too-small direct budget stops before any paid request',async()=>{
  let calls=0;const report=await runLive([sample],{...direct,budget:0.000001},async()=>{calls++;throw Error('unexpected');});
  assert.equal(calls,0);assert.equal(report.stopReason,'budget_limit');assert.equal(report.live.length,0);
});
test('provider authentication failures discard the body and stop the evaluation',async()=>{
  let calls=0;const report=await runLive([sample],direct,async()=>{calls++;return Response.json({error:secret},{status:401});});
  assert.equal(calls,1);assert.equal(report.live[0].code,'provider_http_401');assert.ok(!JSON.stringify(report).includes(secret));assert.equal(report.stopReason,'service_or_quota');
});
test('direct transport error messages cannot copy credentials into a report',async()=>{
  const report=await runLive([sample],{...direct,limit:1,repeat:1},async()=>{throw Error('Invalid header: Bearer '+secret);});
  assert.ok(!JSON.stringify(report).includes(secret));assert.equal(report.live[0].contractAccepted,false);
});
test('hosted quota responses stop repeats and never trigger a retry',async()=>{
  let posts=0;const report=await runLive([sample],{...direct,direct:false},async(url,init)=>{
    assert.equal(url,preview+'/api/assistant');
    if(!init.method)return Response.json({available:true,sourceFingerprint:'test-version'});
    posts++;return Response.json({error:'Rate limit reached.'},{status:429});
  });assert.equal(posts,1);assert.equal(report.live[0].status,429);assert.equal(report.stopReason,'service_or_quota');
});
test('a completed fictional response can fail validation and remains available for local diagnosis',async()=>{
  const bad=structuredClone(sample.result);bad.suggestions[0].evidenceQuotes[0].quote='This quote was invented.';
  const report=await runLive([sample],{...direct,limit:1,repeat:1},async()=>completed(bad));
  assert.equal(report.live[0].status,200);assert.equal(report.live[0].contractAccepted,false);assert.equal(report.live[0].code,'unsupported_evidence');assert.ok(report.live[0].providerRaw);assert.ok(!JSON.stringify(report).includes(secret));
});
