import type {AssistantInput, AssistantResult} from './assistant-contract';

export type Session={id:string;label:string;date:string;endDate:string;start:string;end:string;timezone:string;buffer:number;source:string};
export type Window={date:string;endDate:string;start:string;end:string;timezone:string};
export type Schedule={sessions:Session[];availability:Window|null;breakMinutes:number;maxActivities:number};
export type Finding={kind:'overlap'|'buffer'|'outside';ids:string[];minutes?:number};
export type Evidence={id:string;label:string;text:string;kind:'supplied'|'calculated'};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function keys(v:Record<string,unknown>,expected:string[]) {if(Object.keys(v).length!==expected.length||expected.some(k=>!Object.hasOwn(v,k)))throw Error('Unsupported schedule fields.');}
function bounded(v:unknown,max:number):string {if(typeof v!=='string'||v.length>max)throw Error('Invalid session text.');return v.trim();}
function integer(v:unknown,max:number,min=0):number {if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw Error('Invalid activity or break limit.');return v;}
const parts=(stamp:number,format:Intl.DateTimeFormat)=>Object.fromEntries(format.formatToParts(stamp).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));

// Resolve a wall-clock time by round-tripping candidate offsets. Missing and repeated
// daylight-saving times are rejected instead of silently choosing an instant.
export function localInstant(date:string,time:string,timezone:string):number {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Use a complete date and a 24-hour time.');
  const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number),naive=Date.UTC(y,m-1,d,h,min);
  if(y<2000||y>2100||new Date(naive).toISOString().slice(0,10)!==date)throw Error('Invalid session date.');
  let format:Intl.DateTimeFormat;
  try{format=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{throw Error('Use a valid event timezone.');}
  const offsets=new Set<number>();
  for(let delta=-36;delta<=36;delta+=6){const stamp=naive+delta*3600000,p=parts(stamp,format);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-stamp);}
  const matches=[...offsets].map(offset=>naive-offset).filter(stamp=>{const p=parts(stamp,format);return p.year===y&&p.month===m&&p.day===d&&p.hour===h&&p.minute===min;});
  if(matches.length!==1)throw Error(matches.length?'This local time occurs twice during a clock change. Choose an unambiguous time before comparing it.':'This local time does not exist during a clock change. Check the organizer timetable.');
  return matches[0];
}
export function interval(s:Window):[number,number] {
  const start=localInstant(s.date,s.start,s.timezone),end=localInstant(s.endDate,s.end,s.timezone);
  if(end<=start||end-start>7*86400000)throw Error('The end must be after the start, within seven days. Use full dates for overnight sessions.');
  return [start,end];
}
export function validateSchedule(raw:unknown):Schedule|null {
  if(raw===null)return null;
  if(!obj(raw))throw Error('Invalid session details.');keys(raw,['sessions','availability','breakMinutes','maxActivities']);
  if(!Array.isArray(raw.sessions)||raw.sessions.length<1||raw.sessions.length>18)throw Error('Check between one and eighteen sessions.');
  function window(v:unknown):Window {if(!obj(v))throw Error('Invalid time window.');const w={date:bounded(v.date,10),endDate:bounded(v.endDate,10),start:bounded(v.start,5),end:bounded(v.end,5),timezone:bounded(v.timezone,80)};interval(w);return w;}
  const seen=new Set<string>();
  const sessions=raw.sessions.map(v=>{
    if(!obj(v))throw Error('Invalid session.');keys(v,['id','label','date','endDate','start','end','timezone','buffer','source']);
    const id=bounded(v.id,32),label=bounded(v.label,140),source=bounded(v.source,500);
    if(!/^(?:session|saved):[1-9]\d*$/.test(id)||seen.has(id)||!label)throw Error('Invalid session identity.');seen.add(id);
    if(source){const u=new URL(source);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Use a public source URL without private parameters.');}
    return {...window(v),id,label,source,buffer:integer(v.buffer,600)};
  });
  if(raw.availability!==null){if(!obj(raw.availability))throw Error('Invalid availability.');keys(raw.availability,['date','endDate','start','end','timezone']);}
  return {sessions,availability:raw.availability===null?null:window(raw.availability),breakMinutes:integer(raw.breakMinutes,600),maxActivities:integer(raw.maxActivities,18,1)};
}
export function parseSessionLines(text:string,date:string,timezone:string):Session[] {
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length>18)throw Error('Use at most eighteen session lines.');
  return lines.map((line,i)=>{
    const c=line.split('|').map(s=>s.trim());
    if(c.length<3||c.length>6)throw Error(`Line ${i+1}: use Session | start | end, with optional timezone | public URL | buffer minutes.`);
    const stamp=(s:string)=>{const m=/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(s);return m?[m[1],m[2]]:[date,s];};
    const [startDate,start]=stamp(c[1]),[endDate,end]=stamp(c[2]);
    return {id:'session:'+(i+1),label:c[0],date:startDate,endDate,start,end,timezone:c[3]||timezone,source:c[4]||'',buffer:c[5]?Number(c[5]):0};
  });
}
export function inspectSchedule(schedule:Schedule):Finding[] {
  const result:Finding[]=[],ranges=schedule.sessions.map(interval),window=schedule.availability?interval(schedule.availability):null;
  schedule.sessions.forEach((s,i)=>{
    const [start,end]=ranges[i];if(window&&(start<window[0]||end>window[1]))result.push({kind:'outside',ids:[s.id]});
    for(let j=i+1;j<ranges.length;j++){
      const [otherStart,otherEnd]=ranges[j],other=schedule.sessions[j];
      if(start<otherEnd&&otherStart<end){result.push({kind:'overlap',ids:[s.id,other.id]});continue;}
      const first=end<=otherStart?s:other,second=first===s?other:s;
      const gap=((first===s?otherStart:start)-(first===s?end:otherEnd))/60000;
      if(gap<Math.max(schedule.breakMinutes,first.buffer))result.push({kind:'buffer',ids:[first.id,second.id],minutes:gap});
    }
  });return result;
}
export function findingText(f:Finding,schedule:Schedule):string {
  const name=(id:string)=>schedule.sessions.find(s=>s.id===id)!.label;
  if(f.kind==='outside')return `${name(f.ids[0])} is outside your stated availability.`;
  if(f.kind==='overlap')return `${name(f.ids[0])} and ${name(f.ids[1])} overlap. Choose one if planning to attend in full.`;
  return `${name(f.ids[0])} → ${name(f.ids[1])}: ${f.minutes} minutes between sessions; less than the requested break or reset buffer. The sessions do not overlap.`;
}
export function evidenceFor(input:AssistantInput):Evidence[] {
  const list:Evidence[]=[{id:'goal',label:'Your goal',text:input.goal,kind:'supplied'}];
  for(const id of ['constraints','agenda'] as const)if(input[id])list.push({id,label:id==='agenda'?'Your agenda notes':'Your limits',text:input[id],kind:'supplied'});
  for(const c of input.context){
    if(c.id==='priorities'){
      try{const rows:unknown=JSON.parse(c.text);if(Array.isArray(rows)){rows.forEach((v,i)=>{if(obj(v))list.push({id:'priority:'+(i+1),label:'Saved priority '+(i+1),text:JSON.stringify(v),kind:'supplied'});});continue;}}catch{/* Older human-readable summaries keep their original source. */}
    }
    if(c.text&&c.text!=='[]')list.push({id:c.id,label:c.label,text:c.text,kind:'supplied'});
  }
  if(input.schedule){
    for(const s of input.schedule.sessions)list.push({id:s.id,label:s.label,text:JSON.stringify(s),kind:'supplied'});
    list.push({id:'schedule-checks',label:'Calculated session checks',text:JSON.stringify({findings:inspectSchedule(input.schedule),availability:input.schedule.availability,breakMinutes:input.schedule.breakMinutes,maxActivities:input.schedule.maxActivities}),kind:'calculated'});
  }
  return list;
}
export function checkGroundedResult(result:AssistantResult,input:AssistantInput):void {
  if(input.version<2)return;
  const known=new Map(evidenceFor(input).map(e=>[e.id,e]));
  const ids=result.recommendedSessionIds||[];
  const identities=new Map<string,Set<string>>();
  const identity=(name:string,id:string)=>{if(!identities.has(name))identities.set(name,new Set());identities.get(name)!.add(id);};
  for(const session of input.schedule?.sessions||[])identity(session.label,session.id);
  for(const e of known.values())if(e.id.startsWith('priority:')){const row=JSON.parse(e.text);if(typeof row.name==='string'&&row.name.trim())identity(row.name,e.id);}
  for(const s of result.suggestions){
    if(!s.evidenceQuotes?.length||s.evidenceQuotes.length!==s.evidenceIds.length||new Set(s.evidenceIds).size!==s.evidenceIds.length)throw Error('Each reference needs supporting text.');
    for(const id of s.evidenceIds){const e=known.get(id),q=s.evidenceQuotes.find(q=>q.id===id);if(!e||!q||!q.quote.trim()||!e.text.includes(q.quote)||q.quote.length<Math.min(8,e.text.length))throw Error('The supporting text was not supplied.');}
    const named=[s.title,...s.fields.filter(f=>['target-name','experience-name'].includes(f.key)).map(f=>f.value)];
    for(const text of named){
      const spans:{start:number;end:number;ids:Set<string>}[]=[];
      for(const [name,ids] of identities){
        if(name.length<8){if(text.replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').toLowerCase()===name.toLowerCase())spans.push({start:0,end:text.length,ids});continue;}
        const expression=new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu');
        for(const match of text.matchAll(expression)){
          const start=match.index!,end=start+match[0].length;
          if((start&&/[\p{L}\p{N}_]/u.test(text[start-1]))||(end<text.length&&/[\p{L}\p{N}_]/u.test(text[end])))continue;
          spans.push({start,end,ids});
        }
      }
      // A longer supplied name can contain another session's complete name.
      // Referencing the longer item must not require a citation for the shorter one.
      for(const span of spans){
        if(spans.some(other=>other!==span&&other.start<=span.start&&other.end>=span.end&&(other.start<span.start||other.end>span.end)))continue;
        if(!s.evidenceIds.some(id=>span.ids.has(id)))throw Error('A named session or priority needs its own evidence reference.');
        if(ids.length&&[...span.ids].some(id=>/^(?:session|saved):/.test(id))&&!ids.some(id=>span.ids.has(id))){
          const action=s.action.replace(/\bnot(?:\s+as)?\s+(?:an?\s+)?(?:second|additional)\s+(?:\w+\s+){0,3}(?:session|activity|option)\b/gi,'[alternative limit]');
          if(!/\b(?:backup|alternative|fallback|replacement|instead)\b/i.test(s.title+' '+s.action)||/\bafter\b[^.!?\n]{0,100}\b(?:primary|main)\b|\b(?:second|additional)\s+(?:\w+\s+){0,3}(?:session|activity|option)\b/i.test(action))throw Error('A non-selected session must be labelled as an alternative.');
        }
      }
    }
  }
  if(new Set(ids).size!==ids.length||(!input.schedule&&ids.length))throw Error('Unsupported session selection.');
  if(input.schedule){
    if(ids.length>input.schedule.maxActivities||ids.some(id=>!input.schedule!.sessions.some(s=>s.id===id)))throw Error('Unsupported session selection.');
    const selected={...input.schedule,sessions:input.schedule.sessions.filter(s=>ids.includes(s.id))};
    if(inspectSchedule(selected).length)throw Error('The selected sessions do not meet the checked constraints.');
  }
  // Timetable facts are rendered from the checked session records, never generated
  // as free text. This catches the reproduced clock-change and overlap claims.
  const suppliedNames=new Set(identities.keys());
  const texts=[result.summary,...result.questions,...result.suggestions.flatMap(s=>[...(suppliedNames.has(s.title)?[]:[s.title]),s.action,s.why,s.uncertainty,...s.fields.filter(f=>!['target-link','experience-source'].includes(f.key)&&!(['target-name','experience-name'].includes(f.key)&&suppliedNames.has(f.value))).map(f=>f.value)])];
  const prose=texts.map(t=>{
    for(const name of [...suppliedNames].sort((a,b)=>b.length-a.length))t=t.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu'),'[supplied item]');
    return t.replace(/https?:\/\/[^\s<>"'\\`]+/gi,'[source]').replace(/\bconflict[- ](?:resolution|management|free)\b/gi,'[topic]')
      .replace(/\boverlap(?:ping)?(?: in)? (?:interests|topics|skills|expertise|areas)\b/gi,'[topic]')
      .replace(/\b(?:interests?|topics?|skills?|expertise|peers?)(?: (?:area|most|directly|closely|also))* overlaps?\b/gi,'[topic]')
      // These requests to define a desired connection assert no timetable fact.
      // Keep other overlap claims in the same sentence subject to the guard.
      .replace(/\b(?:kind|type) of overlap you want\b|\b(?:define|describe|clarify) the overlap you care about\b/gi,'[topic]');
  });
  const clock=/\b\d{1,2}:\d{2}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b|\b\d{1,2}h\d{2}\b|\b(?:\d{1,2}(?:[.:]\d{2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*[ap]\.?m\.?(?!\p{L})|\b(?:noon|midnight)\b/iu;
  const relation=/\b(?:simultaneous\w*|double[ -]?book\w*|back[ -]to[ -]back|at the same time)\b|\b(?:time|timing|schedule|scheduling)[ -]+conflict\w*\b|\b(?:sessions?|talks?|activities|appointments?)\s+(?:(?:all|both)\s+)?(?:conflict|clash)\w*\b|\b(?:conflicting|clashing)\s+(?:sessions?|talks?|activities|appointments?)\b|\b(?:timed?|timing|schedule|scheduling)\b[^.!?\n]*\b(?:conflicts?|clashes?)\b/i;
  // Without a timetable, an unqualified interest-overlap question is not a
  // scheduling assertion. Explicit session/time referents still trigger checks.
  const overlap=/\boverlap\w*\b/i,temporal=/\[supplied item\]|\b(?:sessions?|talks?|workshops?|activities|appointments?|events?|times?(?!\s+zones?\b)|timetable|timing|schedule|scheduling)\b/i;
  if(prose.some(t=>clock.test(t)||relation.test(t)||(overlap.test(t)&&(input.schedule||temporal.test(t)))||(input.schedule&&/\b(?:second|additional)\b[^.!?\n]{0,40}\b(?:later|after|alongside)\b/i.test(t))))throw Error('Timetable claims must use the calculated session checks.');
}
