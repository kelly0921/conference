/* Shared planner validation, migration, drafts and conference profile. */
const PLANNER_GOALS = ["Recruiting / career", "Technical learning", "People / community", "Build / share a project"];
const EVENT_FORMATS = ["In person", "Online", "Hybrid"];
const TASK_GUIDES = {decision:"worth", access:"prepare", targets:"prioritize", story:"conversations",
  budget:"funding", experience:"explore", outreach:"conversations", schedule:"time",
  daychoice:"time", notes:"conversations", followup:"followup", learning:"learning",
  online:"prepare", travel:"time", applications:"prepare"};
let editingProfile = false, editingFunding = null, editingNote = null, pendingDeletePlan = null, resumeTargetId = null;

function validISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parts = value.split("-").map(Number), date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() === parts[0] &&
    date.getUTCMonth() + 1 === parts[1] && date.getUTCDate() === parts[2];
}
function validTimeZone(value) {
  if (!String(value || "").trim()) return false;
  try { new Intl.DateTimeFormat("en-US", {timeZone:value}).format(new Date()); return true; }
  catch (_) { return false; }
}
function validWebURL(value) {
  if (!value) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); }
  catch (_) { return false; }
}
function validCurrency(value) {
  if (!/^[A-Z]{3}$/.test(value)) return false;
  try {
    return typeof Intl.supportedValuesOf !== "function" ||
      Intl.supportedValuesOf("currency").includes(value);
  } catch (_) { return false; }
}
function currencyPlaces(code) {
  try { return new Intl.NumberFormat("en-US", {style:"currency", currency:code}).resolvedOptions().maximumFractionDigits; }
  catch (_) { return 2; }
}
function currencySymbol(code) {
  try { return new Intl.NumberFormat("en-US", {style:"currency", currency:code}).formatToParts(0).find(x=>x.type==="currency").value; }
  catch (_) { return code; }
}
function zoneLabel(value) { return !value ? "" : validTimeZone(value) ? value : "Timezone needs checking"; }
function planDateRange(p) { return prettyDate(p.date) + (p.end && p.end !== p.date ? " – " + prettyDate(p.end) : ""); }
function freshPlanId(prefix) {
  const suffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() :
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10);
  return (prefix || "custom") + "-" + suffix;
}
function normalizePlanRecord(raw, id) {
  const p = {...raw};
  p.id = id || p.id;
  for (const key of ["name","date","location","timezone","goal"]) p[key] = typeof p[key] === "string" ? p[key] : "";
  p.end = typeof p.end === "string" && p.end ? p.end : p.date;
  p.currency = validCurrency(p.currency) ? p.currency : "USD";
  p.format = typeof p.format === "string" ? p.format : "";
  p.organizerUrl = typeof p.organizerUrl === "string" ? p.organizerUrl : "";
  p.presetId = p.presetId || (typeof EVENTS !== "undefined" && EVENTS[p.id] ? p.id : "");
  for (const key of ["tasks","skippedTasks","decision","dayChoice","access","story","budget","experience","insight","drafts","printPreferences","worksheetDrafts"])
    if (!p[key] || typeof p[key] !== "object" || Array.isArray(p[key])) p[key] = {};
  for (const key of ["targets","activities","notes"]) if (!Array.isArray(p[key])) p[key] = [];
  p.targets = p.targets.filter(n=>n && typeof n==="object").map((n,i)=>({...n,id:n.id || p.id+"-target-"+i}));
  p.activities = p.activities.filter(n=>n && typeof n==="object");
  p.notes = p.notes.filter(n=>n && typeof n==="object");
  p.notes = p.notes.map((n,i)=>({...n, id:n.id || p.id + "-note-" + i}));
  if (!Array.isArray(p.budget.sources)) p.budget.sources = [];
  p.budget.sources = p.budget.sources.filter(n=>n && typeof n==="object").map((n,i)=>({...n, id:n.id || p.id + "-funding-" + i}));
  return p;
}
function normalizePlannerDatabase(raw) {
  const plans = Object.create(null);
  for (const [id,p] of Object.entries(raw.plans || {}))
    if (p && typeof p === "object" && !Array.isArray(p) && !["__proto__","constructor","prototype"].includes(id)) plans[id] = normalizePlanRecord(p,id);
  return {schemaVersion:6, activeId:plans[raw.activeId] ? raw.activeId : null, plans,
    setupDraft:raw.setupDraft && typeof raw.setupDraft === "object" ? raw.setupDraft : {},
    looseDrafts:raw.looseDrafts && typeof raw.looseDrafts === "object" ? raw.looseDrafts : {}};
}
function activatePlannerPlan(p) {
  editingProfile = false; editingFunding = null; editingNote = null; resumeTargetId = null;
  selectedTask = "access"; taskPhase = "now"; editingTarget = -1;
  p.worksheetDrafts ||= {};
  for (const [scope,draft] of Object.entries(db.looseDrafts || {}))
    if (!p.worksheetDrafts[scope]) p.worksheetDrafts[scope] = draft;
  db.looseDrafts = {};
}
function initializePlannerTasks() {
  for (const task of [
    {id:"online",stage:"before",label:"Check online access and the event timezone",sub:"Join instructions, pass access and local times",editor:"access"},
    {id:"travel",stage:"before",label:"Check the journey and your buffers",sub:"Venue access, travel and room to pause",editor:"schedule"},
    {id:"applications",stage:"before",label:"Check the actual application route",sub:"Role requirements, official posting and next action",editor:"access"}
  ]) if (!TASKS.some(t=>t.id===task.id)) TASKS.push(task);
}
function taskAppliesToProfile(t,p) {
  if (t.id === "online") return !p.format || ["Online","Hybrid"].includes(p.format);
  if (t.id === "travel") return !p.format || ["In person","Hybrid"].includes(p.format);
  if (t.id === "applications") return !p.goal || p.goal === "Recruiting / career";
  if (t.id === "outreach") return !p.goal || p.goal !== "Technical learning";
  return true;
}
function checklistProgress(p,phase) {
  const applicable = TASKS.filter(t=>taskFilter(t,phase) && !p.skippedTasks?.[t.id]);
  return {done:applicable.filter(t=>p.tasks[t.id]).length, total:applicable.length};
}
function worksheetScope(task) {
  return task === "targets" ? "targets:" + (editingTarget >= 0 ? getPlan()?.targets[editingTarget]?.id || editingTarget : resumeTargetId || "new") : task;
}
function draftAttributes(p,scope) {
  return 'data-draft-owner="' + esc(p ? p.id : "anonymous") + '" data-draft-scope="' + esc(scope) + '"';
}
function draftStore(owner) {
  if (owner === "setup") return db.setupDraft;
  if (owner === "anonymous") return db.looseDrafts;
  const p = db.plans[owner];
  return p ? (p.worksheetDrafts ||= {}) : null;
}
function recordWorksheetDraft(owner,scope,values) {
  const store = draftStore(owner);
  if (!store) return false;
  store[scope] = {values:{...values}, updated:Date.now()};
  try { localStorage.setItem(STORAGE, JSON.stringify(db)); storageAvailable = true; return true; }
  catch (_) { storageAvailable = false; return false; }
}
function keepWorksheetDraft(target) {
  const container = typeof target?.closest === "function" ? target.closest("[data-draft-scope]") : null;
  if (!container || typeof container.getAttribute !== "function") return;
  const values = {};
  for (const field of container.querySelectorAll("input[id],textarea[id],select[id]")) {
    if (field.type === "file" || field.dataset.access !== undefined || field.closest("[data-draft-scope]") !== container) continue;
    values[field.id] = field.type === "checkbox" ? field.checked : field.value;
  }
  if (!Object.keys(values).length) return;
  const kept = recordWorksheetDraft(container.getAttribute("data-draft-owner"),
    container.getAttribute("data-draft-scope"), values);
  document.querySelectorAll(".save-state").forEach(x=>{
    const text = kept ? "Draft kept in this browser · Worksheet not saved" : "Unsaved draft · Download a backup before leaving";
    if (x.textContent !== text) x.textContent = text;
  });
}
function restoreWorksheetDrafts() {
  let restored = false;
  for (const container of document.querySelectorAll("[data-draft-scope]")) {
    const draft = draftStore(container.getAttribute("data-draft-owner"))?.[container.getAttribute("data-draft-scope")];
    if (!draft?.values) continue;
    for (const field of container.querySelectorAll("input[id],textarea[id],select[id]")) {
      if (field.type === "file" || field.closest("[data-draft-scope]") !== container || !(field.id in draft.values)) continue;
      if (field.type === "checkbox") field.checked = !!draft.values[field.id];
      else field.value = String(draft.values[field.id]);
    }
    restored = true;
  }
  if (restored) document.querySelectorAll(".save-state").forEach(x=>{
    x.textContent = storageAvailable ? "Draft kept in this browser · Worksheet not saved" : "Unsaved draft · Copy before leaving";
  });
}
function clearWorksheetDraftFor(button, fallback) {
  const container = typeof button?.closest === "function" ? button.closest("[data-draft-scope]") : null;
  const owner = container?.getAttribute?.("data-draft-owner") || getPlan()?.id || "anonymous";
  const scope = container?.getAttribute?.("data-draft-scope") || fallback || worksheetScope(selectedTask);
  const store = draftStore(owner);
  if (store) delete store[scope];
}
function formError(id,message,field) {
  const out = document.getElementById(id);
  if (out) out.textContent = message;
  if (field) { const el=document.getElementById(field); el?.setAttribute("aria-invalid","true"); el?.setAttribute("aria-describedby",id); el?.focus(); }
  return false;
}
function formField(id,label,value,type,help,attributes) {
  const extra=(help ? ' aria-describedby="'+id+'-help"' : "")+
    (label.includes("*") || ["custom-name","custom-date","custom-currency"].includes(id) ? ' aria-required="true"' : "");
  const control = type === "textarea" ?
    '<textarea id="' + id + '" rows="2"'+extra+'>' + esc(value || "") + '</textarea>' :
    '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(value || "") + '" ' + (attributes || "") + extra+'>';
  return '<div class="formrow"><label for="' + id + '">' + esc(label) + '</label>' + control +
    (help ? '<p class="helper" id="'+id+'-help">' + esc(help) + '</p>' : "") + '</div>';
}
function selectField(id,label,options,value) {
  const all = options.includes(value) || !value ? options : [...options,value];
  return '<div class="formrow"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '"'+(id==="custom-format" ? ' aria-required="true"' : "")+'>' +
    all.map(x=>'<option value="' + esc(x) + '" ' + (x === (value || "") ? "selected" : "") + '>' +
      esc(x || "Choose one") + '</option>').join("") + '</select></div>';
}
function profileValues() {
  return {name:gv("custom-name").trim(),date:gv("custom-date"),end:gv("custom-end") || gv("custom-date"),
    timezone:gv("custom-timezone").trim(),format:gv("custom-format"),location:gv("custom-location").trim(),
    organizerUrl:gv("custom-url").trim(),currency:gv("custom-currency").trim().toUpperCase(),goal:gv("custom-goal")};
}
function profileValidation(p) {
  if (!p.name) return ["Enter a conference name.","custom-name"];
  if (!validISODate(p.date)) return ["Enter a valid start date.","custom-date"];
  if (!validISODate(p.end) || p.end < p.date) return ["The end date must be on or after the start date.","custom-end"];
  if (p.timezone && !validTimeZone(p.timezone)) return ["Use a valid timezone, such as America/New_York or Europe/London.","custom-timezone"];
  if (!EVENT_FORMATS.includes(p.format)) return ["Choose in person, online or hybrid.","custom-format"];
  if (!validWebURL(p.organizerUrl)) return ["Use a full http:// or https:// organizer URL, or leave it blank.","custom-url"];
  if (!validCurrency(p.currency)) return ["Use a valid three-letter currency code, such as USD, EUR or CAD.","custom-currency"];
  return null;
}
function renderProfileEditor(p,setup) {
  const x = p || {currency:"USD",format:"",goal:""};
  return '<div class="conference-profile" ' + (setup ? 'data-draft-owner="setup" data-draft-scope="profile"' : draftAttributes(p,"profile")) + '>' +
    '<div class="edhead"><h2>' + (setup ? "Add your conference" : "Conference details") + '</h2><p>Use the organizer’s details. Leave an unknown website, location or timezone blank and check it before making commitments.</p></div><div class="edbody">' +
    formField("custom-name","Conference name",x.name,"text","",'maxlength="140" autocomplete="off"') +
    '<div class="fg2">' + formField("custom-date","Start date",x.date,"date") +
    formField("custom-end","End date",x.end,"date","Leave blank for a one-day event.") + '</div>' +
    '<div class="fg2">' + selectField("custom-format","Event format",["",...EVENT_FORMATS],x.format) +
    formField("custom-timezone","Event timezone",x.timezone,"text","Confirm the event’s zone, rather than your current location.",'list="timezone-choices"') + '</div>' +
    '<datalist id="timezone-choices">' + ["UTC","America/New_York","America/Los_Angeles","America/Chicago","America/Indiana/Indianapolis","Europe/London","Europe/Paris","Asia/Kolkata","Asia/Tokyo","Australia/Sydney"].map(z=>'<option value="' + z + '">').join("") + '</datalist>' +
    formField("custom-location","Location or online platform (if known)",x.location,"text") +
    formField("custom-url","Official organizer website (if known)",x.organizerUrl,"url") +
    '<div class="fg2">' + formField("custom-currency","Budget currency",x.currency,"text","Changing currency does not convert saved amounts.",'maxlength="3" list="currency-choices"') +
    selectField("custom-goal","Main goal",["",...PLANNER_GOALS],x.goal) + '</div>' +
    '<datalist id="currency-choices">' + ["USD","EUR","GBP","CAD","AUD","INR","JPY","CHF","CNY","BRL","MXN","ZAR","SGD"].map(c=>'<option value="' + c + '">').join("") + '</datalist>' +
    '<p class="error" id="profile-warning" role="alert"></p><div class="linkrow"><button class="btn primary" ' +
    (setup ? "data-create-custom" : 'data-save-profile="1"') + '>' + (setup ? "Create my plan" : "Save conference details") +
    '</button>' + (!setup ? '<button class="btn" data-cancel-profile="1">Back to checklist</button>' : "") +
    '</div><p class="save-state" role="status">' + (setup ? "Your records stay in this browser." : "Saved in this browser") + '</p></div></div>';
}
function renderUniversalSetup() {
  return '<section class="setup"><div class="eyebrow">My Conference</div><h1>A plan for your conference.</h1>' +
    '<p class="lead">Start with one useful outcome. Save a private checklist, use the guides you need, and take your field plan with you.</p>' +
    (oldPlanAvailable() ? '<div class="quiet-card"><p>An earlier plan can be imported without replacing current conferences.</p><button class="btn" data-import-v4="1">Import my v4 plans</button></div>' : "") +
    renderProfileEditor(null,true) +
    '<details class="preset-examples"><summary>Or start with an example conference</summary><p class="helper">Edition details are reference information, not confirmation of your registration or pass access. You can edit them.</p>' +
    '<div class="setuplist">' + Object.entries(EVENTS).map(([id,e])=>'<button class="select-card" data-create-event="' + id + '"><strong>' +
      esc(e.name) + '</strong><span>' + esc(prettyDate(e.date)) + '</span><span>' + esc(e.location) + '</span></button>').join("") +
    '</div></details><div class="data-controls setup-data">' + renderBackupControls() + '</div></section>';
}
function renderChecklistRows(p) {
  const eligible = TASKS.filter(t=>taskFilter(t,taskPhase)), other = TASKS.filter(t=>!taskFilter(t,taskPhase));
  const progress = checklistProgress(p,taskPhase);
  if (!TASKS.some(t=>t.id===selectedTask)) selectedTask=eligible[0]?.id || "access";
  const rows = tasks=>tasks.map(t=>{
    const skipped=!!p.skippedTasks[t.id], done=!!p.tasks[t.id];
    return '<div class="taskrow checklist-row ' + (selectedTask===t.id ? "active " : "") + (skipped ? "not-needed" : "") + '">' +
      '<label class="task-check"><input type="checkbox" data-task-check="' + t.id + '" ' + (done ? "checked " : "") + (skipped ? "disabled " : "") +
      'aria-label="Mark ' + esc(t.label) + ' prepared"></label><button class="titlebutton" data-task="' + t.id + '" ' +
      (selectedTask===t.id ? 'aria-current="step"' : "") + '><strong>' + esc(t.label) + '</strong><small>' + esc(t.sub) + '</small></button>' +
      '<div class="task-meta"><span class="task-state">' + (skipped ? "Not needed" : done ? "Prepared by you" : "Still to prepare") +
      '</span><div class="task-links"><a href="#/guide/' + TASK_GUIDES[t.id] + '" aria-label="Read guide: '+esc(GUIDE_BY_ID[TASK_GUIDES[t.id]].title)+'">Guide →</a><button class="task-skip" data-skip-task="' + t.id +
      '" aria-label="' + (skipped ? "Include " : "Mark ") + esc(t.label) + (skipped ? " in the checklist" : " not needed") + '">' +
      (skipped ? "Include" : "Not needed") + '</button></div></div></div>';
  }).join("");
  return '<div class="checklist-progress"><p id="checklist-count" role="status">' + progress.done + " of " + progress.total +
    ' applicable actions prepared</p><progress max="' + Math.max(1,progress.total) + '" value="' + progress.done +
    '" aria-labelledby="checklist-count"></progress><p class="helper">Your checkmarks record preparation. They do not confirm admission, funding or an invitation.</p></div>' +
    rows(eligible) + '<details class="other-steps" ' + (other.some(t=>t.id===selectedTask) ? "open" : "") +
    '><summary>All other planning steps</summary><p class="helper">Keep any step you find useful, even outside the suggested phase or goal.</p>' +
    rows(other) + '</details>';
}
function renderDraftResume(p) {
  const entries = Object.entries(p.worksheetDrafts || {}).sort((a,b)=>(b[1].updated || 0)-(a[1].updated || 0));
  if (!entries.length) return "";
  return '<div class="draft-resume"><p>A worksheet draft is kept in this browser.</p><button class="btn sm" data-resume-draft="' +
    esc(entries[0][0]) + '">Resume draft →</button></div>';
}
function renderBackupControls() {
  return '<h2>Your browser-local data</h2><p class="helper">A backup includes private notes, drafts, financial amounts and links for all your conferences. Keep the file private. Nothing is uploaded.</p>' +
    '<div class="linkrow"><button class="btn" data-backup-plans="1">Download private backup</button><label class="btn backup-import" for="backup-file">Restore a backup<input id="backup-file" type="file" accept=".json,application/json"></label></div>' +
    '<p class="helper">Restore keeps existing plans. Matching IDs become separate restored copies.</p><p id="backup-status" role="status"></p>';
}
function renderDataControls(p) {
  return '<details class="data-controls no-print"><summary>Backup, restore or delete a plan</summary>' + renderBackupControls() +
    '<div class="delete-plan-control"><p>Delete only <strong>' + esc(p.name) + '</strong> from this browser.</p><button class="btn danger" data-delete-plan="1">Delete this plan</button></div></details>' +
    '<dialog id="delete-plan-dialog" aria-labelledby="delete-plan-title"><h2 id="delete-plan-title">Delete this saved plan?</h2><p id="delete-plan-name"></p>' +
    '<p>The plan and its worksheet drafts will be removed from this browser. Download a backup first if you may need them.</p><div class="linkrow">' +
    '<button class="btn" data-cancel-delete="1">Keep plan</button><button class="btn danger" data-confirm-delete="1">Delete saved plan</button></div></dialog>';
}
function backupPayload() {
  return {app:"conference-playbook",backupVersion:1,schemaVersion:6,createdAt:new Date().toISOString(),
    activeId:db.activeId,plans:Object.values(db.plans),looseDrafts:db.looseDrafts,setupDraft:db.setupDraft};
}
function parseBackup(text) {
  const value = JSON.parse(text);
  if (value?.app !== "conference-playbook" || value.backupVersion !== 1 || !Array.isArray(value.plans) || value.plans.length > 100)
    throw Error("Use a Conference Playbook backup with at most 100 plans.");
  const ids = new Set();
  for (const p of value.plans) {
    if (!p || typeof p !== "object" || typeof p.id !== "string" || !p.id || p.id.length>200 ||
      typeof p.name !== "string" || !p.name.trim() || p.name.length>1000 || !validISODate(p.date) ||
      !validISODate(p.end || p.date) || (p.end || p.date)<p.date || ids.has(p.id) || ["__proto__","constructor","prototype"].includes(p.id))
      throw Error("The backup contains an invalid or duplicate conference record. No records were changed.");
    ids.add(p.id);
    for (const key of ["activities","targets","notes"])
      if (p[key] !== undefined && (!Array.isArray(p[key]) || p[key].length > 10000))
        throw Error("The backup contains an invalid worksheet list.");
  }
  return value;
}
function restoreBackupRecords(value) {
  const added = [], prepared = value.plans.map(p=>{
    const copy = JSON.parse(JSON.stringify(p));
    if (db.plans[copy.id]) { copy.id=freshPlanId("restored"); copy.name += " (restored copy)"; }
    return normalizePlanRecord(copy,copy.id);
  });
  for (const p of prepared) { db.plans[p.id]=p; added.push(p.id); }
  if (!db.activeId) db.activeId=added.find(id=>id===value.activeId) || added[0] || null;
  if (value.looseDrafts && !Object.keys(db.looseDrafts).length) db.looseDrafts=value.looseDrafts;
  if (value.setupDraft && !Object.keys(db.setupDraft).length) db.setupDraft=value.setupDraft;
  return added;
}
function deletePlannerRecord(id) {
  if (!db.plans[id]) return false;
  const before=JSON.parse(JSON.stringify(db));
  delete db.plans[id];
  if (db.activeId===id) db.activeId=Object.keys(db.plans)[0] || null;
  if (!save()) { db=before; return false; }
  if (typeof guideScratch !== "undefined") guideScratch.delete(id);
  editingProfile=false; editingFunding=null; editingNote=null; selectedTask="access"; taskPhase="now";
  return true;
}
function handlePlannerClick(button) {
  const d=button.dataset, p=getPlan();
  if (d.task || d.phase || d.launch || d.showAdd !== undefined) editingProfile=false;
  if (d.editProfile) { editingProfile=true; render(); document.getElementById("custom-name")?.focus(); return true; }
  if (d.cancelProfile) { editingProfile=false; render(); return true; }
  if (d.saveProfile && p) {
    const profile=profileValues(), error=profileValidation(profile);
    if (error) return !formError("profile-warning",...error);
    Object.assign(p,profile); clearWorksheetDraftFor(button,"profile"); editingProfile=false;
    refresh(); notifySaved("Conference details saved."); return true;
  }
  if (d.skipTask !== undefined && p) {
    p.skippedTasks[d.skipTask]=!p.skippedTasks[d.skipTask];
    refresh(); return true;
  }
  if (d.resumeDraft && p) {
    const scope=d.resumeDraft, [kind,id]=scope.split(":");
    editingProfile=kind==="profile";
    if (kind==="template") { navTo("templates/"+id); return true; }
    if (kind==="funding") { editingFunding={planId:p.id,id:id==="new" ? null : id}; selectedTask="budget"; }
    else if (kind==="note") { editingNote={planId:p.id,id:id==="new" ? null : id}; selectedTask="notes"; }
    else if (!editingProfile) {
      selectedTask=kind;
      if(kind==="targets") {
        editingTarget=id==="new" ? -1 : p.targets.findIndex(x=>x.id===id);
        resumeTargetId=editingTarget<0 && id!=="new" ? id : null;
      }
    }
    render(); return true;
  }
  if (d.backupPlans) {
    const blob=new Blob([JSON.stringify(backupPayload(),null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob), link=document.createElement("a");
    link.href=url; link.download="conference-playbook-private-backup-"+new Date().toISOString().slice(0,10)+".json";
    link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify("Private backup downloaded. Keep it somewhere safe."); return true;
  }
  if (d.deletePlan && p) {
    pendingDeletePlan=p.id;
    document.getElementById("delete-plan-name").textContent=p.name;
    document.getElementById("delete-plan-dialog").showModal();
    return true;
  }
  if (d.cancelDelete) { pendingDeletePlan=null; document.getElementById("delete-plan-dialog").close(); return true; }
  if (d.confirmDelete) {
    const id=pendingDeletePlan; pendingDeletePlan=null;
    document.getElementById("delete-plan-dialog").close();
    if (!deletePlannerRecord(id)) { notify("The saved plan could not be deleted. Browser storage is unavailable."); return true; }
    render(); notify("The selected plan was deleted."); return true;
  }
  return false;
}
async function handleBackupFile(input) {
  const file=input.files?.[0];
  if (!file) return;
  if (file.size>10*1024*1024) { formError("backup-status","Use a backup smaller than 10 MB."); return; }
  try {
    const value=parseBackup(await file.text()), ids=restoreBackupRecords(value), stored=save();
    render();
    notify(ids.length+" plan"+(ids.length===1 ? "" : "s")+" restored"+(stored ? " in this browser." : " in memory only. Download a backup before leaving."));
  } catch (error) { formError("backup-status",error.message || "The backup could not be read. No records were changed."); }
  input.value="";
}
/* Worksheets keep provenance and outcomes separate from confirmation. */
function rememberPlannerFocus() {
  const el=document.activeElement, main=document.getElementById("main");
  if(!el || !main?.contains?.(el)) return null;
  if(el.id) return {id:el.id};
  for(const key of ["taskCheck","skipTask","phase","task","saveProfile","editProfile","saveBudget","saveFunding","saveExperience","saveNote","saveInsight","saveTemplate"])
    if(el.dataset?.[key]!==undefined) return {key,value:el.dataset[key]};
  return null;
}
function restorePlannerFocus(hint) {
  if(!hint) return;
  let el=hint.id ? document.getElementById(hint.id) : null;
  if(hint.key) {
    const attr="data-"+hint.key.replace(/[A-Z]/g,c=>"-"+c.toLowerCase());
    el=[...document.querySelectorAll("["+attr+"]")].find(x=>x.dataset[hint.key]===hint.value);
  }
  if(el && !el.disabled) el.focus({preventScroll:true});
}
const FOLLOWUP_STATUSES=["To do","Drafted","Sent","Completed","Not needed"];
const REPLY_STATUSES=["Not requested","Awaiting reply","Received reply","No reply","Closed"];
function validLocalTime(value) { return !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function saveActivityWorksheet(button) {
  const p=getPlan(); if(!p) return;
  const row={label:gv("activity-label").trim(), date:gv("activity-date"),start:gv("activity-start"),end:gv("activity-end"),
    timezone:gv("activity-timezone").trim(),venue:gv("activity-venue").trim(),status:gv("activity-access"),
    fixed:gv("activity-fixed")==="fixed",buffer:gv("activity-buffer")===""?0:Number(gv("activity-buffer")),
    source:gv("activity-source").trim(),confirmationRef:gv("activity-reference").trim(),backup:gv("activity-backup").trim()};
  let error;
  if(!row.label) error=["Add the activity and local date.","activity-label"];
  else if(!validISODate(row.date)) error=["Enter a valid local date.","activity-date"];
  else if(row.timezone && !validTimeZone(row.timezone)) error=["Enter a valid IANA timezone, such as America/New_York.","activity-timezone"];
  else if((row.start || row.end || row.fixed) && !validTimeZone(row.timezone)) error=["A timed activity needs a valid event timezone.","activity-timezone"];
  else if(row.fixed && (!row.start || !row.end || !row.venue)) error=["A fixed appointment needs start/end, event timezone and actual venue.",!row.start?"activity-start":!row.end?"activity-end":"activity-venue"];
  else if(row.fixed && row.status!=="User-reported confirmed") error=["Only an activity confirmed to you can be marked fixed.","activity-access"];
  else if(!validLocalTime(row.start) || !validLocalTime(row.end)) error=["Enter valid local times.","activity-start"];
  else if(row.start && row.end && row.end<=row.start) error=["For a same-day block, end time must be later than start.","activity-end"];
  else if(!Number.isFinite(row.buffer) || row.buffer<0 || row.buffer>600) error=["Use a buffer between 0 and 600 minutes.","activity-buffer"];
  else if(!validWebURL(row.source)) error=["Use a full http or https source URL, or leave it blank.","activity-source"];
  if(error) { formError("activity-error",...error); return; }
  row.id=freshPlanId("activity"); p.activities.push(row);
  if(!p.timezone) p.timezone=row.timezone;
  p.tasks.schedule=true; clearWorksheetDraftFor(button,worksheetScope(selectedTask)); refresh();
  notify(storageAvailable ? "Activity saved to this conference." : "Activity is in memory only. Download a backup before leaving.");
}
function renderCommunityEditor(p) {
  const x=p.experience || {};
  return '<p class="muted small">Keep one learning or community opportunity with its actual source, time and access. A tentative activity stays tentative.</p>' +
    formField("experience-name","Session or community",x.name) + formField("experience-purpose","Why it fits your goal",x.purpose) +
    formField("experience-source","Public source URL",x.source,"url") +
    '<div class="fg2">' + formField("experience-date","Local date",x.date,"date") + formField("experience-time","Local time (optional)",x.time,"time") + '</div>' +
    formField("experience-timezone","IANA event timezone",x.timezone || p.timezone) +
    formField("experience-venue",p.format==="Online" ? "Online platform or join instructions" : "Place, room or online platform",x.venue) +
    selectField("experience-access","Self-reported access",ACCESS_STATUS,x.access || "Needs checking") +
    formField("experience-question","One useful question",x.question) + formField("experience-action","Next action",x.action,"textarea") +
    formField("experience-backup","Alternative",x.backup) +
    '<div class="linkrow"><button class="btn primary" data-save-experience="1">Save activity</button><p id="experience-error" class="error" role="alert"></p></div>';
}
function renderFundingSources(p) {
  const sources=p.budget.sources || [], id=editingFunding?.planId===p.id ? editingFunding.id : null,
    x=sources.find(s=>s.id===id) || {}, scope="funding:"+(x.id || id || "new");
  return '<section class="funding-sources"><h3>Funding sources and terms</h3><p class="helper">Track the terms behind your totals. These records do not change the amounts above. Pending support is never treated as cash available.</p>' +
    (sources.length ? '<ul class="detail-list">'+sources.map(s=>'<li><div><b>'+esc(s.name)+'</b><small>'+esc(s.status || "Needs checking")+
      (s.deadline ? " · Deadline "+esc(s.deadline) : "")+'</small><small>'+esc(s.next || "")+'</small></div><div class="linkrow"><button class="btn sm" data-edit-funding="'+esc(s.id)+
      '">Edit<span class="sr-only"> '+esc(s.name)+'</span></button><button class="btn sm danger" data-remove-funding="'+esc(s.id)+'">Remove<span class="sr-only"> '+esc(s.name)+'</span></button></div></li>').join("")+'</ul>' : "")+
    '<div class="funding-source-form" '+draftAttributes(p,scope)+'><h4>'+(x.id?"Edit source":"Add a funding source")+'</h4>'+
    formField("funding-name","Source or provider",x.name) + formField("funding-source","Official source URL",x.source,"url") +
    formField("funding-expense","Covered expenses, eligibility and obligations",x.expense,"textarea") +
    '<div class="fg2">'+formField("funding-edition","Event edition",x.edition)+formField("funding-deadline","Deadline date",x.deadline,"date")+'</div>'+
    '<div class="fg2">'+formField("funding-deadline-time","Deadline time (optional)",x.deadlineTime,"time")+formField("funding-timezone","Deadline IANA timezone",x.timezone)+'</div>'+
    selectField("funding-status","Your funding status",["Needs checking","To request","Pending","Confirmed by me","Declined","Received","Not needed"],x.status || "Needs checking")+
    selectField("funding-method","Payment method",["Unknown","Paid directly","Advance payment","Later reimbursement"],x.paymentMethod || "Unknown")+
    formField("funding-reimbursement","Expected payment or reimbursement date",x.reimbursementDate,"date")+
    formField("funding-next","Next action / receipts / refund terms",x.next,"textarea")+
    '<div class="linkrow"><button class="btn" data-save-funding="1">'+(x.id?"Save changes":"Add funding source")+'</button>'+
    (x.id ? '<button class="btn" data-cancel-funding="1">Cancel edit</button>' : "")+'</div><p id="funding-error" class="error" role="alert"></p></div></section>';
}
function renderCommitmentEditor(p) {
  const id=editingNote?.planId===p.id ? editingNote.id : null, x=p.notes.find(n=>n.id===id) || {};
  return '<p class="muted small">Record your action separately from someone else’s reply. Private channels are excluded from printing unless you opt in.</p>' +
    '<div class="commitment-form" '+draftAttributes(p,"note:"+(x.id || id || "new"))+'>'+
    formField("note-context","Conversation context *",x.context) + formField("note-next","Real next action *",x.action,"textarea") +
    '<div class="fg2">'+formField("note-channel","Preferred route (private)",x.channel)+formField("note-due","Agreed next-action date (optional)",x.due,"date")+'</div>'+
    formField("note-source","Public source / official action URL",x.source,"url")+
    '<div class="fg2">'+selectField("note-status","Your action status",FOLLOWUP_STATUSES,x.status || (x.done?"Completed":"To do"))+
    selectField("note-response","Response status",REPLY_STATUSES,x.response || (x.reply==="pending"?"Awaiting reply":"Not requested"))+'</div>'+
    formField("note-outcome","Outcome / what happened",x.outcome,"textarea")+
    '<div class="linkrow"><button class="btn primary" data-save-note="1">'+(x.id?"Save changes":"Save private commitment")+'</button>'+
    (x.id ? '<button class="btn" data-cancel-note="1">Cancel edit</button>' : "")+'</div><p id="note-error" class="error" role="alert"></p></div>'+
    (p.notes.length ? '<ul class="detail-list">'+p.notes.map((n,i)=>'<li><div><b>'+esc(n.context)+'</b><small>'+esc(n.action)+(n.due?" · Due "+esc(n.due):"")+
      '</small><small>'+esc(n.status || (n.done?"Completed":"To do"))+' · '+esc(n.response || n.reply || "Not requested")+'</small></div><div class="linkrow">'+
      '<button class="btn sm" data-edit-note="'+esc(n.id)+'">Edit<span class="sr-only"> '+esc(n.context)+'</span></button>'+
      '<button class="btn sm" data-toggle-note="'+i+'">'+(n.done?"Undo done":"Mark done")+'<span class="sr-only"> '+esc(n.context)+'</span></button>'+
      '<button class="btn sm danger" data-remove-note="'+i+'">Remove<span class="sr-only"> '+esc(n.context)+'</span></button></div></li>').join("")+'</ul>' : "");
}
function renderDebriefEditor(p) {
  const x=p.insight || {};
  return formField("insight-goal","The goal you started with",x.goal || p.goal)+
    formField("insight-observed","What actually happened",x.observed,"textarea")+
    formField("insight-learning","One thing you learned",x.learning,"textarea")+
    formField("insight-use","Where you might apply it",x.use)+
    selectField("insight-decision","What you choose next",["Try an action","Deliberate no action","Revisit later"],x.decision || "Try an action")+
    formField("insight-action","Next action or reason for no action",x.action)+
    formField("insight-review","When to review it (optional)",x.reviewDate,"date")+
    formField("insight-outcome","Result when you tried it",x.outcome,"textarea")+
    '<button class="btn primary" data-save-insight="1">Save learning</button><p id="insight-error" class="error" role="alert"></p>'+
    '<div class="linkrow"><a href="#/templates/recap" class="plainlink">Optional recap template →</a></div>';
}
function handleWorksheetClick(button) {
  const d=button.dataset,p=getPlan(); if(!p) return false;
  if(d.editFunding!==undefined) { editingFunding={planId:p.id,id:d.editFunding}; render(); return true; }
  if(d.cancelFunding) { editingFunding=null; render(); return true; }
  if(d.removeFunding!==undefined) { p.budget.sources=(p.budget.sources || []).filter(s=>s.id!==d.removeFunding); if(editingFunding?.id===d.removeFunding)editingFunding=null; refresh(); return true; }
  if(d.editNote!==undefined) { editingNote={planId:p.id,id:d.editNote}; render(); return true; }
  if(d.cancelNote) { editingNote=null; render(); return true; }
  if(d.saveFunding) {
    const old=(p.budget.sources || []).find(x=>x.id===editingFunding?.id && editingFunding.planId===p.id),
      x={id:old?.id || freshPlanId("funding"),name:gv("funding-name").trim(),source:gv("funding-source").trim(),
      expense:gv("funding-expense").trim(),edition:gv("funding-edition").trim(),deadline:gv("funding-deadline"),
      deadlineTime:gv("funding-deadline-time"),timezone:gv("funding-timezone").trim(),status:gv("funding-status"),
      paymentMethod:gv("funding-method"),reimbursementDate:gv("funding-reimbursement"),next:gv("funding-next").trim()};
    let error;
    if(!x.name) error=["Add a source or provider.","funding-name"];
    else if(!validWebURL(x.source)) error=["Use a full http or https source URL.","funding-source"];
    else if(x.deadline && !validISODate(x.deadline)) error=["Enter a valid deadline date.","funding-deadline"];
    else if(x.reimbursementDate && !validISODate(x.reimbursementDate)) error=["Enter a valid payment date.","funding-reimbursement"];
    else if(x.timezone && !validTimeZone(x.timezone)) error=["Use a valid IANA timezone.","funding-timezone"];
    else if(x.deadlineTime && (!x.deadline || !validLocalTime(x.deadlineTime) || !validTimeZone(x.timezone))) error=["A timed deadline needs its date and a valid IANA timezone.","funding-timezone"];
    if(error){formError("funding-error",...error);return true;}
    p.budget.sources ||= [];
    if(old) p.budget.sources[p.budget.sources.indexOf(old)]=x; else p.budget.sources.push(x);
    clearWorksheetDraftFor(button,"funding:"+(old?.id || "new")); editingFunding=null; refresh(); notifySaved("Funding source saved."); return true;
  }
  if(d.saveExperience) {
    const x={...p.experience};
    for(const key of ["name","purpose","source","date","time","timezone","venue","access","question","action","backup"]) x[key]=gv("experience-"+key).trim();
    let error;
    if(!validWebURL(x.source))error=["Use a full http or https source URL.","experience-source"];
    else if(x.date && !validISODate(x.date))error=["Enter a valid local date.","experience-date"];
    else if(x.timezone && !validTimeZone(x.timezone))error=["Use a valid IANA timezone.","experience-timezone"];
    else if(x.time && (!x.date || !validLocalTime(x.time) || !validTimeZone(x.timezone)))error=["A timed activity needs a date and a valid IANA timezone.","experience-timezone"];
    if(error){formError("experience-error",...error);return true;}
    p.experience=x;p.tasks.experience=Boolean(x.name && x.action);clearWorksheetDraftFor(button,"experience");refresh();notifySaved("Activity saved.");return true;
  }
  if(d.saveNote) {
    const old=p.notes.find(n=>n.id===editingNote?.id && editingNote.planId===p.id),
      x={...old,id:old?.id || freshPlanId("note"),context:gv("note-context").trim(),action:gv("note-next").trim(),
        channel:gv("note-channel").trim(),due:gv("note-due"),source:gv("note-source").trim(),
        status:gv("note-status") || "To do",response:gv("note-response") || "Not requested",outcome:gv("note-outcome").trim()};
    let error;
    if(!x.context || !x.action)error=["Add context and a real next action.",!x.context?"note-context":"note-next"];
    else if(x.due && !validISODate(x.due))error=["Enter a valid next-action date.","note-due"];
    else if(!validWebURL(x.source))error=["Use a full http or https source URL.","note-source"];
    if(error){formError("note-error",...error);return true;}
    x.done=x.status==="Completed" || x.status==="Not needed";
    if(old)p.notes[p.notes.indexOf(old)]=x;else p.notes.push(x);
    p.tasks.notes=true;
    clearWorksheetDraftFor(button,"note:"+(old?.id || "new"));editingNote=null;refresh();notifySaved("Private commitment saved.");return true;
  }
  if(d.saveInsight) {
    const x={...p.insight};
    for(const key of ["goal","observed","learning","use","decision","action","outcome"])x[key]=gv("insight-"+key).trim();
    x.reviewDate=gv("insight-review");
    if(x.reviewDate && !validISODate(x.reviewDate)){formError("insight-error","Enter a valid review date.","insight-review");return true;}
    p.insight=x;p.tasks.learning=Boolean(x.learning && x.action);clearWorksheetDraftFor(button,"learning");refresh();notifySaved("Learning saved.");return true;
  }
  return false;
}
