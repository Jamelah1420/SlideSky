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
// NOTE: You must ensure your Constants file defines THEMES and CUSTOM_GRADIENT_TEXT_COLOR
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
    // Theme definition: used to pass the theme object to PresentationEditor
    const theme = THEMES[themeKey] || THEMES.light; 
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const updatePresentationState = useCallback((newState) => { setPresentation(newState); }, []);
    const updatePresentationStateWithoutHistory = useCallback((newPresentationData) => { setPresentation(newPresentationData); }, []);
    
    // Progress interval logic
    useEffect(() => {
      let interval; 
      if (isLoading) {
        setLoadingProgress(0);
        interval = setInterval(() => { 
          setLoadingProgress(prev => {
            const increment = rawMeta ? (Math.random() * 5 + 3) : (Math.random() * 1.5 + 0.5);
            return Math.min(95, prev + increment);
          });
        }, 400); 
      } else { 
        setLoadingProgress(100);
        const timeout = setTimeout(() => setLoadingProgress(0), 1000); // Reset after completion visibility
        return () => clearTimeout(timeout);
      }
      return () => clearInterval(interval);
    }, [isLoading, rawMeta]);
    
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

    // --- MODIFIED: initializeHistory for AI-generated titles ---
    const initializeHistory = useCallback((initialPresentation) => {
        let originalSections = normalizeSections(initialPresentation.sections || []);
        
        // Find and separate special sections
        const findAndRemoveSection = (keyword) => {
            const index = originalSections.findIndex(s => s.sectionTitle?.toLowerCase().includes(keyword.toLowerCase()));
            if (index !== -1) return originalSections.splice(index, 1)[0];
            return null;
        };

        const contentsSection = findAndRemoveSection('contents');
        const aboutDatasetContent = findAndRemoveSection('about the dataset');
        
        // Remove section title placeholders
        originalSections = originalSections.filter(s => 
            !s.isSectionTitle || 
            (s.sectionTitle.toLowerCase() !== "about the dataset")
        );

        // Build Contents points from AI-generated titles
        const contentsPoints = [];
        
        // Fixed sections
        if (aboutDatasetContent) {
            contentsPoints.push(`About the dataset`);
        }
        contentsPoints.push(`Relevant Inquiries`);

        // Process remaining sections in order (charts are already inserted by backend)
        originalSections.forEach((slide, index) => {
            const title = stripHtml(slide.sectionTitle).trim();
            
            if (slide.isChartSlide) {
                // Chart slides get "Chart" label
                contentsPoints.push(`${title} Chart`);
            } else if (!slide.isThankYou && !slide.isSectionTitle && title.toLowerCase() !== 'about the dataset') {
                // Regular text slides use AI-generated titles
                contentsPoints.push(title);
            }
        });

        // Build final deck - PRESERVE THE ORDER from backend (charts already inserted)
        const finalSections = [];
        
        // Add Test slide after title slide
        finalSections.push({ 
            sectionTitle: "Contents", 
            points: contentsPoints,
            isTestSlide: true 
        });

        // Add fixed sections
        if (aboutDatasetContent) {
            finalSections.push({ sectionTitle: "About the Dataset", isSectionTitle: true, points: [] });
            finalSections.push({ ...aboutDatasetContent, sectionTitle: 'Dataset & Scope' });
        }

        // Add Relevant Inquiries as section title only (no content slide)
        finalSections.push({ sectionTitle: "Relevant Inquiries", isSectionTitle: true, points: [] });

        // Add all remaining sections in their original order (charts are already in place)
        finalSections.push(...originalSections.filter(s => !s.isThankYou && s.sectionTitle.toLowerCase() !== 'about the dataset'));
        
        // Add thank you slide
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

    useEffect(() => { if (rawMeta) { setIsEditorMode(true); handleGenerate(); } }, [rawMeta]);
    
    // NOTE: This effect is likely redundant with the one above, but kept for matching context.
    useEffect(() => {
        let interval; 
        if (isLoading) {
            setLoadingProgress(0);
            interval = setInterval(() => { setLoadingProgress(prev => Math.min(95, prev + (rawMeta ? (Math.random() * 8 + 5) : (Math.random() * 2 + 1)))); }, 300);
        } else { 
            setLoadingProgress(100); 
            const timeout = setTimeout(() => setLoadingProgress(0), 500);
            return () => clearTimeout(timeout);
        }
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
                    // Passing the correct single theme object
                    theme={theme} 
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