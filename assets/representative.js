/* Shared reading and planning surfaces. Editorial text comes from v1.3.
   The original save handlers and field-plan exporter remain in app.js. */
const guideScratch = new Map();
function currentGuideScratch() {
  const key = getPlan()?.id || "anonymous";
  if (!guideScratch.has(key)) {
    guideScratch.set(key, { target: {}, budget: {} });
  }
  const anonymous = key !== "anonymous" ? guideScratch.get("anonymous") : null;
  if (anonymous) {
    for (const kind of ["target", "budget"]) {
      if (Object.keys(anonymous[kind]).length)
        guideScratch.get(key)[kind] = anonymous[kind];
    }
    guideScratch.delete("anonymous");
  }
  return guideScratch.get(key);
}
let exampleGoal = "Learning";
let storageAvailable = true;

const GOAL_EXAMPLES = {
  Recruiting: [
    "A role worth researching",
    "Inspect a current employer posting: role ID, graduation and experience requirements, location, and the official application route. A booth conversation is additional; it does not replace an application.",
  ],
  Learning: [
    "A question worth answering",
    "Read the actual session abstract. What question could it help you answer? Check the time, pass rules and access before protecting a block in your schedule.",
  ],
  Community: [
    "A conversation worth having",
    "Find a relevant community or host event page. Check the actual RSVP and access rules, then prepare one genuine question and an accessible alternative.",
  ],
  Building: [
    "An assumption worth testing",
    "Sam’s fictional builder example starts with a question about coordination failure. Look for an accessible peer or founder conversation; unrelated recruiting tasks can be skipped.",
  ],
};

// Supplemental beta teaching material; the approved v1.3 manuscript stays versioned separately.
function starterPlanSaved(p) {
  return !!p?.decision?.goal?.trim() && p.targets.some(t=>t.name?.trim() && t.action?.trim() && t.backup?.trim());
}
function renderStarterPath(p,place) {
  const complete=starterPlanSaved(p), onHome=place === "home";
  const action=(task,label)=>p ? `<button class="plainlink" ${onHome ? "data-launch" : "data-task"}="${task}" data-focus-editor="1">${label} →</button>` : "";
  const body=`<div class="starter-body"><p class="starter-intro">Start with five minutes. You can leave the rest for later.</p>
    <ol class="starter-steps">
      <li><span class="section-caption">01 · ${p?.decision?.goal?.trim() ? "Outcome saved" : "Your outcome"}</span><h3>Name one useful outcome</h3><p>What would make attending worthwhile? Try “learn one interview technique” or “meet a peer working on a similar problem.”</p>${action("decision","Name my outcome")}</li>
      <li><span class="section-caption">02 · ${p?.targets?.some(t=>t.name?.trim() && t.action?.trim() && t.backup?.trim()) ? "Priority and backup saved" : "Your next move"}</span><h3>Choose a priority and a backup</h3><p>Find one real session, conversation or opportunity. Keep its source, your next action and an alternative if it falls through.</p>${action("targets","Choose my priority")}</li>
      <li><span class="section-caption">03 · Take it with you</span><h3>Read your field plan</h3><p>See your choices together. Check missing details, then copy or print what you need.</p>${p ? '<a class="plainlink" href="#/plan">Open my field plan →</a>' : ""}</li>
    </ol><div class="linkrow">${!p ? '<a class="btn primary" href="#/conference">Start my five-minute plan →</a>' : ""}<a class="plainlink" href="#/example/learning">See a complete learning example →</a></div>
    <p class="helper">${p ? "These steps use your saved notes. " : "No account needed. "}Add funding, access and other details as needed before committing. AI help is optional.</p></div>`;
  return onHome ? `<section class="starter-path no-print" aria-labelledby="starter-heading"><div class="section-caption">A small place to start</div><h2 id="starter-heading">One outcome. One priority. One backup.</h2>${body}</section>` :
    `<details class="starter-path no-print" ${complete ? "" : "open"}><summary>Your five-minute plan${complete ? " · Starter notes saved" : ""}</summary>${body}</details>`;
}

