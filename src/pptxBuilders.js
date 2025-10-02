import PptxGenJS from "pptxgenjs";

/* ===== THEME ===== */
export const PPTX_THEME = {
  BG_LIGHT: "#FFFFFF",
  TXT_DARK: "#2C2C2C",
  TXT_MUTED: "#6A6A6A",
  ACCENT: "#0078D4",
  BG_DARK: "#0D1117",
  TXT_ON_DARK: "#EFEFEF",
  TXT_MUTED_ON_DARK: "#9AA1A9",
  DISPLAY_FONT: "Inter",
  TEXT_FONT: "Inter Light",
  TEXT_FONT_BOLD: "Inter SemiBold",
  TITLE_SIZE: 36,
  SUBTITLE_SIZE: 26,
  BODY_SIZE: 20,
  TITLE_HERO: 60,
  BULLET_LINE: 200,
};

const LAYOUT = {
  page: { w: 10, h: 5.625 },
  band: { y: 0, h: 0.65 },
  dividerY: 0.65,
  accentRule: { x: 0.6, y: 1.1, w: 0.06, h: 4.9 },
  bullets: { x: 0.95, y: 1.5, w: 8.5, h: 4.8 },
  bulletsAnalytical: { x: 0.95, y: 2.2, w: 5.2, h: 3.9 },
  takeawayCard: { x: 6.4, y: 1.25, w: 3.2, h: 2.1 },
};

/* ===== TEXT NORMALIZATION (fixes [object Object]) ===== */
// Returns a plain string from any input (string | number | object | array)
const toPlainString = (val) => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean")
    return String(val);

  // Rich text object? { text: string | arrayOfRuns }
  if (typeof val === "object" && "text" in val) {
    const t = val.text;
    if (Array.isArray(t)) {
      // array of runs like [{text:'A'}, {text:'B'}]
      return t.map((r) => toPlainString(r?.text ?? r)).join("");
    }
    return toPlainString(t);
  }

  // Array (maybe runs/objects/strings)
  if (Array.isArray(val)) return val.map((v) => toPlainString(v)).join("");

  // Fallback
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
};

/* ===== MARKDOWN → RUNS ===== */
export const parseMarkdownBolding = (raw, onDark = false) => {
  const t = PPTX_THEME;
  const boldColor = (onDark ? t.TXT_ON_DARK : t.TXT_DARK).replace("#", "");
  const normalColor = (onDark ? t.TXT_MUTED_ON_DARK : t.TXT_MUTED).replace("#", "");
  const text = toPlainString(raw);

  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    return {
      text: content,
      options: {
        bold: isBold,
        color: isBold ? boldColor : normalColor,
        fontFace: isBold ? t.TEXT_FONT_BOLD : t.TEXT_FONT,
      },
    };
  });
};

// Build bullet paragraph objects (safe)
const bulletParas = (items, { onDark = false, size = PPTX_THEME.BODY_SIZE } = {}) =>
  (items || [])
    .map((s) => toPlainString(s))
    .filter((s) => s.trim().length > 0)
    .map((s) => ({
      text: parseMarkdownBolding(s, onDark),
      options: {
        bullet: { code: "2022" }, // •
        indentLevel: 0,
        fontSize: size,
        lineSpacing: PPTX_THEME.BULLET_LINE,
      },
    }));

/* ===== MASTER & TITLE ===== */
export const defineMasterSlide = (pptx) => {
  const t = PPTX_THEME;
  pptx.defineSlideMaster({
    title: "MASTER",
    background: { fill: t.BG_LIGHT.replace("#", "") },
    objects: [
      { rect: { x: 0, y: LAYOUT.band.y, w: LAYOUT.page.w, h: LAYOUT.band.h, fill: t.BG_LIGHT.replace("#", "") } },
      { rect: { x: 0, y: LAYOUT.dividerY, w: LAYOUT.page.w, h: 0.02, fill: t.ACCENT.replace("#", "") } },
      { rect: { ...LAYOUT.accentRule, fill: t.ACCENT.replace("#", "") } },
      {
        text: {
          text: `Auto-generated insights • ${new Date().toLocaleString()}`,
          options: {
            x: 0.4, y: 5.35, w: 9.2, h: 0.3,
            fontSize: 9, color: t.TXT_MUTED.replace("#", ""), align: "right", fontFace: t.TEXT_FONT,
          },
        },
      },
    ],
  });
};

