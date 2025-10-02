// PresentationPageUI.jsx

import React, { useState, useEffect, useRef } from "react";

// =========================== DESIGN CONSTANTS ===========================

// --- Updated Color Scheme to Match Homepage ---
export const HOME_COLORS = {
    BG: '#FFFFFF',
    TEXT_DARK: '#111827',
    TEXT_LIGHT: '#6B7280',
    ACCENT_PRIMARY: '#059669', // Emerald green
    ACCENT_SECONDARY: '#7C3AED', // Purple
    ACCENT_GRADIENT: 'linear-gradient(135deg, #059669, #7C3AED)',
};

// --- Updated THEMES to Match Homepage ---
export const THEMES = {
    DISPLAY_FONT: 'Inter, sans-serif',
    TEXT_FONT: 'Inter, sans-serif',
    light: {
        name: "SlideSky Pro",
        pageBg: "#FFFFFF", // White background like homepage
        pageText: "#111827", // Dark text like homepage
        slideBg: "#FFFFFF", // Pure white slides
        slideText: "#111827", // Dark text for slides
        primary: "#059669", // Emerald green from homepage
        secondary: "#7C3AED", // Purple from homepage
        accentGradient: 'linear-gradient(135deg, #059669, #7C3AED)' // Homepage gradient
    },
    aurora: { name: "Aurora Dark", pageBg: "#0F172A", pageText: "#E2E8F0", slideBg: "#1E293B", slideText: "#F1F5F9", primary: "#059669", secondary: "#7C3AED", accentGradient: 'linear-gradient(135deg, #059669, #7C3AED)' },
};

// Custom Gradient for Special Slides
export const CUSTOM_GRADIENT_BG = 'linear-gradient(135deg, #059669, #7C3AED)';
export const CUSTOM_GRADIENT_TEXT_COLOR = '#FFFFFF';

// =========================== HELPER UI COMPONENTS ===========================

// --- Slide Frame Component ---
export const SlideFrame = React.forwardRef(({ theme, children, isThumbnail = false, isSelected = false, isSpecialBg = false, ...props }, ref) => (
    <div
        ref={ref}
        className={`rounded-xl p-0 relative border-2 transition-all duration-300 ${isThumbnail ? 'w-full' : 'w-full max-w-[1200px]'} ${
            isSelected ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'
        }`}
        style={{
            backgroundColor: isSpecialBg ? undefined : theme.slideBg,
            backgroundImage: isSpecialBg ? CUSTOM_GRADIENT_BG : undefined,
            borderColor: isSelected ? theme.primary : (isThumbnail ? '#E5E7EB' : '#F3F4F6'),
            borderWidth: isSelected ? '2px' : '1px',
            aspectRatio: '16 / 9',
            minHeight: isThumbnail ? '60px' : '600px',
            overflow: 'hidden',
        }}
        {...props}
    >
        {children}
    </div>
));

// --- Hero Slide Content Component ---
export const HeroSlide = ({ title, subtitle, theme, onTitleChange, onSubtitleChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText;

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 transition-colors outline-none max-w-full leading-tight"
                style={{
                    fontFamily: THEMES.DISPLAY_FONT,
                    color: textColor,
                    background: isSpecialBg ? undefined : theme.accentGradient,
                    WebkitBackgroundClip: isSpecialBg ? undefined : 'text',
                    WebkitTextFillColor: isSpecialBg ? undefined : 'transparent'
                }}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: title }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            >
            </h1>
        </div>
    );
};

