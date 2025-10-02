import React from "react";
import { THEMES, CUSTOM_GRADIENT_BG, CUSTOM_GRADIENT_TEXT_COLOR } from "./Constants";

// --- Helpers ---
const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

// --- Exported UI Components ---

export const SlideFrame = React.forwardRef(({ theme, children, isThumbnail = false, isSelected = false, isSpecialBg = false, ...props }, ref) => (
    <div
        ref={ref}
        className={`shadow-xl rounded-lg p-0 relative border transition-all duration-150 ${isThumbnail ? 'w-full' : 'w-full max-w-[1200px]'}`}
        style={{
            backgroundColor: isSpecialBg ? undefined : theme.slideBg,
            backgroundImage: isSpecialBg ? CUSTOM_GRADIENT_BG : undefined,
            border: `2px solid ${isSelected ? theme.primary : (isThumbnail ? theme.pageBg : '#E5E7EB')}`,
            aspectRatio: '16 / 9',
            minHeight: isThumbnail ? '60px' : '600px',
            overflow: 'hidden',
        }}
        {...props}
    >
        {children}
    </div>
));

export const HeroSlide = ({ title, theme, onTitleChange, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 transition-colors outline-none max-w-full" 
                style={{ fontFamily: THEMES.DISPLAY_FONT, color: primaryColor }}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: title }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            >
            </h1>
        </div>
    );
};

export const EditableBullets = ({ items, theme, onPointChange, onPointDelete, onFocus, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText;

    return (
        <ul className="list-none ml-0 space-y-4">
            {items.map((item, i) => (
                <li key={i} className="text-lg font-medium flex items-start group transition-all" style={{ color: textColor, fontFamily: THEMES.TEXT_FONT }}>
                    <span style={{ color: primaryColor }} className="mr-3 mt-[2px]">&#x2022;</span>
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        className="flex-1 outline-none min-h-[1.5rem] p-0.5 rounded focus:ring-2 focus:ring-blue-300"
                        dangerouslySetInnerHTML={{ __html: item }}
                        onBlur={e => onPointChange(i, e.currentTarget.innerHTML)}
                        onFocus={() => onFocus(i)}
                    >
                    </span>
                    <button
                        onClick={() => onPointDelete(i)}
                        className="ml-4 p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                        title="Delete bullet point"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </li>
            ))}
        </ul>
    );
};

export const MiniatureSlideContent = ({ slide, theme }) => {
    const isSpecial = slide.isHero || slide.isThankYou || slide.isSectionTitle;

    if (isSpecial) {
        return (
            <div className="flex flex-col justify-center items-center text-center h-full w-full p-2">
                <div className="text-[9px] font-extrabold" style={{ color: CUSTOM_GRADIENT_TEXT_COLOR, fontFamily: THEMES.DISPLAY_FONT }}>
                    {stripHtml(slide.sectionTitle).substring(0, 25)}{stripHtml(slide.sectionTitle).length > 25 ? '...' : ''}
                </div>
            </div>
        );
    }
    
    // Content Slides
    return (
        <div style={{ padding: 4, color: theme.slideText }} className="h-full">
            <div 
                style={{ fontSize: 7, fontWeight: 700, marginBottom: 3, color: theme.pageText, borderBottom: '1px solid #eee' }} 
                className="truncate"
            >
                {stripHtml(slide.sectionTitle).substring(0, 35)}{stripHtml(slide.sectionTitle).length > 35 ? '...' : ''}
            </div>
            <ul className="list-none space-y-[1px] text-[6px] text-gray-700 pl-1 mt-1">
                {slide.points?.slice(0, 3).map((p, i) => <li key={i} className="truncate">• {stripHtml(p).substring(0, 45)}</li>)}
            </ul>
        </div>
    );
};

export const SectionTitleSlideContent = ({ title, isSpecialBg, onTitleChange }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1 
                className="text-5xl font-extrabold transition-colors outline-none" 
                style={{ fontFamily: THEMES.DISPLAY_FONT, color: textColor }}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: title }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            >
            </h1>
        </div>
    );
};

