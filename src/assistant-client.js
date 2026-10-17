import {parseSessionLines, validateSchedule, inspectSchedule, findingText, evidenceFor} from './assistant-grounding.ts';
import {redact, publicURL, validateInput, validateResult, worksheetFields} from './assistant-contract.ts';
const sessions=new Map();
let availability=null, availabilityPending=false;
const labels={profile:'Conference profile',priorities:'Saved priorities',schedule:'Saved schedule',budget:'Budget totals',learning:'Saved learning',notes:'Commitment summaries',goal:'Your goal',constraints:'Your limits',agenda:'Agenda details'};
const worksheetNames={targets:'Priority',decision:'Attendance decision',experience:'Learning & community',learning:'Next action'};
const fieldLabels={'target-name':'Priority','target-action':'First action','target-backup':'Backup','target-question':'Question','target-link':'Source','decision-goal':'Outcome','decision-fit':'Opportunity','decision-alt':'Alternative','decision-next':'Next action','experience-name':'Activity','experience-purpose':'Purpose','experience-question':'Question','experience-action':'Next action','experience-backup':'Alternative','experience-source':'Source','insight-goal':'Goal','insight-use':'Where to apply it','insight-action':'Next action'};
const key=(p,mode)=>p.id+':'+mode;
const stateFor=(p,mode)=>{const k=key(p,mode);if(!sessions.has(k)) sessions.set(k,{});return sessions.get(k);};
const safe=(v,max=4000)=>redact(String(v||'')).slice(0,max);
function contextText(p,id) {
  if(id==='profile') return JSON.stringify({name:p.name,dates:[p.date,p.end],timezone:zoneLabel(p.timezone),format:p.format,location:p.location,organizer:publicURL(p.organizerUrl||''),goal:p.goal});
  if(id==='priorities') return JSON.stringify(p.targets.slice(0,12).map(t=>({name:t.name,action:t.action,backup:t.backup,status:t.status,source:publicURL(t.source||'')})));
  if(id==='schedule') return JSON.stringify(p.activities.slice(0,18).map(a=>({label:a.label,date:a.date,start:a.start,end:a.end,timezone:zoneLabel(a.timezone),venue:a.venue,status:a.status,fixed:a.fixed,buffer:a.buffer})));
  if(id==='budget') return JSON.stringify({currency:p.currency,...Object.fromEntries(['registration','travel','lodging','local','food','buffer','direct','reimbursement','pending'].map(k=>[k,p.budget?.[k]??'']))});
  if(id==='learning') return JSON.stringify({learning:p.insight?.learning,action:p.insight?.action});
  if(id==='notes') return JSON.stringify(p.notes.slice(0,10).map(n=>({action:n.action,status:n.status,response:n.response,due:n.due})));
  return '';
}
export function scheduleFromForm(p,v,requireConfirmation=true) {
  const date=String(v['ai-session-date']||p.date||''),timezone=String(v['ai-session-zone']||p.timezone||'');
  const lines=String(v['ai-session-lines']||'');
  const sessions=parseSessionLines(lines,date,timezone).map(s=>({...s,label:safe(s.label,140),source:publicURL(s.source)}));
  if(v['ai-share-schedule']) p.activities.slice(0,18).forEach((a,i)=>{if(a.date&&a.start&&a.end&&a.timezone)sessions.push({id:'saved:'+(i+1),label:safe(a.label,140),date:a.date,endDate:a.date,start:a.start,end:a.end,timezone:a.timezone,buffer:Number(a.buffer||0),source:publicURL(a.source||'')});});
  if(!sessions.length)return null;
  const start=String(v['ai-available-start']||''),end=String(v['ai-available-end']||'');
  const schedule=validateSchedule({sessions,availability:start||end?{date,endDate:date,start,end,timezone}:null,breakMinutes:v['ai-break']===''?0:Number(v['ai-break']??15),maxActivities:Number(v['ai-max-activities']||2)});
  if(requireConfirmation&&!v['ai-times-confirm'])throw Error('Check session times below and confirm the displayed details before previewing.');
  return schedule;
}
function sessionListHTML(schedule) {
  return `<ul class="ai-session-list">${schedule.sessions.map(s=>`<li><strong>${esc(s.label)}</strong><span>${esc(s.date)} ${esc(s.start)} → ${s.endDate!==s.date?esc(s.endDate)+' ':''}${esc(s.end)} · ${esc(s.timezone)} · Reset buffer: ${s.buffer} minutes</span>${s.source?`<span>Supplied public source: ${esc(s.source)}</span>`:''}</li>`).join('')}</ul>`;
}
function scheduleFactsHTML(schedule,selected) {
  if(!schedule)return '<p class="helper">No session times confirmed for calculation. AI can suggest research actions; timetable claims are not supported.</p>';
  const findings=inspectSchedule(schedule),chosen=selected?{...schedule,sessions:schedule.sessions.filter(s=>selected.includes(s.id))}:null;
  return `<section class="ai-schedule-facts" aria-label="Calculated session checks"><h3>Session checks</h3><p class="helper">Calculated from the listed details. Access and organizer changes still need checking. Comparisons below apply if you choose both sessions.</p>${sessionListHTML(schedule)}${findings.length?`<ul>${findings.map(f=>`<li>${esc(findingText(f,schedule))}</li>`).join('')}</ul>`:'<p>No overlaps, insufficient buffers or availability violations found among the listed sessions.</p>'}<p class="helper">Requested break: ${schedule.breakMinutes} minutes · Activity limit: ${schedule.maxActivities}${schedule.availability?` · Available ${esc(schedule.availability.date)} ${esc(schedule.availability.start)}–${esc(schedule.availability.end)} ${esc(schedule.availability.timezone)}`:' · Availability not supplied'}. Untimed activities and unstructured agenda notes are not compared.</p>${chosen?`<h3>Suggested session selection</h3>${chosen.sessions.length?sessionListHTML(chosen):'<p>No timed selection proposed. Use the suggestions to check missing details.</p>'}`:''}</section>`;
}
function scheduleControlsHTML(p) {
  return `<details class="ai-schedule-controls"><summary>Check session times (optional)</summary><p>For timetable advice, enter sessions here or include your saved schedule. These details are only for this AI request; they do not create appointments.</p><div class="fg2"><div class="formrow"><label for="ai-session-date">Session date</label><input type="date" id="ai-session-date" value="${esc(p.date||'')}"></div><div class="formrow"><label for="ai-session-zone">Session timezone</label><input id="ai-session-zone" value="${esc(p.timezone||'')}" placeholder="Europe/Paris"></div></div><div class="formrow"><label for="ai-session-lines">Session times to compare</label><textarea id="ai-session-lines" rows="4" maxlength="6000" placeholder="Testing workshop | 14:00 | 15:00&#10;Architecture talk | 14:30 | 15:30"></textarea><p class="helper">One session per line: name | start | end. Use 24-hour times. You can add | timezone | public URL | reset minutes. For another date or an overnight session use YYYY-MM-DDTHH:mm in each time column. Other agenda notes belong above.</p></div><div class="fg2"><div class="formrow"><label for="ai-available-start">Available from (optional)</label><input type="time" id="ai-available-start"></div><div class="formrow"><label for="ai-available-end">Available until (optional)</label><input type="time" id="ai-available-end"></div><div class="formrow"><label for="ai-break">Minimum break between sessions (minutes)</label><input type="number" id="ai-break" min="0" max="600" value="15"></div><div class="formrow"><label for="ai-max-activities">Maximum activities</label><input type="number" id="ai-max-activities" min="1" max="18" value="2"></div></div><button class="btn" data-ai-check-times="1">Check session times</button><div id="ai-times-review" role="status"></div></details>`;
}
export function buildInput(p,mode,values) {
  const context=[{id:'profile',label:labels.profile,text:safe(contextText(p,'profile'))}];
  for(const id of ['priorities','schedule','budget','learning','notes']) if(values['ai-share-'+id]) context.push({id,label:labels[id],text:safe(contextText(p,id))});
  return validateInput({version:2,schedule:scheduleFromForm(p,values),mode:mode==='review'?'review':'plan',goal:safe(values['ai-goal'],600),constraints:safe(values['ai-constraints'],2000),agenda:safe(values['ai-agenda'],8000),context});
}
function valuesFromForm() {
  const values={};document.querySelectorAll('#assistant-input input[id],#assistant-input textarea[id]').forEach(f=>values[f.id]=f.type==='checkbox'?f.checked:f.value);return values;
}
export function renderEntry() {return `<section class="assistant-entry no-print" aria-label="AI planning help"><div><span class="section-caption">A second perspective</span><h2>Make room for what matters.</h2><p>Turn your goal into a focused plan, or look for gaps in the plan you’ve saved.</p></div><div class="linkrow"><a class="btn primary" href="#/assistant/plan">Help me plan</a><a class="btn" href="#/assistant/review">Review my plan</a></div></section>`;}
export function renderWorkspace(p,requested) {
  if(!p) return renderSetup(); const mode=requested==='review'?'review':'plan',s=stateFor(p,mode);
  return `<section class="assistant-workspace"><a class="plainlink" href="#/conference">← My Conference</a><div class="section-caption">Optional AI planning · ${esc(p.name)}</div><h1>${mode==='review'?'Review my plan':'Help me plan'}</h1><p class="lead">${mode==='review'?'Find the gaps, see the tradeoffs, and choose what to adjust.':'Choose one worthwhile priority, a realistic backup, and your next action.'}</p><div class="linkrow assistant-modes"><a class="btn ${mode==='plan'?'primary':''}" href="#/assistant/plan" ${mode==='plan'?'aria-current="page"':''}>Help me plan</a><a class="btn ${mode==='review'?'primary':''}" href="#/assistant/review" ${mode==='review'?'aria-current="page"':''}>Review my plan</a></div>
    <p id="ai-availability" class="helper" role="status">Checking live AI availability…</p>
    <div class="assistant-columns"><section class="assistant-input" id="assistant-input" ${draftAttributes(p,'assistant:'+mode)}><h2>Your direction</h2><p class="helper save-state" role="status">${storageAvailable?'Inputs are kept as a draft in this browser.':'Browser storage is unavailable. Copy your input before leaving.'}</p><div class="formrow"><label for="ai-goal">What would make this conference worthwhile? *</label><textarea id="ai-goal" rows="2" maxlength="600" required>${esc(p.goal||'')}</textarea></div><div class="formrow"><label for="ai-constraints">Time, budget or other limits (optional)</label><textarea id="ai-constraints" rows="3" maxlength="2000" placeholder="I have one afternoon and want to leave time for a break."></textarea></div><div class="formrow"><label for="ai-agenda">Relevant agenda or opportunity details (optional)</label><textarea id="ai-agenda" rows="5" maxlength="8000" placeholder="Paste a few sessions, opportunities or public links. Sources are not opened or verified."></textarea></div>${scheduleControlsHTML(p)}<fieldset class="assistant-sharing"><legend>Also include from my saved plan</legend><p class="helper">Conference profile is included. Additional sections are your choice.</p>${['priorities','schedule','budget','learning','notes'].map(id=>`<label><input id="ai-share-${id}" type="checkbox" ${id==='priorities'?'checked':''}> ${esc(labels[id])}</label>`).join('')}</fieldset><p class="helper">Contact channels, private confirmation references, funding-source details and full templates are excluded. Automatic removal catches some emails, phone numbers, secrets and private links; review the preview for anything else you want to remove.</p><button class="btn primary" data-ai-preview="1">Preview what will be sent →</button></section>
    <section class="assistant-preview" aria-labelledby="ai-preview-heading"><h2 id="ai-preview-heading">You control what you share</h2><p>Only the displayed details are sent when you choose to ask AI. Suggestions stay in this session until you open one as a worksheet draft.</p><p class="helper">OpenAI processes the request. We don’t save your request on our server. OpenAI may retain abuse-monitoring logs for up to 30 days under its standard API policy. <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">Data policy ↗</a></p><div id="ai-preview">${s.prepared?previewHTML(s.prepared):'<p class="helper">Fill in your direction, then preview the exact details.</p>'}</div><p id="ai-message" class="error" role="alert"></p><div class="linkrow"><button class="btn" data-ai-example="1">See a fictional example</button></div></section></div><section id="ai-results" class="assistant-results" aria-label="Planning suggestions" tabindex="-1" ${s.pending?'aria-busy="true"':''}>${s.result?resultsHTML(s):''}</section></section>`;
}
function previewHTML(input) {
  return `<div class="ai-payload"><p class="section-caption">${input.mode==='review'?'Review my plan':'Help me plan'} · Exact request details</p><dl><dt>Goal</dt><dd>${esc(input.goal)}</dd><dt>Constraints</dt><dd>${esc(input.constraints||'None supplied')}</dd><dt>Agenda</dt><dd>${esc(input.agenda||'None supplied')}</dd>${input.context.map(c=>`<dt>${esc(c.label)}</dt><dd>${esc(c.text)}</dd>`).join('')}</dl>${scheduleFactsHTML(input.schedule)}</div><label class="ai-consent"><input type="checkbox" id="ai-consent" data-draft-exclude="1"> I approve sending these displayed details to OpenAI.</label><div class="linkrow"><button class="btn primary" id="ai-send" data-ai-send="1">Ask AI for suggestions</button><button class="btn" data-ai-cancel="1" hidden>Cancel request</button></div><p class="helper">Up to six attempts per hour per visitor, with a shared daily limit. Requests are never retried automatically.</p>`;
}
function resultsHTML(s) {
  return `<div class="assistant-results-heading"><span class="section-caption">${s.example?'Fictional example · no AI request was made':'AI suggestions · check before using'}</span><h2>A little focus goes a long way.</h2><p>${esc(s.result.summary)}</p><p class="helper">${s.example?'This shows the experience with an invented event. These example suggestions cannot be added to your real plan.':'AI can be wrong. Dates, eligibility, funding and access still need confirmation from official sources. These suggestions do not change your saved plan.'}</p></div>${s.example?'':scheduleFactsHTML(s.usedInput?.schedule,s.result.recommendedSessionIds)}${s.result.suggestions.map((x,i)=>`<article class="assistant-card"><span class="section-caption">${String(i+1).padStart(2,'0')} · ${esc(worksheetNames[x.worksheet])}</span><h3>${esc(x.title)}</h3><p class="ai-action">${esc(x.action)}</p><dl><dt>Why this fits</dt><dd>${esc(x.why)}</dd><dt>Needs checking</dt><dd>${esc(x.uncertainty)}</dd></dl>${x.evidenceQuotes?`<details class="ai-evidence"><summary>Supporting details</summary><dl>${x.evidenceQuotes.map(q=>{const e=evidenceFor(s.usedInput).find(e=>e.id===q.id);return `<dt>${esc(e?.label||q.id)} · ${e?.kind==='calculated'?'Calculated':'You supplied'}</dt><dd>${esc(q.quote)}</dd>`;}).join('')}</dl><p class="helper">Matching a quote confirms its source, not independent verification or whether the reasoning is correct.</p></details>`:`<p class="helper">Based on: ${x.evidenceIds.map(id=>esc(labels[id]||id)).join(', ')}.</p>`}<details><summary>Proposed worksheet draft</summary><dl>${x.fields.map(f=>`<dt>${esc(fieldLabels[f.key])}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl></details><div class="linkrow">${s.example?'':`<button class="btn primary" data-ai-use="${i}">Use in worksheet →</button>`}<a class="plainlink" href="#/guide/${x.guideId}">${esc(GUIDE_BY_ID[x.guideId].title)} →</a></div></article>`).join('')}${s.result.questions.length?`<div class="assistant-questions"><h3>Before you commit</h3><ul>${s.result.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>`:''}`;
}
function showAvailability() {
  const out=document.getElementById('ai-availability');if(!out)return;
  out.textContent=availability===true?'Live AI is available. Preview your details before sending.':availability===false?'Live AI is not enabled here yet. You can explore the fictional example and keep using your saved planner.':'Checking live AI availability…';
}
export function afterRender() {
  if(!document.getElementById('assistant-input'))return;
  showAvailability();
  if(availability===null && !availabilityPending && typeof fetch==='function') {
    availabilityPending=true;
    fetch('/api/assistant',{cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(r=>{availability=r?.available===true;showAvailability();}).catch(()=>{availability=false;showAvailability();}).finally(()=>{availabilityPending=false;});
  }
}
function message(text) {const out=document.getElementById('ai-message');if(out)out.textContent=text;}
function current() { const r=routeHash(),p=getPlan();if(r[0]!=='assistant'||!p)return null;const mode=r[1]==='review'?'review':'plan';return {p,mode,s:stateFor(p,mode)}; }
export function invalidate(changedId) {
  const c=current();if(!c)return;c.s.prepared=null;const consent=document.getElementById('ai-consent');if(consent)consent.checked=false;
  message('');
  if(changedId && /^(ai-session-|ai-available-|ai-break$|ai-max-activities$|ai-share-schedule$)/.test(changedId)){const check=document.getElementById('ai-times-confirm');if(check)check.checked=false;const review=document.getElementById('ai-times-review');if(review)review.innerHTML='<p>Session details changed. Check them again before confirming.</p>';}
  const out=document.getElementById('ai-preview');if(out)out.innerHTML='<p class="helper">Details changed. Preview again before sending.</p>';
}
export function stageSuggestion(p,suggestion) {
  const scope=suggestion.worksheet==='targets'?'targets:new':suggestion.worksheet;
  if(p.worksheetDrafts?.[scope]) return {ok:false,scope};
  const values=Object.fromEntries(suggestion.fields.map(f=>[f.key,f.value]));
  if(suggestion.worksheet==='targets') {values['target-status']='Needs checking';values['target-kind']=p.goal==='Recruiting / career'?'Role or employer':p.goal==='People / community'?'Community or person':p.goal==='Build / share a project'?'Project or contribution':'Session or workshop';}
  if(suggestion.worksheet==='experience')values['experience-access']='Needs checking';
  // Include only proposal fields; untouched committed fields are populated by the worksheet.
  const stored=recordWorksheetDraft(p.id,scope,values);
  return {ok:true,scope,stored};
}
async function send(c) {
  if(c.s.pending)return;
  let fresh;try {fresh=buildInput(c.p,c.mode,valuesFromForm());}catch(error){message(error.message);return;}
  if(!c.s.prepared || JSON.stringify(fresh)!==JSON.stringify(c.s.prepared)) {invalidate();message('Preview your current details before sending.');return;}
  if(!document.getElementById('ai-consent')?.checked){message('Approve the displayed details before sending.');document.getElementById('ai-consent')?.focus();return;}
  if(availability!==true){message('Live AI is unavailable here. Try the fictional example or continue in the planner.');return;}
  const input=c.s.prepared;c.s.pending=true;c.s.controller=new AbortController();const timer=setTimeout(()=>c.s.controller.abort(),30000);
  document.getElementById('ai-consent').checked=false;
  c.s.result=null; const results=document.getElementById('ai-results');results.innerHTML='<p role="status">Thinking through your priorities… Your saved plan is unchanged.</p>';results.setAttribute('aria-busy','true');
  document.getElementById('ai-send').disabled=true;document.querySelector('[data-ai-cancel]').hidden=false;message('');
  document.querySelectorAll('#assistant-input input,#assistant-input textarea').forEach(f=>f.disabled=true);
  try {
    const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,input}),signal:c.s.controller.signal});
    const body=await response.json();if(!response.ok)throw Error(body.error||'AI is unavailable. Try again later.');
    c.s.result=validateResult(body.result,input);c.s.example=false;c.s.usedInput=input;
    if(current()?.s===c.s) {results.innerHTML=resultsHTML(c.s);results.focus({preventScroll:true});results.scrollIntoView?.({block:'start',behavior:'auto'});}
  } catch(error) {if(current()?.s===c.s){results.innerHTML='';message(error.name==='AbortError'?'Request cancelled or timed out. Your plan is unchanged.':error.message);}}
  finally {clearTimeout(timer);c.s.pending=false;if(current()?.s===c.s){results.removeAttribute('aria-busy');document.querySelectorAll('#assistant-input input,#assistant-input textarea').forEach(f=>f.disabled=false);const b=document.getElementById('ai-send');if(b)b.disabled=false;const cancel=document.querySelector('[data-ai-cancel]');if(cancel)cancel.hidden=true;}}
}
export function handleClick(button) {
  const d=button.dataset,c=current();if(!c)return false;
  if(d.aiCheckTimes){if(c.s.pending)return true;try{const schedule=scheduleFromForm(c.p,valuesFromForm(),false);document.getElementById('ai-times-review').innerHTML=schedule?scheduleFactsHTML(schedule)+`<label class="ai-consent"><input id="ai-times-confirm" type="checkbox" data-draft-exclude="1"> These are the session details I want compared.</label>`:'<p>Add session times, or select a saved schedule with complete dates, times and timezones.</p>';invalidate();message('');}catch(error){message(error.message);}return true;}
  if(d.aiPreview) {if(c.s.pending){message('Wait for this request or cancel it first.');return true;}try {c.s.prepared=buildInput(c.p,c.mode,valuesFromForm());document.getElementById('ai-preview').innerHTML=previewHTML(c.s.prepared);message('');}catch(error){message(error.message);}return true;}
  if(d.aiSend){void send(c);return true;}
  if(d.aiCancel){c.s.controller?.abort();return true;}
  if(d.aiExample) {if(c.s.pending){message('Wait for this request or cancel it first.');return true;}c.s.result=example();c.s.example=true;message('');const results=document.getElementById('ai-results');results.innerHTML=resultsHTML(c.s);results.focus({preventScroll:true});results.scrollIntoView?.({block:'start',behavior:'auto'});return true;}
  if(d.aiUse!==undefined) {
    const suggestion=c.s.result?.suggestions[Number(d.aiUse)];if(!suggestion||c.s.example)return true;
    let latest;try{latest=buildInput(c.p,c.mode,valuesFromForm());}catch{message('Your details changed. Preview and ask again before using these suggestions.');return true;}
    if(JSON.stringify(latest)!==JSON.stringify(c.s.usedInput)){message('Your details changed since this response. Ask again before using its suggestions.');return true;}
    const staged=stageSuggestion(c.p,suggestion);
    if(!staged.ok){message('A draft already exists in this worksheet. Resume it from My Conference before adding another suggestion.');return true;}
    selectedTask=suggestion.worksheet;editingTarget=-1;resumeTargetId=null;editingProfile=false;navTo('conference');
    notify(staged.stored?'AI suggestion opened as a draft. Review it, then save the worksheet.':'Draft is in memory only. Browser storage is unavailable; copy it before leaving.');return true;
  }return false;
}
export function onNavigate() { for(const s of sessions.values())if(s.pending)s.controller?.abort(); }
export function example() {
  return {summary:'Fictional example: one afternoon at a developer conference, with learning as the main goal. Focus on one relevant session, keep a community conversation as a backup, and leave a break.',suggestions:[{
    title:'Find one session you can use afterward',action:'Compare the two session descriptions, choose the one closest to a problem you want to solve, and check its access requirements.',why:'With only one afternoon, a specific learning outcome is more useful than collecting several loosely related sessions.',uncertainty:'No session timetable or pass rules were supplied. This is a research task, not a confirmed booking.',guideId:'prioritize',evidenceIds:['goal','constraints'],worksheet:'targets',fields:[{key:'target-name',value:'Research one relevant technical session'},{key:'target-action',value:'Read the current session abstract and check access.'},{key:'target-backup',value:'A public community discussion, if accessible.'}]},
    {title:'Protect time to reflect',action:'Leave a short break after your main session to record one idea and one question.',why:'A smaller plan leaves room to turn information into something you can try.',uncertainty:'Travel times and session duration still need checking before setting the break.',guideId:'time',evidenceIds:['constraints'],worksheet:'learning',fields:[{key:'insight-action',value:'After the session, capture one idea to try and one question to investigate.'}]}],questions:['What is the actual session timetable?','Which sessions does your pass include?']};
}
if(typeof document!=='undefined') document.addEventListener('input',event=>{if(event.target.closest?.('#assistant-input'))invalidate(event.target.id);});
