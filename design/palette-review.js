// Local design review: theme the actual app without changing its shared stylesheet.
const paletteThemes = {
  teal: {
    paper: "#ffffff", surface: "#ffffff", text: "#252b2e", secondary: "#596469",
    rule: "#dde3e4", border: "#7d8c8d", accent: "#006d68", dark: "#00544f",
    wash: "#edf6f5", example: "#e7f3ef", exampleRule: "#c4dcd3",
  },
  forest: {
    paper: "#faf8f2", surface: "#fffefa", text: "#342e28", secondary: "#665f54",
    rule: "#e0dfd3", border: "#918b7b", accent: "#35634b", dark: "#254c37",
    wash: "#edf2ea", example: "#eaf0e6", exampleRule: "#cbd8c1",
  },
  burgundy: {
    paper: "#f8fafc", surface: "#ffffff", text: "#293341", secondary: "#596575",
    rule: "#dde2e9", border: "#8792a3", accent: "#843a50", dark: "#6c293e",
    wash: "#f7ebef", example: "#eef1f6", exampleRule: "#cdd5e2",
  },
  aubergine: {
    paper: "#fffaf7", surface: "#ffffff", text: "#332a35", secondary: "#6b5d69",
    rule: "#e5dddf", border: "#988494", accent: "#69416d", dark: "#522f56",
    wash: "#f1e9f4", example: "#faece4", exampleRule: "#e4ccc0",
  },
  navy: {
    paper: "#fffdf9", surface: "#ffffff", text: "#253447", secondary: "#5d6775",
    rule: "#e2e1db", border: "#88929d", accent: "#2e4d70", dark: "#213c5a",
    wash: "#eaf0f6", example: "#ffedda", exampleRule: "#e9cdb0",
  },
  graphite: {
    paper: "#fafafa", surface: "#ffffff", text: "#252529", secondary: "#60606a",
    rule: "#dedee3", border: "#8a8a93", accent: "#3a50bb", dark: "#2c3d99",
    wash: "#eef0fb", example: "#f0f0f2", exampleRule: "#d3d3dc", emphasis: "#252529",
  },
  plum: {
    paper: "#fff9fb", surface: "#ffffff", text: "#342b38", secondary: "#6a5f6c",
    rule: "#e7dde3", border: "#958493", accent: "#70486e", dark: "#563652",
    wash: "#f2eaf4", example: "#f8e7ec", exampleRule: "#e3cbd5",
  },
  mulberry: {
    paper: "#fffbfe", surface: "#ffffff", text: "#372d39", secondary: "#6e6071",
    rule: "#e4dfe8", border: "#98849a", accent: "#873e63", dark: "#6f2b4d",
    wash: "#f8edf3", example: "#efeafb", exampleRule: "#d8cce8",
  },
  cocoa: {
    paper: "#fffaf8", surface: "#ffffff", text: "#362d29", secondary: "#6f615a",
    rule: "#e6ddd8", border: "#98867e", accent: "#765443", dark: "#593c2e",
    wash: "#f4ece7", example: "#fae9e8", exampleRule: "#e8cdcd",
  },
  ocean: {
    paper: "#ffffff", surface: "#ffffff", text: "#252b2e", secondary: "#596469",
    rule: "#dde3e4", border: "#7d8c8d", accent: "#176da0", dark: "#125476",
    wash: "#e9f3fb", example: "#edf5fa", exampleRule: "#c6dfed",
  },
  violet: {
    paper: "#ffffff", surface: "#ffffff", text: "#252b2e", secondary: "#596469",
    rule: "#dde3e4", border: "#7d8c8d", accent: "#7046b4", dark: "#53338d",
    wash: "#f3effb", example: "#f1edfb", exampleRule: "#d8cdef",
  },
  coral: {
    paper: "#ffffff", surface: "#ffffff", text: "#252b2e", secondary: "#596469",
    rule: "#dde3e4", border: "#7d8c8d", accent: "#a54143", dark: "#823033",
    wash: "#fceff0", example: "#fcebed", exampleRule: "#edcbd0",
  },
};
const cards = [...document.querySelectorAll(".palette-card")];
const paletteSet = document.getElementById("palette-set");
const routeSelect = document.getElementById("route");
const sectionSelect = document.getElementById("section");
const compareButton = document.getElementById("compare");
const grid = document.getElementById("palettes");
const params = new URLSearchParams(location.search);
paletteSet.value = ["first", "more", "variations", "crisp", "favorite", "all"].includes(params.get("set")) ? params.get("set") : "favorite";
sectionSelect.value = ["worked-example", "guide-worksheet"].includes(params.get("section")) ? params.get("section") : "top";
function themedCSS(theme) {
  const tokens = {
    paper: theme.paper, surface: theme.surface, text: theme.text, secondary: theme.secondary,
    rule: theme.rule, "control-border": theme.border, accent: theme.accent,
    "accent-dark": theme.dark, "accent-wash": theme.wash, "example-wash": theme.example,
    emphasis: theme.emphasis || theme.accent, "example-rule": theme.exampleRule,
    "worksheet-rule": theme.exampleRule, "shadow-ink": theme.text + "1a", "shadow-soft": theme.text + "05",
  };
  return ":root {" + Object.entries(tokens).map(([name, value]) => "--" + name + ":" + value + ";").join("") + "}";
}

