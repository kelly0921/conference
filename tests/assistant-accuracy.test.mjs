import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {validateSchedule,inspectSchedule,interval,parseSessionLines,evidenceFor} from '../.qa-cache/assistant-tests/grounding.mjs';
import {validateInput,validateResult} from '../.qa-cache/assistant-tests/contract.mjs';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/assistant-accuracy.json',import.meta.url),'utf8'));
for(const f of fixtures)test('accuracy: '+f.id,()=>{
  const exercise=()=>{
    if(f.kind==='response')return validateResult(f.result,validateInput(f.input));
    return validateSchedule(f.schedule);
  };
  if(f.expected.error){assert.throws(exercise);return;}
  const checked=exercise();
  if(f.kind==='schedule'){
    const schedule=checked,findings=inspectSchedule(schedule);
    assert.deepEqual(findings.map(x=>x.kind),f.expected.kinds);
    if(f.expected.durationMinutes!==undefined){const [a,b]=interval(schedule.sessions[0]);assert.equal((b-a)/60000,f.expected.durationMinutes);}
  }
});
test('pasted session columns preserve dates, source and overnight boundaries; ambiguous prose is not guessed',()=>{
  const rows=parseSessionLines('Testing | 2027-03-08T23:30 | 2027-03-09T00:30 | Europe/Paris | https://example.org/session | 20','2027-03-08','UTC');
  const s=validateSchedule({sessions:rows,availability:null,breakMinutes:15,maxActivities:2});
  assert.equal(s.sessions[0].start,'23:30');assert.equal(s.sessions[0].endDate,'2027-03-09');assert.equal(s.sessions[0].buffer,20);
  assert.throws(()=>parseSessionLines('A workshop sometime after lunch','2027-03-08','UTC'));
});
test('saved priorities receive individual evidence identities; empty context does not become evidence',()=>{
  const i=structuredClone(fixtures.find(f=>f.live).input);
  i.context.push({id:'priorities',label:'Saved priorities',text:JSON.stringify([{name:'Testing',action:'Check access'},{name:'Community',action:'Read description'}])});
  const list=evidenceFor(i);assert.ok(list.some(e=>e.id==='priority:2'&&e.text.includes('Community')));assert.ok(!list.some(e=>e.id==='priorities'));
  const r=structuredClone(fixtures.find(f=>f.id==='learning-goal-with-unknown-access').result);
  r.suggestions[0].title='Check whether Community is a useful backup';
  assert.throws(()=>validateResult(r,validateInput(i)));
  r.suggestions[0].evidenceIds=['priority:2'];r.suggestions[0].evidenceQuotes=[{id:'priority:2',quote:'Community'}];
  assert.doesNotThrow(()=>validateResult(r,validateInput(i)));
});
test('session confirmation gates sharing and a changed time clears both approvals',()=>{
  const {application}=createRequire(import.meta.url)('../scripts/application_runtime.cjs'),a=application();
  a.run("ensurePreset('ghc');location.hash='#/assistant/plan'");
  a.context.form={'ai-goal':'Learn testing','ai-session-lines':'Testing | 14:00 | 15:00','ai-session-date':'2027-03-08','ai-session-zone':'Europe/Paris'};
  assert.throws(()=>a.run("PlaybookAssistant.buildInput(getPlan(),'plan',form)"));
  a.context.form['ai-times-confirm']=true;
  assert.equal(a.run("PlaybookAssistant.buildInput(getPlan(),'plan',form).schedule.sessions[0].start"),'14:00');
  a.node('ai-times-confirm').checked=true;a.node('ai-consent').checked=true;
  a.run("PlaybookAssistant.invalidate('ai-session-lines')");assert.equal(a.node('ai-times-confirm').checked,false);assert.equal(a.node('ai-consent').checked,false);
});
