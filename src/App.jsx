// === src/App.jsx ===
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import HomePage from "./components/HomePage";
import PresentationEditor from "./components/PresentationEditor";

// Load Carlito from Google Fonts dynamically (fallback for Calibri)
const loadFont = () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Carlito:wght@400;600;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};
loadFont();

// Import THEMES from Constants
import { THEMES, CUSTOM_GRADIENT_TEXT_COLOR } from "./Constants";

// Global style injection
const GlobalFont = () => (
  <style>{`
    :root { --font-sans: Calibri, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
    html, body, #root { height: 100%; }
    body {
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `}</style>
);

// Mock libraries for export functionality
const PptxGenJS = window.PptxGenJS || class MockPptxGenJS {
    addSlide() { return { addText: () => {}, addImage: () => {} }; }
    writeFile() { console.log("Mock PPTX file created."); }
};

const html2canvas = window.html2canvas || ((el) => new Promise(resolve => resolve({ toDataURL: () => "data:image/png;base64:mock" })));

const jsPDF = window.jsPDF || class MockJsPdf {
    constructor() {}
    addImage() {}
    save(filename) { console.log(`Mock PDF file saved: ${filename}`); }
};

// Utils
const stripEmojis = (s) => s && s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
const formatNum = (n) => n?.toLocaleString() || "0";
const buildProfile = (rows) => ({ nRows: rows.length, nCols: Object.keys(rows[0] || {}).length, kpis: [{ name: "Revenue", sum: 1234567.89 }] });
const stripHtml = (html) => { if (!html) return ''; const div = document.createElement('div'); div.innerHTML = html; return div.textContent || div.innerText || ''; };

const deepSanitize = (node) => {
    if (Array.isArray(node)) return node.map(deepSanitize);
    if (node && typeof node === "object") {
        const out = {};
        for (const k of Object.keys(node)) out[k] = deepSanitize(node[k]);
        return out;
    }
    if (typeof node === "string") return stripEmojis(node);
    return node;
};

const normalizeSections = (sections = []) => sections.map((s) => ({
    sectionTitle: s.sectionTitle || "Untitled Slide",
    points: (s.points || []).filter(Boolean),
    elements: s.elements || [],
    isThankYou: !!s.isThankYou,
    isSectionTitle: !!s.isSectionTitle,
    isChartSlide: !!s.isChartSlide,
    chartType: s.chartType,
    chartData: s.chartData
}));

// File Processor Hook
const useFileProcessor = () => {
    const [rawMeta, setRawMeta] = useState(null);
    const [rows, setRows] = useState([]);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setRawMeta({ filename: file.name, stats: "150 rows, 5 columns", fileObject: file });
            setRows(Array(150).fill({ date: '2023-01-01', revenue: 100, category: 'A' })); 
        } else { setRawMeta(null); setRows([]); }
    };
    return { rawMeta, rows, handleFileChangeFromProcessor: handleFileChange };
};