function jumpToSection(frame) {
  const doc = frame.contentDocument;
  if (!doc || !frame.closest(".palette-card").classList.contains("ready")) return;
  const target = sectionSelect.value === "top" ? null : doc.getElementById(sectionSelect.value);
  const top = target ? target.getBoundingClientRect().top + frame.contentWindow.scrollY - 24 : 0;
  // Scroll the app only; scrollIntoView would also move the surrounding review page.
  frame.contentWindow.scrollTo({ top: Math.max(0, top), behavior: "instant" });
}

for (const card of cards) {
  const frame = card.querySelector("iframe");
  frame.addEventListener("load", () => {
    try {
      const style = frame.contentDocument.createElement("style");
      style.textContent = themedCSS(paletteThemes[card.dataset.palette]);
      frame.contentDocument.head.append(style);
      card.classList.add("ready");
      // The app may still be rendering after its load event.
      requestAnimationFrame(() => jumpToSection(frame));
    } catch (error) {
      card.querySelector(".loading").textContent = "Preview could not load. Refresh to retry.";
    }
  });
}

function updateRoute() {
  const isPlanner = routeSelect.value === "conference";
  sectionSelect.disabled = isPlanner;
  if (isPlanner) sectionSelect.value = "top";
  for (const card of cards) {
    if (card.hidden || card.dataset.route === routeSelect.value) continue;
    card.classList.remove("ready");
    // Navigate a fresh preview, never change the user's open app tab.
    card.querySelector("iframe").src = "../index.html?palette-preview=" + card.dataset.palette
      + "&view=" + encodeURIComponent(routeSelect.value) + "#/" + routeSelect.value;
    card.dataset.route = routeSelect.value;
  }
}

function showSet() {
  grid.classList.toggle("single", paletteSet.value === "favorite");
  for (const card of cards) {
    const inSet = paletteSet.value === "all" || (paletteSet.value === "favorite"
      ? card.dataset.palette === "teal" : card.dataset.set === paletteSet.value);
    card.hidden = !inSet;
  }
  compareButton.hidden = true;
  updateRoute();
  requestAnimationFrame(() => cards.filter((card) => !card.hidden).forEach((card) => jumpToSection(card.querySelector("iframe"))));
}

routeSelect.addEventListener("change", updateRoute);
paletteSet.addEventListener("change", showSet);
sectionSelect.addEventListener("change", () => cards.forEach((card) => jumpToSection(card.querySelector("iframe"))));
document.querySelectorAll("[data-expand]").forEach((button) => {
  button.addEventListener("click", () => {
    grid.classList.add("single");
    for (const card of cards) card.hidden = card.dataset.palette !== button.dataset.expand;
    compareButton.hidden = false;
    compareButton.focus();
    requestAnimationFrame(() => jumpToSection(cards.find((card) => !card.hidden).querySelector("iframe")));
  });
});
compareButton.addEventListener("click", () => {
  showSet();
  cards.find((card) => !card.hidden).querySelector("[data-expand]").focus();
});
showSet();
