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
    scheduleFromForm: () => scheduleFromForm,
    stageSuggestion: () => stageSuggestion
  });

  // src/assistant-grounding.ts
  var obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function keys(v, expected) {
    if (Object.keys(v).length !== expected.length || expected.some((k) => !Object.hasOwn(v, k))) throw Error("Unsupported schedule fields.");
  }
  function bounded(v, max) {
    if (typeof v !== "string" || v.length > max) throw Error("Invalid session text.");
    return v.trim();
  }
  function integer(v, max, min = 0) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) throw Error("Invalid activity or break limit.");
    return v;
  }
  var parts = (stamp, format) => Object.fromEntries(format.formatToParts(stamp).filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
  function localInstant(date, time, timezone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error("Use a complete date and a 24-hour time.");
    const [y, m, d] = date.split("-").map(Number), [h, min] = time.split(":").map(Number), naive = Date.UTC(y, m - 1, d, h, min);
    if (y < 2e3 || y > 2100 || new Date(naive).toISOString().slice(0, 10) !== date) throw Error("Invalid session date.");
    let format;
    try {
      format = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    } catch {
      throw Error("Use a valid event timezone.");
    }
    const offsets = /* @__PURE__ */ new Set();
    for (let delta = -36; delta <= 36; delta += 6) {
      const stamp = naive + delta * 36e5, p = parts(stamp, format);
      offsets.add(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - stamp);
    }
    const matches = [...offsets].map((offset) => naive - offset).filter((stamp) => {
      const p = parts(stamp, format);
      return p.year === y && p.month === m && p.day === d && p.hour === h && p.minute === min;
    });
    if (matches.length !== 1) throw Error(matches.length ? "This local time occurs twice during a clock change. Choose an unambiguous time before comparing it." : "This local time does not exist during a clock change. Check the organizer timetable.");
    return matches[0];
  }
  function interval(s) {
    const start = localInstant(s.date, s.start, s.timezone), end = localInstant(s.endDate, s.end, s.timezone);
    if (end <= start || end - start > 7 * 864e5) throw Error("The end must be after the start, within seven days. Use full dates for overnight sessions.");
    return [start, end];
  }
  function validateSchedule(raw) {
    if (raw === null) return null;
    if (!obj(raw)) throw Error("Invalid session details.");
    keys(raw, ["sessions", "availability", "breakMinutes", "maxActivities"]);
    if (!Array.isArray(raw.sessions) || raw.sessions.length < 1 || raw.sessions.length > 18) throw Error("Check between one and eighteen sessions.");
    function window(v) {
      if (!obj(v)) throw Error("Invalid time window.");
      const w = { date: bounded(v.date, 10), endDate: bounded(v.endDate, 10), start: bounded(v.start, 5), end: bounded(v.end, 5), timezone: bounded(v.timezone, 80) };
      interval(w);
      return w;
    }
    const seen = /* @__PURE__ */ new Set();
    const sessions2 = raw.sessions.map((v) => {
      if (!obj(v)) throw Error("Invalid session.");
      keys(v, ["id", "label", "date", "endDate", "start", "end", "timezone", "buffer", "source"]);
      const id = bounded(v.id, 32), label = bounded(v.label, 140), source = bounded(v.source, 500);
      if (!/^(?:session|saved):[1-9]\d*$/.test(id) || seen.has(id) || !label) throw Error("Invalid session identity.");
      seen.add(id);
      if (source) {
        const u = new URL(source);
        if (!["http:", "https:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw Error("Use a public source URL without private parameters.");
      }
      return { ...window(v), id, label, source, buffer: integer(v.buffer, 600) };
    });
    if (raw.availability !== null) {
      if (!obj(raw.availability)) throw Error("Invalid availability.");
      keys(raw.availability, ["date", "endDate", "start", "end", "timezone"]);
    }
    return { sessions: sessions2, availability: raw.availability === null ? null : window(raw.availability), breakMinutes: integer(raw.breakMinutes, 600), maxActivities: integer(raw.maxActivities, 18, 1) };
  }
  function parseSessionLines(text2, date, timezone) {
    const lines = text2.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 18) throw Error("Use at most eighteen session lines.");
    return lines.map((line, i) => {
      const c = line.split("|").map((s) => s.trim());
      if (c.length < 3 || c.length > 6) throw Error(`Line ${i + 1}: use Session | start | end, with optional timezone | public URL | buffer minutes.`);
      const stamp = (s) => {
        const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(s);
        return m ? [m[1], m[2]] : [date, s];
      };
      const [startDate, start] = stamp(c[1]), [endDate, end] = stamp(c[2]);
      return { id: "session:" + (i + 1), label: c[0], date: startDate, endDate, start, end, timezone: c[3] || timezone, source: c[4] || "", buffer: c[5] ? Number(c[5]) : 0 };
    });
  }
  function inspectSchedule(schedule) {
    const result = [], ranges = schedule.sessions.map(interval), window = schedule.availability ? interval(schedule.availability) : null;
    schedule.sessions.forEach((s, i) => {
      const [start, end] = ranges[i];
      if (window && (start < window[0] || end > window[1])) result.push({ kind: "outside", ids: [s.id] });
      for (let j = i + 1; j < ranges.length; j++) {
        const [otherStart, otherEnd] = ranges[j], other = schedule.sessions[j];
        if (start < otherEnd && otherStart < end) {
          result.push({ kind: "overlap", ids: [s.id, other.id] });
          continue;
        }
        const first = end <= otherStart ? s : other, second = first === s ? other : s;
        const gap = ((first === s ? otherStart : start) - (first === s ? end : otherEnd)) / 6e4;
        if (gap < Math.max(schedule.breakMinutes, first.buffer)) result.push({ kind: "buffer", ids: [first.id, second.id], minutes: gap });
      }
    });
    return result;
  }
  function findingText(f, schedule) {
    const name = (id) => schedule.sessions.find((s) => s.id === id).label;
    if (f.kind === "outside") return `${name(f.ids[0])} is outside your stated availability.`;
    if (f.kind === "overlap") return `${name(f.ids[0])} and ${name(f.ids[1])} overlap. Choose one if planning to attend in full.`;
    return `${name(f.ids[0])} \u2192 ${name(f.ids[1])}: ${f.minutes} minutes between sessions; less than the requested break or reset buffer. The sessions do not overlap.`;
  }
  function evidenceFor(input) {
    const list = [{ id: "goal", label: "Your goal", text: input.goal, kind: "supplied" }];
    for (const id of ["constraints", "agenda"]) if (input[id]) list.push({ id, label: id === "agenda" ? "Your agenda notes" : "Your limits", text: input[id], kind: "supplied" });
    for (const c of input.context) {
      if (c.id === "priorities") {
        try {
          const rows = JSON.parse(c.text);
          if (Array.isArray(rows)) {
            rows.forEach((v, i) => {
              if (obj(v)) list.push({ id: "priority:" + (i + 1), label: "Saved priority " + (i + 1), text: JSON.stringify(v), kind: "supplied" });
            });
            continue;
          }
        } catch {
        }
      }
      if (c.text && c.text !== "[]") list.push({ id: c.id, label: c.label, text: c.text, kind: "supplied" });
    }
    if (input.schedule) {
      for (const s of input.schedule.sessions) list.push({ id: s.id, label: s.label, text: JSON.stringify(s), kind: "supplied" });
      list.push({ id: "schedule-checks", label: "Calculated session checks", text: JSON.stringify({ findings: inspectSchedule(input.schedule), availability: input.schedule.availability, breakMinutes: input.schedule.breakMinutes, maxActivities: input.schedule.maxActivities }), kind: "calculated" });
    }
    return list;
  }
  function checkGroundedResult(result, input) {
    if (input.version < 2) return;
    const known = new Map(evidenceFor(input).map((e) => [e.id, e]));
    const ids = result.recommendedSessionIds || [];
    const identities = /* @__PURE__ */ new Map();
    const identity = (name, id) => {
      if (!identities.has(name)) identities.set(name, /* @__PURE__ */ new Set());
      identities.get(name).add(id);
    };
    for (const session of input.schedule?.sessions || []) identity(session.label, session.id);
    for (const e of known.values()) if (e.id.startsWith("priority:")) {
      const row = JSON.parse(e.text);
      if (typeof row.name === "string" && row.name.trim()) identity(row.name, e.id);
    }
    for (const s of result.suggestions) {
      if (!s.evidenceQuotes?.length || s.evidenceQuotes.length !== s.evidenceIds.length || new Set(s.evidenceIds).size !== s.evidenceIds.length) throw Error("Each reference needs supporting text.");
      for (const id of s.evidenceIds) {
        const e = known.get(id), q = s.evidenceQuotes.find((q2) => q2.id === id);
        if (!e || !q || !q.quote.trim() || !e.text.includes(q.quote) || q.quote.length < Math.min(8, e.text.length)) throw Error("The supporting text was not supplied.");
      }
      const named = [s.title, ...s.fields.filter((f) => ["target-name", "experience-name"].includes(f.key)).map((f) => f.value)];
      for (const text2 of named) {
        const spans = [];
        for (const [name, ids2] of identities) {
          if (name.length < 8) {
            if (text2.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").toLowerCase() === name.toLowerCase()) spans.push({ start: 0, end: text2.length, ids: ids2 });
            continue;
          }
          const expression = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
          for (const match of text2.matchAll(expression)) {
            const start = match.index, end = start + match[0].length;
            if (start && /[\p{L}\p{N}_]/u.test(text2[start - 1]) || end < text2.length && /[\p{L}\p{N}_]/u.test(text2[end])) continue;
            spans.push({ start, end, ids: ids2 });
          }
        }
        for (const span of spans) {
          if (spans.some((other) => other !== span && other.start <= span.start && other.end >= span.end && (other.start < span.start || other.end > span.end))) continue;
          if (!s.evidenceIds.some((id) => span.ids.has(id))) throw Error("A named session or priority needs its own evidence reference.");
          if (ids.length && [...span.ids].some((id) => /^(?:session|saved):/.test(id)) && !ids.some((id) => span.ids.has(id))) {
            const action = s.action.replace(/\bnot(?:\s+as)?\s+(?:an?\s+)?(?:second|additional)\s+(?:\w+\s+){0,3}(?:session|activity|option)\b/gi, "[alternative limit]");
            if (!/\b(?:backup|alternative|fallback|replacement|instead)\b/i.test(s.title + " " + s.action) || /\bafter\b[^.!?\n]{0,100}\b(?:primary|main)\b|\b(?:second|additional)\s+(?:\w+\s+){0,3}(?:session|activity|option)\b/i.test(action)) throw Error("A non-selected session must be labelled as an alternative.");
          }
        }
      }
    }
    if (new Set(ids).size !== ids.length || !input.schedule && ids.length) throw Error("Unsupported session selection.");
    if (input.schedule) {
      if (ids.length > input.schedule.maxActivities || ids.some((id) => !input.schedule.sessions.some((s) => s.id === id))) throw Error("Unsupported session selection.");
      const selected = { ...input.schedule, sessions: input.schedule.sessions.filter((s) => ids.includes(s.id)) };
      if (inspectSchedule(selected).length) throw Error("The selected sessions do not meet the checked constraints.");
    }
    const suppliedNames = new Set(identities.keys());
    const texts = [result.summary, ...result.questions, ...result.suggestions.flatMap((s) => [...suppliedNames.has(s.title) ? [] : [s.title], s.action, s.why, s.uncertainty, ...s.fields.filter((f) => !["target-link", "experience-source"].includes(f.key) && !(["target-name", "experience-name"].includes(f.key) && suppliedNames.has(f.value))).map((f) => f.value)])];
    const prose = texts.map((t) => {
      for (const name of [...suppliedNames].sort((a, b) => b.length - a.length)) t = t.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu"), "[supplied item]");
      return t.replace(/https?:\/\/[^\s<>"'\\`]+/gi, "[source]").replace(/\bconflict[- ](?:resolution|management|free)\b/gi, "[topic]").replace(/\boverlap(?:ping)?(?: in)? (?:interests|topics|skills|expertise|areas)\b/gi, "[topic]").replace(/\b(?:interests?|topics?|skills?|expertise|peers?)(?: (?:area|most|directly|closely|also))* overlaps?\b/gi, "[topic]").replace(/\b(?:kind|type) of overlap you want\b|\b(?:define|describe|clarify) the overlap you care about\b/gi, "[topic]");
    });
    const clock = /\b\d{1,2}:\d{2}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b|\b\d{1,2}h\d{2}\b|\b(?:\d{1,2}(?:[.:]\d{2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*[ap]\.?m\.?(?!\p{L})|\b(?:noon|midnight)\b/iu;
    const relation = /\b(?:simultaneous\w*|double[ -]?book\w*|back[ -]to[ -]back|at the same time)\b|\b(?:time|timing|schedule|scheduling)[ -]+conflict\w*\b|\b(?:sessions?|talks?|activities|appointments?)\s+(?:(?:all|both)\s+)?(?:conflict|clash)\w*\b|\b(?:conflicting|clashing)\s+(?:sessions?|talks?|activities|appointments?)\b|\b(?:timed?|timing|schedule|scheduling)\b[^.!?\n]*\b(?:conflicts?|clashes?)\b/i;
    const overlap = /\boverlap\w*\b/i, temporal = /\[supplied item\]|\b(?:sessions?|talks?|workshops?|activities|appointments?|events?|times?(?!\s+zones?\b)|timetable|timing|schedule|scheduling)\b/i;
    if (prose.some((t) => clock.test(t) || relation.test(t) || overlap.test(t) && (input.schedule || temporal.test(t)) || input.schedule && /\b(?:second|additional)\b[^.!?\n]{0,40}\b(?:later|after|alongside)\b/i.test(t))) throw Error("Timetable claims must use the calculated session checks.");
  }

  // src/assistant-contract.ts
  var guideIds = ["worth", "funding", "prepare", "prioritize", "time", "conversations", "explore", "followup", "learning"];
  var worksheetFields = {
    targets: ["target-name", "target-action", "target-backup", "target-question", "target-link"],
    decision: ["decision-goal", "decision-fit", "decision-alt", "decision-next"],
    experience: ["experience-name", "experience-purpose", "experience-question", "experience-action", "experience-backup", "experience-source"],
    learning: ["insight-goal", "insight-use", "insight-action"]
  };
  var ACCESS_VERIFICATION_QUESTION = "Which current organizer or activity-host source confirms you can join the activities you plan to use, including any pass, RSVP or approval requirements?";
  function withAccessVerification(questions) {
    const remaining = questions.filter((q) => q.trim().toLowerCase() !== ACCESS_VERIFICATION_QUESTION.toLowerCase());
    return [ACCESS_VERIFICATION_QUESTION, ...remaining.slice(0, 3)];
  }
  var contextIds = ["profile", "priorities", "schedule", "budget", "learning", "notes"];
  var record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function exact(v, keys2) {
    if (Object.keys(v).some((k) => !keys2.includes(k)) || keys2.some((k) => !(k in v))) throw Error("Unexpected fields.");
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
  function textURLs(text2) {
    return text2.match(/https?:\/\/[^\s<>"'\\`]+/gi) || [];
  }
  function sourceVariants(raw) {
    let clean = raw, previous = "";
    while (previous !== clean) {
      previous = clean;
      clean = clean.replace(/[.,;:!?]+$/, "");
      for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]]) if (clean.endsWith(close) && clean.split(close).length > clean.split(open).length) clean = clean.slice(0, -1);
    }
    return [...new Set([publicURL(raw), publicURL(clean)].filter(Boolean))];
  }
  function redact(text2) {
    return text2.replace(/https?:\/\/[^\s<>"']+/gi, (url) => publicURL(url) || "[private link removed]").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]").replace(/\b(?:sk|ghp|gho|github_pat)[-_][a-zA-Z0-9_-]{12,}\b/g, "[secret removed]").replace(/(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]\d{3}[ .-]\d{4}\b/g, "[phone removed]");
  }
  function validateInput(raw) {
    if (!record(raw)) throw Error("Invalid request.");
    exact(raw, ["version", "mode", "goal", "constraints", "agenda", "context", ...raw.version === 2 || raw.version === 3 ? ["schedule"] : [], ...raw.version === 3 ? ["sourceLinks"] : []]);
    if (![1, 2, 3].includes(raw.version) || typeof raw.mode !== "string" || !["plan", "review"].includes(raw.mode) || !Array.isArray(raw.context) || raw.context.length > 6) throw Error("Invalid request.");
    let sourceLinks;
    if (raw.version === 3) {
      if (!Array.isArray(raw.sourceLinks) || raw.sourceLinks.length > 32) throw Error("Use at most thirty-two approved public source links.");
      sourceLinks = raw.sourceLinks.map((v) => {
        const u = publicURL(string(v, 500, true));
        if (!u) throw Error("Use public source links without private parameters.");
        return u;
      });
      if (new Set(sourceLinks).size !== sourceLinks.length) throw Error("Remove duplicate source links.");
    }
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
    return { version: raw.version, ...sourceLinks ? { sourceLinks } : {}, ...raw.version !== 1 ? { schedule: validateSchedule(raw.schedule) } : {}, mode: raw.mode, goal: string(raw.goal, 600, true), constraints: string(raw.constraints, 2e3), agenda: string(raw.agenda, 8e3), context };
  }
  function allowedSources(input) {
    if (input.version === 3) return new Set(input.sourceLinks);
    return new Set(textURLs(JSON.stringify(input)).flatMap(sourceVariants));
  }
  function validateResult(raw, input) {
    if (!record(raw)) throw Error("The response could not be checked.");
    exact(raw, ["summary", "suggestions", "questions", ...input.version >= 2 ? ["recommendedSessionIds"] : []]);
    if (!Array.isArray(raw.suggestions) || raw.suggestions.length < 1 || raw.suggestions.length > 4 || !Array.isArray(raw.questions) || raw.questions.length > 4) throw Error("Invalid suggestions.");
    const evidence = new Set(input.version >= 2 ? evidenceFor(input).map((e) => e.id) : ["goal", "constraints", "agenda", ...input.context.map((c) => c.id)]), sources = allowedSources(input);
    const suggestions = raw.suggestions.map((s) => {
      if (!record(s)) throw Error("Invalid suggestion.");
      exact(s, ["title", "action", "why", "uncertainty", "guideId", "evidenceIds", "worksheet", "fields", ...input.version >= 2 ? ["evidenceQuotes"] : []]);
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
      const quotes = input.version >= 2 ? (() => {
        if (!Array.isArray(s.evidenceQuotes) || s.evidenceQuotes.length > 6) throw Error("Unsupported references.");
        return s.evidenceQuotes.map((q) => {
          if (!record(q)) throw Error("Invalid reference.");
          exact(q, ["id", "quote"]);
          return { id: string(q.id, 40, true), quote: string(q.quote, 500, true) };
        });
      })() : void 0;
      return { ...quotes ? { evidenceQuotes: quotes } : {}, title: string(s.title, 140, true), action: string(s.action, 1200, true), why: string(s.why, 1200, true), uncertainty: string(s.uncertainty, 1200, true), guideId: String(s.guideId), evidenceIds: s.evidenceIds.map(String), worksheet, fields };
    });
    const selected = input.version >= 2 ? (() => {
      if (!Array.isArray(raw.recommendedSessionIds) || raw.recommendedSessionIds.length > 18) throw Error("Invalid session selection.");
      return raw.recommendedSessionIds.map((id) => string(id, 32, true));
    })() : void 0;
    const result = { summary: string(raw.summary, 1600, true), suggestions, questions: raw.questions.map((q) => string(q, 600, true)), ...selected ? { recommendedSessionIds: selected } : {} };
    if (input.version >= 2) {
      const text2 = [result.summary, ...result.questions, ...result.suggestions.flatMap((s) => [s.title, s.action, s.why, s.uncertainty, ...s.fields.map((f) => f.value)])];
      for (const t of text2) {
        if (redact(t) !== t) throw Error("Generated contact details or private links are unsupported.");
        if (textURLs(t).some((url) => !sourceVariants(url).some((v) => sources.has(v)))) throw Error("Unprovided source URL.");
        const cashText = t.replace(/\b(?:(?:do|must|should)\s+not|never)\s+(?:list|treat|count|use|consider)\s+(?:only\s+)?confirmed\s+(?:funding|support|awards?)\s+as\s+(?:available\s+)?cash\b/gi, "[cash timing caution]");
        if (/\b(?:list|treat|count|use|consider)\s+(?:only\s+)?confirmed\s+(?:funding|support|awards?)\s+as\s+(?:available\s+)?cash\b|\bconfirmed\s+(?:funding|support|awards?)\s+(?:is|are)\s+(?:available\s+)?cash\b/i.test(cashText)) throw Error("Funding approval alone does not establish upfront cash.");
      }
    }
    checkGroundedResult(result, input);
    return { ...result, questions: withAccessVerification(result.questions) };
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
  var resultSchema = { type: "object", additionalProperties: false, required: ["summary", "suggestions", "questions"], properties: {
    summary: text,
    questions: { type: "array", items: text, maxItems: 4 },
    suggestions: { type: "array", minItems: 1, maxItems: 4, items: suggestionSchema }
  } };
  var evidenceQuoteSchema = { type: "object", additionalProperties: false, required: ["id", "quote"], properties: { id: text, quote: text } };
  var groundedResultSchema = { ...resultSchema, required: [...resultSchema.required, "recommendedSessionIds"], properties: {
    ...resultSchema.properties,
    recommendedSessionIds: { type: "array", items: text, maxItems: 18 },
    suggestions: { ...resultSchema.properties.suggestions, items: { ...suggestionSchema, required: [...suggestionSchema.required, "evidenceQuotes"], properties: { ...suggestionSchema.properties, evidenceQuotes: { type: "array", minItems: 1, maxItems: 6, items: evidenceQuoteSchema } } } }
  } };

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
  function scheduleFromForm(p, v, requireConfirmation = true) {
    const date = String(v["ai-session-date"] || p.date || ""), timezone = String(v["ai-session-zone"] || p.timezone || "");
    const lines = String(v["ai-session-lines"] || "");
    const sessions2 = parseSessionLines(lines, date, timezone).map((s) => ({ ...s, label: safe(s.label, 140), source: publicURL(s.source) }));
    if (v["ai-share-schedule"]) p.activities.slice(0, 18).forEach((a, i) => {
      if (a.date && a.start && a.end && a.timezone) sessions2.push({ id: "saved:" + (i + 1), label: safe(a.label, 140), date: a.date, endDate: a.date, start: a.start, end: a.end, timezone: a.timezone, buffer: Number(a.buffer || 0), source: publicURL(a.source || "") });
    });
    if (!sessions2.length) return null;
    const start = String(v["ai-available-start"] || ""), end = String(v["ai-available-end"] || "");
    const schedule = validateSchedule({ sessions: sessions2, availability: start || end ? { date, endDate: date, start, end, timezone } : null, breakMinutes: v["ai-break"] === "" ? 0 : Number(v["ai-break"] ?? 15), maxActivities: Number(v["ai-max-activities"] || 2) });
    if (requireConfirmation && !v["ai-times-confirm"]) throw Error("Check session times below and confirm the displayed details before previewing.");
    return schedule;
  }
  function sessionListHTML(schedule) {
    return `<ul class="ai-session-list">${schedule.sessions.map((s) => `<li><strong>${esc(s.label)}</strong><span>${esc(s.date)} ${esc(s.start)} \u2192 ${s.endDate !== s.date ? esc(s.endDate) + " " : ""}${esc(s.end)} \xB7 ${esc(s.timezone)} \xB7 Reset buffer: ${s.buffer} minutes</span>${s.source ? `<span>Supplied public source: ${esc(s.source)}</span>` : ""}</li>`).join("")}</ul>`;
  }
  function scheduleFactsHTML(schedule, selected) {
    if (!schedule) return '<p class="helper">No session times confirmed for calculation. AI can suggest research actions; timetable claims are not supported.</p>';
    const findings = inspectSchedule(schedule), chosen = selected ? { ...schedule, sessions: schedule.sessions.filter((s) => selected.includes(s.id)) } : null;
    return `<section class="ai-schedule-facts" aria-label="Calculated session checks"><h3>Session checks</h3><p class="helper">Calculated from the listed details. Access and organizer changes still need checking. Comparisons below apply if you choose both sessions.</p>${sessionListHTML(schedule)}${findings.length ? `<ul>${findings.map((f) => `<li>${esc(findingText(f, schedule))}</li>`).join("")}</ul>` : "<p>No overlaps, insufficient buffers or availability violations found among the listed sessions.</p>"}<p class="helper">Requested break: ${schedule.breakMinutes} minutes \xB7 Activity limit: ${schedule.maxActivities}${schedule.availability ? ` \xB7 Available ${esc(schedule.availability.date)} ${esc(schedule.availability.start)}\u2013${esc(schedule.availability.end)} ${esc(schedule.availability.timezone)}` : " \xB7 Availability not supplied"}. Untimed activities and unstructured agenda notes are not compared.</p>${chosen ? `<h3>Suggested session selection</h3>${chosen.sessions.length ? sessionListHTML(chosen) : "<p>No timed selection proposed. Use the suggestions to check missing details.</p>"}` : ""}</section>`;
  }
  function scheduleControlsHTML(p) {
    return `<details class="ai-schedule-controls"><summary>Check session times (optional)</summary><p>For timetable advice, enter sessions here or include your saved schedule. These details are only for this AI request; they do not create appointments.</p><div class="fg2"><div class="formrow"><label for="ai-session-date">Session date</label><input type="date" id="ai-session-date" value="${esc(p.date || "")}"></div><div class="formrow"><label for="ai-session-zone">Session timezone</label><input id="ai-session-zone" value="${esc(p.timezone || "")}" placeholder="Europe/Paris"></div></div><div class="formrow"><label for="ai-session-lines">Session times to compare</label><textarea id="ai-session-lines" rows="4" maxlength="6000" placeholder="Testing workshop | 14:00 | 15:00&#10;Architecture talk | 14:30 | 15:30"></textarea><p class="helper">One session per line: name | start | end. Use 24-hour times. You can add | timezone | public URL | reset minutes. For another date or an overnight session use YYYY-MM-DDTHH:mm in each time column. Other agenda notes belong above.</p></div><div class="fg2"><div class="formrow"><label for="ai-available-start">Available from (optional)</label><input type="time" id="ai-available-start"></div><div class="formrow"><label for="ai-available-end">Available until (optional)</label><input type="time" id="ai-available-end"></div><div class="formrow"><label for="ai-break">Minimum break between sessions (minutes)</label><input type="number" id="ai-break" min="0" max="600" value="15"></div><div class="formrow"><label for="ai-max-activities">Maximum activities</label><input type="number" id="ai-max-activities" min="1" max="18" value="2"></div></div><button class="btn" data-ai-check-times="1">Check session times</button><div id="ai-times-review" role="status"></div></details>`;
  }
  function buildInput(p, mode, values) {
    const context = [{ id: "profile", label: labels.profile, text: safe(contextText(p, "profile")) }];
    for (const id of ["priorities", "schedule", "budget", "learning", "notes"]) if (values["ai-share-" + id]) context.push({ id, label: labels[id], text: safe(contextText(p, id)) });
    const schedule = scheduleFromForm(p, values), typed = String(values["ai-sources"] || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const approved = typed.map((u) => {
      const url = publicURL(u);
      if (!url || redact(url) !== url) throw Error("Use one public source URL per line, without private links or contact details.");
      return url;
    });
    const sourceLinks = [...new Set([publicURL(p.organizerUrl || ""), ...values["ai-share-priorities"] ? p.targets.slice(0, 12).map((t) => publicURL(t.source || "")) : [], ...schedule?.sessions.map((s) => s.source) || [], ...approved].filter(Boolean))];
    return validateInput({ version: 3, sourceLinks, schedule, mode: mode === "review" ? "review" : "plan", goal: safe(values["ai-goal"], 600), constraints: safe(values["ai-constraints"], 2e3), agenda: safe(values["ai-agenda"], 8e3), context });
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
    <div class="assistant-columns"><section class="assistant-input" id="assistant-input" ${draftAttributes(p, "assistant:" + mode)}><h2>Your direction</h2><p class="helper save-state" role="status">${storageAvailable ? "Inputs are kept as a draft in this browser." : "Browser storage is unavailable. Copy your input before leaving."}</p><div class="formrow"><label for="ai-goal">What would make this conference worthwhile? *</label><textarea id="ai-goal" rows="2" maxlength="600" required>${esc(p.goal || "")}</textarea></div><div class="formrow"><label for="ai-constraints">Time, budget or other limits (optional)</label><textarea id="ai-constraints" rows="3" maxlength="2000" placeholder="I have one afternoon and want to leave time for a break."></textarea></div><div class="formrow"><label for="ai-agenda">Relevant agenda or opportunity details (optional)</label><textarea id="ai-agenda" rows="5" maxlength="8000" placeholder="Paste a few sessions, opportunities or public links. Sources are not opened or verified."></textarea></div><div class="formrow"><label for="ai-sources">Public source links for worksheet drafts (optional)</label><textarea id="ai-sources" rows="2" maxlength="4000" placeholder="https://example.org/session"></textarea><p class="helper">One public URL per line. Only these links and public sources from your shared saved records can become draft source fields. Links inside agenda notes stay untrusted context. Including a source does not verify it.</p></div>${scheduleControlsHTML(p)}<fieldset class="assistant-sharing"><legend>Also include from my saved plan</legend><p class="helper">Conference profile is included. Additional sections are your choice.</p>${["priorities", "schedule", "budget", "learning", "notes"].map((id) => `<label><input id="ai-share-${id}" type="checkbox" ${id === "priorities" ? "checked" : ""}> ${esc(labels[id])}</label>`).join("")}</fieldset><p class="helper">Contact channels, private confirmation references, funding-source details and full templates are excluded. Automatic removal catches some emails, phone numbers, secrets and private links; review the preview for anything else you want to remove.</p><button class="btn primary" data-ai-preview="1">Preview what will be sent \u2192</button></section>
    <section class="assistant-preview" aria-labelledby="ai-preview-heading"><h2 id="ai-preview-heading">You control what you share</h2><p>Only the displayed details are sent when you choose to ask AI. Suggestions stay in this session until you open one as a worksheet draft.</p><p class="helper">OpenAI processes the request. We don\u2019t save your request on our server. OpenAI may retain abuse-monitoring logs for up to 30 days under its standard API policy. <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">Data policy \u2197</a></p><div id="ai-preview">${s.prepared ? previewHTML(s.prepared) : '<p class="helper">Fill in your direction, then preview the exact details.</p>'}</div><p id="ai-message" class="error" role="alert"></p><div class="linkrow"><button class="btn" data-ai-example="1">See a fictional example</button></div></section></div><section id="ai-results" class="assistant-results" aria-label="Planning suggestions" tabindex="-1" ${s.pending ? 'aria-busy="true"' : ""}>${s.result ? resultsHTML(s) : ""}</section></section>`;
  }
  function previewHTML(input) {
    return `<div class="ai-payload"><p class="section-caption">${input.mode === "review" ? "Review my plan" : "Help me plan"} \xB7 Exact request details</p><dl><dt>Goal</dt><dd>${esc(input.goal)}</dd><dt>Constraints</dt><dd>${esc(input.constraints || "None supplied")}</dd><dt>Agenda</dt><dd>${esc(input.agenda || "None supplied")}</dd><dt>Source links eligible for worksheet drafts</dt><dd>${esc((input.sourceLinks || []).join("\n") || "None approved")}</dd>${input.context.map((c) => `<dt>${esc(c.label)}</dt><dd>${esc(c.text)}</dd>`).join("")}</dl>${scheduleFactsHTML(input.schedule)}</div><label class="ai-consent"><input type="checkbox" id="ai-consent" data-draft-exclude="1"> I approve sending these displayed details to OpenAI.</label><div class="linkrow"><button class="btn primary" id="ai-send" data-ai-send="1">Ask AI for suggestions</button><button class="btn" data-ai-cancel="1" hidden>Cancel request</button></div><p class="helper">Up to six attempts per hour per visitor, with a shared daily limit. Requests are never retried automatically.</p>`;
  }
  function resultsHTML(s) {
    const questions = withAccessVerification(s.result.questions);
    return `<div class="assistant-results-heading"><span class="section-caption">${s.example ? "Fictional example \xB7 no AI request was made" : "AI suggestions \xB7 check before using"}</span><h2>A little focus goes a long way.</h2><p>${esc(s.result.summary)}</p><p class="helper">${s.example ? "This shows the experience with an invented event. These example suggestions cannot be added to your real plan." : "AI can be wrong. Dates, eligibility, funding and access still need confirmation from official sources. These suggestions do not change your saved plan."}</p></div>${s.example ? "" : scheduleFactsHTML(s.usedInput?.schedule, s.result.recommendedSessionIds)}${s.result.suggestions.map((x, i) => `<article class="assistant-card"><span class="section-caption">${String(i + 1).padStart(2, "0")} \xB7 ${esc(worksheetNames[x.worksheet])}</span><h3>${esc(x.title)}</h3><p class="ai-action">${esc(x.action)}</p><dl><dt>Why this fits</dt><dd>${esc(x.why)}</dd><dt>Needs checking</dt><dd>${esc(x.uncertainty)}</dd></dl>${x.evidenceQuotes ? `<details class="ai-evidence"><summary>Supporting details</summary><dl>${x.evidenceQuotes.map((q) => {
      const e = evidenceFor(s.usedInput).find((e2) => e2.id === q.id);
      return `<dt>${esc(e?.label || q.id)} \xB7 ${e?.kind === "calculated" ? "Calculated" : "You supplied"}</dt><dd>${esc(q.quote)}</dd>`;
    }).join("")}</dl><p class="helper">Matching a quote confirms its source, not independent verification or whether the reasoning is correct.</p></details>` : `<p class="helper">Based on: ${x.evidenceIds.map((id) => esc(labels[id] || id)).join(", ")}.</p>`}<details><summary>Proposed worksheet draft</summary><dl>${x.fields.map((f) => `<dt>${esc(fieldLabels[f.key])}</dt><dd>${esc(f.value)}</dd>`).join("")}</dl></details><div class="linkrow">${s.example ? "" : `<button class="btn primary" data-ai-use="${i}">Use in worksheet \u2192</button>`}<a class="plainlink" href="#/guide/${x.guideId}">${esc(GUIDE_BY_ID[x.guideId].title)} \u2192</a></div></article>`).join("")}<div class="assistant-questions"><h3>Before you commit</h3><p class="helper">The access check comes from the planner. Other questions come from ${s.example ? "this fictional example" : "AI"}.</p><ul>${questions.map((q, i) => `<li>${i === 0 ? "<strong>Access check:</strong> " : ""}${esc(q)}</li>`).join("")}</ul></div>`;
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
  function invalidate(changedId) {
    const c = current();
    if (!c) return;
    c.s.prepared = null;
    const consent = document.getElementById("ai-consent");
    if (consent) consent.checked = false;
    message("");
    if (changedId && /^(ai-session-|ai-available-|ai-break$|ai-max-activities$|ai-share-schedule$)/.test(changedId)) {
      const check = document.getElementById("ai-times-confirm");
      if (check) check.checked = false;
      const review = document.getElementById("ai-times-review");
      if (review) review.innerHTML = "<p>Session details changed. Check them again before confirming.</p>";
    }
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
    if (d.aiCheckTimes) {
      if (c.s.pending) return true;
      try {
        const schedule = scheduleFromForm(c.p, valuesFromForm(), false);
        document.getElementById("ai-times-review").innerHTML = schedule ? scheduleFactsHTML(schedule) + `<label class="ai-consent"><input id="ai-times-confirm" type="checkbox" data-draft-exclude="1"> These are the session details I want compared.</label>` : "<p>Add session times, or select a saved schedule with complete dates, times and timezones.</p>";
        invalidate();
        message("");
      } catch (error) {
        message(error.message);
      }
      return true;
    }
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
    if (event.target.closest?.("#assistant-input")) invalidate(event.target.id);
  });
  return __toCommonJS(assistant_client_exports);
})();