const App = () => {
    const { rawMeta, rows, handleFileChangeFromProcessor } = useFileProcessor();
    const fileInputRef = useRef(null);
    const mainSlideRef = useRef(null);

    const [isEditorMode, setIsEditorMode] = useState(false);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [presentation, setPresentation] = useState(null);
    const [themeKey, setThemeKey] = useState("light");
    const theme = THEMES[themeKey] || THEMES.light; // Define theme here
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const updatePresentationState = useCallback((newState) => { setPresentation(newState); }, []);
    const updatePresentationStateWithoutHistory = useCallback((newPresentationData) => { setPresentation(newPresentationData); }, []);

    useEffect(() => {
        if (presentation) {
            if (historyIndex >= 0 && JSON.stringify(presentation) === JSON.stringify(history[historyIndex])) return;
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(presentation);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [presentation, history, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            updatePresentationStateWithoutHistory(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex, updatePresentationStateWithoutHistory]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            updatePresentationStateWithoutHistory(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex, updatePresentationStateWithoutHistory]);

    const getSectionIndex = () => selectedSlideIndex - 1;

    const handleContentUpdate = useCallback((sectionKey, content, index = null) => {
        if (!presentation) return;
        let newPresentation = JSON.parse(JSON.stringify(presentation));
        if (selectedSlideIndex === 0) {
            if (sectionKey === 'title') newPresentation.title = content;
        } else {
            const secIndex = getSectionIndex();
            // Remove HTML formatting when updating from an editable area
            const cleanContent = stripHtml(content); 
            if (sectionKey === 'sectionTitle') newPresentation.sections[secIndex].sectionTitle = cleanContent;
            else if (sectionKey === 'points' && index !== null) newPresentation.sections[secIndex].points[index] = cleanContent;
        }
        updatePresentationState(newPresentation);
    }, [presentation, selectedSlideIndex, updatePresentationState]);

    const handleTitleChange = (content) => handleContentUpdate('sectionTitle', content);
    const handleHeroTitleChange = (content) => handleContentUpdate('title', content);
    const handlePointChange = (pointIndex, content) => handleContentUpdate('points', content, pointIndex);

    const handlePointDelete = useCallback((pointIndex) => {
        if (!presentation || selectedSlideIndex === 0) return;
        const secIndex = getSectionIndex();
        const newPoints = presentation.sections[secIndex].points.filter((_, i) => i !== pointIndex);
        const newPresentation = JSON.parse(JSON.stringify(presentation));
        newPresentation.sections[secIndex].points = newPoints;
        updatePresentationState(newPresentation);
    }, [presentation, selectedSlideIndex, updatePresentationState]);

    const handleAddPoint = useCallback(() => {
        if (!presentation || selectedSlideIndex === 0 || isLoading) return;
        const secIndex = getSectionIndex();
        const currentSlide = presentation.sections[secIndex];
        if (currentSlide.isSectionTitle || currentSlide.isChartSlide) {
            setModalMessage("Cannot add bullet points to this type of slide.");
            setShowModal(true);
            return;
        }
        const newPresentation = JSON.parse(JSON.stringify(presentation));
        const newPoint = currentSlide.isThankYou ? "Contact information or final message..." : "New bullet point added by user.";
        newPresentation.sections[secIndex].points.push(newPoint);
        updatePresentationState(newPresentation);
    }, [presentation, selectedSlideIndex, isLoading, updatePresentationState]);

    const handleFileChange = async (e) => {
        setPresentation(null); 
        setIsLoading(false); 
        setLoadingProgress(0); 
        setSelectedSlideIndex(0); 
        setHistory([]); 
        setHistoryIndex(-1);
        handleFileChangeFromProcessor(e);
        if (!e.target.files?.length && !rawMeta) setIsEditorMode(false);
    };

    const triggerFileInput = () => { if (fileInputRef.current) { fileInputRef.current.value = null; fileInputRef.current.click(); } };

    // --- MODIFIED initializeHistory for fixed Contents layout ---
    const initializeHistory = useCallback((initialPresentation) => {
        let originalSections = normalizeSections(initialPresentation.sections || []);
        const finalSections = [];

        // LIFT OUT SPECIFIC SECTIONS
        const findAndRemoveSection = (keyword) => {
            const index = originalSections.findIndex(s => s.sectionTitle?.toLowerCase().includes(keyword.toLowerCase()));
            if (index !== -1) return originalSections.splice(index, 1)[0];
            return null;
        };

        const contentsSection = findAndRemoveSection('contents');
        const relevantInquiryContent = findAndRemoveSection('relevant inquiries');
        const aboutDatasetContent = findAndRemoveSection('about the dataset');
        
        // Remove section title placeholders which were automatically generated for these parts
        originalSections = originalSections.filter(s => 
            !s.isSectionTitle || 
            (s.sectionTitle.toLowerCase() !== "relevant inquiries" && s.sectionTitle.toLowerCase() !== "about the dataset")
        );

        // TOC BUILDER
        const contentsPoints = [];
        let sectionIndex = 3; // Start numbering for regular sections/charts after the fixed 2

        // 1. Fixed: About the Dataset (Part 1)
        if (aboutDatasetContent) {
            // Use stripHtml on sectionTitle because it might contain unwanted AI formatting
            contentsPoints.push(`About the dataset: ${stripHtml(aboutDatasetContent.sectionTitle)} Part 1`);
        }
        // 2. Fixed: Relevant Inquiries (Part 2)
        if (relevantInquiryContent) {
            contentsPoints.push(`Relevant inquiries: ${stripHtml(relevantInquiryContent.sectionTitle)} Part 2`);
        }

        // Non-chart analytical slides (from AI) - use Section X label
        const nonChartSlides = originalSections.filter(s => !s.isChartSlide && !s.isSectionTitle && !s.isThankYou);
        nonChartSlides.forEach((slide) => {
            const title = stripHtml(slide.sectionTitle).replace('Key Finding: ', '').trim();
            contentsPoints.push(`${title} Section ${sectionIndex++}`);
        });

        // Chart slides (from backend) - use Chart X label
        const chartSlides = originalSections.filter(s => s.isChartSlide);
        chartSlides.forEach((slide, idx) => {
            const title = stripHtml(slide.sectionTitle).replace('Key Finding: ', '').trim();
            contentsPoints.push(`${title} Chart ${idx + 1}`);
        });

        // BUILD FINAL DECK
        finalSections.push({ ...(contentsSection || { sectionTitle: 'Contents', points: [] }), points: contentsPoints.slice(0, 20) });

        // Add Section/Detail slides in the specific order
        if (aboutDatasetContent) {
            finalSections.push({ sectionTitle: "About the Dataset", isSectionTitle: true, points: [] });
            finalSections.push({ ...aboutDatasetContent, sectionTitle: 'Dataset & Scope' });
        }
        if (relevantInquiryContent) {
            finalSections.push({ sectionTitle: "Relevant Inquiries", isSectionTitle: true, points: [] });
            finalSections.push({ ...relevantInquiryContent, sectionTitle: 'Key Questions & Analysis' });
        }

        finalSections.push(...nonChartSlides);
        finalSections.push(...chartSlides);
        finalSections.push({ sectionTitle: "Thanks for watching!", points: [], isThankYou: true });

        const finalPresentation = { ...initialPresentation, sections: finalSections };
        setPresentation(finalPresentation);
        setHistory([finalPresentation]);
        setHistoryIndex(0);
    }, []);

    const handleGenerate = async () => {
        if (!rawMeta || !rawMeta.fileObject) { setModalMessage("File data is not ready."); setShowModal(true); return; }
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", rawMeta.fileObject, rawMeta.filename);

        try {
            const r = await fetch("http://127.0.0.1:5000/api/analyze", { method: "POST", body: formData });
            const body = await r.json();
            if (!r.ok) throw new Error(`Server Error: ${body.error || r.statusText}`);
            let parsed = deepSanitize(body.presentation || {});
            parsed.title = stripEmojis(parsed.title || "Data Analysis Report");
            parsed.sections = normalizeSections(parsed.sections || []);
            initializeHistory(parsed);
        } catch (e) {
            const p = buildProfile(rows);
            const primaryMetricFallback = p.kpis[0];
            const fb = {
                title: "Data Analysis Report (Fallback)",
                sections: [
                    { sectionTitle: "Contents", points: ["Dataset structure and scope", "Summary of key values"] },
                    { sectionTitle: "Relevant Inquiries", points: ["What are the main business values?", "Which customer segments are driving value?"] },
                    { sectionTitle: "About the Dataset", points: [`${p.nRows.toLocaleString()} records across ${p.nCols} data fields.`, `Total value recorded: ${primaryMetricFallback ? formatNum(primaryMetricFallback.sum) : 'N/A'}.`] },
                ]
            };
            initializeHistory(deepSanitize(fb));
            setModalMessage(`Could not connect to backend or AI failed. Showing minimal fallback slides. Issue: ${String(e.message || e)}`);
            setShowModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToPptx = () => {
        if (!presentation) return;
        const t = theme;
        const pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_16x9";
        const colorText = t?.pageText?.replace("#", "") || "000000";
        const addFooter = (slide) => { 
          slide.addText("Auto-generated insights • " + new Date().toLocaleString(), { 
            x: 0.3, y: 6.7, w: 9.2, h: 0.3, fontSize: 9, color: "A7AAB3", align: "right", fontFace: "Calibri" 
          }); 
        };

        let hero = pptx.addSlide();
        hero.addText((presentation.title || '').replace(/<[^>]*>/g, ''), { 
          x: 0.5, y: 3, w: 9, h: 1, fontSize: 40, bold: true, color: CUSTOM_GRADIENT_TEXT_COLOR.replace("#", ""), align: 'center', isHtml: false, fontFace: "Calibri" 
        });

        (presentation.sections || []).forEach(section => {
            let s = pptx.addSlide();
            const isSpecialTitle = section.isSectionTitle || section.isThankYou;
            if (isSpecialTitle) {
                s.addText(section.sectionTitle.replace(/<[^>]*>/g, ''), { 
                  x: 0.5, y: 3, w: 9, h: 1, fontSize: 40, bold: true, color: CUSTOM_GRADIENT_TEXT_COLOR.replace("#", ""), align: 'center', fontFace: "Calibri" 
                });
            } else if (section.isChartSlide) {
                s.addText(section.sectionTitle.replace(/<[^>]*>/g, ''), { 
                  x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: colorText, align: 'center', fontFace: "Calibri" 
                });
                s.addText("[Chart: " + section.sectionTitle + "]", { 
                  x: 1.0, y: 2.0, w: 8, h: 4, fontSize: 18, color: colorText, align: 'center', fontFace: "Calibri" 
                });
            } else {
                const isContents = section.sectionTitle.toLowerCase() === "contents";
                if (isContents) {
                    s.addText(section.sectionTitle.replace(/<[^>]*>/g, ''), { 
                      x: 0.8, y: 0.8, w: 9, h: 0.8, fontSize: 30, bold: true, color: colorText, isHtml: false, fontFace: "Calibri" 
                    });
                    const contentsText = (section.points || []).map(p => stripHtml(p)).map(line => {
                        const match = line.match(/(.*?)(Part\s+\d+|Detail\s+\d+|Section\s+\d+|Chart\s+\d+):\s+(.*)$/);
                        if (match) return `${match[1].trim()}\t\t${match[2]}: ${match[3]}`;
                        const parts = line.split(': ');
                        if (parts.length > 1) {
                            const title = parts[0].trim();
                            const suffix = parts.slice(1).join(': ').trim();
                            return `${title}\t\t${suffix}`;
                        }
                        return line;
                    }).join("\n");
                    s.addText(contentsText, { 
                      x: 1.0, y: 1.8, w: 8.5, h: 4.8, fontSize: 18, color: colorText, lineSpacing: 28, fontFace: "Calibri" 
                    });
                } else {
                    s.addText(section.sectionTitle.replace(/<[^>]*>/g, ''), { 
                      x: 0.8, y: 0.8, w: 9, h: 0.8, fontSize: 30, bold: true, color: colorText, isHtml: false, fontFace: "Calibri" 
                    });
                    const bullets = (section.points || []).map((p) => `• ${stripHtml(p)}`).join("\n");
                    s.addText(bullets, { 
                      x: 1.0, y: 1.8, w: 8.5, h: 4.8, fontSize: 18, color: colorText, lineSpacing: 28, fontFace: "Calibri" 
                    });
                }
                addFooter(s);
            }
        });

        const safe = (presentation.title || "Data Analysis Report").replace(/<[^>]*>/g, "").replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
        pptx.writeFile({ fileName: `${safe}.pptx` });
    };

    const exportToPdf = async () => {
        const el = mainSlideRef.current;
        if (!el) { setModalMessage("Cannot capture slide content."); setShowModal(true); return; }
        const currentSlide = allSlides[selectedSlideIndex] || {};
        const safeTitle = (currentSlide.sectionTitle || 'Slide').replace(/<[^>]*>/g, "").replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
        try {
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('l', 'mm', 'a4'); 
            const width = pdf.internal.pageSize.getWidth();
            const slideWidth = width - 20; 
            const slideHeight = (slideWidth / 16) * 9;
            const x = 10;
            const y = (pdf.internal.pageSize.getHeight() - slideHeight) / 2; 
            pdf.addImage(imgData, 'JPEG', x, y, slideWidth, slideHeight);
            pdf.save(`${safeTitle}.pdf`);
        } catch (error) { setModalMessage(`PDF Export Failed: ${error.message}.`); setShowModal(true); }
    };

    const onExport = (format) => {
        if (!presentation) { setModalMessage("Please complete the presentation generation first."); setShowModal(true); return; }
        if (format === 'pptx') exportToPptx();
        else if (format === 'pdf') exportToPdf();
    };

    useEffect(() => { if (rawMeta) { setIsEditorMode(true); handleGenerate(); } }, [rawMeta]);
    useEffect(() => {
        let interval; 
        if (isLoading) {
            setLoadingProgress(0);
            interval = setInterval(() => { setLoadingProgress(prev => Math.min(95, prev + (rawMeta ? (Math.random() * 8 + 5) : (Math.random() * 2 + 1)))); }, 300);
        } else { setLoadingProgress(100); }
        return () => clearInterval(interval);
    }, [isLoading, rawMeta]);
    useEffect(() => { if (presentation) setSelectedSlideIndex(0); }, [presentation]);

    const allSlides = useMemo(() => {
        if (presentation) {
            const heroSlide = { isHero: true, sectionTitle: presentation.title, points: [], elements: presentation.heroElements || [] };
            return [heroSlide, ...(presentation.sections || [])];
        } 
        if (rawMeta || isLoading) {
            return [
                { isHero: true, sectionTitle: "Draft Presentation", subtitle: "AI is Generating Content", points: [] },
                ...Array(10).fill({ sectionTitle: "Generating...", isPlaceholder: true, points: [] })
            ];
        }
        return [];
    }, [presentation, rawMeta, isLoading]);

    const currentSlide = allSlides[selectedSlideIndex] || { sectionTitle: "", points: [], isHero: false, isThankYou: false, isSectionTitle: false, isChartSlide: false };
    const isSpecialBg = useMemo(() => currentSlide.isHero || currentSlide.isThankYou || currentSlide.isSectionTitle || currentSlide.isChartSlide, [currentSlide]);
    const isContentOrThankYouSlide = !currentSlide.isHero && !currentSlide.isSectionTitle && !currentSlide.isChartSlide;

    return (
        <div style={{ background: theme?.pageBg || '#ffffff', minHeight: "100vh", fontFamily: THEMES.TEXT_FONT }} className="transition-all duration-300">
            <GlobalFont />
            <input type="file" onChange={handleFileChange} className="hidden" ref={fileInputRef} accept=".xlsx,.xls,.csv" />
            {!isEditorMode ? (
                <HomePage onFileProcessed={handleFileChange} />
            ) : (
                <PresentationEditor
                    // State
                    rawMeta={rawMeta}
                    presentation={presentation}
                    isLoading={isLoading}
                    loadingProgress={loadingProgress}
                    selectedSlideIndex={selectedSlideIndex}
                    setSelectedSlideIndex={setSelectedSlideIndex}
                    theme={THEMES}
                    themeKey={themeKey}
                    setThemeKey={setThemeKey}
                    showModal={showModal}
                    setShowModal={setShowModal}
                    modalMessage={modalMessage}
                    
                    // Refs
                    fileInputRef={fileInputRef}
                    mainSlideRef={mainSlideRef}
                    
                    // Handlers
                    handleFileChange={handleFileChange}
                    triggerFileInput={triggerFileInput}
                    onExport={onExport}
                    handleContentUpdate={handleContentUpdate}
                    handleTitleChange={handleTitleChange}
                    handleHeroTitleChange={handleHeroTitleChange}
                    handlePointChange={handlePointChange}
                    handlePointDelete={handlePointDelete}
                    handleAddPoint={handleAddPoint}
                    undo={undo}
                    redo={redo}
                    historyIndex={historyIndex}
                    history={history}
                    
                    // Utils
                    allSlides={allSlides}
                    currentSlide={currentSlide}
                    isSpecialBg={isSpecialBg}
                    isContentOrThankYouSlide={isContentOrThankYouSlide}
                />
            )}
        </div>
    );
};

export default App;