/* Regression checks for the retained v5 calculations, event storage and export
   contract. Real UI/persistence checks are documented separately in QA notes. */
const { test } = require("node:test");
const assert = require("node:assert/strict");

const { application: app } = require('../scripts/application_runtime.cjs');

test("cash timing excludes pending awards and distinguishes direct support", () => {
  const a = app();
  const q = a.run(
    "budgetCalc({registration:200,travel:350,lodging:400,local:70,food:80,buffer:100,reimbursement:400,pending:300})",
  );
  assert.deepEqual(
    { ...q },
    { total: 1200, net: 800, upfront: 1200, pending: 300 },
  );
  assert.deepEqual(
    {
      ...a.run(
        "budgetCalc({travel:1200,direct:200,reimbursement:400,pending:9999})",
      ),
    },
    { total: 1200, net: 600, upfront: 1000, pending: 9999 },
  );
});

test("blank and excessive confirmed amounts never create a negative cost", () => {
  const a = app();
  assert.equal(a.run("budgetCalc({}).net"), 0);
  assert.equal(
    a.run("budgetCalc({travel:10,direct:100,reimbursement:100}).upfront"),
    0,
  );
  assert.equal(a.run("budgetCalc({travel:-50}).total"), 0);
});

test("pending label updates without colliding with its input ID", () => {
  const a = app();
  a.node("budget-travel").value = "1200";
  a.node("budget-pending").value = "300";
  a.run("delegatedInput({target:{id:'budget-pending'}})");
  assert.equal(
    a.node("budget-pending-summary").textContent,
    "USD 300 pending · Not subtracted",
  );
  assert.equal(a.node("budget-pending").value, "300");
});

test("all nine guides render approved checks, examples and detailed instructions", () => {
  const a = app();
  a.run(
    'for(const g of GUIDES){ const page=renderGuide(g); if(!page.includes(esc(g.example)))throw Error(g.id+" example missing"); for(const c of g.checks){if(!page.includes(esc(c.text)))throw Error(g.id+" check missing")}; for(const d of g.details){if(!page.includes(esc(d)))throw Error(g.id+" detail missing")} }',
  );
});

test("all guide and planning renderers produce unique IDs and labeled controls", () => {
  const a = app();
  a.run("ensurePreset('ghc')");
  for (const expression of [
    ...a.run("GUIDES.map(g => 'renderGuide(GUIDE_BY_ID.' + g.id + ')')"),
    ...a.run("Object.keys(TEMPLATE_DATA).map(k => 'renderTemplates(' + JSON.stringify(k) + ')')"),
    "renderFieldPlan()",
    "renderConference()",
    "editorTargets(getPlan())",
    "editorBudget(getPlan())",
    "editorSchedule(getPlan())",
  ]) {
    const html = a.run(expression),
      ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
    assert.equal(new Set(ids).size, ids.length, expression);
    for (const id of [
      ...html.matchAll(/<(?:input|textarea|select)[^>]*\bid="([^"]+)"/g),
    ].map((x) => x[1]))
      assert.ok(html.includes('for="' + id + '"'), id);
  }
});

test("guide tools preserve the prompt and reach their existing planning editors", () => {
  const a = app();
  a.run(`for (const g of GUIDES) {
    const html = renderGuide(g);
    if (!html.includes(esc(g.optionalBody))) throw Error(g.id + ' optional guidance missing');
    if (g.tool === 'prompt') {
      if (!html.includes('data-copy-text=') || html.includes('data-launch=')) throw Error('copy prompt changed');
    } else if (!['prioritize','funding'].includes(g.id)) {
      if (!html.includes('data-launch="' + GUIDE_TASK[g.id] + '"')) throw Error(g.id + ' editor link missing');
    }
  }`);
});

