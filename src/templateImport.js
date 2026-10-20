const ALLOWED_LAYOUTS = new Set(["frame", "map", "wave", "grid", "split", "code", "tree", "band"]);
const FONT_PRESETS = ["Inter", "Source Serif 4", "JetBrains Mono"];

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function color(value, fallback, field) {
  if (value == null || value === "") return fallback;
  let v = typeof value === "string" ? value.trim() : "";
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgb) v = "#" + [rgb[1], rgb[2], rgb[3]].map(n => Math.min(255, Number(n)).toString(16).padStart(2, "0")).join("");
  if (/^#?[0-9a-fA-F]{3}$/.test(v)) v = "#" + v.replace("#", "").split("").map(c => c + c).join("");
  if (/^[0-9a-fA-F]{6}$/.test(v)) v = "#" + v;
  if (/^#[0-9a-fA-F]{8}$/.test(v)) v = v.slice(0, 7);
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
    throw new Error(`Invalid ${field} color: ${String(value)}. Use six-digit hex such as #293b36.`);
  }
  return v.toLowerCase();
}

// Return the first non-empty value found for any of the keys in any of the given objects.
function pick(sources, keys) {
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of keys) {
      const v = src[key];
      if (v != null && v !== "" && typeof v !== "object") return v;
    }
  }
  return undefined;
}

function inferLayout(identity) {
  const value = identity.toLowerCase();
  if (/map|isogloss|atlas|dialect|variation/.test(value)) return "map";
  if (/wave|phonetic|acoustic/.test(value)) return "wave";
  if (/tree|syntax|branch/.test(value)) return "tree";
  if (/gloss|bilingual|translation/.test(value)) return "split";
  if (/corpus|concordance|transcript/.test(value)) return "code";
  return "frame";
}

function normalizeFont(value) {
  const font = String(value || "Arial");
  if (FONT_PRESETS.includes(font)) return font;
  if (/mono|code|courier|consolas|menlo/i.test(font)) return "JetBrains Mono";
  if (/serif|georgia|times|garamond|cambria|palatino|book/i.test(font) && !/sans/i.test(font)) return "Source Serif 4";
  return "Inter";
}

// Turn body text (array, string or object) into a list of lines.
function bodyLines(value) {
  if (Array.isArray(value)) return value.map(v => (v && typeof v === "object" ? (v.text || v.title || "") : String(v))).map(v => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  return [];
}

/** Convert a supported LinguaSlides template/deck JSON object into a gallery theme. */
export function normalizeImportedTemplate(input, now = Date.now()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("The JSON root must be an object.");
  }

  // Accept either the documented top-level template shape or { template: { ... } } wrappers.
  const raw = input.template && typeof input.template === "object" && !Array.isArray(input.template)
    ? { ...input, ...input.template }
    : input;
  // A deck JSON exported by the app has no top-level "name"; fall back to its theme name / title.
  const themeObj = objectOrEmpty(raw.theme);
  const name = String(raw.name || themeObj.name || raw.title || "").trim();
  if (!name) throw new Error("Missing required field: name.");

  const theme = themeObj;
  const tokens = objectOrEmpty(theme.colorTokens || raw.colorTokens);
  const palettes = [theme, tokens, objectOrEmpty(theme.colors), objectOrEmpty(theme.palette), objectOrEmpty(raw.colors), objectOrEmpty(raw.palette), raw];
  const layouts = Array.isArray(raw.layouts) ? raw.layouts : (Array.isArray(raw.slides) ? raw.slides : []);
  if (!layouts.length) throw new Error("Add a non-empty layouts array (or slides array).");
  if (layouts.some(item => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error("Every layouts/slides item must be a JSON object.");
  }

  const bg = color(pick(palettes, ["background", "bg", "backgroundColor"]), "#ffffff", "theme.background");
  const ink = color(pick(palettes, ["primary", "text", "ink", "foreground", "textColor"]), "#243b53", "theme.primary/text");
  const muted = color(pick(palettes, ["muted", "secondary", "mutedText"]), "#68778a", "theme.muted");
  const accent = color(pick(palettes, ["accent", "accent1", "highlight"]), "#2e77b7", "theme.accent");

  const explicitLayout = String(raw.layout ?? theme.layout ?? "").trim().toLowerCase();
  if (explicitLayout && !ALLOWED_LAYOUTS.has(explicitLayout)) {
    throw new Error(`Unsupported layout "${explicitLayout}". Use one of: ${[...ALLOWED_LAYOUTS].join(", ")}.`);
  }
  const layout = explicitLayout || "frame";
  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const tags = rawTags.map(String).map(tag => tag.trim()).filter(Boolean).slice(0, 8);
  const category = String(raw.category || tags[0] || "Custom");
  const content = layouts.map((item, index) => ({
    type: String(item.type || "content").trim().toLowerCase().replace(/\s+/g, "-") || "content",
    title: String(item.title || item.heading || (item.type && item.type !== "content" ? item.type : "") || `Slide ${index + 1}`).trim(),
    body: [item.body, item.content, item.slots?.body, item.slots?.content, item.text].map(bodyLines).find(l => l.length) || []
  }));
  const headings = layouts.map((item, index) => String(item.title || item.type || `Slide ${index + 1}`).trim() || `Slide ${index + 1}`);
  const slug = String(raw.id || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "imported-template";

  return {
    id: `custom-${slug}-${now}`,
    name,
    tag: category,
    tags: tags.length ? tags : [category],
    desc: String(raw.description || "Imported JSON template"),
    slides: layouts.length,
    layout,
    bg,
    ink,
    muted,
    accent,
    font: normalizeFont(pick([theme, raw], ["fontFamily", "typeface", "font"]) || "Arial"),
    fontFace: String(pick([theme, raw], ["fontFamily", "typeface", "font"]) || "Arial").replace(/[^\w .-]/g, "").trim() || "Arial",
    title: String(raw.title || headings[0] || name),
    map: headings,
    content,
    imported: true
  };
}
