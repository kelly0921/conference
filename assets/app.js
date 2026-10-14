const GUIDE_BY_ID = Object.fromEntries(GUIDES.map((g) => [g.id, g]));
const STAGES = {
  before: {
    title: "Before the conference",
    desc: "Decide, fund, prepare and choose what matters.",
  },
  during: {
    title: "During the conference",
    desc: "Use your time wisely, connect and explore.",
  },
  after: {
    title: "After the conference",
    desc: "Follow through and make learning useful.",
  },
};
const EVENTS = Object.fromEntries(
  Object.entries(SNAPSHOT.events).map(([id, x]) => [
    id,
    {
      name: x.name,
      date: x.start,
      end: x.end,
      location: x.location,
      timezone: x.timezone,
      links: x.sourceRefs.map((k) => [
        SNAPSHOT.sources[k].label,
        SNAPSHOT.sources[k].url,
      ]),
    },
  ]),
);
const JOB_TYPES = [
  "Role or employer",
  "Session or workshop",
  "Community or person",
  "Project or contribution",
];
const ACCESS_STATUS = [
  "Needs checking",
  "To do",
  "Requested",
  "Submitted",
  "Waitlisted",
  "User-reported confirmed",
  "Closed/unavailable",
  "Not started",
  "Requested / submitted",
  "Not applicable",
];
const TEMPLATE_DATA = SNAPSHOT.templates;
const TASKS = [
  {
    id: "decision",
    stage: "before",
    label: "Decide if the trip is worth it",
    sub: "Goal, cost, alternative and condition",
  },
  {
    id: "access",
    stage: "before",
    label: "Check registrations and access",
    sub: "Tickets, profiles, applications and invitations differ",
  },
  {
    id: "targets",
    stage: "before",
    label: "Research and choose priorities",
    sub: "Real roles, sessions, people or product conversations",
  },
  {
    id: "story",
    stage: "before",
    label: "Prepare a real story and question",
    sub: "Your contribution, decision and useful question",
  },
  {
    id: "budget",
    stage: "before",
    label: "Estimate costs and funding",
    sub: "Confirmed support and actual upfront cash",
  },
  {
    id: "experience",
    stage: "during",
    label: "Plan learning and community",
    sub: "Verify access and keep a fallback",
  },
  {
    id: "outreach",
    stage: "before",
    label: "Prepare an introduction",
    sub: "Genuine, specific and easy to decline",
  },
  {
    id: "schedule",
    stage: "during",
    label: "Save fixed and flexible activities",
    sub: "Time, timezone, room, source and confirmation",
  },
  {
    id: "daychoice",
    stage: "during",
    label: "Keep, swap or skip",
    sub: "Adjust against your actual commitments",
  },
  {
    id: "notes",
    stage: "during",
    label: "Capture a useful conversation",
    sub: "Context, action and appropriate channel",
  },
  {
    id: "followup",
    stage: "after",
    label: "Complete one follow-up",
    sub: "A promise or relevant official action",
  },
  {
    id: "learning",
    stage: "after",
    label: "Apply one lesson",
    sub: "Insight to a practical next test",
  },
];
const STORAGE = "conference-playbook-integrated-v5";
const OLD_STORAGE = "conference-playbook-integrated-v4";
function oldPlanAvailable() {
  try {
    return !!localStorage.getItem(OLD_STORAGE);
  } catch (e) {
    return false;
  }
}
let db = { activeId: null, plans: {} };
try {
  const v = JSON.parse(localStorage.getItem(STORAGE) || "null");
  if (v && typeof v === "object" && v.plans && typeof v.plans === "object") db = v;
} catch (e) { storageAvailable = false; }
db = normalizePlannerDatabase(db);
let selectedTask = "access",
  taskPhase = "now",
  editingTarget = -1,
  activeTemplate = "funding",
  selectedStage = "before";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const nl = (s) => esc(s).replace(/\n/g, "<br>");
const fmt = (n, currency = "USD") => currency + " " + (Number(n) || 0).toLocaleString("en-US", {minimumFractionDigits:0, maximumFractionDigits:currencyPlaces(currency)});
function save() {
  try {
    const p = getPlan();
    if (p) p.updated = new Date().toISOString();
    localStorage.setItem(STORAGE, JSON.stringify(db));
    storageAvailable = true;
    document
      .querySelectorAll(".save-state")
      .forEach((x) => (x.textContent = "Saved in this browser"));
    return true;
  } catch (e) {
    storageAvailable = false;
    document
      .querySelectorAll(".save-state")
      .forEach((x) => (x.textContent = "Storage unavailable · Copy or print"));
    notify(
      "Browser storage is unavailable. Copy or print your plan before leaving.",
    );
    return false;
  }
}
let noticeTimeout;
function notifySaved(message) {
  notify(storageAvailable ? message : "Changes are in memory only. Download a private backup before leaving.");
}
function notify(msg) {
  const s = document.getElementById("status");
  s.innerHTML = '<div class="live">' + esc(msg) + "</div>";
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => (s.innerHTML = ""), 4000);
}
function todayUTC() {
  const tz=getPlan()?.timezone;
  if (validTimeZone(tz)) {
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(new Date());
    const value=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return Date.UTC(Number(value.year),Number(value.month)-1,Number(value.day));
  }
  const d=new Date(); return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
}