test("field-plan preview preserves private exclusions and explicit opt-ins", () => {
  const a = app();
  a.run("ensurePreset('ghc');getPlan().budget={travel:1234};getPlan().drafts.pre='PRIVATE-DRAFT-TEST'");
  const privateOff = a.run("renderFieldPlan()");
  assert.ok(!privateOff.includes('PRIVATE-DRAFT-TEST'));
  assert.equal([...privateOff.matchAll(/data-print-pref=/g)].length, 4);
  assert.ok(!/data-print-pref="[^"]+" checked/.test(privateOff));
  a.run("getPlan().printPreferences={includeDrafts:true}");
  assert.ok(a.run("renderFieldPlan()").includes('PRIVATE-DRAFT-TEST'));
  assert.ok(a.run("renderFieldPlan()").includes('data-print-pref="includeDrafts" checked'));
});

test("per-conference plans persist and switch without mixing targets", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc'); getPlan().targets.push({name:'GHC QA',action:'Check source'});save();ensurePreset('shpe')",
  );
  assert.equal(a.run("getPlan().targets.length"), 0);
  const b = app(Object.fromEntries(a.values));
  assert.equal(b.run("getPlan().id"), "shpe");
  b.run("switchPlan('ghc')");
  assert.equal(b.run("getPlan().targets[0].name"), "GHC QA");
});

test("unsaved guide drafts stay with their event; anonymous work attaches once", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc'); currentGuideScratch().target={name:'GHC draft'}; ensurePreset('shpe')",
  );
  assert.equal(a.run("currentGuideScratch().target.name"), undefined);
  a.run("switchPlan('ghc')");
  assert.equal(a.run("currentGuideScratch().target.name"), "GHC draft");
  a.run(
    "db.activeId=null;currentGuideScratch().budget={travel:17};ensurePreset('shpe')",
  );
  assert.equal(a.run("currentGuideScratch().budget.travel"), 17);
  a.run("switchPlan('ghc')");
  assert.equal(a.run("currentGuideScratch().budget.travel"), undefined);
});

test("builder and learning goals do not force recruiter-only profile tasks", () => {
  const a = app();
  a.run("ensurePreset('afrotech');getPlan().goal='Build / share a project'");
  const html = a.run("editorAccess(getPlan())");
  assert.ok(!html.includes("Specific employer application"));
  assert.ok(!html.includes("Attendee or talent profile"));
  assert.ok(html.includes("Conference registration"));
});

test("date-aware recommendations keep every editor reachable", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc');getPlan().date=new Date(Date.now()+3*86400000).toISOString().slice(0,10);taskPhase='now';selectedTask='budget'",
  );
  assert.equal(
    a.run("taskFilter(TASKS.find(t=>t.id==='budget'),'now')"),
    false,
  );
  const html = a.run("renderPlannerTasks(getPlan())");
  assert.ok(html.includes('data-task="budget" aria-current="step"'));
  assert.equal(a.run("selectedTask"), "budget");
  for (const id of a.run("TASKS.map(t=>t.id)"))
    assert.ok(html.includes('data-task="' + id + '"'));
});

test("default export excludes contacts, drafts, money and token-bearing URLs", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc');const p=getPlan();p.targets=[{name:'QA',action:'Verify',source:'https://example.com?token=PRIVATE',status:'Requested'}];p.budget={travel:1200};p.notes=[{context:'QA',action:'Check',channel:'PRIVATE_EMAIL'}];p.drafts={pre:'PRIVATE_DRAFT'}",
  );
  const text = a.run("fieldPlanText(getPlan())");
  for (const secret of [
    "PRIVATE_EMAIL",
    "PRIVATE_DRAFT",
    "token=PRIVATE",
    "USD 1,200",
  ])
    assert.ok(!text.includes(secret), secret);
  assert.ok(text.includes("[private source link hidden]"));
});

test("private export preferences are explicit and event-specific", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc');getPlan().budget={travel:1200};getPlan().printPreferences.includeFunding=true",
  );
  assert.ok(a.run("fieldPlanText(getPlan())").includes("USD 1,200"));
  a.run("ensurePreset('shpe')");
  assert.equal(a.run("printPrefs(getPlan()).includeFunding"), false);
});