function renderLearningJourney() {
  return `<article class="learning-journey" aria-labelledby="journey-title"><a class="plainlink" href="#/playbook/before">← Back to the Playbook</a>
    <div class="guide-heading"><div class="section-caption">Worked example · Fictional</div><h1 id="journey-title">A learning plan, start to finish.</h1><p class="guide-purpose">Leena wants to ask better questions for a neighborhood history project. Here’s how one conference becomes a small, useful next step.</p><p class="helper">Leena, the gathering, its program, access confirmation and later outcome are invented for this example. Reading it does not add anything to your plan.</p></div>
    <section class="journey-stage"><span class="section-caption">Before · Make a choice</span><h2>A specific skill, within a small budget.</h2>
      <dl class="journey-record"><dt>Conference</dt><dd>Community History Day · an invented one-day, in-person gathering at an example library. April 12, 2027 · Europe/London timezone.</dd>
      <dt>One useful outcome</dt><dd>Learn an open-ended interview question and practice following the answer, rather than reading from a script.</dd>
      <dt>Cost and decision</dt><dd>USD 25 entry + USD 10 transport = USD 35 upfront. Leena can safely spend USD 50 and expects no reimbursement. Her decision is to go if the workshop includes practice and her pass covers it.</dd>
      <dt>Primary choice</dt><dd>“Asking better oral-history questions.” In this story, the session description says participants practice open-ended questions in pairs. That makes it a better fit than a broad keynote.</dd>
      <dt>Source and access</dt><dd>Leena saves the organizer’s session description and checks the pass terms. In the fictional story, the organizer confirms her workshop place separately from general entry. In your plan, keep the actual source and your own confirmation.</dd>
      <dt>One question</dt><dd>“How can I follow an unexpected answer without steering the person toward my own story?”</dd>
      <dt>Next action and backup</dt><dd>Read the workshop instructions and bring one practice question. If the workshop becomes unavailable, replace it with the included oral-history exhibit and note one interviewing approach to research afterward.</dd></dl>
      <div class="linkrow"><a class="plainlink" href="#/guide/prioritize">Choose your priority →</a><a class="plainlink" href="#/guide/funding">Check cost and cash timing →</a></div></section>
    <section class="journey-stage"><span class="section-caption">During · Keep it realistic</span><h2>One session, then room to reflect.</h2><p>Her field plan has the confirmed workshop from 10:00–10:45 in Example Room A, on the event’s local agenda. She leaves 15 minutes afterward for notes and a break. The exhibit is a replacement if the workshop falls through; she does not try to do both at once.</p>
      <p>In the workshop, Leena practices asking “What happened next?” and waiting before adding another question. She records one lesson: a neutral follow-up can reveal more than several prepared questions.</p><p>She has a friendly conversation but makes no promise and receives no contact route. There is no message she needs to send.</p>
      <a class="plainlink" href="#/guide/time">Make room in your day →</a></section>
    <section class="journey-stage"><span class="section-caption">After · Try it, then look back</span><h2>A useful outcome can be small.</h2>
      <dl class="journey-record"><dt>What actually happened in the story</dt><dd>Leena attended the workshop and tried one follow-up question. She did not make a new professional contact.</dd>
      <dt>Next action</dt><dd>With a willing project volunteer, practice one open question and one neutral follow-up. Ask permission before taking or sharing notes.</dd>
      <dt>Review a week later</dt><dd>In this fictional outcome, the volunteer gave a more detailed account after the follow-up. Leena still interrupted once. She keeps the technique and decides to practice listening again.</dd>
      <dt>What counts as success</dt><dd>A specific technique tried and a clear next practice step. One conversation does not establish that the method always works. No public recap, referral or new contact is required.</dd></dl>
      <div class="linkrow"><a class="plainlink" href="#/guide/learning">Apply one lesson →</a><a class="plainlink" href="#/templates/follow">Choose an appropriate follow-up →</a></div></section>
    <section class="next-move no-print"><div><h2>What would your version look like?</h2><p>Name one outcome, choose a real priority and keep a backup.</p></div><a class="btn" href="#/conference">Make my own plan →</a></section></article>`;
}

const FOLLOWUP_EXAMPLES=[
  {title:"Send a resource you promised",context:"Fictional example: Maya offered a professional message channel and asked for the project link. Only use this structure if that happened.",text:"Hi Maya,\n\nThanks for talking with me after the session about keeping local-history notes organized. Here’s the project link I promised: [actual public project link]. The example we discussed is in [section].\n\nNo reply needed—I hope it’s useful.\nAmir"},
  {title:"Ask one answerable question",context:"Fictional example: a speaker welcomed questions through the event’s public Q&A. Use the route actually offered.",text:"Thank you for the session on oral-history interviews. Your suggestion to pause before asking a follow-up helped me rethink my question list.\n\nFor a first practice interview, how would you choose between asking for an example and asking what happened next?\n\nAmir"}
];
function renderFollowupExamples() {
  return `<section class="followup-examples" aria-labelledby="followup-examples-heading"><h3 id="followup-examples-heading">Give the message a reason.</h3><p>Use a real promise or one small question. Change “today” in the original structure if you are writing later, and use the actual channel offered.</p>
    ${FOLLOWUP_EXAMPLES.map(x=>`<details class="message-example"><summary>${esc(x.title)}</summary><p class="helper">${esc(x.context)}</p><blockquote>${esc(x.text)}</blockquote><button class="btn sm" data-copy-text="${esc(x.text)}">Copy this example structure</button></details>`).join("")}
    <details class="message-example"><summary>When no message is needed</summary><p>A useful conversation without a promise or appropriate contact route can end there. Save the insight and try something with it. If the next action is an official application, use that process.</p><a class="plainlink" href="#/guide/learning">Turn the insight into an action →</a></details>
    <p class="helper">Copying an example does not replace your draft. Keep only details that are true for you; review it before sending.</p></section>`;
}

