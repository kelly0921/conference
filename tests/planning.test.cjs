/* Behavioral checks for migration, recovery, validation and complete worksheets. */
const {test}=require("node:test"), assert=require("node:assert/strict");
test("draft status announces once while input continues across the shared listeners",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 let text="Saved in this browser", writes=0;
 const status={get textContent(){return text;},set textContent(v){text=v;writes++;}};
 const container={getAttribute:k=>k==="data-draft-owner"?"ghc":"learning",querySelectorAll:()=>[field]};
 const field={id:"insight-learning",value:"First draft",type:"textarea",dataset:{},removeAttribute(){},
   closest:selector=>selector==="[data-draft-scope]"?container:selector.includes(".edbody")?{}:null};
 a.context.document.querySelectorAll=selector=>selector===".save-state"?[status]:[];
 a.listeners["document-input"]({target:field});
 field.value="Continuing the same draft";a.listeners["document-input"]({target:field});
 assert.equal(writes,1);assert.equal(text,"Draft kept in this browser · Worksheet not saved");
 assert.equal(a.run("getPlan().worksheetDrafts.learning.values['insight-learning']"),field.value);
});
test("default export hides URL credentials, encoded tokens and fragment secrets",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 for(const url of ["https://user:private@example.org/event","https://example.org/?%74oken=private","https://example.org/#auth_token=private"]){
  a.context.url=url;a.run("getPlan().organizerUrl=url");
  const text=a.run("fieldPlanText(getPlan())");assert.ok(text.includes("[private source link hidden]"));assert.ok(!text.includes(url));
 }
 a.run("getPlan().printPreferences={includePrivateLinks:'false'}");
 assert.equal(a.run("printPrefs(getPlan()).includePrivateLinks"),false);
 a.run("getPlan().printPreferences.includePrivateLinks=true");assert.ok(a.run("fieldPlanText(getPlan())").includes("auth_token=private"));
});
const {application}=require("../scripts/application_runtime.cjs");
const key="conference-playbook-integrated-v5";
const click=(a,d)=>a.run("delegatedClick({target:{closest:()=>({dataset:"+JSON.stringify(d)+"})}})");
const set=(a,prefix,values)=>Object.entries(values).forEach(([k,v])=>a.node(prefix+k).value=v);
const profile={name:"Fictional Open Conference",date:"2027-03-08",end:"2027-03-10",timezone:"Europe/Paris",format:"Online",location:"Online",url:"https://example.org/conference",currency:"EUR",goal:"Technical learning"};
test("universal setup saves complete multi-day profiles without depending on presets",()=>{
 const a=application(); set(a,"custom-",profile);click(a,{createCustom:""});
 assert.equal(a.run("getPlan().end"),profile.end);assert.equal(a.run("getPlan().timezone"),profile.timezone);
 assert.equal(a.run("getPlan().organizerUrl"),profile.url);assert.equal(a.run("getPlan().format"),"Online");
 assert.equal(a.run("getPlan().currency"),"EUR");assert.equal(a.run("getPlan().presetId"),"");
 assert.ok(a.run("renderSetup()").indexOf("data-create-custom")<a.run("renderSetup()").indexOf("data-create-event"));
 const b=application(Object.fromEntries(a.values));assert.equal(b.run("getPlan().name"),profile.name);
 assert.ok(b.run("renderFieldPlan()").includes("Mar 10"));assert.ok(b.run("fieldPlanText(getPlan())").includes(profile.url));
});
test("invalid profile dates, timezones, URL schemes and currencies cannot create a plan",()=>{
 for(const change of [{end:"2027-03-01"},{date:"2027-02-30"},{timezone:"not/a-zone"},{url:"javascript:alert(1)"},{currency:"ZZZ"}]){
  const a=application();set(a,"custom-",{...profile,...change});click(a,{createCustom:""});
  assert.equal(a.run("getPlan()"),null);assert.ok(a.node("profile-warning").textContent);
 }
});
test("migration retains legacy data and privacy without inventing format or organizer facts",()=>{
 const a=application({[key]:JSON.stringify({activeId:"old",plans:{old:{id:"old",name:"Existing plan",date:"2026-11-12",tasks:{learning:true},budget:{travel:700},notes:[{context:"Actual",action:"Check",done:false}],insight:{learning:"Existing lesson"},drafts:{pre:"Private"},printPreferences:{includeContacts:true}}}})});
 assert.equal(a.run("getPlan().insight.learning"),"Existing lesson");assert.equal(a.run("getPlan().budget.travel"),700);
 assert.equal(a.run("getPlan().tasks.learning"),true);assert.equal(a.run("getPlan().format"),"");
 assert.equal(a.run("getPlan().organizerUrl"),"");assert.equal(a.run("printPrefs(getPlan()).includeContacts"),true);
 assert.ok(a.run("getPlan().notes[0].id"));assert.equal(a.run("db.schemaVersion"),6);
});
test("worksheet drafts survive reload and switching without replacing committed data",()=>{
 const a=application();a.run("ensurePreset('ghc');getPlan().insight.learning='Saved lesson';recordWorksheetDraft('ghc','learning',{'insight-learning':'Still typing'});ensurePreset('shpe')");
 assert.equal(a.run("getPlan().worksheetDrafts.learning"),undefined);
 const b=application(Object.fromEntries(a.values));b.run("switchPlan('ghc')");
 assert.equal(b.run("getPlan().worksheetDrafts.learning.values['insight-learning']"),"Still typing");
 assert.equal(b.run("getPlan().insight.learning"),"Saved lesson");
 b.run("recordWorksheetDraft('ghc','story',{'story-context':'Other draft'});clearWorksheetDraftFor({},'learning');save()");
 assert.equal(b.run("getPlan().worksheetDrafts.learning"),undefined);assert.equal(b.run("getPlan().worksheetDrafts.story.values['story-context']"),"Other draft");
});
test("blocked storage keeps drafts in memory, warns, and will not falsely delete a saved plan",()=>{
 const a=application({},true);a.run("ensurePreset('ghc')");
 assert.equal(a.run("recordWorksheetDraft('ghc','learning',{'insight-learning':'Recovery'})"),false);
 assert.equal(a.run("getPlan().worksheetDrafts.learning.values['insight-learning']"),"Recovery");
 assert.equal(a.run("deletePlannerRecord('ghc')"),false);assert.equal(a.run("getPlan().id"),"ghc");
 assert.ok(a.node("status").innerHTML.includes("storage is unavailable"));
});
test("invalid timezones and malformed appointment fields are rejected before saving",()=>{
 const base={label:"Fictional meeting",date:"2026-10-29",start:"09:30",end:"10:10",timezone:"America/Los_Angeles",venue:"Demo room",fixed:"fixed",access:"User-reported confirmed",buffer:"10",source:"https://example.org/meeting"};
 for(const change of [{timezone:"not/a-zone"},{date:"2026-02-30"},{start:"26:10"},{buffer:"-1"},{buffer:"601"},{source:"javascript:alert(1)"}]){
  const a=application();a.run("ensurePreset('ghc')");set(a,"activity-",{...base,...change});click(a,{saveActivity:"1"});
  assert.equal(a.run("getPlan().activities.length"),0);assert.ok(a.node("activity-error").textContent);
 }
 const a=application();a.run("ensurePreset('ghc');getPlan().timezone='Europe/Paris'");set(a,"activity-",base);click(a,{saveActivity:"1"});
 assert.equal(a.run("getPlan().activities.length"),1);assert.equal(a.run("getPlan().timezone"),"Europe/Paris");
 assert.ok(a.run("fieldPlanText(getPlan())").includes("America/Los_Angeles"));
});
test("legacy invalid appointments stay recoverable but leave the confirmed section",()=>{
 const a=application();a.run("ensurePreset('ghc');getPlan().timezone='not/a-zone';getPlan().activities=[{label:'Old meeting',date:'2026-10-29',start:'09:30',end:'10:00',fixed:true,status:'User-reported confirmed',timezone:'not/a-zone',venue:'Demo'}]");
 const text=a.run("fieldPlanText(getPlan())");
 assert.ok(text.includes("Timezone needs checking"));assert.ok(!text.includes("not/a-zone"));
 assert.ok(text.includes("Schedule needs rechecking"));assert.ok(!text.includes("Confirmed commitments:"));
 assert.equal(a.run("getPlan().activities[0].timezone"),"not/a-zone");
});
test("checklist filters recommendations by goal and format and keeps skipped actions reversible",()=>{
 const a=application();set(a,"custom-",profile);click(a,{createCustom:""});
 assert.equal(a.run("taskFilter(TASKS.find(t=>t.id==='travel'),'now')"),false);
 assert.equal(a.run("taskFilter(TASKS.find(t=>t.id==='online'),'now')"),true);
 assert.equal(a.run("taskFilter(TASKS.find(t=>t.id==='applications'),'now')"),false);
 const before=a.run("checklistProgress(getPlan(),'now').total");
 a.run("getPlan().tasks.online=true");click(a,{skipTask:"online"});
 assert.equal(a.run("checklistProgress(getPlan(),'now').total"),before-1);
 assert.equal(a.run("getPlan().tasks.online"),true);
 click(a,{skipTask:"online"});assert.equal(a.run("checklistProgress(getPlan(),'now').total"),before);
 assert.ok(a.run("renderChecklistRows(getPlan())").includes('href="#/guide/prepare"'));
});
test("funding terms save independently from cash arithmetic and are private by default",()=>{
 const a=application();a.run("ensurePreset('ghc');getPlan().currency='EUR';getPlan().budget.travel=800");
 set(a,"funding-",{name:"Fictional travel grant",source:"https://example.org/grant",expense:"Receipts required",edition:"2026",deadline:"2026-10-20","deadline-time":"17:00",timezone:"America/New_York",status:"Pending",method:"Later reimbursement",reimbursement:"2026-11-30",next:"Check refund terms"});
 click(a,{saveFunding:"1"});assert.equal(a.run("getPlan().budget.sources.length"),1);
 assert.equal(a.run("budgetCalc(getPlan().budget).upfront"),800);
 assert.ok(!a.run("fieldPlanText(getPlan())").includes("Fictional travel grant"));
 a.run("getPlan().printPreferences.includeFunding=true");
 const text=a.run("fieldPlanText(getPlan())");assert.ok(text.includes("EUR 800"));assert.ok(text.includes("2026-11-30"));assert.ok(text.includes("17:00"));
 set(a,"budget-",{travel:"900"});click(a,{saveBudget:"1"});assert.equal(a.run("getPlan().budget.sources.length"),1);
});
test("follow-up response and outcomes can be edited without pretending the action is complete",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 set(a,"note-",{context:"Fictional conversation",next:"Send promised article",channel:"PRIVATE",due:"2026-11-01",status:"Sent",response:"Received reply",outcome:"Asked a question",source:"https://example.org/article"});
 click(a,{saveNote:"1"});assert.equal(a.run("getPlan().notes[0].done"),false);
 const id=a.run("getPlan().notes[0].id");click(a,{editNote:id});
 set(a,"note-",{context:"Fictional conversation",next:"Send promised article",status:"Completed",response:"Received reply",outcome:"Shared article"});
 click(a,{saveNote:"1"});assert.equal(a.run("getPlan().notes.length"),1);assert.equal(a.run("getPlan().notes[0].done"),true);
 const text=a.run("fieldPlanText(getPlan())");assert.ok(text.includes("Outcome: Shared article"));assert.ok(!text.includes("PRIVATE"));
});
test("community provenance and debrief choices survive save and export",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 set(a,"experience-",{name:"Fictional session",purpose:"Learn a method",source:"https://example.org/session",date:"2026-10-29",time:"11:00",timezone:"America/Los_Angeles",venue:"Demo room",access:"Requested",question:"How do you test?",action:"Check RSVP",backup:"Open workshop"});
 click(a,{saveExperience:"1"});assert.equal(a.run("getPlan().experience.venue"),"Demo room");
 set(a,"insight-",{goal:"Learning",observed:"Tried an exercise",learning:"Method did not fit",use:"My project",decision:"Deliberate no action",action:"Existing approach fits",review:"2026-11-10",outcome:"Kept existing approach"});
 click(a,{saveInsight:"1"});assert.equal(a.run("getPlan().tasks.learning"),true);
 const b=application(Object.fromEntries(a.values)), text=b.run("fieldPlanText(getPlan())");
 for(const value of ["https://example.org/session","11:00","Deliberate no action","Kept existing approach"])assert.ok(text.includes(value));
});
test("backup restore preserves existing plans and drafts as separate duplicate copies",()=>{
 const a=application();a.run("ensurePreset('ghc');getPlan().drafts.pre='Private draft';recordWorksheetDraft('ghc','learning',{'insight-learning':'Unsaved text'})");
 const payload=a.run("JSON.stringify(backupPayload())");
 a.run("getPlan().name='Existing newer name'");
 a.context.backup=payload;a.run("restoreBackupRecords(parseBackup(backup));save()");
 assert.equal(a.run("db.plans.ghc.name"),"Existing newer name");assert.equal(a.run("Object.keys(db.plans).length"),2);
 assert.equal(a.run("Object.values(db.plans).find(p=>p.id!=='ghc').drafts.pre"),"Private draft");
 assert.equal(a.run("Object.values(db.plans).find(p=>p.id!=='ghc').worksheetDrafts.learning.values['insight-learning']"),"Unsaved text");
 const b=application(Object.fromEntries(a.values));assert.equal(b.run("Object.keys(db.plans).length"),2);
});
test("malformed, duplicate and prototype-key backups fail without changing plans",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 const original=a.run("JSON.stringify(db)"), valid=JSON.parse(a.run("JSON.stringify(backupPayload())"));
 for(const value of [{}, {...valid,plans:[...valid.plans,...valid.plans]}, {...valid,plans:[{...valid.plans[0],id:"__proto__"}]}, {...valid,plans:[{...valid.plans[0],notes:{}}]}]){
  a.context.restoreText=JSON.stringify(value);assert.throws(()=>a.run("restoreBackupRecords(parseBackup(restoreText))"));assert.equal(a.run("JSON.stringify(db)"),original);
 }
});
test("deleting one plan leaves other conferences and private records intact",()=>{
 const a=application();a.run("ensurePreset('ghc');ensurePreset('shpe');getPlan().drafts.pre='Retain';deletePlannerRecord('ghc')");
 assert.equal(a.run("db.plans.ghc"),undefined);assert.equal(a.run("getPlan().drafts.pre"),"Retain");
 const b=application(Object.fromEntries(a.values));assert.equal(b.run("getPlan().id"),"shpe");assert.equal(b.run("getPlan().drafts.pre"),"Retain");
});
test("event-local dates and the end date determine the current planning phase",()=>{
 const a=application();a.run("ensurePreset('ghc')");
 a.context.Date=class extends Date {constructor(...args){super(...(args.length?args:["2026-10-13T23:30:00Z"]));}static now(){return Date.parse("2026-10-13T23:30:00Z");}};
 a.run("getPlan().timezone='Pacific/Kiritimati';getPlan().date='2026-10-14';getPlan().end='2026-10-16';taskPhase='now'");
 assert.equal(a.run("daysTo(getPlan().date)"),0);a.run("renderPlannerWorkspace()");assert.equal(a.run("taskPhase"),"onsite");
 a.run("getPlan().end='2026-10-13';taskPhase='now';renderPlannerWorkspace()");assert.equal(a.run("taskPhase"),"after");
 a.run("ensurePreset('shpe')");assert.equal(a.run("taskPhase"),"now");
});
test("failed saves never announce that worksheet changes were persisted",()=>{
 const a=application({},true);a.run("ensurePreset('ghc')");
 set(a,"insight-",{learning:"Recover this",action:"Check later"});click(a,{saveInsight:"1"});
 assert.ok(a.node("status").innerHTML.includes("in memory only"));assert.ok(a.run("backupPayload().plans[0].insight.learning")==="Recover this");
});
test("priority draft identities do not move to another target after a removal",()=>{
 const a=application();a.run("ensurePreset('ghc');getPlan().targets=[{id:'first',name:'First',action:'Check'},{id:'second',name:'Second',action:'Check'}];editingTarget=1;recordWorksheetDraft('ghc',worksheetScope('targets'),{'target-name':'Unfinished second edit'});getPlan().targets.splice(0,1);editingTarget=0");
 assert.equal(a.run("worksheetScope('targets')"),"targets:second");
 assert.equal(a.run("getPlan().worksheetDrafts[worksheetScope('targets')].values['target-name']"),"Unfinished second edit");
 a.run("getPlan().targets=[];handlePlannerClick({dataset:{resumeDraft:'targets:second'}})");
 assert.ok(a.run("editorTargets(getPlan())").includes('data-draft-scope="targets:second"'));
});
test("v4 import normalizes old notes while keeping current plans and safe export defaults",()=>{
 const a=application({"conference-playbook-integrated-v4":JSON.stringify({activeId:"old",plans:{old:{name:"Old imported",date:"2026-11-12",notes:[{context:"Existing note",action:"Check",channel:"PRIVATE_CHANNEL"}],printPreferences:{includeContacts:true}}}})});
 a.run("ensurePreset('ghc')");click(a,{importV4:"1"});
 assert.ok(a.run("db.plans.ghc"));assert.ok(a.run("db.plans.old.notes[0].id"));
 a.run("switchPlan('old')");assert.ok(!a.run("fieldPlanText(getPlan())").includes("PRIVATE_CHANNEL"));
});