function dateUTC(s) {
  const a = String(s || "")
    .split("-")
    .map(Number);
  if (a.length !== 3 || a.some((n) => !n)) return todayUTC();
  return Date.UTC(a[0], a[1] - 1, a[2]);
}
function daysTo(s) {
  return Math.round((dateUTC(s) - todayUTC()) / 86400000);
}
function prettyDate(s) {
  if (!s) return "Date not set";
  try {
    return new Date(s + "T12:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return s;
  }
}
function makePlan(id, name, date, location, end) {
  return {
    id,
    name,
    date,
    location,
    end: end || date,
    timezone: EVENTS[id]?.timezone || "",
    currency: "USD",
    format: "", organizerUrl: "", presetId: EVENTS[id] ? id : "", skippedTasks: {}, worksheetDrafts: {},
    goal: "",
    tasks: {},
    decision: {},
    dayChoice: {},
    access: {},
    targets: [],
    activities: [],
    story: {},
    budget: {},
    experience: {},
    notes: [],
    insight: {},
    drafts: {},
    printPreferences: {
      includeFunding: false,
      includeContacts: false,
      includeDrafts: false,
      includePrivateLinks: false,
    },
    updated: new Date().toISOString(),
  };
}
function getPlan() {
  return db.activeId ? db.plans[db.activeId] : null;
}
function ensurePreset(id) {
  if (!EVENTS[id]) return;
  if (!db.plans[id]) {
    const e=EVENTS[id], urls={ghc:"https://ghc.anitab.org/",shpe:"https://shpe.org/2026/",afrotech:"https://afrotechconference.com/"};
    db.plans[id]=makePlan(id,e.name,e.date,e.location,e.end);
    Object.assign(db.plans[id],{format:"In person",organizerUrl:urls[id]});
  }
  db.activeId=id; activatePlannerPlan(getPlan()); currentGuideScratch(); save();
  editingTarget=-1; location.hash="#/conference"; render();
}

function createCustom() {
  const profile=profileValues(), error=profileValidation(profile);
  if (error) { formError("profile-warning",...error); return; }
  const id=freshPlanId("custom");
  db.plans[id]=Object.assign(makePlan(id,profile.name,profile.date,profile.location,profile.end),profile);
  db.activeId=id; delete db.setupDraft.profile; activatePlannerPlan(getPlan()); currentGuideScratch(); save();
  location.hash="#/conference"; render();
}

function switchPlan(id) {
  if (!db.plans[id]) return;
  db.activeId = id;
  activatePlannerPlan(getPlan());
  currentGuideScratch();
  save();
  editingTarget = -1;
  location.hash = "#/conference";
  render();
}
function routeHash() {
  return (location.hash || "#/playbook/before")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean);
}
function navTo(route) {
  location.hash = "#/" + route;
  if (routeHash().join("/") === route) render();
  window.scrollTo(0, 0);
}
function render() {
  const focusHint=rememberPlannerFocus();
  const r = routeHash(),
    view = r[0] || "playbook",
    target = r[1] || "";
  document.body.classList.toggle("review-surface", true);
  let html;
  if (view === "guide" && GUIDE_BY_ID[target])
    html = renderGuide(GUIDE_BY_ID[target]);
  else if (view === "conference") html = renderConference();
  else if (view === "assistant") html = PlaybookAssistant.renderWorkspace(getPlan(),target);
  else if (view === "templates") html = renderTemplates(target);
  else if (view === "plan") html = renderFieldPlan();
  else if (view === "downloads") html = renderDownloads();
  else html = renderHome(STAGES[target] ? target : "before");
  document.getElementById("main").innerHTML = html;
  restoreWorksheetDrafts();
  updateBudgetTotals();
  restorePlannerFocus(focusHint);
  if(view === "assistant") PlaybookAssistant.afterRender();
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) =>
      a.classList.toggle(
        "active",
        view === "conference" || view === "plan" || view === "assistant"
          ? a.dataset.nav === "conference"
          : view === "templates" || view === "downloads"
            ? a.dataset.nav === "templates"
            : a.dataset.nav === "playbook",
      ),
    );
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.classList.contains("active")) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title =
    (view === "guide" && GUIDE_BY_ID[target]
      ? GUIDE_BY_ID[target].title + " · "
      : "") + "The Conference Playbook";
}
function renderHome(stage) {
  selectedStage = stage;
  const g = GUIDES.filter((g) => g.stage === stage),
    p = getPlan(),
    d = p ? daysTo(p.date) : null;
  return `<section class="pageintro"><div class="eyebrow">A practical conference resource</div><h1>The Conference Playbook</h1><p class="lead" style="margin-top:12px">Short guides, worked examples and planning tools for tech conferences. Read only what you need—or make a plan you can take with you.</p></section><nav class="stagebar" aria-label="Conference stage">${Object.keys(
    STAGES,
  )
    .map(
      (st) =>
        `<a href="#/playbook/${st}" class="${stage === st ? "active" : ""}" ${stage === st ? 'aria-current="page"' : ""}>${st === "before" ? "Before" : st === "during" ? "During" : "After"}</a>`,
    )
    .join(
      "",
    )}</nav><div class="resource-layout"><section><div class="topicline"><h2>${esc(STAGES[stage].title)}</h2><span>${g.length} focused guides</span></div><div class="cardlist">${g.map((z) => `<a class="resource-card" href="#/guide/${z.id}"><div class="eyebrow">${esc(z.topic)}</div><h3>${esc(z.title)}</h3><p>${esc(z.subtitle)}</p><span class="card-foot"><span>Checklist · Example · Optional tool</span><span aria-hidden="true">↗</span></span></a>`).join("")}</div></section><aside><div class="quiet-card"><div class="eyebrow">Hands-on planning</div><h3>${p ? "Continue " + esc(p.name) : stage === "before" ? "Make a preparation plan" : stage === "during" ? "Use a field plan" : "Review your next steps"}</h3><p>${p ? (d >= 0 ? `${d} day${d === 1 ? "" : "s"} until the conference. Return to your saved checklist, templates and priorities.` : "Your saved notes and follow-through are ready.") : "A guided checklist, practical templates and one print-ready field plan. You can read this Playbook without starting."}</p><a class="plainlink" href="#/conference">${p ? "Open my conference →" : "Open preparation checklist →"}</a></div><div class="quiet-card"><div class="eyebrow">Available offline</div><h3>Printable Playbook + Workbook</h3><p>Blank worksheets and the original four template families, laid out for writing by hand.</p><a class="plainlink" href="output/pdf/conference-playbook-workbook-v5.pdf" download>Download printable PDF ↓</a><div class="linkrow"><a href="#/downloads">Other print options</a></div></div><p class="fineprint">Conference-specific recruiting, scholarships and invitations are not verified by this prototype. Follow current organizer instructions.</p></aside></div>`;
}
function guideExample(g) {
  const x = g.ex || {};
  if (x.type === "budget") {
    return `<div class="example"><p>${esc(x.intro)}</p><div class="duocol"><div class="mini-panel"><div class="k">After confirmed support</div><div class="v">${esc(x.net)}</div><p>Excludes pending applications</p></div><div class="mini-panel ok"><div class="k">Possible upfront cash</div><div class="v">${esc(x.cash)}</div><p>Before reimbursement</p></div></div><p>${esc(x.foot)}</p></div>`;
  }
  if (x.type === "status")
    return `<div class="example"><p><b>Not enough:</b> ${esc(x.bad)}</p><table>${x.rows.map((a) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td></tr>`).join("")}</table><p>${esc(x.foot)}</p></div>`;
  if (x.type === "questions")
    return `<div class="example"><p><b>Too broad:</b> ${esc(x.bad)}</p><p><b>More specific:</b> ${esc(x.good)}</p><table>${x.rows.map((a) => `<tr><td>${esc(a[0])}</td><td style="text-align:left">${esc(a[1])}</td></tr>`).join("")}</table><p>${esc(x.foot)}</p></div>`;
  if (x.type === "day")
    return `<div class="example"><p><b>Expo-only:</b> ${esc(x.bad)}</p><table>${x.rows.map((a) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td></tr>`).join("")}</table><p>${esc(x.foot)}</p></div>`;
  if (x.type === "learning")
    return `<div class="example"><p><b>Vague:</b> ${esc(x.bad)}</p><div class="duocol">${x.nodes.map((a) => `<div class="mini-panel"><div class="k">${esc(a[0])}</div><p>${esc(a[1])}</p></div>`).join("")}</div><p>${esc(x.foot)}</p></div>`;
  return `<div class="example">${x.intro ? `<p>${esc(x.intro)}</p>` : ""}<div class="duocol"><div class="mini-panel"><div class="k">${esc(x.bad_label || "Less useful")}</div><p>${esc(x.bad)}</p></div><div class="mini-panel ok"><div class="k">${esc(x.good_label || "Better choice")}</div><p>${esc(x.good)}</p></div></div><p>${esc(x.foot || "Illustrative, not an actual conference or attendee outcome.")}</p></div>`;
}
const GUIDE_TASK = {
  worth: "decision",
  funding: "budget",
  prepare: "access",
  prioritize: "targets",
  time: "daychoice",
  conversations: "story",
  explore: "experience",
  followup: "notes",
  learning: "learning",
};
function renderGuide(g) {
  return renderEditorialGuide(g);
}
function renderSetup() { return renderUniversalSetup(); }

function renderConference() {
  return renderPlannerWorkspace();
}
function taskFilter(t, phase) {
  const p=getPlan(), n=daysTo(p?.date);
  if (!taskAppliesToProfile(t,p)) return false;
  if (["online","travel","applications"].includes(t.id)) return phase==="now" || phase==="week";
  if (phase==="now") {
    const ids=n>30 ? ["decision","budget","access","targets","story","experience"] :
      n>14 ? ["budget","access","targets","story","outreach","experience"] :
      ["access","targets","story","outreach","experience","schedule",...(n>7?["budget"]:[])];
    return ids.includes(t.id);
  }
  if(phase==="week") return ["access","outreach","targets","experience","schedule","story"].includes(t.id);
  if(phase==="onsite") return ["schedule","daychoice","experience","notes","targets"].includes(t.id);
  return ["followup","learning","notes"].includes(t.id);
}

function renderTaskList(p) {
  return renderPlannerTasks(p);
}
function renderEditor(p) {
  if (editingProfile) return renderProfileEditor(p,false);
  const t = TASKS.find((x) => x.id === selectedTask) || TASKS[0];
  let h = `<div class="edhead"><div class="eyebrow">Worksheet · ${esc(t.stage)}</div><h2>${esc(t.label)}</h2><p>${esc(t.sub)}.</p></div><div class="edbody" ${draftAttributes(p,worksheetScope(t.id))}>`;
  let b = "";
  switch (t.editor || t.id) {
    case "decision":
      b = editorDecision(p);
      break;
    case "daychoice":
      b = editorDayChoice(p);
      break;
    case "schedule":
      b = editorSchedule(p);
      break;
    case "access":
      b = editorAccess(p);
      break;
    case "targets":
      b = editorTargets(p);
      break;
    case "story":
      b = editorStory(p);
      break;
    case "budget":
      b = editorBudget(p);
      break;
    case "experience":
      b = editorExperience(p);
      break;
    case "outreach":
      b = `<p class="muted small">Use the original pre-conference introduction structure; fill only genuine, researched context.</p><div class="tip">A submitted RSVP, an interview invitation and a public interest list are different things.</div><a class="btn primary" href="#/templates/pre">Open introduction template →</a>`;
      break;
    case "notes":
      b = editorNotes(p);
      break;
    case "followup":
      b = editorNotes(p) + '<div class="linkrow"><a class="plainlink" href="#/templates/follow">Open follow-up template →</a></div>';
      break;
    case "learning":
      b = editorLearning(p);
      break;
    default:
      b = "";
  }
  return h + b + `</div>`;
}
function editorDecision(p) {
  const x = p.decision || {};
  return `<p class="muted small">A conference is not automatically worthwhile. Make a reasoned go/funded-only/wait/skip decision based on your real circumstances.</p><div class="formrow"><label for="decision-goal">Most useful outcome</label><input id="decision-goal" value="${esc(x.goal || "")}" placeholder="A skill, connection, contribution or role to explore"></div><div class="formrow"><label for="decision-fit">What could this event offer that is hard to replace?</label><input id="decision-fit" value="${esc(x.fit || "")}" placeholder="One concrete opportunity or learning experience"></div><div class="fg2"><div class="formrow"><label for="decision-status">My current decision</label><select id="decision-status">${["Not decided", "Go", "Only if funded", "Wait and prepare", "Skip this time"].map((v) => `<option ${x.status === v ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="formrow"><label for="decision-alt">Alternative (optional)</label><input id="decision-alt" value="${esc(x.alternative || "")}" placeholder="Local fair, community meetup or later event"></div></div><div class="formrow"><label for="decision-next">My next action</label><input id="decision-next" value="${esc(x.next || "")}" placeholder="Verify costs, access or funding before committing"></div><div class="tip">Check the budget separately. Pending support is not spendable money; choosing to wait or skip can be sensible.</div><button class="btn primary" data-save-decision="1">Save decision</button>`;
}
function editorDayChoice(p) {
  const x = p.dayChoice || {};
  return `<p class="muted small">Fixed appointments come first. Compare the value of this activity with what you'd miss; do not rely on invented line or availability estimates.</p><div class="formrow"><label for="day-current">Current planned activity</label><input id="day-current" value="${esc(x.current || "")}" placeholder="Booth, session or community stop"></div><div class="formrow"><label for="day-alternative">A realistic alternative</label><input id="day-alternative" value="${esc(x.alternative || "")}" placeholder="Workshop, conversation or break"></div><div class="fg2"><div class="formrow"><label for="day-choice">Decision</label><select id="day-choice">${["Not decided", "Keep", "Swap", "Skip", "Verify first"].map((v) => `<option ${x.choice === v ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="formrow"><label for="day-next">Very next action</label><input id="day-next" value="${esc(x.next || "")}" placeholder="Check event app, confirm access, or head to the activity"></div></div><button class="btn primary" data-save-daychoice="1">Save day-of choice</button>`;
}
function editorAccess(p) {
  const g = p.goal || "";
  const career = !g || g.startsWith("Recruiting");
  const rows = [
    ["registration", "Conference registration"],
    ...(career
      ? [
          ["profile", "Attendee or talent profile"],
          ["application", "Specific employer application"],
        ]
      : []),
    ["session", "Session / gathering RSVP"],
    ...(career ? [["invitation", "Interview or invitation confirmation"]] : []),
    ...(!p.format || ["Online","Hybrid"].includes(p.format) ? [["online","Online platform / join access"]] : []),
  ];
  return `<p class="form-help small muted">Your statuses are self-reported. A talent profile is not an application. Requested is not confirmed.</p>${rows.map(([k, label]) => `<div class="statusline"><span>${esc(label)}</span><select data-access="${k}" aria-label="${esc(label)} status">${ACCESS_STATUS.map((x) => `<option ${p.access?.[k] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>`).join("")}<div class="tip">For the organizer's current routes and actual deadlines, use the original event site; a checked profile does not establish admission or an interview.</div><p class="helper">Recruiting fields follow your main goal and are also shown before a goal is chosen.</p>${officialLinks(p)}`;
}
function officialLinks(p) {
  const e = EVENTS[p.id];
  if (!e?.links?.length)
    return p.organizerUrl && validWebURL(p.organizerUrl) ? '<div class="linkrow"><a class="plainlink" href="'+esc(p.organizerUrl)+'" target="_blank" rel="noopener noreferrer">Organizer website ↗</a></div><p class="helper">Check the current edition and actual attendee instructions. A saved URL does not verify access.</p>' : '<p class="helper">Add the organizer URL in conference details, then check its current attendee instructions.</p>';
  return `<details class="organizer-references"><summary>Organizer references &amp; access routes</summary><div class="linkrow">${e.links.map(([name, url]) => `<a target="_blank" rel="noopener noreferrer" href="${esc(url)}">${esc(name)} ↗</a>`).join("")}</div><p class="helper">Reference links do not verify personal access or eligibility.</p></details>`;
}
function editorTargets(p) {
  return priorityWorksheet(p);
}
function editorStory(p) {
  const x = p.story || {};
  return `<p class="muted small">Make your story specific and true. It can come from classes, work, volunteer activities or a personal project.</p>${[
    ["context", "The problem or project", "What were you trying to solve?"],
    [
      "contribution",
      "What you personally did",
      "Your role, trade-off, or decision",
    ],
    [
      "result",
      "What happened or what you learned",
      "Use actual evidence if available",
    ],
    [
      "question",
      "A question it helps you ask",
      "What are you still curious about?",
    ],
  ]
    .map(
      ([k, l, ph]) =>
        `<div class="formrow"><label for="story-${k}">${l}</label><textarea rows="2" id="story-${k}" placeholder="${ph}">${esc(x[k] || "")}</textarea></div>`,
    )
    .join(
      "",
    )}<button class="btn primary" data-save-story="1">Save story and question</button>`;
}
function editorSchedule(p) {
  const list = p.activities || [];
  return `<p class="muted small">Only appointments actually confirmed to you belong in your fixed schedule. A pending RSVP can be saved as a flexible activity but not as a booking.</p><div class="formrow"><label for="activity-label">Activity or commitment *</label><input id="activity-label" placeholder="Actual meeting, workshop, travel block, or tentative activity"></div><div class="fg2"><div class="formrow"><label for="activity-date">Date in event's local calendar *</label><input type="date" id="activity-date" value="${esc(p.date || "")}"></div><div class="formrow"><label for="activity-timezone">IANA event time zone *</label><input id="activity-timezone" value="${esc(p.timezone || "")}" placeholder="America/Los_Angeles"></div></div><div class="fg2"><div class="formrow"><label for="activity-start">Start (event local)</label><input type="time" id="activity-start"></div><div class="formrow"><label for="activity-end">End (event local)</label><input type="time" id="activity-end"></div></div><div class="fg2"><div class="formrow"><label for="activity-venue">Venue or room</label><input id="activity-venue" placeholder="Use actual confirmed room/address"></div><div class="formrow"><label for="activity-access">Self-reported status</label><select id="activity-access">${ACCESS_STATUS.map((a) => `<option>${esc(a)}</option>`).join("")}</select></div></div><div class="fg2"><div class="formrow"><label for="activity-fixed">Scheduling type</label><select id="activity-fixed"><option value="flexible">Flexible / tentative</option><option value="fixed">Fixed, confirmed commitment</option></select></div><div class="formrow"><label for="activity-buffer">Travel/reset buffer (minutes)</label><input id="activity-buffer" type="number" min="0" max="600" value="10"></div></div><div class="fg2"><div class="formrow"><label for="activity-source">Public source URL</label><input id="activity-source" placeholder="https:// or leave blank"></div><div class="formrow"><label for="activity-reference">Private confirmation reference</label><input id="activity-reference" placeholder="Kept out of default print"></div></div><div class="formrow"><label for="activity-backup">Fallback / next action</label><input id="activity-backup" placeholder="One available alternative"></div><div class="linkrow"><button class="btn primary" data-save-activity="1">Save activity</button><span class="error" id="activity-error" role="alert"></span></div><div class="sepbar"></div><strong class="small">Saved activities (${list.length})</strong>${list.length ? `<ul class="detail-list">${list.map((a, i) => `<li><div><b>${esc(a.label)}</b><small>${esc(a.date || "")} ${esc(a.start || "")}–${esc(a.end || "")} · ${a.fixed ? "Fixed (user-confirmed)" : "Flexible"} · ${esc(a.status)}</small></div><button class="btn sm danger" data-remove-activity="${i}">Remove</button></li>`).join("")}</ul>` : '<p class="muted small">None yet. Empty times are never filled automatically.</p>'}`;
}
const BUDGET_FIELDS = [
  ["registration", "Registration"],
  ["travel", "Travel"],
  ["lodging", "Lodging"],
  ["local", "Local transport"],
  ["food", "Food"],
  ["buffer", "Buffer"],
  ["direct", "Confirmed costs paid directly by someone else"],
  ["reimbursement", "Confirmed later reimbursement"],
  ["pending", "Funding still pending (not subtracted)"],
];
function budgetCalc(b) {
  const n = (k) => Math.max(0, Number(b[k]) || 0);
  const total = [
    "registration",
    "travel",
    "lodging",
    "local",
    "food",
    "buffer",
  ].reduce((a, k) => a + n(k), 0);
  return {
    total,
    net: Math.max(0, total - n("direct") - n("reimbursement")),
    upfront: Math.max(0, total - n("direct")),
    pending: n("pending"),
  };
}
function editorBudget(p) {
  return fundingWorksheet(p);
}
function editorExperience(p) { return renderCommunityEditor(p); }

function editorNotes(p) { return renderCommitmentEditor(p); }

function editorLearning(p) { return renderDebriefEditor(p); }

function renderTemplates(requested) {
  const keys = Object.keys(TEMPLATE_DATA),
    k = TEMPLATE_DATA[requested] ? requested : activeTemplate;
  activeTemplate = k;
  const t = TEMPLATE_DATA[k], p = getPlan();
  const body = p?.drafts?.[k] ?? t.text.replace("[Conference]", p ? String(p.name) : "[Conference]");
  return `<section class="section-intro"><div class="section-caption"><span class="edition-dot" aria-hidden="true"></span> Templates &amp; Downloads <span class="caption-divider">/</span> Editorial v${esc(SNAPSHOT.snapshotVersion)}</div>
    <h1>Copy what you need. Leave the rest.</h1><p class="lead">Four user-authored template structures from the original Playbook. Unknown facts remain bracketed; nothing is sent.</p></section>
    <div class="templayout"><nav class="tlist" aria-label="Message templates"><p class="rail-caption">Choose a template</p>
      ${keys.map((id) => `<a href="#/templates/${id}" class="${id === k ? "active" : ""}" ${id === k ? 'aria-current="page"' : ""}>${esc(TEMPLATE_DATA[id].name)}</a>`).join("")}
      <a class="template-resources" href="#/downloads">Printable resources ↓</a></nav>
    <section class="templatebody" aria-labelledby="template-title" ${draftAttributes(p,"template:"+k)}><div class="section-caption">${esc(t.stage)} <span class="caption-divider">/</span> Editable template</div>
      <h2 id="template-title">${esc(t.name)}</h2><p class="template-check">${esc(t.check)}</p>
      <div class="template-state"><span>${p ? `For <strong>${esc(p.name)}</strong>` : 'Copy a draft here, or <a href="#/conference">choose an event</a> to save it.'}</span>
      <span class="save-state" role="status">${p?.drafts?.[k] !== undefined ? "Saved in this browser" : "Not saved yet"}</span></div>
      <div class="linkrow template-actions"><button class="btn primary" data-save-template="${k}">${p ? "Save to " + esc(p.name) : "Save to My Conference"}</button><button class="btn" data-copy-template="1">Copy draft</button><a href="#/conference" class="plainlink">My Conference →</a></div>
      <div class="formrow"><label for="template-editor">Edit all bracketed details</label><textarea id="template-editor" rows="15">${esc(body)}</textarea></div>
      <p class="fineprint">The template source is shared with the printable workbook. Save is browser-local and event-specific. A public recap is optional.</p></section></div>
    <div class="print-resources no-print"><strong>Prefer paper?</strong><div class="linkrow"><a class="plainlink" href="output/pdf/conference-playbook-workbook-v5.pdf" download>Printable workbook ↓</a><a class="plainlink" href="output/pdf/conference-playbook-sample-field-plan-v5.pdf" download>Completed fictional sample ↓</a></div></div>`;
}
function renderDownloads() {
  return `<section class="section-intro"><div class="eyebrow">Offline & printable</div><h1>Take the useful parts with you.</h1><p class="lead">A blank workbook needs no account or plan. Your personal field plan prints only the event currently selected.</p></section><div class="pdf-tile"><div class="pdf-icon" aria-hidden="true">PDF</div><div><h2>Printable Playbook + Workbook</h2><p>Short Before / During / After instructions, completed fictional examples, original four template families, and blank worksheets. Versioned v${esc(SNAPSHOT.snapshotVersion)}.</p><a class="btn primary" href="output/pdf/conference-playbook-workbook-v5.pdf" download>Download Letter workbook ↓</a><a class=\"btn\" href=\"output/pdf/conference-playbook-workbook-v5-a4.pdf\" download>Download A4 workbook ↓</a></div></div><div class="pdf-tile"><div class="pdf-icon" aria-hidden="true">PDF</div><div><h2>Completed fictional field plan</h2><p>Example content with invented roles and appointments only; not a real attendee schedule.</p><a class="btn" href="output/pdf/conference-playbook-sample-field-plan-v5.pdf" download>Download example ↓</a></div></div><div class="pdf-tile"><div class="pdf-icon" aria-hidden="true">MY</div><div><h2>Your own field plan</h2><p>Use the browser's Print / Save as PDF. Private fields are excluded by default and your event records stay separate.</p><a class="btn" href="#/plan">Open my field plan →</a></div></div><div class="quiet-card downloads-guide"><h2>One guide only?</h2><a class="plainlink" href="#/playbook/before">Open a guide and choose Print this guide →</a></div>`;
}
function defaultPrintPreferences() {
  return {
    includeFunding: false,
    includeContacts: false,
    includeDrafts: false,
    includePrivateLinks: false,
  };
}
function printPrefs(p) {
  return Object.fromEntries(Object.keys(defaultPrintPreferences()).map(k=>[k,p.printPreferences?.[k]===true]));
}
function sensitiveLink(url) {
  const text=String(url || ""), privateKey=/^(?:access_token|auth_token|id_token|token|secret|api_key|apikey|key|signature|invite_token|auth|ticket|password|credential)$/i;
  try {
    const value=new URL(text);
    if(value.username || value.password || [...value.searchParams.keys()].some(k=>privateKey.test(k))) return true;
    if([...new URLSearchParams(value.hash.replace(/^#/,"")).keys()].some(k=>privateKey.test(k))) return true;
  } catch (_) {}
  return /[?&#](?:access_token|auth_token|token|secret|key|signature|invite_token|auth|ticket)=|\/invite\/[A-Za-z0-9_-]{7,}/i.test(text);
}
function showPublicSource(url, p) {
  if (!url) return "";
  return sensitiveLink(url) && !printPrefs(p).includePrivateLinks
    ? "[private source link hidden]"
    : url;
}
function exportSections(p) {
  const pref = printPrefs(p),
    sections = [];
  const add = (title, lines) => {
    const clean = lines.map((x) => String(x || "").trim()).filter(Boolean);
    if (clean.length) sections.push({ title, lines: clean });
  };
  const q = budgetCalc(p.budget || {});
  if (p.decision?.next)
    add("Attendance decision", [
      `Choice: ${p.decision.status || "Not decided"}; goal: ${p.decision.goal || "unspecified"}`,
      `Condition / next: ${p.decision.next}`,
      p.decision.alternative ? `Alternative: ${p.decision.alternative}` : "",
    ]);
  add(
    "Chosen priorities",
    (p.targets || []).flatMap((x, i) => [
      `#${i + 1} ${x.name} — ${x.action}`,
      `Self-reported status: ${x.status || "Needs checking"}${x.roleId ? " · Role/event ID: " + x.roleId : ""}`,
      x.source
        ? `Source: ${showPublicSource(x.source, p)}`
        : "Source: Not verified",
      x.question ? `Question: ${x.question}` : "",
      x.backup ? `Backup: ${x.backup}` : "",
    ]),
  );
  if (Object.keys(p.access || {}).length)
    add(
      "Self-reported access",
      Object.entries(p.access).map(([k, v]) => `${k}: ${v}`),
    );
  if (p.story?.context || p.story?.question)
    add("Conversation cue", [
      p.story.context || "",
      p.story.contribution || "",
      p.story.result || "",
      p.story.question ? `Question: ${p.story.question}` : "",
    ]);
  const a = p.activities || [];
  add(
    "Confirmed commitments",
    a
      .filter((x) => x.fixed && x.status === "User-reported confirmed" && validTimeZone(x.timezone || p.timezone) && validISODate(x.date) && x.start && x.end && validLocalTime(x.start) && validLocalTime(x.end) && x.end>x.start && x.venue)
      .flatMap((x) => [
        `${x.date || ""} ${x.start || "?"}–${x.end || "?"} ${zoneLabel(x.timezone || p.timezone) || "Timezone needs checking"} · ${x.label}`,
        `Venue: ${x.venue || "Not supplied"}`,
        x.source ? `Public source: ${showPublicSource(x.source, p)}` : "",
        x.buffer ? `Buffer: ${x.buffer} min` : "",
      ]),
  );
  add(
    "Flexible or unverified activities",
    a
      .filter((x) => !x.fixed || x.status !== "User-reported confirmed" || !validTimeZone(x.timezone || p.timezone) || !validISODate(x.date) || !x.start || !x.end || !validLocalTime(x.start) || !validLocalTime(x.end) || x.end<=x.start || !x.venue)
      .flatMap((x) => [
        `${x.date || ""} ${x.start || ""} ${x.label} · Access: ${x.status}${x.fixed ? " · Schedule needs rechecking" : ""}`,
        x.venue ? `Location (unconfirmed if access pending): ${x.venue}` : "",
        x.source ? `Public source: ${showPublicSource(x.source, p)}` : "",
        x.backup ? `Backup: ${x.backup}` : "",
      ]),
  );
  if (p.experience?.name)
    add("Learning and community", [
      `${p.experience.name} · Status: ${p.experience.access || "Needs checking"}`,
      p.experience.purpose ? "Goal: " + p.experience.purpose : "",
      p.experience.source ? "Source: " + showPublicSource(p.experience.source,p) : "",
      [p.experience.date,p.experience.time,zoneLabel(p.experience.timezone)].filter(Boolean).join(" · "),
      p.experience.venue ? "Place: " + p.experience.venue : "",
      p.experience.question ? "Question: " + p.experience.question : "",
      p.experience.action || "",
      p.experience.backup ? `Backup: ${p.experience.backup}` : "",
    ]);
  if (p.dayChoice?.next)
    add("Keep / swap / skip", [
      `${p.dayChoice.choice || "Not decided"}: ${p.dayChoice.current || ""} → ${p.dayChoice.alternative || ""}`,
      `Next: ${p.dayChoice.next}`,
    ]);
  add(
    "Follow-through",
    (p.notes || []).flatMap((x) => [
      `${x.context}: ${x.action}${x.due ? " (by " + x.due + ")" : ""} · Your status: ${x.status || (x.done ? "Done" : "To do")}`,
      x.response || x.reply ? "Response: " + (x.response || x.reply) : "",
      x.outcome ? "Outcome: " + x.outcome : "",
      x.source ? "Source: " + showPublicSource(x.source,p) : "",
      pref.includeContacts && x.channel ? `Private channel: ${x.channel}` : "",
    ]),
  );
  if (p.insight?.action || p.insight?.learning)
    add("Apply one insight", [
      p.insight.goal ? "Original goal: " + p.insight.goal : "",
      p.insight.observed ? "Observed: " + p.insight.observed : "",
      p.insight.learning || "",
      p.insight.use ? `Where: ${p.insight.use}` : "",
      p.insight.decision ? "Choice: " + p.insight.decision : "",
      p.insight.action ? "Next: " + p.insight.action : "",
      p.insight.reviewDate ? "Review: " + p.insight.reviewDate : "",
      p.insight.outcome ? "Outcome: " + p.insight.outcome : "",
    ]);
  if (
    pref.includeFunding &&
    BUDGET_FIELDS.some(([k]) => p.budget[k] !== "" && p.budget[k] !== null && p.budget[k] !== undefined)
  )
    add("Private budget figures", [
      `Estimated total: ${fmt(q.total,p.currency || "USD")}`,
      `After confirmed support: ${fmt(q.net,p.currency || "USD")}`,
      `Potential upfront cash: ${fmt(q.upfront,p.currency || "USD")}`,
      q.pending ? `Pending not counted: ${fmt(q.pending,p.currency || "USD")}` : "",
    ]);
  if(pref.includeFunding) add("Private funding sources", (p.budget.sources || []).flatMap(x=>[
    x.name + " · " + (x.status || "Needs checking"),
    x.source ? "Source: " + showPublicSource(x.source,p) : "",
    x.expense ? "Terms: " + x.expense : "", x.edition ? "Edition: " + x.edition : "",
    x.deadline ? "Deadline: " + [x.deadline,x.deadlineTime,zoneLabel(x.timezone)].filter(Boolean).join(" · ") : "",
    x.paymentMethod ? "Payment: " + x.paymentMethod : "",
    x.reimbursementDate ? "Expected payment: " + x.reimbursementDate : "", x.next ? "Next: " + x.next : ""
  ]));
  if (pref.includeDrafts)
    add(
      "Private message drafts",
      Object.entries(p.drafts || {})
        .filter(([_, v]) => v)
        .flatMap(([k, v]) => [`${TEMPLATE_DATA[k]?.name || k}:`, v]),
    );
  return sections;
}
function fieldPlanText(p) {
  return [
    p.name + " — Field plan (v" + SNAPSHOT.snapshotVersion + ")",
    planDateRange(p) +
      (p.format ? " · " + p.format : "") +
      (p.location ? " · " + p.location : "") +
      (p.timezone ? " · " + zoneLabel(p.timezone) : ""),
    "Goal: " + (p.goal || "Not specified"),
    ...(p.organizerUrl ? ["Organizer: " + showPublicSource(p.organizerUrl,p)] : []),
    ...exportSections(p).flatMap((x) => ["", x.title + ":", ...x.lines]),
    "",
    `Generated ${new Date().toLocaleDateString()} from your notes. Source checked by user unless otherwise stated. Recheck official details; fictional demos are not real.`,
    "Private fields excluded unless selected.",
  ].join("\n");
}
function renderFieldPlan() {
  const p = getPlan();
  if (!p) return renderSetup();
  const pref = printPrefs(p), sections = exportSections(p);
  return `<section class="section-intro no-print"><div class="section-caption"><span class="edition-dot" aria-hidden="true"></span> My Conference <span class="caption-divider">/</span> Print view · Snapshot v${esc(SNAPSHOT.snapshotVersion)}</div>
    <h1>Your field plan</h1><p class="lead">A portable summary of your own choices. Source links, saved times and next actions stay with their items. Private details are excluded unless you choose otherwise.</p>
    <div class="linkrow"><button class="btn primary" data-print="plan">Print / Save as PDF</button><button class="btn" data-copy-plan="1">Copy plan</button><a class="plainlink" href="#/conference">Edit My Conference →</a></div></section>
    <div class="field-plan-layout"><aside class="privacy-controls no-print" aria-labelledby="privacy-heading"><h2 id="privacy-heading">Optional private fields in this export</h2>
      <p>Only this event is printed. Choose sensitive sections deliberately; they are OFF by default.</p><div class="privacy-options">${[
        ["includeFunding", "Funding numbers and terms"], ["includeContacts", "Private follow-up channels"],
        ["includeDrafts", "Full edited message drafts"], ["includePrivateLinks", "Private/token-bearing source links"],
      ].map(([k, l]) => `<label class="privacyline"><input type="checkbox" data-print-pref="${k}" ${pref[k] ? "checked" : ""}> <span>${esc(l)}</span></label>`).join("")}</div></aside>
    <article class="planbox" id="print-plan" aria-labelledby="plan-event-title"><div class="planhead"><div><div class="eyebrow">Conference field plan · v${esc(SNAPSHOT.snapshotVersion)}</div>
      <h2 id="plan-event-title">${esc(p.name)}</h2><p>${esc(planDateRange(p))}${p.format ? " · " + esc(p.format) : ""}${p.location ? " · " + esc(p.location) : ""}${p.timezone ? " · " + esc(zoneLabel(p.timezone)) : ""}</p>${p.organizerUrl ? `<p class="plan-organizer">Organizer: ${esc(showPublicSource(p.organizerUrl,p))}</p>` : ""}${p.goal ? `<p class="plan-goal"><b>Goal:</b> ${esc(p.goal)}</p>` : ""}</div><span class="plan-badge">Browser-local · Self-reported</span></div>
      ${sections.length ? sections.map((x) => `<section class="plansect"><h3>${esc(x.title)}</h3>${x.lines.map((line) => `<p class="plan-line">${esc(line)}</p>`).join("")}</section>`).join("") : '<p class="plan-empty">No items yet. Choose one real target or action to begin.</p>'}
      <div class="printnote">Generated ${esc(new Date().toLocaleDateString())} from your selected event plan. Times, sources and access are user-entered/self-reported; verify official changes before acting. Private contact, money and drafts excluded unless selected.</div></article></div>`;
}
function reviewPlan(p) {
  const remarks = [];
  if (!validTimeZone(p.timezone))
    remarks.push("Check the organizer's timezone in conference details before saving timed activities.");
  if (!p.format)
    remarks.push("Add the event format in conference details so the suggested actions fit this conference.");
  if (!p.targets?.length && !p.skippedTasks?.targets)
    remarks.push(
      "Choose one concrete company, role, session or person, and write your first action.",
    );
  else if (p.targets.some((x) => !String(x.action || "").trim()))
    remarks.push(
      "A saved priority needs a specific next action that is in your control.",
    );
  if ((!p.access.registration || p.access.registration === "Needs checking") && !p.skippedTasks?.access)
    remarks.push(
      "Verify actual event registration in the organizer portal; this tool cannot confirm access.",
    );
  if (p.targets?.some((x) => x.status === "Needs checking"))
    remarks.push(
      "One or more target access or application statuses still need official verification.",
    );
  if (!p.story?.question && !p.story?.context && !p.skippedTasks?.story)
    remarks.push(
      "Prepare one genuine project story or question for a relevant conversation.",
    );
  if (!p.experience?.name && !p.skippedTasks?.experience)
    remarks.push(
      "Consider one learning or community opportunity beyond the main expo.",
    );
  return remarks.slice(0, 3).length
    ? remarks.slice(0, 3)
    : [
        "Your current plan has specific actions. Recheck changing event details and leave room to adjust.",
      ];
}
function handleSaveOrUpdate(btn) {
  const p = getPlan();
  if (
    !p &&
    [
      "save-target",
      "save-story",
      "save-budget",
      "save-experience",
      "save-note",
      "save-insight",
    ].includes(btn)
  )
    return;
}
function refresh() {
  save();
  render();
}
function gv(id) {
  return document.getElementById(id)?.value ?? "";
}
function collectNumber(id) {
  let s = gv("budget-" + id);
  return s === "" ? "" : Math.max(0, Number(s) || 0);
}
function copyText(s) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(s)
      .then(() => notify("Copied to clipboard."))
      .catch(() => fallbackCopy(s));
  } else fallbackCopy(s);
}
function fallbackCopy(s) {
  let a = document.createElement("textarea");
  a.value = s;
  document.body.appendChild(a);
  a.select();
  try {
    document.execCommand("copy");
    notify("Copied to clipboard.");
  } catch (e) {
    notify("Clipboard unavailable. Select and copy the text manually.");
  }
  a.remove();
}
function delegatedClick(ev) {
  const target = ev.target.closest("button");
  if (!target) return;
  if (PlaybookAssistant.handleClick(target) || handlePlannerClick(target) || handleWorksheetClick(target) || handleRepresentativeClick(target)) return;
  const d = target.dataset;
  if (d.importV4) {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_STORAGE) || "null");
      if (!old?.plans) throw Error("No prior plans");
      for (const [id, p] of Object.entries(old.plans)) {
        if (db.plans[id]) continue;
        db.plans[id] = normalizePlanRecord({
          ...makePlan(id, p.name || id, p.date || "", p.location || "", p.end),
          ...p,
          activities: p.activities || [],
          printPreferences: defaultPrintPreferences(),
          timezone: p.timezone || EVENTS[id]?.timezone || "",
        },id);
      }
      db.activeId =
        old.activeId && db.plans[old.activeId]
          ? old.activeId
          : Object.keys(db.plans)[0];
      save();
      render();
      notify("Imported plans. Recheck current event access and schedules.");
    } catch (e) {
      notify(
        "Could not import earlier plans. Existing records were left untouched.",
      );
    }
    return;
  }
  if (d.createEvent) {
    ensurePreset(d.createEvent);
    return;
  }
  if (d.createCustom !== undefined) {
    createCustom();
    return;
  }
  if (d.showAdd !== undefined) {
    db.activeId = null;
    selectedTask = "access";
    taskPhase = "now";
    save();
    render();
    return;
  }
  if (d.phase) {
    taskPhase = d.phase;
    const first = TASKS.find((t) => taskFilter(t, taskPhase));
    selectedTask = first?.id || "access";
    editingTarget = -1;
    render();
    return;
  }
  if (d.task) {
    selectedTask = d.task;
    editingTarget = -1;
    render();
    if (d.focusEditor || window.matchMedia("(max-width: 800px)").matches) {
      const editor = document.getElementById("planner-editor");
      editor?.focus({ preventScroll: true });
      editor?.scrollIntoView({ block: "start", behavior: "auto" });
    }
    return;
  }
  if (d.launch) {
    selectedTask = d.launch;
    taskPhase =
      selectedTask === "notes"
        ? "onsite"
        : selectedTask === "learning"
          ? "after"
          : selectedTask === "experience"
            ? "week"
            : "now";
    navTo("conference");
    return;
  }
  if (d.saveActivity) { saveActivityWorksheet(target); return; }
  if (d.removeActivity !== undefined) {
    const p = getPlan();
    p.activities.splice(Number(d.removeActivity), 1);
    refresh();
    return;
  }
  if (d.saveTarget) {
    const p = getPlan();
    if (!p) return;
    if (!validatePriority()) return;
    const name = gv("target-name").trim(),
      action = gv("target-action").trim();
    if (!name || !action) {
      document.getElementById("form-warning").textContent =
        "Add a specific target and a next action.";
      return;
    }
    const row = {
      id: editingTarget >= 0 ? p.targets[editingTarget].id || freshPlanId("target") : freshPlanId("target"),
      name,
      action,
      kind: gv("target-kind"),
      status: gv("target-status"),
      question: gv("target-question").trim(),
      backup: gv("target-backup").trim(),
      source: gv("target-link").trim(),
      roleId: gv("target-role-id").trim(),
    };
    if (editingTarget >= 0) p.targets[editingTarget] = row;
    else if (p.targets.length < 3) p.targets.push(row);
    else {
      notify("Limit to three active targets for a focused field plan.");
      return;
    }
    clearWorksheetDraftFor(target,worksheetScope("targets"));
    resumeTargetId = null;
    editingTarget = -1;
    currentGuideScratch().target = {};
    p.tasks.targets = true;
    refresh();
    notify(
      storageAvailable
        ? "Priority saved to this conference."
        : "Priority is in memory only. Copy or print before leaving.",
    );
    return;
  }
  if (d.editTarget !== undefined) {
    resumeTargetId = null;
    editingTarget = Number(d.editTarget);
    render();
    return;
  }
  if (d.removeTarget !== undefined) {
    const p = getPlan();
    p.targets.splice(Number(d.removeTarget), 1);
    editingTarget = -1;
    refresh();
    return;
  }
  if (d.cancelTarget !== undefined) {
    resumeTargetId = null;
    editingTarget = -1;
    render();
    return;
  }
  if (d.saveDecision) {
    const p = getPlan();
    p.decision = {
      goal: gv("decision-goal").trim(),
      fit: gv("decision-fit").trim(),
      status: gv("decision-status"),
      alternative: gv("decision-alt").trim(),
      next: gv("decision-next").trim(),
    };
    p.tasks.decision = Boolean(p.decision.next);
    clearWorksheetDraftFor(target,"decision");
    refresh();
    notifySaved("Decision saved.");
    return;
  }
  if (d.saveDaychoice) {
    const p = getPlan();
    p.dayChoice = {
      current: gv("day-current").trim(),
      alternative: gv("day-alternative").trim(),
      choice: gv("day-choice"),
      next: gv("day-next").trim(),
    };
    p.tasks.daychoice = Boolean(p.dayChoice.next);
    clearWorksheetDraftFor(target,"daychoice");
    refresh();
    notifySaved("Choice saved.");
    return;
  }
  if (d.saveStory) {
    const p = getPlan();
    p.story = Object.fromEntries(
      ["context", "contribution", "result", "question"].map((k) => [
        k,
        gv("story-" + k).trim(),
      ]),
    );
    p.tasks.story = Boolean(p.story.context && p.story.contribution);
    clearWorksheetDraftFor(target,"story");
    refresh();
    notifySaved("Story saved.");
    return;
  }
  if (d.saveBudget) {
    if (!validateBudget()) return;
    const p = getPlan();
    p.budget = {...p.budget, ...Object.fromEntries(BUDGET_FIELDS.map(([k]) => [k, collectNumber(k)]))};
    currentGuideScratch().budget = {};
    p.tasks.budget = true;
    clearWorksheetDraftFor(target,"budget");
    refresh();
    notify(
      storageAvailable
        ? "Budget saved."
        : "Budget is in memory only. Copy or print before leaving.",
    );
    return;
  }
  if (d.saveExperience) { return; }
  if (d.saveNote) { return; }
  if (d.toggleNote !== undefined) {
    const p = getPlan(),
      x = p.notes[Number(d.toggleNote)];
    if (x) { x.done = !x.done; x.status=x.done ? "Completed" : "To do"; }
    refresh();
    return;
  }
  if (d.removeNote !== undefined) {
    const p = getPlan();
    p.notes.splice(Number(d.removeNote), 1);
    refresh();
    return;
  }
  if (d.saveInsight) { return; }
  if (d.saveTemplate) {
    const p = getPlan();
    if (!p) {
      notify(
        "Choose a conference in My Conference before saving a template. You can still copy the draft.",
      );
      return;
    }
    p.drafts[d.saveTemplate] = gv("template-editor");
    clearWorksheetDraftFor(target,"template:"+d.saveTemplate);
    refresh();
    notifySaved("Draft saved in this browser.");
    return;
  }
  if (d.copyTemplate !== undefined) {
    copyText(gv("template-editor"));
    return;
  }
  if (d.copyPlan !== undefined) {
    const p = getPlan();
    if (p) copyText(fieldPlanText(p));
    return;
  }
  if (d.copyText !== undefined) {
    copyText(d.copyText);
    return;
  }
  if (d.review !== undefined) {
    const p = getPlan();
    if (!p) return;
    const messages = reviewPlan(p);
    const box = document.createElement("div");
    box.className = "assistbox";
    box.style.marginTop = "14px";
    box.innerHTML =
      '<strong class="small">Rules-based checklist review (not AI)</strong><ul>' +
      messages.map((x) => "<li>" + esc(x) + "</li>").join("") +
      '</ul><div class="fineprint">These are generic gap checks, not current availability verification.</div>';
    target.closest(".linkrow")?.insertAdjacentElement("afterend", box);
    target.disabled = true;
    return;
  }
  if (d.print !== undefined) {
    window.print();
    return;
  }
}
function delegatedChange(ev) {
  keepWorksheetDraft(ev.target);
  if (ev.target.id==="backup-file") { handleBackupFile(ev.target); return; }
  const t = ev.target,
    p = getPlan();
  if (t.closest("[data-guide-tool=target]"))
    currentGuideScratch().target = collectTargetDraft();
  if (t.id === "switch-event") {
    switchPlan(t.value);
    return;
  }
  if (t.dataset.printPref !== undefined && p) {
    p.printPreferences = {
      ...defaultPrintPreferences(),
      ...p.printPreferences,
      [t.dataset.printPref]: t.checked,
    };
    save();
    render();
    return;
  }
  if (t.dataset.access !== undefined && p) {
    p.access[t.dataset.access] = t.value;
    save();
    return;
  }
  if (t.dataset.taskCheck !== undefined && p) {
    p.tasks[t.dataset.taskCheck] = t.checked;
    save();
    render();
    return;
  }
  if (t.dataset.planGoal !== undefined && p) {
    p.goal = t.value;
    save();
    render();
    return;
  }
}
function updateBudgetTotals() {
  if (!document.getElementById("budget-total") || !document.getElementById("budget-registration")) return;
  const b=Object.fromEntries(BUDGET_FIELDS.map(([k])=>[k,collectNumber(k)])), q=budgetCalc(b), currency=getPlan()?.currency || "USD";
  for(const [id,value] of [["budget-total",q.total],["budget-net",q.net],["budget-upfront",q.upfront]]) {
    const out=document.getElementById(id); if(out) out.textContent=fmt(value,currency);
  }
  const pending=document.getElementById("budget-pending-summary");
  if(pending) pending.textContent=fmt(q.pending,currency)+" pending · Not subtracted";
}
function delegatedInput(ev) {
  keepWorksheetDraft(ev.target);
  if(ev.target.id?.startsWith("budget-")) updateBudgetTotals();
}

window.addEventListener("beforeprint", () => {
  document.querySelectorAll(".guide-details").forEach((x) => {
    x.dataset.wasOpen = x.open ? "1" : "0";
    x.open = true;
  });
});
window.addEventListener("afterprint", () => {
  document.querySelectorAll(".guide-details").forEach((x) => {
    if (x.dataset.wasOpen === "0") x.open = false;
    delete x.dataset.wasOpen;
  });
});
window.addEventListener("hashchange", () => {
  PlaybookAssistant.onNavigate();
  render();
  document.getElementById("main").focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
document.addEventListener("click", delegatedClick);
document.addEventListener("change", delegatedChange);
document.addEventListener("input", delegatedInput);
initializePlannerTasks();
render();