export const CustomContentsSlide = ({ slide, theme, onPointChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText;
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;

    return (
        <div className="grid grid-cols-2 gap-8 h-full p-8">
            <div className="col-span-1 flex flex-col justify-center">
                <h2 
                    className="text-5xl font-extrabold mb-10" 
                    style={{ fontFamily: THEMES.DISPLAY_FONT, color: theme.pageText }}
                >
                    Contents
                </h2>
            </div>
            <div className="col-span-1 flex flex-col justify-center overflow-y-auto">
                <div className="space-y-6 pr-8">
                    {slide.points.map((item, i) => {
                        const content = stripHtml(item);
                        const parts = content.split(/(?=Part\s+\d+$|Detail\s+\d+|Section\s+\d+$)/); 
                        const heading = parts[0]?.trim() || '';
                        const part = parts[1]?.trim() || '';

                        return (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                                <span 
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="flex-1 outline-none text-xl font-semibold p-1 rounded focus:ring-2 focus:ring-blue-300 mr-4"
                                    style={{ color: textColor, fontFamily: THEMES.TEXT_FONT }}
                                    dangerouslySetInnerHTML={{ __html: heading }}
                                    onBlur={e => {
                                        const newContent = e.currentTarget.innerHTML + (part ? ` ${part}` : '');
                                        onPointChange(i, newContent);
                                    }}
                                ></span>
                                <span 
                                    className="text-lg font-medium px-3 py-1 rounded"
                                    style={{ 
                                        color: primaryColor, 
                                        backgroundColor: `${primaryColor}15`,
                                        fontFamily: THEMES.TEXT_FONT 
                                    }}
                                >
                                    {part}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ContentSlideTemplate = ({ slide, theme, onTitleChange, onPointChange, onPointDelete, onFocus, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.slideText; 

    return (
        <div className="grid grid-cols-2 gap-10 h-full">
            <div className="col-span-1 flex flex-col justify-center items-center text-center pt-16 pl-16 pr-4 pb-16">
                <h2
                    className="text-4xl font-extrabold transition-colors outline-none leading-tight max-w-full break-words" 
                    style={{ fontFamily: THEMES.DISPLAY_FONT, color: primaryColor }}
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: slide.sectionTitle }}
                    onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
                >
                </h2>
            </div>
            <div className="col-span-1 flex flex-col justify-center pt-16 pr-16 pl-4 pb-16 overflow-y-auto">
                <EditableBullets 
                    items={slide.points} 
                    theme={theme} 
                    onPointChange={onPointChange}
                    onPointDelete={onPointDelete}
                    onFocus={onFocus}
                    isSpecialBg={isSpecialBg}
                />
            </div>
        </div>
    );
};

export const SkeletonMainContent = ({ theme }) => (
    <div className="w-full max-w-[1200px] h-full" style={{ padding: 48, backgroundColor: theme.slideBg }}>
        <div className="h-8 w-3/4 mb-10 rounded-lg bg-gray-200/50"></div>
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="h-6 w-full rounded-lg bg-gray-200/50"></div>
                <div className="h-6 w-11/12 rounded-lg bg-gray-200/50"></div>
                <div className="h-6 w-10/12 rounded-lg bg-gray-200/50"></div>
            </div>
            <div className="space-y-4">
                <div className="h-6 w-full rounded-lg bg-gray-200/50"></div>
                <div className="h-6 w-11/12 rounded-lg bg-gray-200/50"></div>
                <div className="h-6 w-10/12 rounded-lg bg-gray-200/50"></div>
            </div>
        </div>
        <div className="mt-12 h-64 w-full rounded-lg bg-gray-200/50"></div>
    </div>
);

export const Header = ({ theme, presentation, onExport, isLoading, rawMeta, triggerFileInput }) => {
    const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
    const downloadRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadRef.current && !downloadRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleChangeFileClick = () => { triggerFileInput(); };

    return (
        <header className="flex items-center justify-between p-3 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10 w-full">
            <div className="flex items-center gap-2">
                {/* START of Popping Logo and SlideSky Text */}
                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        {/* Main logo container with 3D effect */}
                        <div className="relative">
                            {/* Outer glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-70"></div>
                            
                            {/* Main logo */}
                            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xl">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                
                                {/* Sparkle effect */}
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                            </div>
                            
                            {/* Floating particles */}
                            <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500"></div>
                            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500 delay-200"></div>
                        </div>
                    </div>
                    
                    {/* Logo text with gradient and animation */}
                    <div className="relative">
                        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                            SlideSky
                        </span>
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    </div>
                </div>
                {/* END of Popping Logo and SlideSky Text */}

                {rawMeta && (
                    <p className="text-xs text-gray-500 hidden sm:block ml-4">
                        — Loaded **{rawMeta.filename}** ({rawMeta.stats})
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {rawMeta && (
                    <button
                        onClick={handleChangeFileClick}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-md text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-up"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 16v-6"/><path d="m9 13 3-3 3 3"/></svg>
                        Change File
                    </button>
                )}
                <div className="relative" ref={downloadRef}>
                    <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={!presentation || isLoading}
                        style={{ backgroundColor: theme.primary }}
                        className="px-4 py-2 text-white font-semibold rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors shadow-md text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Download
                    </button>
                    {showDownloadMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-20 border border-gray-200">
                            <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => { onExport('pptx'); setShowDownloadMenu(false); }}
                            >
                                Download as PPTX
                            </button>
                            <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

export const GenerationProgress = ({ rawMeta, loadingProgress, theme }) => (
    <div className="p-4 bg-white border border-gray-200 shadow-md mb-4 rounded-lg w-full max-w-[1200px]">
        <div className="flex items-center justify-between text-sm font-semibold mb-2" style={{ color: theme.pageText }}>
            <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: theme.primary }}><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Generating presentation...
            </span>
            <span style={{ color: theme.primary }}>{Math.round(loadingProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
                className="h-full transition-all duration-500 ease-out" 
                style={{ width: `${loadingProgress}%`, backgroundColor: theme.primary }}
            ></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
            Generating content for **{rawMeta?.filename || 'your file'}**.
        </p>
    </div>
); 

export const SkeletonThumbnail = ({ theme, index }) => (
    <div className={`p-1 w-full rounded-md opacity-50 ${theme.pageBg === '#F4F7FC' ? 'bg-gray-100' : 'bg-gray-700'}`}>
        <div className="text-xs text-center mb-1 text-gray-500 hidden sm:block">{index + 1}</div>
        <div className="shadow-lg rounded-lg p-3 w-full" style={{ aspectRatio: '16/9', backgroundColor: theme.slideBg }}>
            <div className="h-2 w-3/4 mb-2 rounded bg-gray-300"></div>
            <div className="space-y-1">
                <div className="h-1 w-full rounded bg-gray-200"></div>
                <div className="h-1 w-11/12 rounded bg-gray-200"></div>
                <div className="h-1 w-10/12 rounded bg-gray-200"></div>
            </div>
        </div>
    </div>
);

export const LeftSidebar = ({ theme, presentation, allSlides, selectedSlideIndex, setSelectedSlideIndex, isLoading }) => {
    
    const slidesToShow = presentation 
        ? allSlides 
        : (isLoading ? Array(10).fill({ isSkeleton: true }) : []); 
    
    const isSpecialBg = (slide) => slide?.isHero || slide?.isThankYou || slide?.isSectionTitle;

    return (
        <div className="w-20 sm:w-64 bg-white border-r border-gray-200 flex flex-col items-center p-3 overflow-y-auto shrink-0">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 w-full hidden sm:block">
                Pages ({slidesToShow.length})
            </h3>
            
            <div className="space-y-3 w-full flex flex-col items-center">
                {slidesToShow.map((slide, index) => (
                    slide.isSkeleton ? (
                        <SkeletonThumbnail key={index} theme={theme} index={index} />
                    ) : (
                        <div
                            key={index}
                            className={`p-1 w-full rounded-md cursor-pointer transition-all ${index === selectedSlideIndex ? 'shadow-lg ring-2 ring-offset-2' : 'hover:bg-gray-100'}`}
                            style={{ ringColor: theme.primary, backgroundColor: index === selectedSlideIndex ? theme.pageBg : 'transparent' }}
                            onClick={() => setSelectedSlideIndex(index)}
                        >
                            <div className="text-xs text-center mb-1 text-gray-500 hidden sm:block">{index + 1}</div>
                            <SlideFrame theme={theme} isThumbnail={true} isSelected={index === selectedSlideIndex} isSpecialBg={isSpecialBg(slide)} className="w-full">
                                <MiniatureSlideContent slide={slide} theme={theme} />
                            </SlideFrame>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export const DesignPanel = ({ theme, themeKey, setThemeKey, onUndo, onRedo, canUndo, canRedo, onAddPoint, isContentSlide }) => {

    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    const HistoryButton = ({ action, disabled, iconPath, label }) => (
        <button
            onClick={action}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors text-gray-600 ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 hover:text-gray-800'}`}
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
            className={`p-2 rounded-lg transition-colors text-gray-600 ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 hover:text-gray-800'}`}
            title={label}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
            </svg>
        </button>
    );


    return (
        <div className="w-0 sm:w-20 md:w-48 lg:w-64 bg-white border-l border-gray-200 flex flex-col p-3 md:p-6 overflow-y-auto shrink-0 space-y-6">
            <h3 className="text-lg font-bold mb-4 hidden md:block" style={{ color: theme.pageText }}>Design Panel</h3>
            
            <div className="space-y-2 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">History</label>
                <div className="flex justify-between gap-1">
                    <HistoryButton action={onUndo} disabled={!canUndo} label="Undo" iconPath="M12 2a10 10 0 0 0-9.84 9.18 2 2 0 0 0 1.95 2.5 7 7 0 0 1 7.15-6.68V7.5L16 11l-4 3.5v-2a7 7 0 0 1-7.15 6.68 2 2 0 0 0-1.95 2.5 10 10 0 0 0 19.84-9.18Z" />
                    <HistoryButton action={onRedo} disabled={!canRedo} label="Redo" iconPath="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM7 12h10" />
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Text Formatting</label>
                <div className="flex justify-between gap-1">
                    <FormattingButton command="bold" label="Bold" iconPath="M14 6H4v12h10c2.21 0 4-1.79 4-4V10c0-2.21-1.79-4-4-4zM7 15V9m7 0h-4v6h4c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z" disabled={!isContentSlide} />
                    <FormattingButton command="italic" label="Italic" iconPath="M10 5l4 14m-3-14h3M8 19h3M5 5h3m3 14h3" disabled={!isContentSlide} />
                    <FormattingButton command="insertUnorderedList" label="List" iconPath="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" disabled={!isContentSlide} />
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Add Element</label>
                <button
                    onClick={onAddPoint}
                    disabled={!isContentSlide}
                    className={`flex items-center justify-center w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg transition-colors gap-2 ${isContentSlide ? 'hover:bg-gray-200' : 'opacity-30 cursor-not-allowed'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    Add Point
                </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-600">Presentation Theme</label>
                <select
                    value={themeKey}
                    onChange={(e) => setThemeKey(e.target.value)}
                    className="mt-2 w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
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