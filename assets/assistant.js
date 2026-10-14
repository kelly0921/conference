"use strict";
var PlaybookAssistant = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/assistant-client.js
  var assistant_client_exports = {};
  __export(assistant_client_exports, {
    afterRender: () => afterRender,
    buildInput: () => buildInput,
    example: () => example,
    handleClick: () => handleClick,
    invalidate: () => invalidate,
    onNavigate: () => onNavigate,
    renderEntry: () => renderEntry,
    renderWorkspace: () => renderWorkspace,
    stageSuggestion: () => stageSuggestion
  });

  // src/assistant-contract.ts
  var guideIds = ["worth", "funding", "prepare", "prioritize", "time", "conversations", "explore", "followup", "learning"];
  var worksheetFields = {
    targets: ["target-name", "target-action", "target-backup", "target-question", "target-link"],
    decision: ["decision-goal", "decision-fit", "decision-alt", "decision-next"],
    experience: ["experience-name", "experience-purpose", "experience-question", "experience-action", "experience-backup", "experience-source"],
    learning: ["insight-goal", "insight-use", "insight-action"]
  };
  var contextIds = ["profile", "priorities", "schedule", "budget", "learning", "notes"];
  var record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function exact(v, keys) {
    if (Object.keys(v).some((k) => !keys.includes(k)) || keys.some((k) => !(k in v))) throw Error("Unexpected fields.");
  }
  function string(v, max, required = false) {
    if (typeof v !== "string" || v.length > max || required && !v.trim()) throw Error("Text is missing or too long.");
    return v.trim();
  }
  function publicURL(raw) {
    try {
      const u = new URL(raw);
      if (!["https:", "http:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) return "";
      return u.href;
    } catch {
      return "";
    }
  }
  function redact(text2) {
    return text2.replace(/https?:\/\/[^\s<>"']+/gi, (url) => publicURL(url) || "[private link removed]").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]").replace(/\b(?:sk|ghp|gho|github_pat)[-_][a-zA-Z0-9_-]{12,}\b/g, "[secret removed]").replace(/(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]\d{3}[ .-]\d{4}\b/g, "[phone removed]");
  }
  function validateInput(raw) {
    if (!record(raw)) throw Error("Invalid request.");
    exact(raw, ["version", "mode", "goal", "constraints", "agenda", "context"]);
    if (raw.version !== 1 || !["plan", "review"].includes(String(raw.mode)) || !Array.isArray(raw.context) || raw.context.length > 6) throw Error("Invalid request.");
    const seen = /* @__PURE__ */ new Set();
    const context = raw.context.map((c) => {
      if (!record(c)) throw Error("Invalid context.");
      exact(c, ["id", "label", "text"]);
      const id = string(c.id, 20, true);
      if (!contextIds.includes(id) || seen.has(id)) throw Error("Invalid context.");
      seen.add(id);
      return { id, label: string(c.label, 80, true), text: string(c.text, 4e3) };
    });
    if (!seen.has("profile")) throw Error("Conference context is required.");
    return { version: 1, mode: raw.mode, goal: string(raw.goal, 600, true), constraints: string(raw.constraints, 2e3), agenda: string(raw.agenda, 8e3), context };
  }
  function allowedSources(input) {
    const urls = (JSON.stringify(input).match(/https?:\/\/[^\s<>"\\]+/gi) || []).map(publicURL).filter(Boolean);
    return new Set(urls);
  }
  function validateResult(raw, input) {
    if (!record(raw)) throw Error("The response could not be checked.");
    exact(raw, ["summary", "suggestions", "questions"]);
    if (!Array.isArray(raw.suggestions) || raw.suggestions.length < 1 || raw.suggestions.length > 4 || !Array.isArray(raw.questions) || raw.questions.length > 4) throw Error("Invalid suggestions.");
    const evidence = /* @__PURE__ */ new Set(["goal", "constraints", "agenda", ...input.context.map((c) => c.id)]), sources = allowedSources(input);
    const suggestions = raw.suggestions.map((s) => {
      if (!record(s)) throw Error("Invalid suggestion.");
      exact(s, ["title", "action", "why", "uncertainty", "guideId", "evidenceIds", "worksheet", "fields"]);
      const worksheet = string(s.worksheet, 30);
      if (!Object.hasOwn(worksheetFields, worksheet) || !guideIds.includes(s.guideId) || !Array.isArray(s.fields) || !s.fields.length || s.fields.length > 6 || !Array.isArray(s.evidenceIds) || !s.evidenceIds.length || s.evidenceIds.length > 6 || s.evidenceIds.some((id) => !evidence.has(String(id)))) throw Error("Unsupported suggestion.");
      const seen = /* @__PURE__ */ new Set();
      const fields = s.fields.map((f) => {
        if (!record(f)) throw Error("Invalid draft.");
        exact(f, ["key", "value"]);
        const key2 = string(f.key, 40, true), value = string(f.value, key2 === "target-name" ? 140 : 2e3);
        if (!worksheetFields[worksheet].includes(key2) || seen.has(key2)) throw Error("Unsupported worksheet field.");
        seen.add(key2);
        if (["target-link", "experience-source"].includes(key2) && value && !sources.has(publicURL(value))) throw Error("Unprovided source URL.");
        return { key: key2, value };
      });
      if (worksheet === "targets" && ["target-name", "target-action"].some((k) => !fields.find((f) => f.key === k)?.value)) throw Error("Incomplete priority.");
      return { title: string(s.title, 140, true), action: string(s.action, 1200, true), why: string(s.why, 1200, true), uncertainty: string(s.uncertainty, 1200, true), guideId: String(s.guideId), evidenceIds: s.evidenceIds.map(String), worksheet, fields };
    });
    return { summary: string(raw.summary, 1600, true), suggestions, questions: raw.questions.map((q) => string(q, 600, true)) };
  }
  var text = { type: "string" };
  var fieldSchema = { type: "object", additionalProperties: false, required: ["key", "value"], properties: {
    key: { type: "string", enum: [...new Set(Object.values(worksheetFields).flat())] },
    value: text
  } };
  var suggestionSchema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "action", "why", "uncertainty", "guideId", "evidenceIds", "worksheet", "fields"],
    properties: {
      title: text,
      action: text,
      why: text,
      uncertainty: text,
      guideId: { type: "string", enum: guideIds },
      evidenceIds: { type: "array", minItems: 1, maxItems: 6, items: text },
      worksheet: { type: "string", enum: Object.keys(worksheetFields) },
      fields: { type: "array", minItems: 1, maxItems: 6, items: fieldSchema }
    }
  };

  // src/assistant-client.js
  var sessions = /* @__PURE__ */ new Map();
  var availability = null;
  var availabilityPending = false;
  var labels = { profile: "Conference profile", priorities: "Saved priorities", schedule: "Saved schedule", budget: "Budget totals", learning: "Saved learning", notes: "Commitment summaries", goal: "Your goal", constraints: "Your limits", agenda: "Agenda details" };
  var worksheetNames = { targets: "Priority", decision: "Attendance decision", experience: "Learning & community", learning: "Next action" };
  var fieldLabels = { "target-name": "Priority", "target-action": "First action", "target-backup": "Backup", "target-question": "Question", "target-link": "Source", "decision-goal": "Outcome", "decision-fit": "Opportunity", "decision-alt": "Alternative", "decision-next": "Next action", "experience-name": "Activity", "experience-purpose": "Purpose", "experience-question": "Question", "experience-action": "Next action", "experience-backup": "Alternative", "experience-source": "Source", "insight-goal": "Goal", "insight-use": "Where to apply it", "insight-action": "Next action" };
  var key = (p, mode) => p.id + ":" + mode;
  var stateFor = (p, mode) => {
    const k = key(p, mode);
    if (!sessions.has(k)) sessions.set(k, {});
    return sessions.get(k);
  };
  var safe = (v, max = 4e3) => redact(String(v || "")).slice(0, max);
  function contextText(p, id) {
    if (id === "profile") return JSON.stringify({ name: p.name, dates: [p.date, p.end], timezone: zoneLabel(p.timezone), format: p.format, location: p.location, organizer: publicURL(p.organizerUrl || ""), goal: p.goal });
    if (id === "priorities") return JSON.stringify(p.targets.slice(0, 12).map((t) => ({ name: t.name, action: t.action, backup: t.backup, status: t.status, source: publicURL(t.source || "") })));
    if (id === "schedule") return JSON.stringify(p.activities.slice(0, 18).map((a) => ({ label: a.label, date: a.date, start: a.start, end: a.end, timezone: zoneLabel(a.timezone), venue: a.venue, status: a.status, fixed: a.fixed, buffer: a.buffer })));
    if (id === "budget") return JSON.stringify({ currency: p.currency, ...Object.fromEntries(["registration", "travel", "lodging", "local", "food", "buffer", "direct", "reimbursement", "pending"].map((k) => [k, p.budget?.[k] ?? ""])) });
    if (id === "learning") return JSON.stringify({ learning: p.insight?.learning, action: p.insight?.action });
    if (id === "notes") return JSON.stringify(p.notes.slice(0, 10).map((n) => ({ action: n.action, status: n.status, response: n.response, due: n.due })));
    return "";
  }
  function buildInput(p, mode, values) {
    const context = [{ id: "profile", label: labels.profile, text: safe(contextText(p, "profile")) }];
    for (const id of ["priorities", "schedule", "budget", "learning", "notes"]) if (values["ai-share-" + id]) context.push({ id, label: labels[id], text: safe(contextText(p, id)) });
    return validateInput({ version: 1, mode: mode === "review" ? "review" : "plan", goal: safe(values["ai-goal"], 600), constraints: safe(values["ai-constraints"], 2e3), agenda: safe(values["ai-agenda"], 8e3), context });
  }
  function valuesFromForm() {
    const values = {};
    document.querySelectorAll("#assistant-input input[id],#assistant-input textarea[id]").forEach((f) => values[f.id] = f.type === "checkbox" ? f.checked : f.value);
    return values;
  }
  function renderEntry() {
    return `<section class="assistant-entry no-print" aria-label="AI planning help"><div><span class="section-caption">A second perspective</span><h2>Make room for what matters.</h2><p>Turn your goal into a focused plan, or look for gaps in the plan you\u2019ve saved.</p></div><div class="linkrow"><a class="btn primary" href="#/assistant/plan">Help me plan</a><a class="btn" href="#/assistant/review">Review my plan</a></div></section>`;
  }
  function renderWorkspace(p, requested) {
    if (!p) return renderSetup();
    const mode = requested === "review" ? "review" : "plan", s = stateFor(p, mode);
    return `<section class="assistant-workspace"><a class="plainlink" href="#/conference">\u2190 My Conference</a><div class="section-caption">Optional AI planning \xB7 ${esc(p.name)}</div><h1>${mode === "review" ? "Review my plan" : "Help me plan"}</h1><p class="lead">${mode === "review" ? "Find the gaps, see the tradeoffs, and choose what to adjust." : "Choose one worthwhile priority, a realistic backup, and your next action."}</p><div class="linkrow assistant-modes"><a class="btn ${mode === "plan" ? "primary" : ""}" href="#/assistant/plan" ${mode === "plan" ? 'aria-current="page"' : ""}>Help me plan</a><a class="btn ${mode === "review" ? "primary" : ""}" href="#/assistant/review" ${mode === "review" ? 'aria-current="page"' : ""}>Review my plan</a></div>
    <p id="ai-availability" class="helper" role="status">Checking live AI availability\u2026</p>
    <div class="assistant-columns"><section class="assistant-input" id="assistant-input" ${draftAttributes(p, "assistant:" + mode)}><h2>Your direction</h2><p class="helper save-state" role="status">${storageAvailable ? "Inputs are kept as a draft in this browser." : "Browser storage is unavailable. Copy your input before leaving."}</p><div class="formrow"><label for="ai-goal">What would make this conference worthwhile? *</label><textarea id="ai-goal" rows="2" maxlength="600" required>${esc(p.goal || "")}</textarea></div><div class="formrow"><label for="ai-constraints">Time, budget or other limits (optional)</label><textarea id="ai-constraints" rows="3" maxlength="2000" placeholder="I have one afternoon and want to leave time for a break."></textarea></div><div class="formrow"><label for="ai-agenda">Relevant agenda or opportunity details (optional)</label><textarea id="ai-agenda" rows="5" maxlength="8000" placeholder="Paste a few sessions, opportunities or public links. Sources are not opened or verified."></textarea></div><fieldset class="assistant-sharing"><legend>Also include from my saved plan</legend><p class="helper">Conference profile is included. Additional sections are your choice.</p>${["priorities", "schedule", "budget", "learning", "notes"].map((id) => `<label><input id="ai-share-${id}" type="checkbox" ${id === "priorities" ? "checked" : ""}> ${esc(labels[id])}</label>`).join("")}</fieldset><p class="helper">Contact channels, private confirmation references, funding-source details and full templates are excluded. Automatic removal catches some emails, phone numbers, secrets and private links; review the preview for anything else you want to remove.</p><button class="btn primary" data-ai-preview="1">Preview what will be sent \u2192</button></section>
    <section class="assistant-preview" aria-labelledby="ai-preview-heading"><h2 id="ai-preview-heading">You control what you share</h2><p>Only the displayed details are sent when you choose to ask AI. Suggestions stay in this session until you open one as a worksheet draft.</p><p class="helper">OpenAI processes the request. We don\u2019t save your request on our server. OpenAI may retain abuse-monitoring logs for up to 30 days under its standard API policy. <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">Data policy \u2197</a></p><div id="ai-preview">${s.prepared ? previewHTML(s.prepared) : '<p class="helper">Fill in your direction, then preview the exact details.</p>'}</div><p id="ai-message" class="error" role="alert"></p><div class="linkrow"><button class="btn" data-ai-example="1">See a fictional example</button></div></section></div><section id="ai-results" class="assistant-results" aria-label="Planning suggestions" tabindex="-1" ${s.pending ? 'aria-busy="true"' : ""}>${s.result ? resultsHTML(s) : ""}</section></section>`;
  }
  function previewHTML(input) {
    return `<div class="ai-payload"><p class="section-caption">${input.mode === "review" ? "Review my plan" : "Help me plan"} \xB7 Exact request details</p><dl><dt>Goal</dt><dd>${esc(input.goal)}</dd><dt>Constraints</dt><dd>${esc(input.constraints || "None supplied")}</dd><dt>Agenda</dt><dd>${esc(input.agenda || "None supplied")}</dd>${input.context.map((c) => `<dt>${esc(c.label)}</dt><dd>${esc(c.text)}</dd>`).join("")}</dl></div><label class="ai-consent"><input type="checkbox" id="ai-consent" data-draft-exclude="1"> I approve sending these displayed details to OpenAI.</label><div class="linkrow"><button class="btn primary" id="ai-send" data-ai-send="1">Ask AI for suggestions</button><button class="btn" data-ai-cancel="1" hidden>Cancel request</button></div><p class="helper">Up to six attempts per hour per visitor, with a shared daily limit. Requests are never retried automatically.</p>`;
  }
  function resultsHTML(s) {
    return `<div class="assistant-results-heading"><span class="section-caption">${s.example ? "Fictional example \xB7 no AI request was made" : "AI suggestions \xB7 check before using"}</span><h2>A little focus goes a long way.</h2><p>${esc(s.result.summary)}</p><p class="helper">${s.example ? "This shows the experience with an invented event. These example suggestions cannot be added to your real plan." : "AI can be wrong. Dates, eligibility, funding and access still need confirmation from official sources. These suggestions do not change your saved plan."}</p></div>${s.result.suggestions.map((x, i) => `<article class="assistant-card"><span class="section-caption">${String(i + 1).padStart(2, "0")} \xB7 ${esc(worksheetNames[x.worksheet])}</span><h3>${esc(x.title)}</h3><p class="ai-action">${esc(x.action)}</p><dl><dt>Why this fits</dt><dd>${esc(x.why)}</dd><dt>Needs checking</dt><dd>${esc(x.uncertainty)}</dd></dl><p class="helper">Based on: ${x.evidenceIds.map((id) => esc(labels[id] || id)).join(", ")}.</p><details><summary>Proposed worksheet draft</summary><dl>${x.fields.map((f) => `<dt>${esc(fieldLabels[f.key])}</dt><dd>${esc(f.value)}</dd>`).join("")}</dl></details><div class="linkrow">${s.example ? "" : `<button class="btn primary" data-ai-use="${i}">Use in worksheet \u2192</button>`}<a class="plainlink" href="#/guide/${x.guideId}">${esc(GUIDE_BY_ID[x.guideId].title)} \u2192</a></div></article>`).join("")}${s.result.questions.length ? `<div class="assistant-questions"><h3>Before you commit</h3><ul>${s.result.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : ""}`;
  }
  function showAvailability() {
    const out = document.getElementById("ai-availability");
    if (!out) return;
    out.textContent = availability === true ? "Live AI is available. Preview your details before sending." : availability === false ? "Live AI is not enabled here yet. You can explore the fictional example and keep using your saved planner." : "Checking live AI availability\u2026";
  }
  function afterRender() {
    if (!document.getElementById("assistant-input")) return;
    showAvailability();
    if (availability === null && !availabilityPending && typeof fetch === "function") {
      availabilityPending = true;
      fetch("/api/assistant", { cache: "no-store", signal: AbortSignal.timeout(8e3) }).then((r) => r.ok ? r.json() : null).then((r) => {
        availability = r?.available === true;
        showAvailability();
      }).catch(() => {
        availability = false;
        showAvailability();
      }).finally(() => {
        availabilityPending = false;
      });
    }
  }
  function message(text2) {
    const out = document.getElementById("ai-message");
    if (out) out.textContent = text2;
  }
  function current() {
    const r = routeHash(), p = getPlan();
    if (r[0] !== "assistant" || !p) return null;
    const mode = r[1] === "review" ? "review" : "plan";
    return { p, mode, s: stateFor(p, mode) };
  }
  function invalidate() {
    const c = current();
    if (!c) return;
    c.s.prepared = null;
    const consent = document.getElementById("ai-consent");
    if (consent) consent.checked = false;
    message("");
    const out = document.getElementById("ai-preview");
    if (out) out.innerHTML = '<p class="helper">Details changed. Preview again before sending.</p>';
  }
  function stageSuggestion(p, suggestion) {
    const scope = suggestion.worksheet === "targets" ? "targets:new" : suggestion.worksheet;
    if (p.worksheetDrafts?.[scope]) return { ok: false, scope };
    const values = Object.fromEntries(suggestion.fields.map((f) => [f.key, f.value]));
    if (suggestion.worksheet === "targets") {
      values["target-status"] = "Needs checking";
      values["target-kind"] = p.goal === "Recruiting / career" ? "Role or employer" : p.goal === "People / community" ? "Community or person" : p.goal === "Build / share a project" ? "Project or contribution" : "Session or workshop";
    }
    if (suggestion.worksheet === "experience") values["experience-access"] = "Needs checking";
    const stored = recordWorksheetDraft(p.id, scope, values);
    return { ok: true, scope, stored };
  }
  async function send(c) {
    if (c.s.pending) return;
    let fresh;
    try {
      fresh = buildInput(c.p, c.mode, valuesFromForm());
    } catch (error) {
      message(error.message);
      return;
    }
    if (!c.s.prepared || JSON.stringify(fresh) !== JSON.stringify(c.s.prepared)) {
      invalidate();
      message("Preview your current details before sending.");
      return;
    }
    if (!document.getElementById("ai-consent")?.checked) {
      message("Approve the displayed details before sending.");
      document.getElementById("ai-consent")?.focus();
      return;
    }
    if (availability !== true) {
      message("Live AI is unavailable here. Try the fictional example or continue in the planner.");
      return;
    }
    const input = c.s.prepared;
    c.s.pending = true;
    c.s.controller = new AbortController();
    const timer = setTimeout(() => c.s.controller.abort(), 3e4);
    document.getElementById("ai-consent").checked = false;
    c.s.result = null;
    const results = document.getElementById("ai-results");
    results.innerHTML = '<p role="status">Thinking through your priorities\u2026 Your saved plan is unchanged.</p>';
    results.setAttribute("aria-busy", "true");
    document.getElementById("ai-send").disabled = true;
    document.querySelector("[data-ai-cancel]").hidden = false;
    message("");
    document.querySelectorAll("#assistant-input input,#assistant-input textarea").forEach((f) => f.disabled = true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true, input }), signal: c.s.controller.signal });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "AI is unavailable. Try again later.");
      c.s.result = validateResult(body.result, input);
      c.s.example = false;
      c.s.usedInput = input;
      if (current()?.s === c.s) {
        results.innerHTML = resultsHTML(c.s);
        results.focus({ preventScroll: true });
        results.scrollIntoView?.({ block: "start", behavior: "auto" });
      }
    } catch (error) {
      if (current()?.s === c.s) {
        results.innerHTML = "";
        message(error.name === "AbortError" ? "Request cancelled or timed out. Your plan is unchanged." : error.message);
      }
    } finally {
      clearTimeout(timer);
      c.s.pending = false;
      if (current()?.s === c.s) {
        results.removeAttribute("aria-busy");
        document.querySelectorAll("#assistant-input input,#assistant-input textarea").forEach((f) => f.disabled = false);
        const b = document.getElementById("ai-send");
        if (b) b.disabled = false;
        const cancel = document.querySelector("[data-ai-cancel]");
        if (cancel) cancel.hidden = true;
      }
    }
  }
  function handleClick(button) {
    const d = button.dataset, c = current();
    if (!c) return false;
    if (d.aiPreview) {
      if (c.s.pending) {
        message("Wait for this request or cancel it first.");
        return true;
      }
      try {
        c.s.prepared = buildInput(c.p, c.mode, valuesFromForm());
        document.getElementById("ai-preview").innerHTML = previewHTML(c.s.prepared);
        message("");
      } catch (error) {
        message(error.message);
      }
      return true;
    }
    if (d.aiSend) {
      void send(c);
      return true;
    }
    if (d.aiCancel) {
      c.s.controller?.abort();
      return true;
    }
    if (d.aiExample) {
      if (c.s.pending) {
        message("Wait for this request or cancel it first.");
        return true;
      }
      c.s.result = example();
      c.s.example = true;
      message("");
      const results = document.getElementById("ai-results");
      results.innerHTML = resultsHTML(c.s);
      results.focus({ preventScroll: true });
      results.scrollIntoView?.({ block: "start", behavior: "auto" });
      return true;
    }
    if (d.aiUse !== void 0) {
      const suggestion = c.s.result?.suggestions[Number(d.aiUse)];
      if (!suggestion || c.s.example) return true;
      let latest;
      try {
        latest = buildInput(c.p, c.mode, valuesFromForm());
      } catch {
        message("Your details changed. Preview and ask again before using these suggestions.");
        return true;
      }
      if (JSON.stringify(latest) !== JSON.stringify(c.s.usedInput)) {
        message("Your details changed since this response. Ask again before using its suggestions.");
        return true;
      }
      const staged = stageSuggestion(c.p, suggestion);
      if (!staged.ok) {
        message("A draft already exists in this worksheet. Resume it from My Conference before adding another suggestion.");
        return true;
      }
      selectedTask = suggestion.worksheet;
      editingTarget = -1;
      resumeTargetId = null;
      editingProfile = false;
      navTo("conference");
      notify(staged.stored ? "AI suggestion opened as a draft. Review it, then save the worksheet." : "Draft is in memory only. Browser storage is unavailable; copy it before leaving.");
      return true;
    }
    return false;
  }
  function onNavigate() {
    for (const s of sessions.values()) if (s.pending) s.controller?.abort();
  }
  function example() {
    return { summary: "Fictional example: one afternoon at a developer conference, with learning as the main goal. Focus on one relevant session, keep a community conversation as a backup, and leave a break.", suggestions: [
      {
        title: "Find one session you can use afterward",
        action: "Compare the two session descriptions, choose the one closest to a problem you want to solve, and check its access requirements.",
        why: "With only one afternoon, a specific learning outcome is more useful than collecting several loosely related sessions.",
        uncertainty: "No session timetable or pass rules were supplied. This is a research task, not a confirmed booking.",
        guideId: "prioritize",
        evidenceIds: ["goal", "constraints"],
        worksheet: "targets",
        fields: [{ key: "target-name", value: "Research one relevant technical session" }, { key: "target-action", value: "Read the current session abstract and check access." }, { key: "target-backup", value: "A public community discussion, if accessible." }]
      },
      { title: "Protect time to reflect", action: "Leave a short break after your main session to record one idea and one question.", why: "A smaller plan leaves room to turn information into something you can try.", uncertainty: "Travel times and session duration still need checking before setting the break.", guideId: "time", evidenceIds: ["constraints"], worksheet: "learning", fields: [{ key: "insight-action", value: "After the session, capture one idea to try and one question to investigate." }] }
    ], questions: ["What is the actual session timetable?", "Which sessions does your pass include?"] };
  }
  if (typeof document !== "undefined") document.addEventListener("input", (event) => {
    if (event.target.closest?.("#assistant-input")) invalidate();
  });
  return __toCommonJS(assistant_client_exports);
})();
