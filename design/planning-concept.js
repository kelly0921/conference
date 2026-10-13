"use strict";
// Isolated design preview. No app storage, model call, or user plan is read.
const previewDate = Date.UTC(2026, 9, 13);
const day = 86400000;
const phases = {
  before: ["Your preparation checklist", "Start with a worthwhile outcome, a realistic budget and one priority."],
  week: ["Your final-week checklist", "Recheck changing details and leave some space in your day."],
  during: ["Your at-event checklist", "Use the plan as a guide. Adjust it when the day changes."],
  after: ["Your after-conference checklist", "Keep real promises and turn one insight into a useful next step."]
};
const tasks = [
  {id:"decision", phases:["before"], title:"Decide what would make this worthwhile", text:"Name one useful outcome and compare a realistic alternative.", guide:"worth", link:"Read the decision guide"},
  {id:"funding", phases:["before"], title:"Know what you can pay upfront", text:"Separate confirmed support, pending funding and later reimbursement.", guide:"funding", link:"Use the funding guide"},
  {id:"priority", phases:["before","week"], title:"Choose one priority and a backup", text:"Use a current public source; write your first action and a useful question.", guide:"prioritize", link:"Use the priority guide"},
  {id:"access", phases:["before","week"], title:"Check registration and activity access", text:"Record what is confirmed, pending or still needs checking.", guide:"prepare", link:"Read the access guide"},
  {id:"story", phases:["before","week"], title:"Prepare one real story and question", text:"Use a true example of your contribution and an answerable question.", guide:"conversations", link:"Read the conversation guide"},
  {id:"introduction", phases:["before"], title:"Prepare a specific introduction", text:"Offer genuine context, a small request and an easy way to decline.", guide:"conversations", link:"Read the conversation guide", goals:["community","recruiting","project"]},
  {id:"learning", phases:["before"], title:"Find a useful session or community", text:"Check the actual program, access and one alternative.", guide:"explore", link:"Read the learning & community guide", goals:["learning","community"]},
  {id:"applications", phases:["before","week"], title:"Check the actual role and application route", text:"A talent profile or badge scan is not an application or an interview.", guide:"prepare", link:"Read the access guide", goals:["recruiting"]},
  {id:"project", phases:["before"], title:"Prepare a bounded project conversation", text:"Choose one true decision or trade-off to discuss and one useful question.", guide:"conversations", link:"Read the conversation guide", goals:["project"]},
  {id:"schedule", phases:["week","during"], title:"Keep fixed commitments and flexible options", text:"Record local dates, timezone, room, source and travel/reset buffers.", guide:"time", link:"Use the time guide"},
  {id:"travel", phases:["week"], title:"Check the journey and your buffers", text:"Review travel, venue access and space to pause between activities.", guide:"time", link:"Read the time guide", travel:true},
  {id:"online", phases:["before","week","during"], title:"Check online access and the event timezone", text:"Verify the organizer’s join instructions and which sessions your pass includes.", guide:"prepare", link:"Read the access guide", online:true},
  {id:"daychoice", phases:["during"], title:"Choose one worthwhile next move", text:"Use your actual access and energy; keep a realistic alternative.", guide:"time", link:"Read the time guide"},
  {id:"notes", phases:["during"], title:"Capture useful context and real promises", text:"Record a next action only when it is appropriate and within your control.", guide:"followup", link:"Read the follow-up guide"},
  {id:"explore", phases:["during"], title:"Make room for learning or community", text:"A session, conversation or break can be a useful outcome too.", guide:"explore", link:"Read the learning & community guide"},
  {id:"followup", phases:["after"], title:"Follow through on an appropriate next action", text:"Use the context you actually shared; track your action separately from their reply.", guide:"followup", link:"Use the follow-up guide"},
  {id:"debrief", phases:["after"], title:"Turn one insight into a practical experiment", text:"Choose an action or deliberate no-action, then a date to review the outcome.", guide:"learning", link:"Read the learning guide"},
  {id:"recap", phases:["after"], title:"Decide whether a public recap is useful", text:"Public posting is optional. Share only what you can accurately describe.", guide:"learning", link:"Read the learning guide", optional:true}
];
let phase = "before";
const state = new Map([["decision", "done"]]);
const byId = id => document.getElementById(id);
function localDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [y,m,d] = value.split("-").map(Number);
  return Date.UTC(y,m-1,d);
}
function dateLabel(value) {
  const ms = localDate(value);
  return Number.isFinite(ms) ? new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(ms) : "Date needed";
}
function applicable(t) {
  return t.phases.includes(phase) && (!t.goals || t.goals.includes(byId("goal").value)) && (!t.travel || byId("format").value !== "online") && (!t.online || byId("format").value !== "in-person");
}
function renderTasks() {
  const shown = tasks.filter(applicable);
  byId("task-list").replaceChildren();
  for (const task of shown) {
    const status = state.get(task.id) || "todo";
    const row = document.createElement("div"); row.className = "task " + (status === "todo" ? "" : status);
    const checkLabel = document.createElement("label"); checkLabel.className = "check-wrap";
    const check = document.createElement("input"); check.type = "checkbox"; check.id = "check-" + task.id;
    check.checked = status === "done"; check.disabled = status === "skipped";
    check.setAttribute("aria-label", "Mark " + task.title + " prepared");
    check.addEventListener("change", () => {state.set(task.id, check.checked ? "done" : "todo");renderTasks();byId(check.id)?.focus();});
    checkLabel.append(check);
    const body = document.createElement("div"); body.className = "task-body";
    const title = document.createElement("label"); title.className = "task-title";title.htmlFor = check.id;title.textContent = task.title;
    const badge = document.createElement("span");badge.className = "task-state";badge.textContent = status === "done" ? "Prepared by you" : status === "skipped" ? "Not needed" : task.optional ? "Optional" : "";
    title.append(badge);
    const explanation = document.createElement("p"); explanation.textContent = task.text;
    const link = document.createElement("a");link.className = "task-link";link.href = "../#/guide/" + task.guide;link.target = "_blank";link.rel = "noopener";link.textContent = task.link + " ↗";
    body.append(title, explanation, link);
    const skip = document.createElement("button");skip.type = "button";skip.className = "task-skip";skip.id = "skip-" + task.id;
    skip.textContent = status === "skipped" ? "Include again" : "Not needed";
    skip.setAttribute("aria-label", (status === "skipped" ? "Include " : "Mark ") + task.title + (status === "skipped" ? " again" : " not needed"));
    skip.addEventListener("click", () => {state.set(task.id, status === "skipped" ? "todo" : "skipped");renderTasks();byId(skip.id)?.focus();});
    row.append(checkLabel,body,skip);byId("task-list").append(row);
  }
  const active = shown.filter(t => state.get(t.id) !== "skipped");
  const done = active.filter(t => state.get(t.id) === "done").length;
  byId("progress-text").textContent = `${done} of ${active.length} prepared`;
  byId("progress").max = Math.max(1,active.length);byId("progress").value = done;
  byId("empty-note").hidden = shown.length > 0;
  byId("checklist-title").textContent = phases[phase][0];byId("phase-note").textContent = phases[phase][1];
}
function renderProfile() {
  const start = localDate(byId("start").value), end = localDate(byId("end").value);
  const valid = Number.isFinite(start) && Number.isFinite(end) && end >= start;
  byId("profile-title").textContent = byId("name").value.trim() || "Your next conference";
  byId("profile-error").textContent = valid ? "" : "Choose both dates. The end date must be on or after the start date.";
  const length = valid ? Math.round((end-start)/day)+1 : 0;
  byId("profile-dates").textContent = valid ? `${dateLabel(byId("start").value)} – ${dateLabel(byId("end").value)} · ${length} ${length === 1 ? "day" : "days"}` : "Dates need checking";
  byId("profile-place").textContent = `${byId("format").value === "online" ? "Online" : byId("place").value.trim() || "Location needed"} · ${byId("timezone").value.trim() || "Timezone needed"} · ${byId("currency").value}`;
  let timing = "Dates need checking";
  if (valid) {
    const until = Math.round((start-previewDate)/day);
    timing = until > 0 ? `${until} days to go` : previewDate <= end ? "At event through " + dateLabel(byId("end").value) : "Time to reflect and follow through";
  }
  byId("timing").textContent = timing;
}
for (const button of document.querySelectorAll("[data-phase]")) button.addEventListener("click", () => {
  phase = button.dataset.phase;
  document.querySelectorAll("[data-phase]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  renderTasks();
});
for (const id of ["name","start","end","timezone","place","currency","official","format","goal"]) byId(id).addEventListener("input", () => {renderProfile();renderTasks();});
byId("reset-checks").addEventListener("click", () => {state.clear();renderTasks();});
renderProfile();renderTasks();