// --- Editable Bullets Component ---
export const EditableBullets = ({ items, theme, onPointChange, onPointDelete, onFocus, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText;

    return (
        <ul className="list-none ml-0 space-y-4">
            {items.map((item, i) => (
                <li key={i} className="text-lg font-medium flex items-start group transition-all duration-200 hover:translate-x-1" style={{ color: textColor, fontFamily: THEMES.TEXT_FONT }}>
                    <div className="w-2 h-2 rounded-full mt-3 mr-4 flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        className="flex-1 outline-none min-h-[1.5rem] p-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-300 focus:bg-white/50"
                        dangerouslySetInnerHTML={{ __html: item }}
                        onBlur={e => onPointChange(i, e.currentTarget.innerHTML)}
                        onFocus={() => onFocus(i)}
                    >
                    </span>
                    <button
                        onClick={() => onPointDelete(i)}
                        className="ml-4 p-2 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        title="Delete bullet point"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </li>
            ))}
        </ul>
    );
};

// --- Miniature Slide Content Component (for sidebar thumbnails) ---
export const MiniatureSlideContent = ({ slide, theme }) => {
    const stripHtml = (html) => {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    const isSpecial = slide.isHero || slide.isThankYou || slide.isSectionTitle;

    if (isSpecial) {
        return (
            <div className="flex flex-col justify-center items-center text-center h-full w-full p-2 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-lg">
                <div className="text-[8px] font-bold text-white" style={{ fontFamily: THEMES.DISPLAY_FONT }}>
                    {stripHtml(slide.sectionTitle).substring(0, 25)}{stripHtml(slide.sectionTitle).length > 25 ? '...' : ''}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 6, color: theme.slideText }} className="h-full bg-white rounded-lg">
            <div
                style={{ fontSize: 7, fontWeight: 700, marginBottom: 4, color: theme.primary, borderBottom: '1px solid #E5E7EB' }}
                className="truncate pb-1"
            >
                {stripHtml(slide.sectionTitle).substring(0, 35)}{stripHtml(slide.sectionTitle).length > 35 ? '...' : ''}
            </div>
            <ul className="list-none space-y-[2px] text-[6px] text-gray-600 pl-1 mt-2">
                {slide.points?.slice(0, 3).map((p, i) => (
                    <li key={i} className="flex items-start">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 mt-[3px] mr-1 flex-shrink-0"></div>
                        <span className="truncate">{stripHtml(p).substring(0, 45)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// =========================== LAYOUT COMPONENTS ===========================

// --- Header Component ---
export const Header = ({ theme, presentation, onExport, isLoading, rawMeta, triggerFileInput }) => {
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadRef.current && !downloadRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [downloadRef]);

    const handleChangeFileClick = () => {
        triggerFileInput();
    };

    return (
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                        SlideSky Editor
                    </h2>
                </div>
                {rawMeta && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                        <span className="text-xs font-medium text-emerald-700">
                            {rawMeta.filename} • {rawMeta.stats}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">

                {rawMeta && (
                    <button
                        onClick={handleChangeFileClick}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm text-sm flex items-center gap-2 border border-gray-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2v4a2 2 0 0 0 2 2h4"/><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M2 15v-1a2 2 0 0 1 2-2h2"/><path d="M2 15v4a2 2 0 0 0 2 2h2"/></svg>
                        Change File
                    </button>
                )}

                <div className="relative" ref={downloadRef}>
                    <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={!presentation || isLoading}
                        style={{ background: theme.accentGradient }}
                        className="px-4 py-2 text-white font-semibold rounded-lg disabled:opacity-50 hover:shadow-lg transition-all duration-200 shadow-md text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Download
                    </button>

                    {showDownloadMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-20 border border-gray-200">
                            <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                                onClick={() => { onExport('pptx'); setShowDownloadMenu(false); }}
                            >
                                Download as PPTX
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                                onClick={() => { onExport('pdf'); setShowDownloadMenu(false); }}
                            >
                                Download as PDF (Current Slide)
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

// --- Generation Progress Bar Component ---
export const GenerationProgress = ({ rawMeta, loadingProgress, theme }) => (
    <div className="p-6 bg-white border border-gray-200 shadow-lg mb-6 rounded-xl w-full max-w-[1200px]">
        <div className="flex items-center justify-between text-sm font-semibold mb-3" style={{ color: theme.pageText }}>
            <span className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>
                Generating your presentation...
            </span>
            <span className="font-bold" style={{ color: theme.primary }}>{Math.round(loadingProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{
                    width: `${loadingProgress}%`,
                    background: theme.accentGradient
                }}
            ></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
            Processing <strong>{rawMeta?.filename || 'your file'}</strong> with AI
        </p>
    </div>
);

// --- Left Sidebar (Slide Thumbnails) Component ---
export const LeftSidebar = ({ theme, presentation, allSlides, selectedSlideIndex, setSelectedSlideIndex, isLoading }) => {

    const slidesToShow = presentation
        ? allSlides
        : (isLoading ? Array(10).fill({ isSkeleton: true }) : []);

    const isSpecialBg = (slide) => slide?.isHero || slide?.isThankYou || slide?.isSectionTitle;

    return (
        <div className="w-20 sm:w-64 bg-white border-r border-gray-200 flex flex-col items-center p-4 overflow-y-auto shrink-0">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 w-full hidden sm:block">
                Slides ({slidesToShow.length})
            </h3>

            <div className="space-y-3 w-full flex flex-col items-center">
                {slidesToShow.map((slide, index) => (
                    <div
                        key={index}
                        className={`p-2 w-full rounded-lg cursor-pointer transition-all duration-200 ${
                            index === selectedSlideIndex
                                ? 'bg-gradient-to-r from-emerald-50 to-purple-50 shadow-lg ring-2 ring-emerald-200'
                                : 'hover:bg-gray-50 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedSlideIndex(index)}
                    >
                        <div className="text-xs text-center mb-2 text-gray-500 hidden sm:block font-medium">
                            Slide {index + 1}
                        </div>
                        <SlideFrame theme={theme} isThumbnail={true} isSelected={index === selectedSlideIndex} isSpecialBg={isSpecialBg(slide)} className="w-full">
                            <MiniatureSlideContent slide={slide} theme={theme} />
                        </SlideFrame>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Design Panel Component ---
export const DesignPanel = ({ theme, themeKey, setThemeKey, onUndo, onRedo, canUndo, canRedo, onAddPoint, isContentSlide }) => {

    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    const HistoryButton = ({ action, disabled, iconPath, label }) => (
        <button
            onClick={action}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all duration-200 ${
                disabled
                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md'
            }`}
            title={label}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
            </svg>
        </button>
    );

    const FormattingButton = ({ command, iconPath, label, disabled }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                executeCommand(command);
            }}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all duration-200 ${
                disabled
                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md'
            }`}
            title={label}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
            </svg>
        </button>
    );

    return (
        <div className="w-0 sm:w-20 md:w-48 lg:w-64 bg-white border-l border-gray-200 flex flex-col p-4 md:p-6 overflow-y-auto shrink-0 space-y-6">
            <h3 className="text-lg font-bold mb-4 hidden md:block" style={{ color: theme.pageText }}>Design Tools</h3>

            {/* History Controls */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">History</label>
                <div className="flex justify-between gap-2 bg-gray-50 p-2 rounded-xl">
                    <HistoryButton
                        action={onUndo}
                        disabled={!canUndo}
                        label="Undo"
                        iconPath="M12 2a10 10 0 0 0-9.84 9.18 2 2 0 0 0 1.95 2.5 7 7 0 0 1 7.15-6.68V7.5L16 11l-4 3.5v-2a7 7 0 0 1-7.15 6.68 2 2 0 0 0-1.95 2.5 10 10 0 0 0 19.84-9.18Z"
                    />
                    <HistoryButton
                        action={onRedo}
                        disabled={!canRedo}
                        label="Redo"
                        iconPath="M12 2a10 10 0 0 1 9.84 9.18 2 2 0 0 1-1.95 2.5 7 7 0 0 0-7.15-6.68V7.5L8 11l4 3.5v-2a7 7 0 0 0 7.15 6.68 2 2 0 0 1 1.95 2.5 10 10 0 0 1-19.84-9.18Z"
                    />
                </div>
            </div>

            {/* Formatting Controls */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Text Formatting</label>
                <div className="flex justify-between gap-2 bg-gray-50 p-2 rounded-xl">
                    <FormattingButton
                        command="bold"
                        label="Bold"
                        iconPath="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"
                        disabled={!isContentSlide}
                    />
                    <FormattingButton
                        command="italic"
                        label="Italic"
                        iconPath="M19 4h-9M14 20H5M14.5 12.5l-5 5"
                        disabled={!isContentSlide}
                    />
                    <FormattingButton
                        command="insertUnorderedList"
                        label="List"
                        iconPath="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                        disabled={!isContentSlide}
                    />
                </div>
            </div>

            {/* Add Elements */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Add Elements</label>
                <button
                    onClick={onAddPoint}
                    disabled={!isContentSlide}
                    className={`flex items-center justify-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 gap-2 ${
                        isContentSlide
                            ? 'bg-gradient-to-r from-emerald-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    Add Point
                </button>
            </div>

            {/* Theme Selector */}
            <div className="pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-3 block">Presentation Theme</label>
                   <select
                    value={themeKey}
                    onChange={(e) => setThemeKey(e.target.value)}
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                >
                    {Object.entries(THEMES).filter(([k, v]) => !k.includes('FONT')).map(([k, v]) => (
                        <option key={k} value={k}>
                            {v.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};