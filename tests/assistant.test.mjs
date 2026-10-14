import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {validateInput,validateResult,redact} from '../.qa-cache/assistant-tests/contract.mjs';
import {handleRequest,reserveQuota,extractResult,providerRequest,readBounded} from '../.qa-cache/assistant-tests/server.mjs';
import {Miniflare} from 'miniflare';
const require=createRequire(import.meta.url),{application}=require('../scripts/application_runtime.cjs');
const input={version:1,mode:'plan',goal:'Learn one useful testing technique',constraints:'One afternoon; leave time for a break.',agenda:'Fictional workshop: testing small services. Public source: https://example.org/session',context:[{id:'profile',label:'Conference profile',text:'Fictional developer conference, online, 2027-03-08, Europe/Paris.'}]};
const result={summary:'Focus on one relevant workshop and a realistic backup.',suggestions:[{title:'Check the testing workshop',action:'Read the abstract and check online access.',why:'It fits the specific learning goal and limited time.',uncertainty:'The timetable and pass requirements need checking.',guideId:'prioritize',evidenceIds:['goal','agenda'],worksheet:'targets',fields:[{key:'target-name',value:'Fictional testing workshop'},{key:'target-action',value:'Check the abstract and access.'},{key:'target-link',value:'https://example.org/session'}]}],questions:['What does your pass include?']};
const env={AI_ENABLED:'true',OPENAI_API_KEY:'fictional-test-key-not-real',AI_MODEL:'gpt-5.4-mini',AI_LIMITS:null};
const request=(body={consent:true,input},origin='https://example.org')=>new Request('https://example.org/api/assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(body)});
async function database() {
  const mf=new Miniflare({workers:[{config:{name:'test',compatibilityDate:'2026-10-13',manifest:{mainModule:'test.js',modules:{'test.js':{type:'esm',contents:'export default {fetch(){return new Response("test");}}'}}},env:{AI_LIMITS:{type:'d1',id:'test-db'}}}}]});
  return {mf,db:await mf.getD1Database('AI_LIMITS')};
}
test('sharing is selective and never includes private contact channels or confirmation references',()=>{
  const a=application();a.run("ensurePreset('ghc');getPlan().organizerUrl='https://example.org/?token=private';getPlan().notes=[{context:'Private Person',contact:'private@example.org',action:'Check the next step',reference:'SECRET-REFERENCE'}];getPlan().activities=[{label:'Session',date:'2027-03-08',reference:'SECRET-BOOKING'}];getPlan().budget.sources=[{terms:'SECRET-TERMS'}];getPlan().drafts.pre='SECRET-TEMPLATE'");
  a.context.form={'ai-goal':'Learn testing','ai-constraints':'Email me at test@example.org. 212-555-0199','ai-share-notes':true,'ai-share-schedule':true,'ai-share-budget':true};
  const json=a.run("JSON.stringify(PlaybookAssistant.buildInput(getPlan(),'review',form))");
  for(const secret of ['Private Person','private@example.org','SECRET-REFERENCE','SECRET-BOOKING','SECRET-TERMS','SECRET-TEMPLATE','token=private','test@example.org','212-555-0199'])assert.ok(!json.includes(secret),secret);
  assert.ok(json.includes('2027-03-08'));assert.ok(json.includes('[email removed]'));
  a.context.form={'ai-goal':'Learn testing'};assert.equal(a.run("PlaybookAssistant.buildInput(getPlan(),'plan',form).context.length"),1);
});
test('redaction keeps conference dates, currency and public sources readable',()=>{
  assert.equal(redact('2027-03-08 · EUR 1200 · https://example.org/session'),'2027-03-08 · EUR 1200 · https://example.org/session');
  assert.equal(redact('https://user:password@example.org/path?token=secret'),'[private link removed]');
});
test('input rejects unknown sections, excessive text and prototype payloads',()=>{
  assert.deepEqual(validateInput(input),input);
  for(const v of [{...input,contacts:[]},{...input,agenda:'x'.repeat(8001)},{...input,context:[{id:'contacts',label:'Contacts',text:'Private'}]},null])assert.throws(()=>validateInput(v));
});
test('response validation accepts editable suggestions and rejects invented source URLs or confirmation writes',()=>{
  assert.deepEqual(validateResult(result,input),result);
  for(const change of [{guideId:'made-up'},{evidenceIds:['contacts']},{worksheet:'schedule'},{worksheet:'__proto__'},{fields:[{key:'target-status',value:'User-reported confirmed'}]},{fields:[{key:'target-name',value:'Workshop'},{key:'target-action',value:'Go'},{key:'target-link',value:'https://invented.example.org'}]}]) {
    assert.throws(()=>validateResult({...result,suggestions:[{...result.suggestions[0],...change}]},input));
  }
});
test('using a suggestion creates a recoverable draft without changing records or completing tasks',()=>{
  const a=application();a.run("ensurePreset('ghc')");a.context.suggestion=result.suggestions[0];
  const before=a.run('JSON.stringify(getPlan().tasks)');
  assert.equal(a.run('PlaybookAssistant.stageSuggestion(getPlan(),suggestion).ok'),true);
  assert.equal(a.run('getPlan().targets.length'),0);assert.equal(a.run('JSON.stringify(getPlan().tasks)'),before);
  assert.equal(a.run("getPlan().worksheetDrafts['targets:new'].values['target-status']"),'Needs checking');
  const b=application(Object.fromEntries(a.values));assert.equal(b.run("getPlan().worksheetDrafts['targets:new'].values['target-name']"),'Fictional testing workshop');
  assert.equal(a.run('PlaybookAssistant.stageSuggestion(getPlan(),suggestion).ok'),false);
});
test('AI drafts do not replace another conference or committed debrief observations',()=>{
  const a=application();a.run("ensurePreset('ghc');getPlan().insight={observed:'Actual observation',learning:'Actual lesson'};ensurePreset('shpe')");a.context.suggestion={...result.suggestions[0],worksheet:'learning',fields:[{key:'insight-action',value:'Try a technique'}]};
  a.run('PlaybookAssistant.stageSuggestion(getPlan(),suggestion)');
  assert.equal(a.run('db.plans.ghc.insight.observed'),'Actual observation');assert.equal(a.run('db.plans.ghc.worksheetDrafts.learning'),undefined);
  assert.equal(a.run("getPlan().worksheetDrafts.learning.values['insight-action']"),'Try a technique');
});
test('blocked browser storage keeps proposed drafts in memory and reports failure',()=>{
  const a=application({},true);a.run("ensurePreset('ghc')");a.context.suggestion=result.suggestions[0];assert.equal(a.run('PlaybookAssistant.stageSuggestion(getPlan(),suggestion).stored'),false);
});
test('provider payload uses approved guides, structured outputs, a token bound and no tools or storage',()=>{
  const body=providerRequest(input,'gpt-5.4-mini');assert.equal(body.store,false);assert.equal(body.max_output_tokens,3500);assert.equal(body.text.format.strict,true);assert.equal(body.tools,undefined);
  assert.ok(body.instructions.includes('pending'));assert.ok(body.instructions.includes('What should I prioritize?'));assert.ok(body.instructions.includes('untrusted data'));
});
test('refused and incomplete provider responses cannot become suggestions',()=>{
  assert.throws(()=>extractResult({status:'incomplete',output:[]}));assert.throws(()=>extractResult({status:'completed',output:[{content:[{type:'refusal',refusal:'No'}]}]}));
});
test('request bodies are bounded before parsing',async()=>{
  await assert.rejects(()=>readBounded(new Response('x'.repeat(32769)).body,32768));
});
test('endpoint is disabled unless key, enabled flag and rate database all exist',async()=>{
  for(const e of [{...env,AI_LIMITS:undefined},{...env,AI_ENABLED:'false'},{...env,OPENAI_API_KEY:''}]) {
    assert.equal((await handleRequest(request(),e)).status,503);
    assert.equal((await (await handleRequest(new Request('https://example.org/api/assistant'),e)).json()).available,false);
  }
});
test('cross-origin and missing-consent requests never call the provider',async()=>{
  const active={...env,AI_LIMITS:{}};let calls=0;const provider=async()=>{calls++;throw Error('unexpected');};
  assert.equal((await handleRequest(request(undefined,'https://other.example.org'),active,provider)).status,403);
  assert.equal((await handleRequest(request({input}),active,provider)).status,400);assert.equal(calls,0);
});
test('real SQLite quotas cap concurrent requests, share a daily bound and roll over',async()=>{
  const {mf,db}=await database();try {
    const now=Date.UTC(2027,2,8,10);
    const results=await Promise.all(Array.from({length:15},()=>reserveQuota(db,'192.0.2.1','fictional-key',now)));
    assert.equal(results.filter(Boolean).length,6);
    for(let i=0;i<24;i++)assert.equal(await reserveQuota(db,'192.0.2.'+(i+2),'fictional-key',now),true);
    assert.equal(await reserveQuota(db,'192.0.2.200','fictional-key',now),false);
    assert.equal(await reserveQuota(db,'192.0.2.1','fictional-key',now+86400000),true);
    const rows=await db.prepare('SELECT bucket FROM ai_request_limits').all();assert.ok(rows.results.every(r=>!r.bucket.includes('192.0.2.1')));
  }finally{await mf.dispose();}
});
test('endpoint returns only checked provider results and preserves secrets in error cases',async()=>{
  const {mf,db}=await database();try {
    let calls=0; const provider=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(JSON.parse(options.body).store,false);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});};
    const active={...env,AI_LIMITS:db};
    const response=await handleRequest(request(),active,provider);assert.equal(response.status,200);assert.deepEqual((await response.json()).result,result);assert.equal(calls,1);
    const bad=await handleRequest(request(),active,async()=>Response.json({private:env.OPENAI_API_KEY},{status:401}));assert.equal(bad.status,502);assert.ok(!(await bad.text()).includes(env.OPENAI_API_KEY));
    const refused=await handleRequest(request(),active,async()=>Response.json({status:'completed',output:[{content:[{type:'refusal'}]}]}));assert.equal(refused.status,502);
    const injected={...input,agenda:'Email secret@example.org or https://example.org/?token=private'};assert.equal((await handleRequest(request({consent:true,input:injected}),active,provider)).status,400);assert.equal(calls,1);
  }finally{await mf.dispose();}
});

