import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import HomePage from "./components/HomePage";

// Import all UI components
import { 
    SlideFrame, HeroSlide, EditableBullets, MiniatureSlideContent, 
    SectionTitleSlideContent, CustomContentsSlide, ContentSlideTemplate, 
    SkeletonMainContent, Header, GenerationProgress, LeftSidebar, DesignPanel 
} from "./EditorComponents";

// Import constants
import { THEMES, CUSTOM_GRADIENT_TEXT_COLOR } from "./Constants";

// External dependencies
const PptxGenJS = window.PptxGenJS || class MockPptxGenJS {
    addSlide() { return { addText: () => {}, addImage: () => {} }; }
    writeFile() { console.log("Mock PPTX file created."); }
};

const html2canvas = window.html2canvas || ((el) => new Promise(resolve => resolve({ toDataURL: () => "data:image/png;base64:mock" })));

const jsPDF = window.jsPDF || class MockJsPDF {
    constructor() {}
    addImage() {}
    save(filename) { console.log(`Mock PDF file saved: ${filename}`); }
};

// Utilities
const stripEmojis = (s) => s && s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

const formatNum = (n) => n?.toLocaleString() || "0";

const buildProfile = (rows) => ({ 
    nRows: rows.length, 
    nCols: Object.keys(rows[0] || {}).length, 
    kpis: [{ name: "Revenue", sum: 1234567.89 }] 
});

const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

// Data Helpers
const deepSanitize = (node) => {
    if (Array.isArray(node)) return node.map(deepSanitize);
    if (node && typeof node === "object") {
        const out = {};
        for (const k of Object.keys(node)) { 
            out[k] = deepSanitize(node[k]); 
        }
        return out;
    }
    if (typeof node === "string") { 
        return stripEmojis(node); 
    }
    return node;
};

const normalizeSections = (sections = []) => {
    return sections.map((s) => ({
        sectionTitle: s.sectionTitle || "Untitled Slide", 
        points: (s.points || []).filter(Boolean),
        elements: s.elements || [],
        isThankYou: s.isThankYou || false, 
        isSectionTitle: s.isSectionTitle || false,
    }));
};

// File Processor Hook
const useFileProcessor = () => {
    const [rawMeta, setRawMeta] = useState(null);
    const [rows, setRows] = useState([]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setRawMeta({ 
                filename: file.name, 
                stats: "150 rows, 5 columns", 
                fileObject: file 
            });
            setRows(Array(150).fill({ date: '2023-01-01', revenue: 100, category: 'A' })); 
        } else {
            setRawMeta(null);
            setRows([]);
        }
    };

    return { 
        rawMeta, 
        rows, 
        handleFileChangeFromProcessor: handleFileChange 
    };
};