test("appointments export local date, times, timezone, venue and public source", () => {
  const a = app();
  a.run(
    "ensurePreset('ghc');getPlan().activities=[{label:'QA appointment',fixed:true,status:'User-reported confirmed',date:'2026-10-29',start:'09:30',end:'10:10',timezone:'America/Los_Angeles',venue:'QA Room',source:'https://example.com/qa',buffer:10,confirmationRef:'PRIVATE_REF'},{label:'QA tentative',fixed:false,status:'Requested',date:'2026-10-29'}]",
  );
  const text = a.run("fieldPlanText(getPlan())");
  for (const s of [
    "09:30–10:10",
    "America/Los_Angeles",
    "QA Room",
    "https://example.com/qa",
    "Flexible or unverified",
    "QA tentative",
  ])
    assert.ok(text.includes(s));
  assert.ok(!text.includes("PRIVATE_REF"));
});

test("a pending RSVP cannot be saved as a fixed appointment", () => {
  const a = app();
  a.run("ensurePreset('ghc')");
  for (const [k, v] of Object.entries({
    label: "QA",
    date: "2026-10-29",
    start: "09:30",
    end: "10:10",
    timezone: "America/Los_Angeles",
    venue: "QA room",
    fixed: "fixed",
    access: "Requested",
  }))
    a.node("activity-" + k).value = v;
  a.run(
    "delegatedClick({target:{closest:()=>({dataset:{saveActivity:'1'}})}})",
  );
  assert.equal(a.run("getPlan().activities.length"), 0);
  assert.equal(
    a.node("activity-error").textContent,
    "Only an activity confirmed to you can be marked fixed.",
  );
});

test("template drafts remain local and event-specific", () => {
  const a = app();
  a.run("ensurePreset('ghc')");
  a.node("template-editor").value = "QA edited draft";
  a.run(
    "delegatedClick({target:{closest:()=>({dataset:{saveTemplate:'pre'}})}})",
  );
  assert.equal(a.run("getPlan().drafts.pre"), "QA edited draft");
  a.run("ensurePreset('shpe')");
  assert.equal(a.run("getPlan().drafts.pre"), undefined);
});

test("blocked storage leaves setup usable and reports save failure", () => {
  const a = app({}, true);
  assert.ok(a.run("renderSetup()").includes("Create my plan"));
  assert.equal(a.run("save()"), false);
  assert.equal(a.run("storageAvailable"), false);
  assert.ok(a.node("status").innerHTML.includes("storage is unavailable"));
});

test("printing expands approved instructions and restores disclosure state", () => {
  const a = app(),
    details = [
      { open: false, dataset: {} },
      { open: true, dataset: {} },
    ];
  a.context.document.querySelectorAll = () => details;
  a.listeners.beforeprint();
  assert.ok(details.every((x) => x.open));
  a.listeners.afterprint();
  assert.equal(details[0].open, false);
  assert.equal(details[1].open, true);
});


test("unsaved status is announced once while typing continues", () => {
  const a=app(); let text="Saved in this browser", writes=0;
  const status={get textContent(){return text;},set textContent(value){text=value;writes++;}};
  a.context.document.querySelectorAll=()=>[status];
  const event={target:{id:'template-editor',removeAttribute(){},closest:selector=>selector.includes('.templatebody')?{}:null}};
  a.listeners['document-input'](event);
  a.listeners['document-input'](event);
  assert.equal(text,'Unsaved changes'); assert.equal(writes,1);
});


test("library and download sections have a complete heading hierarchy", () => {
  const a=app();
  for (const render of ["renderHome('before')","renderHome('during')","renderHome('after')","renderDownloads()"]){
    const levels=[...a.run(render).matchAll(/<h([1-6])(?:\s|>)/g)].map(m=>Number(m[1]));
    assert.equal(levels[0],1);
    for(let i=1;i<levels.length;i++)assert.ok(levels[i]<=levels[i-1]+1,render+" skips a heading level");
  }
});
