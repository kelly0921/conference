export const guideIds = ["worth", "funding", "prepare", "prioritize", "time", "conversations", "explore", "followup", "learning"] as const;
export const worksheetFields = {
  targets: ["target-name", "target-action", "target-backup", "target-question", "target-link"],
  decision: ["decision-goal", "decision-fit", "decision-alt", "decision-next"],
  experience: ["experience-name", "experience-purpose", "experience-question", "experience-action", "experience-backup", "experience-source"],
  learning: ["insight-goal", "insight-use", "insight-action"]
} as const;
export type Worksheet = keyof typeof worksheetFields;
export type AssistantInput = {version:1; mode:"plan"|"review"; goal:string; constraints:string; agenda:string; context:{id:string;label:string;text:string}[]};
export type Suggestion = {title:string; action:string; why:string; uncertainty:string; guideId:string; evidenceIds:string[]; worksheet:Worksheet; fields:{key:string;value:string}[]};
export type AssistantResult = {summary:string; suggestions:Suggestion[]; questions:string[]};
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
export function redact(text:string):string {
  return text.replace(/https?:\/\/[^\s<>"']+/gi, url=>publicURL(url) || "[private link removed]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[email removed]")
    .replace(/\b(?:sk|ghp|gho|github_pat)[-_][a-zA-Z0-9_-]{12,}\b/g,"[secret removed]")
    .replace(/(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]\d{3}[ .-]\d{4}\b/g,"[phone removed]");
}
export function validateInput(raw:unknown):AssistantInput {
  if(!record(raw)) throw Error("Invalid request.");
  exact(raw,["version","mode","goal","constraints","agenda","context"]);
  if(raw.version!==1 || !["plan","review"].includes(String(raw.mode)) || !Array.isArray(raw.context) || raw.context.length>6) throw Error("Invalid request.");
  const seen=new Set<string>();
  const context=raw.context.map(c=>{
    if(!record(c)) throw Error("Invalid context."); exact(c,["id","label","text"]);
    const id=string(c.id,20,true); if(!contextIds.includes(id) || seen.has(id)) throw Error("Invalid context."); seen.add(id);
    return {id,label:string(c.label,80,true),text:string(c.text,4000)};
  });
  if(!seen.has("profile")) throw Error("Conference context is required.");
  return {version:1,mode:raw.mode as "plan"|"review",goal:string(raw.goal,600,true),constraints:string(raw.constraints,2000),agenda:string(raw.agenda,8000),context};
}
export function allowedSources(input:AssistantInput):Set<string> {
  const urls=(JSON.stringify(input).match(/https?:\/\/[^\s<>"\\]+/gi)||[]).map(publicURL).filter(Boolean);
  return new Set(urls);
}
export function validateResult(raw:unknown,input:AssistantInput):AssistantResult {
  if(!record(raw)) throw Error("The response could not be checked."); exact(raw,["summary","suggestions","questions"]);
  if(!Array.isArray(raw.suggestions) || raw.suggestions.length<1 || raw.suggestions.length>4 || !Array.isArray(raw.questions) || raw.questions.length>4) throw Error("Invalid suggestions.");
  const evidence=new Set(["goal","constraints","agenda",...input.context.map(c=>c.id)]), sources=allowedSources(input);
  const suggestions=raw.suggestions.map(s=>{
    if(!record(s)) throw Error("Invalid suggestion."); exact(s,["title","action","why","uncertainty","guideId","evidenceIds","worksheet","fields"]);
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
    return {title:string(s.title,140,true),action:string(s.action,1200,true),why:string(s.why,1200,true),uncertainty:string(s.uncertainty,1200,true),guideId:String(s.guideId),evidenceIds:s.evidenceIds.map(String),worksheet,fields};
  });
  return {summary:string(raw.summary,1600,true),suggestions,questions:raw.questions.map(q=>string(q,600,true))};
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