const App = () => {
    const { rawMeta, rows, handleFileChangeFromProcessor } = useFileProcessor();
    const fileInputRef = useRef(null);
    const mainSlideRef = useRef(null);

    const [isEditorMode, setIsEditorMode] = useState(false); 
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0); 
    const [presentation, setPresentation] = useState(null);
    const [themeKey, setThemeKey] = useState("light");
    const theme = THEMES[themeKey];
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0); 
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    
    // History state
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // State update helpers
    const updatePresentationState = useCallback((newState) => { 
        setPresentation(newState); 
    }, []);

    const updatePresentationStateWithoutHistory = useCallback((newPresentationData) => { 
        setPresentation(newPresentationData); 
    }, []);

    // History management
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

    // Content handlers
    const handleContentUpdate = useCallback((sectionKey, content, index = null) => {
        if (!presentation) return;
        let newPresentation = JSON.parse(JSON.stringify(presentation));
        
        if (selectedSlideIndex === 0) {
            if (sectionKey === 'title') newPresentation.title = content;
        } else {
            const secIndex = getSectionIndex();
            if (sectionKey === 'sectionTitle') {
                newPresentation.sections[secIndex].sectionTitle = content;
            } else if (sectionKey === 'points' && index !== null) {
                newPresentation.sections[secIndex].points[index] = content;
            }
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
        
        if (currentSlide.isSectionTitle) {
            setModalMessage("Cannot add bullet points to a Section Title slide.");
            setShowModal(true);
            return;
        }

        const newPresentation = JSON.parse(JSON.stringify(presentation));
        const newPoint = currentSlide.isThankYou ? 
            "Contact information or final message..." : 
            "New bullet point added by user.";
        newPresentation.sections[secIndex].points.push(newPoint);
        updatePresentationState(newPresentation);
    }, [presentation, selectedSlideIndex, isLoading, updatePresentationState]);

    // File handling
    const handleFileChange = async (e) => {
        setPresentation(null); 
        setIsLoading(false); 
        setLoadingProgress(0); 
        setSelectedSlideIndex(0); 
        setHistory([]); 
        setHistoryIndex(-1);
        
        handleFileChangeFromProcessor(e); 
        
        if (!e.target.files?.length && !rawMeta) {
            setIsEditorMode(false); 
        }
    };

    const triggerFileInput = () => { 
        if (fileInputRef.current) { 
            fileInputRef.current.value = null; 
            fileInputRef.current.click(); 
        } 
    };

    // AI Generation logic
    const initializeHistory = useCallback((initialPresentation) => {
        let originalSections = initialPresentation.sections || [];
        const finalSections = [];
        
        const findAndRemoveSection = (keyword) => {
            const index = originalSections.findIndex(s => 
                s.sectionTitle.toLowerCase().includes(keyword.toLowerCase())
            );
            if (index !== -1) return originalSections.splice(index, 1)[0];
            return null;
        };
        
        const contentsSection = findAndRemoveSection('contents');
        const relevantInquiryContent = findAndRemoveSection('relevant inquiries');
        const aboutDatasetContent = findAndRemoveSection('about the dataset');
        const analyticalContentSlides = originalSections.map(s => ({ 
            ...s, 
            sectionTitle: s.sectionTitle, 
            points: s.points 
        }));
        
        // Build TOC points
        const contentsPoints = [];
        let contentIndex = 1; 
        
        if (relevantInquiryContent) { 
            contentsPoints.push(`Relevant Inquiries Part ${contentIndex++}`); 
            contentsPoints.push(`Key Questions & Analysis Detail ${contentIndex++}`); 
        }
        
        if (aboutDatasetContent) { 
            contentsPoints.push(`About the Dataset Part ${contentIndex++}`); 
            contentsPoints.push(`Dataset & Scope Detail ${contentIndex++}`); 
        }
        
        analyticalContentSlides.forEach((slide) => { 
            contentsPoints.push(
                `${stripHtml(slide.sectionTitle).replace('Key Finding: ', '').trim()} Section ${contentIndex++}`
            ); 
        });

        // Assemble Final Sections
        finalSections.push({ 
            ...(contentsSection || { sectionTitle: 'Contents', points: [] }), 
            points: contentsPoints.slice(0, 5) 
        });

        if (relevantInquiryContent) {
            finalSections.push({ sectionTitle: "Relevant Inquiries", isSectionTitle: true, points: [] });
            finalSections.push({ 
                ...relevantInquiryContent, 
                sectionTitle: 'Key Questions & Analysis', 
                points: relevantInquiryContent.points 
            });
        }

        if (aboutDatasetContent) {
            finalSections.push({ sectionTitle: "About the Dataset", isSectionTitle: true, points: [] });
            finalSections.push({ 
                ...aboutDatasetContent, 
                sectionTitle: 'Dataset & Scope', 
                points: aboutDatasetContent.points 
            });
        }

        finalSections.push(...analyticalContentSlides);
        finalSections.push({ sectionTitle: "Thanks for watching!", points: [], isThankYou: true });

        const finalPresentation = { ...initialPresentation, sections: finalSections };
        setPresentation(finalPresentation);
        setHistory([finalPresentation]);
        setHistoryIndex(0);
    }, []);

    const handleGenerate = async () => {
        if (!rawMeta || !rawMeta.fileObject) { 
            setModalMessage("File data is not ready."); 
            setShowModal(true); 
            return; 
        }
        
        setIsLoading(true);

        const formData = new FormData();
        formData.append("file", rawMeta.fileObject, rawMeta.filename);

        try {
            const r = await fetch("http://127.0.0.1:5000/api/analyze", { 
                method: "POST", 
                body: formData 
            });
            const body = await r.json();

            if (!r.ok) throw new Error(`Server Error: ${body.error || r.statusText}`);
            
            let parsed = deepSanitize(body.presentation || {});
            parsed.title = stripEmojis(parsed.title || "Data Analysis Report");
            parsed.sections = normalizeSections(parsed.sections || []);

            initializeHistory(parsed);
        } catch (e) {
            // Fallback Logic
            const p = buildProfile(rows);
            const primaryMetricFallback = p.kpis[0];
            const fb = {
                title: "Data Analysis Report (Fallback)",
                sections: [
                    { sectionTitle: "Contents", points: ["Dataset structure and scope", "Summary of key values", "Analysis inquiries"] },
                    { sectionTitle: "Relevant Inquiries", points: ["What are the main business values?", "Which customer segments are driving value?"] },
                    { sectionTitle: "About the Dataset", points: [
                        `${p.nRows.toLocaleString()} records across ${p.nCols} data fields.`, 
                        `Total value recorded: ${primaryMetricFallback ? formatNum(primaryMetricFallback.sum) : 'N/A'}.`
                    ]},
                ]
            };
            initializeHistory(deepSanitize(fb));
            setModalMessage(`Could not connect to backend or AI failed. Showing minimal fallback slides. Issue: ${String(e.message || e)}`);
            setShowModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Export logic
    const exportToPptx = () => {
        const t = THEMES[themeKey];
        const pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_16x9";
        const colorText = t.pageText.replace("#", ""); 

        const addFooter = (slide) => { 
            slide.addText(
                "Auto-generated insights • " + new Date().toLocaleString(), 
                { x: 0.3, y: 6.7, w: 9.2, h: 0.3, fontSize: 9, color: "A7AAB3", align: "right" }
            ); 
        };
        
        let hero = pptx.addSlide();
        hero.addText(
            presentation.title.replace(/<[^>]*>/g, ''), 
            { 
                x: 0.5, y: 3, w: 9, h: 1, 
                fontSize: 40, bold: true, 
                color: CUSTOM_GRADIENT_TEXT_COLOR.replace("#", ""), 
                align: 'center', 
                isHtml: false 
            }
        );
        
        presentation.sections.forEach(section => {
            let s = pptx.addSlide();
            const isSpecialTitle = section.isSectionTitle || section.isThankYou;
            
            if (isSpecialTitle) {
                s.addText(
                    section.sectionTitle.replace(/<[^>]*>/g, ''), 
                    { 
                        x: 0.5, y: 3, w: 9, h: 1, 
                        fontSize: 40, bold: true, 
                        color: CUSTOM_GRADIENT_TEXT_COLOR.replace("#", ""), 
                        align: 'center' 
                    }
                );
            } else {
                const isContents = section.sectionTitle.toLowerCase() === "contents";
                
                if (isContents) {
                    s.addText(
                        section.sectionTitle.replace(/<[^>]*>/g, ''), 
                        { x: 0.8, y: 0.8, w: 9, h: 0.8, fontSize: 30, bold: true, color: colorText, isHtml: false }
                    );
                    
                    const contentsText = (section.points || [])
                        .map(p => stripHtml(p))
                        .map(line => {
                            const match = line.match(/(.*?)(Part\s+\d+|Detail\s+\d+|Section\s+\d+)$/);
                            if (match) return `${match[1].trim()}\t\t${match[2]}`;
                            return line;
                        })
                        .join("\n");
                    
                    s.addText(contentsText, { 
                        x: 1.0, y: 1.8, w: 8.5, h: 4.8, 
                        fontSize: 18, color: colorText, 
                        lineSpacing: 28 
                    });
                } else {
                    s.addText(
                        section.sectionTitle.replace(/<[^>]*>/g, ''), 
                        { x: 0.8, y: 0.8, w: 9, h: 0.8, fontSize: 30, bold: true, color: colorText, isHtml: false }
                    );
                    
                    const bullets = (section.points || []).map((p) => `• ${stripHtml(p)}`).join("\n");
                    
                    s.addText(bullets, { 
                        x: 1.0, y: 1.8, w: 8.5, h: 4.8, 
                        fontSize: 18, color: colorText, 
                        lineSpacing: 28 
                    });
                }
                addFooter(s);
            }
        });

        const safe = (presentation.title || "Data Analysis Report")
            .replace(/<[^>]*>/g, "")
            .replace(/[\\/:*?"<>|]/g, "")
            .slice(0, 80);
        pptx.writeFile({ fileName: `${safe}.pptx` });
    };

    const exportToPdf = async () => {
        const el = mainSlideRef.current;
        if (!el) { 
            setModalMessage("Cannot capture slide content."); 
            setShowModal(true); 
            return; 
        }

        const safeTitle = (currentSlide.sectionTitle || 'Slide')
            .replace(/<[^>]*>/g, "")
            .replace(/[\\/:*?"<>|]/g, "")
            .slice(0, 50);

        try {
            const canvas = await html2canvas(el, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: null 
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF('l', 'mm', 'a4'); 
            const width = pdf.internal.pageSize.getWidth();
            const slideWidth = width - 20; 
            const slideHeight = (slideWidth / 16) * 9;
            const x = 10;
            const y = (pdf.internal.pageSize.getHeight() - slideHeight) / 2; 

            pdf.addImage(imgData, 'JPEG', x, y, slideWidth, slideHeight);
            pdf.save(`${safeTitle}.pdf`);

        } catch (error) {
            setModalMessage(`PDF Export Failed: ${error.message}.`);
            setShowModal(true);
        }
    };
    
    const onExport = (format) => {
        if (!presentation) { 
            setModalMessage("Please complete the presentation generation first."); 
            setShowModal(true); 
            return; 
        }
        if (format === 'pptx') exportToPptx();
        else if (format === 'pdf') exportToPdf();
    };

    // Effects
    useEffect(() => { 
        if (rawMeta) { 
            setIsEditorMode(true); 
            handleGenerate(); 
        } 
    }, [rawMeta]);

    useEffect(() => { 
        let interval; 
        if (isLoading) { 
            setLoadingProgress(0); 
            interval = setInterval(() => { 
                setLoadingProgress(prev => 
                    Math.min(95, prev + (rawMeta ? (Math.random() * 8 + 5) : (Math.random() * 2 + 1)))
                ); 
            }, 300); 
        } else { 
            setLoadingProgress(100); 
        } 
        return () => clearInterval(interval); 
    }, [isLoading, rawMeta]);

    useEffect(() => { 
        if (presentation) setSelectedSlideIndex(0); 
    }, [presentation]);
    
    // Derived state
    const allSlides = useMemo(() => {
        if (presentation) {
            const heroSlide = { 
                isHero: true, 
                sectionTitle: presentation.title, 
                points: [], 
                elements: presentation.heroElements || [] 
            };
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
    
    const currentSlide = allSlides[selectedSlideIndex] || { 
        sectionTitle: "", 
        points: [], 
        isHero: false, 
        isThankYou: false, 
        isSectionTitle: false 
    };
    
    const isSpecialBg = useMemo(() => 
        currentSlide.isHero || currentSlide.isThankYou || currentSlide.isSectionTitle, 
        [currentSlide]
    );
    
    const isContentOrThankYouSlide = !currentSlide.isHero && !currentSlide.isSectionTitle;

    return (
        <div style={{ background: theme.pageBg, minHeight: "100vh", fontFamily: THEMES.TEXT_FONT }} className="transition-all duration-300">
            <input 
                type="file" 
                onChange={handleFileChange} 
                className="hidden" 
                ref={fileInputRef} 
                accept=".xlsx,.xls,.csv" 
            />
            
            {!isEditorMode ? (
                <HomePage onFileProcessed={handleFileChange} />
            ) : (
                <div className="flex flex-col h-screen overflow-hidden">
                    <Header 
                        theme={theme} 
                        presentation={presentation} 
                        onExport={onExport}
                        isLoading={isLoading}
                        rawMeta={rawMeta}
                        triggerFileInput={triggerFileInput}
                    />

                    <div className="flex flex-1 overflow-hidden">
                        <LeftSidebar 
                            theme={theme}
                            presentation={presentation} 
                            allSlides={allSlides}
                            selectedSlideIndex={selectedSlideIndex} 
                            setSelectedSlideIndex={setSelectedSlideIndex}
                            isLoading={isLoading}
                        />

                        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex flex-col items-center relative">
                            {isLoading && (
                                <GenerationProgress 
                                    rawMeta={rawMeta} 
                                    loadingProgress={loadingProgress} 
                                    theme={theme} 
                                />
                            )}

                            <h3 className="text-sm text-gray-500 mb-4 font-medium">
                                Editing Slide {selectedSlideIndex + 1} of {allSlides.length}
                            </h3>

                            <SlideFrame 
                                theme={theme} 
                                isSelected={true} 
                                ref={mainSlideRef} 
                                isSpecialBg={isSpecialBg}
                            >
                                {isLoading && !presentation ? (
                                    <SkeletonMainContent theme={theme} />
                                ) : currentSlide && (
                                    <div 
                                        style={{ 
                                            padding: 48, 
                                            color: isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText 
                                        }} 
                                        className="h-full relative"
                                    >
                                        {currentSlide.isSectionTitle && (
                                            <SectionTitleSlideContent 
                                                title={currentSlide.sectionTitle} 
                                                isSpecialBg={isSpecialBg} 
                                                onTitleChange={handleTitleChange}
                                            />
                                        )}

                                        {currentSlide.isHero && (
                                            <HeroSlide 
                                                title={currentSlide.sectionTitle} 
                                                theme={theme} 
                                                onTitleChange={handleHeroTitleChange}
                                                onSubtitleChange={() => {}}
                                                isSpecialBg={isSpecialBg}
                                            />
                                        )}

                                        {isContentOrThankYouSlide && currentSlide.sectionTitle.toLowerCase() === 'contents' ? (
                                            <CustomContentsSlide 
                                                slide={currentSlide}
                                                theme={theme}
                                                onPointChange={handlePointChange}
                                                isSpecialBg={isSpecialBg}
                                            />
                                        ) : isContentOrThankYouSlide && currentSlide.isThankYou ? (
                                            <div className="flex flex-col justify-center items-center text-center h-full w-full">
                                                <h2 
                                                    className="text-6xl font-extrabold transition-colors outline-none" 
                                                    style={{ 
                                                        fontFamily: THEMES.DISPLAY_FONT, 
                                                        color: isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.pageText 
                                                    }}
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    dangerouslySetInnerHTML={{ __html: currentSlide.sectionTitle }}
                                                    onBlur={e => handleContentUpdate('sectionTitle', e.currentTarget.innerHTML)}
                                                />
                                                <EditableBullets 
                                                    items={currentSlide.points} 
                                                    theme={theme} 
                                                    onPointChange={handlePointChange}
                                                    onPointDelete={handlePointDelete}
                                                    onFocus={() => {}}
                                                    isSpecialBg={isSpecialBg}
                                                />
                                            </div>
                                        ) : isContentOrThankYouSlide ? (
                                            <ContentSlideTemplate
                                                slide={currentSlide}
                                                theme={theme}
                                                onTitleChange={handleTitleChange}
                                                onPointChange={handlePointChange}
                                                onPointDelete={handlePointDelete}
                                                onFocus={() => {}}
                                                isSpecialBg={isSpecialBg}
                                            />
                                        ) : null}
                                    </div>
                                )}
                            </SlideFrame>
                            <div className="h-20"></div>
                        </main>

                        <DesignPanel 
                            theme={theme} 
                            themeKey={themeKey} 
                            setThemeKey={setThemeKey} 
                            onUndo={undo}
                            onRedo={redo}
                            canUndo={historyIndex > 0}
                            canRedo={historyIndex < history.length - 1}
                            onAddPoint={handleAddPoint}
                            isContentSlide={isContentOrThankYouSlide}
                        />
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white text-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-sm text-center border border-gray-200 animate-in fade-in zoom-in duration-300">
                        <h3 className="2xl font-bold mb-4" style={{ color: theme.primary }}>Notice</h3>
                        <p className="text-gray-600 whitespace-pre-wrap mb-6 text-base leading-relaxed" style={{ fontFamily: THEMES.TEXT_F }}>
                            {modalMessage}
                        </p>
                        <button 
                            onClick={() => setShowModal(false)} 
                            style={{ backgroundColor: theme.primary }} 
                            className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-colors shadow-lg shadow-blue-400/50"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;