import {validateSchedule, evidenceFor, checkGroundedResult, type Schedule} from './assistant-grounding';
export const guideIds = ["worth", "funding", "prepare", "prioritize", "time", "conversations", "explore", "followup", "learning"] as const;
export const worksheetFields = {
  targets: ["target-name", "target-action", "target-backup", "target-question", "target-link"],
  decision: ["decision-goal", "decision-fit", "decision-alt", "decision-next"],
  experience: ["experience-name", "experience-purpose", "experience-question", "experience-action", "experience-backup", "experience-source"],
  learning: ["insight-goal", "insight-use", "insight-action"]
} as const;
export type Worksheet = keyof typeof worksheetFields;
export type AssistantInput = {version:1|2|3; sourceLinks?:string[]; schedule?:Schedule|null; mode:"plan"|"review"; goal:string; constraints:string; agenda:string; context:{id:string;label:string;text:string}[]};
export type Suggestion = {title:string; action:string; why:string; uncertainty:string; guideId:string; evidenceIds:string[]; worksheet:Worksheet; evidenceQuotes?:{id:string;quote:string}[]; fields:{key:string;value:string}[]};
export type AssistantResult = {summary:string; suggestions:Suggestion[]; questions:string[]; recommendedSessionIds?:string[]};
const contextIds = ["profile", "priorities", "schedule", "budget", "learning", "notes"];
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v==="object" && !Array.isArray(v);
function exact(v:Record<string,unknown>, keys:string[]) { if(Object.keys(v).some(k=>!keys.includes(k)) || keys.some(k=>!(k in v))) throw Error("Unexpected fields."); }
function string(v:unknown, max:number, required=false):string {
  if(typeof v!=="string" || v.length>max || (required && !v.trim())) throw Error("Text is missing or too long.");
  return v.trim();
}
export function publicURL(raw:string):string {
  try { const u=new URL(raw); if(!["https:","http:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) return ""; return u.href; } catch { return ""; }
}
function textURLs(text:string):string[] {return text.match(/https?:\/\/[^\s<>"'\\`]+/gi)||[];}
function sourceVariants(raw:string):string[] {
  let clean=raw,previous='';
  while(previous!==clean){
    previous=clean;clean=clean.replace(/[.,;:!?]+$/,'');
    for(const [open,close] of [['(',')'],['[',']'],['{','}']])if(clean.endsWith(close)&&clean.split(close).length>clean.split(open).length)clean=clean.slice(0,-1);
  }
  return [...new Set([publicURL(raw),publicURL(clean)].filter(Boolean))];
}
export function redact(text:string):string {
  return text.replace(/https?:\/\/[^\s<>"']+/gi, url=>publicURL(url) || "[private link removed]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[email removed]")
    .replace(/\b(?:sk|ghp|gho|github_pat)[-_][a-zA-Z0-9_-]{12,}\b/g,"[secret removed]")
    .replace(/(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]\d{3}[ .-]\d{4}\b/g,"[phone removed]");
}
export function validateInput(raw:unknown):AssistantInput {
  if(!record(raw)) throw Error("Invalid request.");
  exact(raw,["version","mode","goal","constraints","agenda","context",...(raw.version===2||raw.version===3?["schedule"]:[]),...(raw.version===3?["sourceLinks"]:[])]);
  if(![1,2,3].includes(raw.version as number) || typeof raw.mode!=='string' || !["plan","review"].includes(raw.mode) || !Array.isArray(raw.context) || raw.context.length>6) throw Error("Invalid request.");
  let sourceLinks:string[]|undefined;
  if(raw.version===3){
    if(!Array.isArray(raw.sourceLinks)||raw.sourceLinks.length>32)throw Error('Use at most thirty-two approved public source links.');
    sourceLinks=raw.sourceLinks.map(v=>{const u=publicURL(string(v,500,true));if(!u)throw Error('Use public source links without private parameters.');return u;});
    if(new Set(sourceLinks).size!==sourceLinks.length)throw Error('Remove duplicate source links.');
  }
  const seen=new Set<string>();
  const context=raw.context.map(c=>{
    if(!record(c)) throw Error("Invalid context."); exact(c,["id","label","text"]);
    const id=string(c.id,20,true); if(!contextIds.includes(id) || seen.has(id)) throw Error("Invalid context."); seen.add(id);
    return {id,label:string(c.label,80,true),text:string(c.text,4000)};
  });
  if(!seen.has("profile")) throw Error("Conference context is required.");
  return {version:raw.version as 1|2|3,...(sourceLinks?{sourceLinks}:{}),...(raw.version!==1?{schedule:validateSchedule(raw.schedule)}:{}),mode:raw.mode as "plan"|"review",goal:string(raw.goal,600,true),constraints:string(raw.constraints,2000),agenda:string(raw.agenda,8000),context};
}
export function allowedSources(input:AssistantInput):Set<string> {
  if(input.version===3)return new Set(input.sourceLinks);
  return new Set(textURLs(JSON.stringify(input)).flatMap(sourceVariants));
}
export function validateResult(raw:unknown,input:AssistantInput):AssistantResult {
  if(!record(raw)) throw Error("The response could not be checked."); exact(raw,["summary","suggestions","questions",...(input.version>=2?["recommendedSessionIds"]:[])]);
  if(!Array.isArray(raw.suggestions) || raw.suggestions.length<1 || raw.suggestions.length>4 || !Array.isArray(raw.questions) || raw.questions.length>4) throw Error("Invalid suggestions.");
  const evidence=new Set(input.version>=2?evidenceFor(input).map(e=>e.id):["goal","constraints","agenda",...input.context.map(c=>c.id)]), sources=allowedSources(input);
  const suggestions=raw.suggestions.map(s=>{
    if(!record(s)) throw Error("Invalid suggestion."); exact(s,["title","action","why","uncertainty","guideId","evidenceIds","worksheet","fields",...(input.version>=2?["evidenceQuotes"]:[])]);
    const worksheet=string(s.worksheet,30) as Worksheet;
    if(!Object.hasOwn(worksheetFields,worksheet) || !guideIds.includes(s.guideId as typeof guideIds[number]) || !Array.isArray(s.fields) || !s.fields.length || s.fields.length>6 || !Array.isArray(s.evidenceIds) || !s.evidenceIds.length || s.evidenceIds.length>6 || s.evidenceIds.some(id=>!evidence.has(String(id)))) throw Error("Unsupported suggestion.");
    const seen=new Set<string>();
    const fields=s.fields.map(f=>{
      if(!record(f)) throw Error("Invalid draft."); exact(f,["key","value"]);
      const key=string(f.key,40,true), value=string(f.value,key==="target-name"?140:2000);
      if(!(worksheetFields[worksheet] as readonly string[]).includes(key) || seen.has(key)) throw Error("Unsupported worksheet field."); seen.add(key);
      if(["target-link","experience-source"].includes(key) && value && !sources.has(publicURL(value))) throw Error("Unprovided source URL.");
      return {key,value};
    });
    if(worksheet==="targets" && ["target-name","target-action"].some(k=>!fields.find(f=>f.key===k)?.value)) throw Error("Incomplete priority.");
    const quotes=input.version>=2?(()=>{if(!Array.isArray(s.evidenceQuotes)||s.evidenceQuotes.length>6)throw Error("Unsupported references.");return s.evidenceQuotes.map(q=>{if(!record(q))throw Error("Invalid reference.");exact(q,["id","quote"]);return {id:string(q.id,40,true),quote:string(q.quote,500,true)};});})():undefined;
    return {...(quotes?{evidenceQuotes:quotes}:{}),title:string(s.title,140,true),action:string(s.action,1200,true),why:string(s.why,1200,true),uncertainty:string(s.uncertainty,1200,true),guideId:String(s.guideId),evidenceIds:s.evidenceIds.map(String),worksheet,fields};
  });
  const selected=input.version>=2?(()=>{if(!Array.isArray(raw.recommendedSessionIds)||raw.recommendedSessionIds.length>18)throw Error("Invalid session selection.");return raw.recommendedSessionIds.map(id=>string(id,32,true));})():undefined;
  const result={summary:string(raw.summary,1600,true),suggestions,questions:raw.questions.map(q=>string(q,600,true)),...(selected?{recommendedSessionIds:selected}:{})};
  if(input.version>=2){
    const text=[result.summary,...result.questions,...result.suggestions.flatMap(s=>[s.title,s.action,s.why,s.uncertainty,...s.fields.map(f=>f.value)])];
    for(const t of text){
      if(redact(t)!==t)throw Error('Generated contact details or private links are unsupported.');
      if(textURLs(t).some(url=>!sourceVariants(url).some(v=>sources.has(v))))throw Error('Unprovided source URL.');
    }
  }
  checkGroundedResult(result,input);return result;
}
const text={type:"string"};
const fieldSchema={type:"object",additionalProperties:false,required:["key","value"],properties:{
  key:{type:"string",enum:[...new Set(Object.values(worksheetFields).flat())]},value:text
}};
const suggestionSchema={type:"object",additionalProperties:false,
  required:["title","action","why","uncertainty","guideId","evidenceIds","worksheet","fields"],properties:{
    title:text,action:text,why:text,uncertainty:text,
    guideId:{type:"string",enum:guideIds},evidenceIds:{type:"array",minItems:1,maxItems:6,items:text},
    worksheet:{type:"string",enum:Object.keys(worksheetFields)},fields:{type:"array",minItems:1,maxItems:6,items:fieldSchema}
  }
};
export const resultSchema={type:"object",additionalProperties:false,required:["summary","suggestions","questions"],properties:{
  summary:text,questions:{type:"array",items:text,maxItems:4},suggestions:{type:"array",minItems:1,maxItems:4,items:suggestionSchema}
}};

const evidenceQuoteSchema={type:"object",additionalProperties:false,required:["id","quote"],properties:{id:text,quote:text}};
export const groundedResultSchema={...resultSchema,required:[...resultSchema.required,"recommendedSessionIds"],properties:{...resultSchema.properties,
  recommendedSessionIds:{type:"array",items:text,maxItems:18},
  suggestions:{...resultSchema.properties.suggestions,items:{...suggestionSchema,required:[...suggestionSchema.required,"evidenceQuotes"],properties:{...suggestionSchema.properties,evidenceQuotes:{type:"array",minItems:1,maxItems:6,items:evidenceQuoteSchema}}}}
}};

export function quoteChoices(text:string,hint=''):string[]{
  const offsets=[0,Math.max(0,Math.floor(text.length/2)-100),Math.max(0,text.length-200)];
  const values=[...(hint&&text.includes(hint)&&hint.length<=200?[hint]:[]),...offsets.map(start=>text.slice(start,start+200).trim())];
  return [...new Set(values.filter(q=>q.length>=Math.min(8,text.trim().length)))];
}
export function providerSchema(input:AssistantInput){
  if(input.version<3)return input.version===2?groundedResultSchema:resultSchema;
  const choices=evidenceFor(input).map(e=>({type:'object',additionalProperties:false,required:['id','quote'],properties:{id:{type:'string',enum:[e.id]},quote:{type:'string',enum:quoteChoices(e.text,e.label)}}}));
  const {evidenceIds:_redundant,...properties}=groundedResultSchema.properties.suggestions.items.properties;
  const sourceKeys=['target-link','experience-source'];
  const draftFields={type:'array',minItems:1,maxItems:6,items:{anyOf:[
    {...fieldSchema,properties:{key:{type:'string',enum:fieldSchema.properties.key.enum.filter(k=>!sourceKeys.includes(k))},value:text}},
    {...fieldSchema,properties:{key:{type:'string',enum:sourceKeys},value:{type:'string',enum:['',...(input.sourceLinks||[])]}}}
  ]}};
  return {...groundedResultSchema,properties:{...groundedResultSchema.properties,suggestions:{...groundedResultSchema.properties.suggestions,items:{...groundedResultSchema.properties.suggestions.items,required:groundedResultSchema.properties.suggestions.items.required.filter(k=>k!=='evidenceIds'),properties:{...properties,fields:draftFields,evidenceQuotes:{type:'array',minItems:1,maxItems:6,items:{anyOf:choices}}}}}}};
}
export function validateProviderResult(raw:unknown,input:AssistantInput):AssistantResult {
  if(input.version<3||!record(raw)||!Array.isArray(raw.suggestions))return validateResult(raw,input);
  const known=new Map(evidenceFor(input).map(e=>[e.id,e.text]));
  const suggestions=raw.suggestions.map(s=>{
    if(!record(s)||Object.hasOwn(s,'evidenceIds')||!Array.isArray(s.evidenceQuotes))return s;
    if(s.evidenceQuotes.length<1||s.evidenceQuotes.length>6)throw Error('Each reference needs supporting text.');
    const quotes=new Map<string,{id:string;quote:string}>();
    for(const q of s.evidenceQuotes){
      if(!record(q)||typeof q.id!=='string'||typeof q.quote!=='string')throw Error('The supporting text was not supplied.');
      exact(q,['id','quote']);
      const source=known.get(q.id);
      if(!source||!q.quote.trim()||q.quote.length>500||q.quote.length<Math.min(8,source.length)||!source.includes(q.quote))throw Error('The supporting text was not supplied.');
      // Validate every quote before coalescing repeated references to one source.
      if(!quotes.has(q.id))quotes.set(q.id,{id:q.id,quote:q.quote});
    }
    return {...s,evidenceIds:[...quotes.keys()],evidenceQuotes:[...quotes.values()]};
  });
  return validateResult({...raw,suggestions},input);
}