export const createTitleSlide = (pptx, presentation) => {
  const t = PPTX_THEME;
  const slide = pptx.addSlide({ masterName: "MASTER" });
  slide.background = { fill: t.BG_DARK.replace("#", "") };

  slide.addText("Executive HR Data Summary", {
    x: 0.5, y: 1.5, w: 9.0, h: 0.5,
    fontSize: t.SUBTITLE_SIZE, bold: true, color: t.TXT_ON_DARK.replace("#", ""), align: "center",
    fontFace: t.DISPLAY_FONT,
  });

  slide.addText(toPlainString(presentation?.title || "Presentation Title"), {
    x: 0.5, y: 2.5, w: 9.0, h: 1.5,
    fontSize: t.TITLE_HERO, bold: true, color: t.TXT_ON_DARK.replace("#", ""), align: "center",
    fontFace: t.DISPLAY_FONT, lineSpacing: 100,
  });

  if (presentation?.subtitle) {
    slide.addText(toPlainString(presentation.subtitle), {
      x: 0.5, y: 4.2, w: 9.0, h: 0.5,
      fontSize: t.SUBTITLE_SIZE, color: t.TXT_MUTED_ON_DARK.replace("#", ""), align: "center",
      fontFace: t.TEXT_FONT,
    });
  }

  const email = presentation?.contact?.email;
  const name = presentation?.contact?.name;
  if (email || name) {
    slide.addText(
      [
        ...(email ? [{ text: `\u2709 ${toPlainString(email)}`, options: { color: t.TXT_MUTED_ON_DARK.replace("#", ""), fontSize: 14, fontFace: t.TEXT_FONT } }] : []),
        ...(email && name ? [{ text: "  •  ", options: { color: t.TXT_MUTED_ON_DARK.replace("#", ""), fontSize: 14, fontFace: t.TEXT_FONT } }] : []),
        ...(name ? [{ text: toPlainString(name), options: { color: t.TXT_MUTED_ON_DARK.replace("#", ""), fontSize: 14, fontFace: t.TEXT_FONT } }] : []),
      ],
      { x: 0.5, y: 5.1, w: 9.0, h: 0.6, align: "center" }
    );
  }
};

/* ===== CONTENT SLIDES ===== */
export const createContentSlide = (pptx, section, idx) => {
  const t = PPTX_THEME;
  const slide = pptx.addSlide({ masterName: "MASTER" });

  const titleText = toPlainString(section?.sectionTitle || `Slide ${idx + 2}`);
  const pts = Array.isArray(section?.points) ? section.points : [];
  const isAnalytical = idx >= 2;

  // Title in the top band
  slide.addText(titleText, {
    x: 0.6, y: 0.15, w: 8.8, h: 0.5,
    fontSize: 20, bold: true, color: t.TXT_DARK.replace("#", ""), fontFace: t.DISPLAY_FONT,
  });

  if (!pts.length) return;

  if (!isAnalytical) {
    slide.addText(
      bulletParas(pts, { onDark: false, size: t.BODY_SIZE }),
      { x: LAYOUT.bullets.x, y: LAYOUT.bullets.y, w: LAYOUT.bullets.w, h: LAYOUT.bullets.h, fontFace: t.TEXT_FONT }
    );
    return;
  }

  // Analytical: first is subheading, last is takeaway
  const subheading = toPlainString(pts[0] || "");
  const bodyBullets = pts.slice(1, Math.max(pts.length - 1, 1));
  const takeaway = toPlainString(pts[pts.length - 1] || "");

  slide.addText(parseMarkdownBolding(subheading, false), {
    x: 0.95, y: 1.2, w: 5.2, h: 0.7,
    fontSize: t.SUBTITLE_SIZE, bold: true, color: t.TXT_DARK.replace("#", ""), fontFace: t.DISPLAY_FONT,
  });

  slide.addText(
    bulletParas(bodyBullets, { onDark: false, size: 19 }),
    { x: LAYOUT.bulletsAnalytical.x, y: LAYOUT.bulletsAnalytical.y, w: LAYOUT.bulletsAnalytical.w, h: LAYOUT.bulletsAnalytical.h, fontFace: t.TEXT_FONT }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: LAYOUT.takeawayCard.x, y: LAYOUT.takeawayCard.y, w: LAYOUT.takeawayCard.w, h: LAYOUT.takeawayCard.h,
    fill: t.BG_LIGHT.replace("#", ""), line: { color: t.ACCENT.replace("#", ""), width: 1.2 }, rectRadius: 0.15,
  });
  slide.addText("Key takeaway", {
    x: LAYOUT.takeawayCard.x + 0.15, y: LAYOUT.takeawayCard.y + 0.12, w: LAYOUT.takeawayCard.w - 0.3, h: 0.3,
    fontSize: 12, bold: true, color: t.ACCENT.replace("#", ""), fontFace: t.DISPLAY_FONT,
  });
  
  // 🛑 FIX APPLIED HERE: Correctly pass the array of rich text objects (runs)
  // as the 'text' property within the main object.
  slide.addText(
    [
      {
        text: parseMarkdownBolding(takeaway, false), 
        options: {
          fontSize: 14, 
          color: t.TXT_DARK.replace("#", ""), 
          fontFace: t.TEXT_FONT, 
          wrap: true,
        }
      }
    ],
    { 
      x: LAYOUT.takeawayCard.x + 0.18, 
      y: LAYOUT.takeawayCard.y + 0.45, 
      w: LAYOUT.takeawayCard.w - 0.36, 
      h: LAYOUT.takeawayCard.h - 0.6,
    }
  );
};

export const createSectionSlides = (pptx, sections = []) => {
  sections.forEach((s, i) => createContentSlide(pptx, s, i));
};

/* ===== BUILD & DOWNLOAD ===== */
export const buildAndDownloadPresentation = async (presentation, sections, filename = "Presentation.pptx") => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  defineMasterSlide(pptx);
  createTitleSlide(pptx, presentation);
  createSectionSlides(pptx, sections);
  await pptx.writeFile({ fileName: filename });
};