async function clientFlow() {
  const a=application();a.run("ensurePreset('ghc');location.hash='#/assistant/plan'");
  a.context.AbortController=AbortController;a.context.AbortSignal=AbortSignal;
  const fields=[['ai-goal','Learn one testing technique'],['ai-constraints','One afternoon'],['ai-agenda','']].map(([id,value])=>({...a.node(id),id,value,type:'textarea'}));
  a.context.document.querySelectorAll=selector=>selector.startsWith('#assistant-input')?fields:[];
  a.context.document.querySelector=()=>a.node('cancel');
  a.context.fetch=async()=>({ok:true,json:async()=>({available:true})});
  a.run('PlaybookAssistant.afterRender()');await new Promise(resolve=>setImmediate(resolve));
  const click=d=>{a.context.button={dataset:d};return a.run('PlaybookAssistant.handleClick(button)');};
  return {a,fields,click};
}
test('consent gates sending; changed input invalidates the preview; errors preserve the planner',async()=>{
  const {a,fields,click}=await clientFlow();let calls=0;
  a.context.fetch=async()=>{calls++;return {ok:false,json:async()=>({error:'Fictional provider unavailable'})};};
  click({aiPreview:'1'});click({aiSend:'1'});assert.equal(calls,0);assert.ok(a.node('ai-message').textContent.includes('Approve'));
  a.node('ai-consent').checked=true;fields[0].value='A changed goal';click({aiSend:'1'});assert.equal(calls,0);assert.equal(a.node('ai-consent').checked,false);
  click({aiPreview:'1'});a.node('ai-consent').checked=true;click({aiSend:'1'});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,1);assert.ok(a.node('ai-message').textContent.includes('Fictional provider unavailable'));assert.equal(a.run('getPlan().targets.length'),0);
});
test('checked AI result opens an editable worksheet draft, and navigation cancels an in-flight request',async()=>{
  const {a,click}=await clientFlow();
  const checked=structuredClone(result);checked.suggestions[0].fields=checked.suggestions[0].fields.filter(f=>f.key!=='target-link');
  a.context.fetch=async()=>({ok:true,json:async()=>({result:checked})});
  click({aiPreview:'1'});a.node('ai-consent').checked=true;click({aiSend:'1'});await new Promise(resolve=>setImmediate(resolve));
  assert.ok(a.node('ai-results').innerHTML.includes('Use in worksheet'));assert.equal(a.node('ai-consent').checked,false);
  click({aiUse:'0'});assert.equal(a.run('location.hash'),'#/conference');assert.equal(a.run('getPlan().targets.length'),0);assert.ok(a.run("getPlan().worksheetDrafts['targets:new']"));
  a.run("location.hash='#/assistant/plan'");let aborted=false;
  a.context.fetch=async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Cancelled','AbortError'));}));
  click({aiPreview:'1'});a.node('ai-consent').checked=true;click({aiSend:'1'});a.run('PlaybookAssistant.onNavigate()');await new Promise(resolve=>setImmediate(resolve));assert.equal(aborted,true);
});