function guideReferences(g, p) {
  const keys = [
    ...new Set([
      ...(g.officialRefs || []),
      ...(SNAPSHOT.events[p?.id]?.sourceRefs || []),
    ]),
  ].filter(
    (k) =>
      SNAPSHOT.sources[k] &&
      (!p || !SNAPSHOT.sources[k].event || SNAPSHOT.sources[k].event === p.id),
  );
  return keys.length
    ? `<details class="source-refs no-print"><summary>Sources &amp; edition checks</summary>
    <p class="helper">Source registry last checked ${esc(SNAPSHOT.sourceCheckedDate)}. Recheck the current edition; these links do not confirm your access.</p>
    <ul>${keys
      .map((k) => {
        const s = SNAPSHOT.sources[k];
        return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><p class="helper">${esc(s.note)}</p></li>`;
      })
      .join("")}</ul></details>`
    : "";
}

function guideRail(g) {
  const labels =
    g.id === "prioritize"
      ? ["Your goal", "Real options", "Fit & access", "Your first move"]
      : g.id === "funding"
        ? ["Full trip cost", "Funding routes", "The terms", "Cost vs. cash"]
        : g.checks.map((check) => check.label.replace(/\.$/, ""));
  return `<aside class="reading-rail no-print" aria-label="Guide navigation">
    <nav class="rail-stages" aria-label="Conference stage">${Object.keys(STAGES)
      .map(
        (k) =>
          `<a href="#/playbook/${k}" ${k === g.stage ? 'aria-current="page"' : ""}>${k[0].toUpperCase() + k.slice(1)}</a>`,
      )
      .join("")}</nav>
    <p class="rail-caption">In this guide</p><nav class="reading-toc" aria-label="On this page">
    ${labels.map((l, i) => `<a href="#tip-${i + 1}" data-section-link="tip-${i + 1}"><span>${String(i + 1).padStart(2, "0")}</span>${l}</a>`).join("")}
    <a href="#worked-example" data-section-link="worked-example"><span>↳</span>Worked example</a>
    <a href="#guide-worksheet" data-section-link="guide-worksheet"><span>↳</span>${g.tool === "prompt" ? "Copyable prompt" : "Try it yourself"}</a></nav>
    <div class="rail-note"><span aria-hidden="true">↗</span><p>You don’t need a perfect plan.<br>Just a useful next move.</p></div>
    <div class="rail-more"><p class="rail-caption">More ${esc(STAGES[g.stage].title.toLowerCase())}</p>${GUIDES.filter(
      (x) => x.stage === g.stage && x.id !== g.id,
    )
      .map(
        (x) =>
          `<a href="#/guide/${x.id}">${esc(x.title)} <span aria-hidden="true">→</span></a>`,
      )
      .join("")}</div>
  </aside>`;
}

function goalSelector() {
  return `<div class="goal-example no-print"><p class="helper">What are you attending for? Try a lens.</p>
    <div class="goal-chips" role="group" aria-label="Choose an example goal">${Object.keys(
      GOAL_EXAMPLES,
    )
      .map(
        (g) =>
          `<button class="goal-chip" data-example-goal="${g}" aria-pressed="${g === exampleGoal}">${g}</button>`,
      )
      .join("")}</div>
    <div id="goal-example" class="goal-response" aria-live="polite"><strong>${GOAL_EXAMPLES[exampleGoal][0]}</strong><p>${GOAL_EXAMPLES[exampleGoal][1]}</p></div></div>`;
}

function fundingExample(g) {
  const b = SNAPSHOT.exampleCases.jordan.budget;
  return `<section class="worked-example funding-example" id="worked-example" aria-labelledby="example-heading">
    <div class="section-caption"><span class="example-mark" aria-hidden="true">↳</span> A worked example · Fictional</div>
    <h2 id="example-heading">Same trip. Two different numbers.</h2>
    <div class="funding-ledger"><div class="ledger-rows">
      <div><span>Full trip cost</span><strong>${fmt(b.total)}</strong></div>
      <div><span>Confirmed reimbursement <small>After the trip, if conditions are met</small></span><strong>− ${fmt(b.approvedReimbursement)}</strong></div>
      <div class="pending-row"><span>Pending support <small>Not included in the calculation</small></span><strong>${fmt(b.pendingGrant)}</strong></div>
    </div><div class="ledger-results"><div><span>Estimated personal cost</span><strong>${fmt(b.netAfterConfirmed)}</strong><small>After confirmed reimbursement</small></div>
      <div class="cash-result"><span>Money needed upfront</span><strong>${fmt(b.potentialUpfront)}</strong><small>Before reimbursement arrives</small></div></div></div>
    <p class="example-prose">${esc(g.example)}</p>
    <p class="helper">${esc(g.exampleTitle)}. This is a teaching case, not an available grant.</p></section>`;
}

function priorityExample(g) {
  return `<section class="worked-example" id="worked-example" aria-labelledby="example-heading">
    <div class="section-caption"><span class="example-mark" aria-hidden="true">↳</span> A worked example · Fictional</div>
    <h2 id="example-heading">Turn “interesting” into a next move.</h2>
    <div class="priority-comparison"><div><span class="comparison-label">An option to research</span><h3>Cedar Labs SWE internship</h3><p>Invented role · CL-DEMO-27</p><p>Check a real equivalent posting, eligibility and the required application route. Expo access stays unknown.</p></div>
      <div><span class="comparison-label">A possible alternative</span><h3>A relevant data workshop</h3><p>Possible learning option · Unverified</p><p>Find an actual abstract, time and access rules before treating it as an available backup.</p></div></div>
    <p class="example-prose">${esc(g.example)}</p><p class="helper">${esc(g.exampleTitle)}. No current role, session or invitation is confirmed.</p></section>`;
}

function standardGuideExample(g) {
  return `<section class="worked-example" id="worked-example" aria-labelledby="example-heading">
    <div class="section-caption"><span class="example-mark" aria-hidden="true">↳</span> A worked example · Fictional</div>
    <h2 id="example-heading">${esc(g.exampleTitle)}</h2>
    <p class="example-prose">${esc(g.example)}</p></section>`;
}

function guidePlanningLink(g) {
  return `<section class="inline-worksheet no-print" id="guide-worksheet" aria-labelledby="worksheet-heading">
    <div class="section-caption">Make it yours <span class="caption-divider">/</span> Optional</div>
    <h2 id="worksheet-heading">${esc(g.optionalHeading)}</h2><p class="worksheet-intro">${esc(g.optionalBody)}</p>
    <div class="linkrow">${g.tool === "prompt"
      ? `<button class="btn primary" data-copy-text="I noticed [specific detail]. This connects to [real experience]. I'm curious about [one answerable question].">Copy conversation prompt</button>`
      : `<button class="btn primary" data-launch="${esc(GUIDE_TASK[g.id] || "access")}">Use this in My Conference →</button>`}</div></section>`;
}

function renderEditorialGuide(g) {
  const p = getPlan(),
    priority = g.id === "prioritize",
    funding = g.id === "funding";
  const titleExtra = priority
    ? "A little intention goes a long way."
    : funding ? "Plan for the bill. And when it’s due." : "";
  const stageLabel = {before: "Before you go", during: "While you’re there", after: "After you return"}[g.stage];
  return `<div class="crumb no-print"><a href="#/playbook/${g.stage}">← ${esc(STAGES[g.stage].title)}</a><span>/ ${esc(g.topic)}</span></div>
    <div class="editorial-layout"><article class="reading" id="print-guide">
    <div class="guide-heading"><div class="section-caption"><span class="edition-dot" aria-hidden="true"></span> ${stageLabel} <span class="caption-divider">/</span> ${esc(g.topic)}</div>
    <h1>${esc(g.title)}</h1><p class="guide-purpose">${esc(g.purpose)}</p>${titleExtra ? `<p class="guide-mood">${titleExtra}</p>` : ""}
    <nav class="guide-shortcuts no-print" aria-label="Guide shortcuts"><a href="#worked-example" data-section-link="worked-example">Worked example ↓</a><a href="#guide-worksheet" data-section-link="guide-worksheet">${g.tool === "prompt" ? "Copyable prompt ↓" : "Try the worksheet ↓"}</a></nav></div>
    <div class="numbered-tips">${g.checks
      .map(
        (
          c,
          i,
        ) => `<section class="reading-tip" id="tip-${i + 1}"><div class="tip-number" aria-hidden="true">${String(i + 1).padStart(2, "0")}</div><div class="tip-content"><h2>${esc(c.label)}</h2><p>${esc(c.text)}</p>
      ${priority && i === 0 ? goalSelector() : ""}
      ${priority && i === 2 ? '<p class="reflection">Ask yourself: <em>What would I get from this—and what would I give up to be there?</em></p>' : ""}
      ${funding && i === 3 ? '<p class="reflection">A reimbursement can reduce your final cost. <strong>It may not reduce what you need to pay today.</strong></p>' : ""}
      </div></section>`,
      )
      .join("")}</div>
    ${priority ? priorityExample(g) : funding ? fundingExample(g) : standardGuideExample(g)}
    ${["prioritize","explore","learning"].includes(g.id) ? '<p class="journey-link"><a class="plainlink" href="#/example/learning">Follow a complete learning plan, from choosing a session to trying the lesson →</a></p>' : ""}
    <details class="guide-details"><summary>${esc(g.detailsHeading)}<span aria-hidden="true" class="disclosure-icon">+</span></summary><ol class="method-steps">${g.details.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></details>
    ${priority || funding ? `<section class="inline-worksheet no-print" id="guide-worksheet" aria-labelledby="worksheet-heading"><div class="section-caption">Make it yours <span class="caption-divider">/</span> Optional</div><h2 id="worksheet-heading">${priority ? "Your first worthwhile priority" : "What would your trip cost?"}</h2>
      <p class="worksheet-intro">${priority ? "A specific target, a source to check, and a next action you control." : "Use one currency (USD). Separate costs, confirmed support and anything still pending."}</p>
      <p class="worksheet-event">${p ? `Saving to <strong>${esc(p.name)}</strong> · <a href="#/conference">Change event</a>` : 'Try this here. <a href="#/conference">Choose an event</a> when you want to save it.'}</p>
      ${priority ? priorityWorksheet(p, true) : fundingWorksheet(p, true)}
      <details class="worksheet-notes"><summary>What else should I record?</summary><p>${esc(g.optionalBody)}</p></details></section>` : guidePlanningLink(g)}
    <div class="guide-end"><div class="linkrow no-print"><button class="btn" data-print="guide">Print this guide</button><a class="plainlink" href="#/conference">My Conference →</a><a class="plainlink" href="output/pdf/conference-playbook-workbook-v5.pdf">Printable workbook ↓</a></div>
    ${guideReferences(g, p)}<p class="sourcenote">General guidance and fictional examples · Editorial v${esc(SNAPSHOT.snapshotVersion)}. Confirm current editions, access and eligibility with official sources. <a href="${esc(g.notionSource)}" target="_blank" rel="noopener noreferrer">Editorial source ↗</a></p></div>
    </article>${guideRail(g)}</div>`;
}

function priorityWorksheet(p, inline = false) {
  const z =
    editingTarget >= 0 && p
      ? p.targets[editingTarget]
      : inline
        ? currentGuideScratch().target
        : {};
  return `<div class="priority-form" ${draftAttributes(p,worksheetScope("targets"))} data-guide-tool="${inline ? "target" : ""}">
    <div class="formrow"><label for="target-name">What are you considering? <span class="required-note">Required</span></label><input id="target-name" required maxlength="140" value="${esc(z?.name || "")}" placeholder="A real opportunity or a specific research task" aria-describedby="form-warning"></div>
    <div class="formrow"><label for="target-action">What will you do first? <span class="required-note">Required</span></label><textarea id="target-action" required rows="2" placeholder="Find the official posting and check eligibility" aria-describedby="form-warning">${esc(z?.action || "")}</textarea></div>
    <div class="fg2"><div class="formrow"><label for="target-link">Official source URL</label><input id="target-link" type="url" value="${esc(z?.source || "")}" placeholder="https://… or leave blank if unverified"></div>
    <div class="formrow"><label for="target-backup">A realistic backup</label><input id="target-backup" value="${esc(z?.backup || "")}" placeholder="Another worthwhile use of your time"></div></div>
    <details class="worksheet-notes" ${editingTarget >= 0 ? "open" : ""}><summary>Question, type &amp; access status</summary>
    <div class="formrow"><label for="target-question">One useful question</label><input id="target-question" value="${esc(z?.question || "")}" placeholder="What are you curious about?"></div>
    <div class="fg2"><div class="formrow"><label for="target-kind">Type</label><select id="target-kind">${JOB_TYPES.map((k) => `<option ${z?.kind === k ? "selected" : ""}>${esc(k)}</option>`).join("")}</select></div>
    <div class="formrow"><label for="target-status">Self-reported access / application</label><select id="target-status">${ACCESS_STATUS.map((k) => `<option ${z?.status === k ? "selected" : ""}>${esc(k)}</option>`).join("")}</select></div></div>
    <div class="formrow"><label for="target-role-id">Role / event ID (if given)</label><input id="target-role-id" value="${esc(z?.roleId || "")}" placeholder="Actual requisition or event ID"></div><p class="helper">Unknown access remains Needs checking. A request is not a confirmation.</p></details>
    <p id="form-warning" class="error" role="alert"></p><div class="linkrow">${p ? `<button class="btn primary" data-save-target="1">${editingTarget >= 0 ? "Update" : "Save"} priority</button>` : '<button class="btn primary" data-preview-priority="1">Preview my next move →</button>'}
    ${editingTarget >= 0 ? '<button class="btn" data-cancel-target="1">Cancel edit</button>' : ""}</div>
    <div id="priority-preview" class="preview-result" role="status" hidden></div>
    ${p ? `<div class="saved-priorities"><h3>Your saved priorities <span>${p.targets.length} / 3</span></h3>${p.targets.length ? `<ul class="detail-list">${p.targets.map((t, i) => `<li><div><b>${esc(t.name)}</b><small>${esc(t.action)}</small><span class="helper">${esc(t.status || "Needs checking")} ${t.roleId ? "· " + esc(t.roleId) : ""}</span></div><div class="linkrow"><button class="btn sm" data-edit-target="${i}">Edit<span class="visually-hidden"> ${esc(t.name)}</span></button><button class="btn sm danger" data-remove-target="${i}">Remove<span class="visually-hidden"> ${esc(t.name)}</span></button></div></li>`).join("")}</ul>` : '<p class="empty-note">Start with one. You can keep up to three active priorities here.</p>'}</div>` : '<p class="helper scratch-note">This preview lasts until reload. Choose an event and save to keep a priority in your browser.</p>'}</div>`;
}

function fundingWorksheet(p, inline = false) {
  const b =
      inline && Object.keys(currentGuideScratch().budget).length
        ? currentGuideScratch().budget
        : p?.budget || {},
    q = budgetCalc(b), currency=p?.currency || "USD";
  const field = ([k, label]) =>
    `<div class="formrow"><label for="budget-${k}">${esc(label)}</label><div class="money-input"><span aria-hidden="true">${esc(currencySymbol(currency))}</span><input id="budget-${k}" inputmode="decimal" type="number" min="0" max="10000000" step="${Math.pow(10,-currencyPlaces(currency))}" value="${esc(b[k] ?? "")}" placeholder="0"></div></div>`;
  return `<div class="funding-form" ${draftAttributes(p,"budget")} data-guide-tool="${inline ? "budget" : ""}"><fieldset><legend>1. The full trip <span>${esc(currency)}</span></legend><div class="fg2">${BUDGET_FIELDS.slice(0, 6).map(field).join("")}</div><p class="helper">Include taxes, fees and care/access needs in the relevant expense or buffer.</p></fieldset>
    <fieldset><legend>2. Support &amp; timing</legend>${BUDGET_FIELDS.slice(6).map(field).join("")}<p class="helper">Count each confirmed contribution once. Direct payment reduces upfront cash; later reimbursement does not.</p></fieldset>
    <div class="worksheet-totals" aria-live="polite" aria-atomic="true"><div class="total-cost"><span>Full trip cost</span><strong id="budget-total">${fmt(q.total,currency)}</strong></div><div><span>Estimated personal cost</span><strong id="budget-net">${fmt(q.net,currency)}</strong><small>After confirmed support</small></div><div class="cash-result"><span>Possible upfront cash</span><strong id="budget-upfront">${fmt(q.upfront,currency)}</strong><small>Before reimbursement</small></div><p id="budget-pending-summary">${fmt(q.pending,currency)} pending · Not subtracted</p></div>
    <p class="helper">Assumes listed costs are paid unless directly covered, and reimbursement comes later. Confirm booking, payment and refund terms. This is an estimate, not a funding approval.</p>
    <p class="error" id="budget-warning" role="alert"></p><div class="linkrow">${p ? '<button class="btn primary" data-save-budget="1">Save budget</button>' : '<a class="btn primary" href="#/conference">Choose an event to save →</a>'}<a class="plainlink" href="#/templates/funding">Draft a funding request →</a></div>
    ${p && !inline ? renderFundingSources(p) : ""}${!p ? '<p class="helper scratch-note">These estimates last until reload. Return to this guide after choosing an event to save them.</p>' : ""}</div>`;
}

function plannerPhase(p) {
  const n = daysTo(p.date),
    end = daysTo(p.end || p.date);
  return n > 30
    ? "Long-range preparation"
    : n > 14
      ? "Prepare this month"
      : n > 7
        ? "Your next two weeks"
        : n > 0
          ? "Final-week essentials"
          : end >= 0
            ? "During the conference"
            : "Follow through afterward";
}

function renderPlannerWorkspace() {
  const p = getPlan();
  if (!p) return renderSetup();
  const n = daysTo(p.date),
    end = daysTo(p.end || p.date);
  if (n <= 0 && taskPhase === "now") taskPhase = end >= 0 ? "onsite" : "after";
  const eligible = TASKS.filter((t) => taskFilter(t, taskPhase));
  const next = eligible.find((t) => !p.tasks[t.id] && !p.skippedTasks[t.id]);
  const saved = storageAvailable
    ? "Saved in this browser"
    : "Storage unavailable · Copy or print";
  return `<div class="planner-heading"><div><div class="section-caption"><span class="edition-dot" aria-hidden="true"></span> My Conference</div><h1>${esc(p.name)}</h1><p>${esc(planDateRange(p))}${p.format ? " · " + esc(p.format) : ""}${p.location ? " · " + esc(p.location) : ""}${p.timezone ? " · " + esc(zoneLabel(p.timezone)) : ""}</p><button class="plainlink profile-edit" data-edit-profile="1">Edit conference details</button></div>
    <div class="event-switcher"><label for="switch-event">Your conferences</label><div class="chooser"><select id="switch-event">${Object.values(
      db.plans,
    )
      .map(
        (x) =>
          `<option value="${esc(x.id)}" ${p.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`,
      )
      .join(
        "",
      )}</select><button class="btn" data-show-add="1">+ Add</button></div><span class="save-state" role="status">${saved}</span></div></div>
    ${renderDraftResume(p)}<div class="planner-context"><span class="event-pill">${n > 0 ? n + " days to go" : n === 0 ? "Starts today" : end >= 0 ? "At the conference" : "After the event"}</span><span>${plannerPhase(p)}</span><div class="planner-goal"><label for="plan-goal">I’m here for</label><select id="plan-goal" data-plan-goal="1"><option value="">Choose a main goal</option>${PLANNER_GOALS.map((x) => `<option ${p.goal === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><a href="#/plan" class="plainlink">My field plan ↗</a></div>
    ${renderStarterPath(p,"planner")}${starterPlanSaved(p) ? `<section class="next-move" aria-label="Suggested next step"><span class="next-icon" aria-hidden="true">↗</span><div><span class="section-caption">${next ? "A good place to start" : "Room to adjust"}</span><h2>${next ? esc(next.label) : "Your suggested steps are prepared or marked not needed."}</h2><p>${next ? esc(next.sub) + "." : "Recheck changing details and leave space for a useful conversation."}</p></div>${next ? `<button class="btn" data-task="${next.id}" data-focus-editor="1">Open this step →</button>` : '<a class="btn" href="#/plan">Read my field plan →</a>'}</section>` : ""}${PlaybookAssistant.renderEntry()}
    <div class="conference-grid"><section class="planner-sidebar" aria-label="Planning steps"><details class="planner-menu" ${window.matchMedia("(min-width: 801px)").matches ? "open" : ""}><summary>Browse planning steps <span aria-hidden="true">+</span></summary><h2>Your next moves</h2><p class="helper">Suggested timing, not organizer deadlines. Use the steps that fit your goal.</p><div class="phasebuttons" role="group" aria-label="Planning phase">${[
      ["now", "Now"],
      ["week", "Final week"],
      ["onsite", "At event"],
      ["after", "After"],
    ]
      .map(
        ([k, l]) =>
          `<button aria-pressed="${taskPhase === k}" class="${taskPhase === k ? "active" : ""}" data-phase="${k}">${l}</button>`,
      )
      .join(
        "",
      )}</div><div id="timeline-tasks">${renderPlannerTasks(p)}</div></details>
    <div class="planner-side-note"><p>One thoughtful priority.<br>One realistic backup.<br><strong>Plenty of room to be human.</strong></p></div></section>
    <section class="edbox" id="planner-editor" tabindex="-1" aria-label="Current planning worksheet">${renderEditor(p)}</section></div>
    <div class="planner-footer no-print"><div class="linkrow"><button class="btn" data-review="1">Basic plan checks</button><a href="#/templates" class="plainlink">Editable templates →</a><a href="#/plan" class="plainlink">Print &amp; privacy options →</a></div><p class="helper">Basic checks use fixed rules. AI sharing is optional and requires a preview and your approval. Planner records are kept in this browser; download a backup before clearing browser data. Access is self-reported; verify changing details with official sources.</p></div>${renderDataControls(p)}`;
}

function renderPlannerTasks(p) { return renderChecklistRows(p); }

function collectTargetDraft() {
  return {
    name: gv("target-name").trim(),
    action: gv("target-action").trim(),
    source: gv("target-link").trim(),
    backup: gv("target-backup").trim(),
    question: gv("target-question").trim(),
    kind: gv("target-kind"),
    status: gv("target-status"),
    roleId: gv("target-role-id").trim(),
  };
}

function handleRepresentativeClick(button) {
  const d = button.dataset;
  if (d.exampleGoal) {
    exampleGoal = d.exampleGoal;
    document
      .querySelectorAll("[data-example-goal]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    const [heading, body] = GOAL_EXAMPLES[exampleGoal];
    document.getElementById("goal-example").innerHTML =
      `<strong>${esc(heading)}</strong><p>${esc(body)}</p>`;
    return true;
  }
  if (d.previewPriority) {
    const z = collectTargetDraft();
    currentGuideScratch().target = z;
    if (!validatePriority()) return true;
    const out = document.getElementById("priority-preview");
    out.hidden = false;
    out.textContent = `${z.name} → ${z.action}${z.backup ? " · Backup: " + z.backup : ""}. Access: ${z.status || "Needs checking"}.`;
    return true;
  }
  return false;
}

function validatePriority() {
  const name = document.getElementById("target-name"),
    action = document.getElementById("target-action"),
    source = document.getElementById("target-link");
  [name, action, source].forEach((x) => x?.removeAttribute("aria-invalid"));
  const invalid = !name.value.trim()
    ? name
    : !action.value.trim()
      ? action
      : source.value && !/^https?:\/\//i.test(source.value)
        ? source
        : null;
  if (invalid) {
    document.getElementById("form-warning").textContent =
      invalid === source
        ? "Use a full http:// or https:// source URL, or leave it blank if unverified."
        : "Add a specific target and a next action.";
    invalid.setAttribute("aria-invalid", "true");
    invalid.focus();
    return false;
  }
  document.getElementById("form-warning").textContent = "";
  return true;
}

function validateBudget() {
  const invalid = BUDGET_FIELDS.map(([k]) =>
    document.getElementById("budget-" + k),
  ).find((x) => x && !x.validity.valid);
  if (!invalid) {
    document.getElementById("budget-warning").textContent = "";
    return true;
  }
  document.getElementById("budget-warning").textContent =
    "Use a non-negative amount, up to 10,000,000, with at most two decimal places.";
  invalid.setAttribute("aria-invalid", "true");
  invalid.focus();
  return false;
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".skip")) {
    event.preventDefault();
    document.getElementById("main").focus();
    return;
  }
  const link = event.target.closest("[data-section-link]");
  if (link) {
    event.preventDefault();
    const section = document.getElementById(link.dataset.sectionLink);
    section?.scrollIntoView({ behavior: "auto", block: "start" });
    if (section) {
      section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    }
  }
});

// Resize the task disclosure without rebuilding or losing unsaved form values.
window
  .matchMedia("(min-width: 801px)")
  .addEventListener?.("change", (event) => {
    const menu = document.querySelector(".planner-menu");
    if (menu) menu.open = event.matches;
  });

document.addEventListener("input", (event) => {
  const scope = event.target.closest("[data-guide-tool]");
  if (scope?.dataset.guideTool === "target")
    currentGuideScratch().target = collectTargetDraft();
  if (scope?.dataset.guideTool === "budget")
    currentGuideScratch().budget = Object.fromEntries(
      BUDGET_FIELDS.map(([k]) => [k, collectNumber(k)]),
    );
  if (event.target.closest(".edbody, .inline-worksheet, .templatebody") && !event.target.closest("[data-draft-scope]"))
    document
      .querySelectorAll(".save-state")
      .forEach((x) => {
        if (x.textContent !== "Unsaved changes") x.textContent = "Unsaved changes";
      });
  event.target.removeAttribute("aria-invalid");
});
