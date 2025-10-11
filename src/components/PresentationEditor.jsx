import React from "react";
import { 
    SlideFrame, 
    SkeletonMainContent 
} from "../EditorComponents";
import { ChartSlide } from "./ChartComponents";
import { 
    HeroSlideContent, 
    SectionTitleSlideContent, 
    ContentSlideContent, 
    ContentsSlideContent, 
    ThankYouSlideContent 
} from "./SlideComponents";

// Import existing components from EditorComponents
import { 
    Header as ExistingHeader,
    LeftSidebar as ExistingLeftSidebar,
    DesignPanel as ExistingDesignPanel
} from "../EditorComponents";

// Wrap existing components to maintain functionality
const Header = ExistingHeader;
const LeftSidebar = ExistingLeftSidebar;
const DesignPanel = ExistingDesignPanel;

// --- START: New Status Bar Component ---
const LoadingStatusBar = ({ loadingProgress, theme, rawMeta }) => {
    const filename = rawMeta?.filename || "data file"; 
    const primaryColor = theme?.primary || '#3b82f6';
    const isComplete = loadingProgress >= 95;

    return (
        <div className="w-full max-w-4xl bg-white rounded-lg p-3 shadow-md border border-gray-100 mb-6">
            <div className="flex items-center justify-between space-x-4">
                
                {/* Left Side: Title and Subtitle */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-base font-semibold text-gray-900 truncate">
                            {isComplete ? 'Generation Complete' : 'Generating presentation...'}
                        </h2>
                        {/* Spinner (only visible when not complete) */}
                        {!isComplete && (
                            <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                        Generating content for <strong>{filename}</strong>
                    </p>
                </div>

                {/* Right Side: Progress Bar and Percentage */}
                <div className="flex items-center space-x-3 w-64 flex-shrink-0">
                    
                    {/* Progress Bar */}
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ 
                                width: `${loadingProgress}%`, 
                                backgroundColor: primaryColor,
                                boxShadow: `0 0 4px 0 ${primaryColor}30` 
                            }}
                        ></div>
                    </div>
                    
                    {/* Percentage Display */}
                    <div className="flex items-center space-x-1">
                        <span 
                            className={`text-sm font-semibold transition-colors duration-300 ${loadingProgress > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                            style={{ color: loadingProgress > 0 ? primaryColor : '#9ca3af' }}
                        >
                            {loadingProgress}%
                        </span>
                        
                        {/* Finish Icon */}
                        <svg className={`w-4 h-4 transition-colors duration-300 ${isComplete ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- END: New Status Bar Component ---

// --- Slide Counter Component (Visible in screenshot) ---
const SlideCounter = ({ selectedSlideIndex, allSlides }) => (
    <h3 className="text-sm text-gray-500 mb-4 font-medium">
        Editing Slide {selectedSlideIndex + 1} of {allSlides.length}
    </h3>
);

const SlideEditor = React.forwardRef(({
    theme,
    isSpecialBg,
    isLoading,
    presentation,
    currentSlide,
    isContentOrThankYouSlide,
    handleContentUpdate,
    handleTitleChange,
    handleHeroTitleChange,
    handlePointChange,
    handlePointDelete,
    // REMOVED redundant props: loadingProgress, rawMeta
}, ref) => {
    return (
        <div className="relative w-full max-w-4xl">
            {/* Loading Overlay: Covers the slide to prevent editing while loading */}
            {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] rounded-lg cursor-wait"></div>
            )}
            
            <SlideFrame theme={theme} isSelected={true} ref={ref} isSpecialBg={isSpecialBg}>
                {/* KEY: RENDER SKELETON IF LOADING, REAL CONTENT OTHERWISE */}
                {isLoading && !presentation ? (
                    <SkeletonMainContent theme={theme} />
                ) : currentSlide && (
                    <SlideContent 
                        currentSlide={currentSlide}
                        isSpecialBg={isSpecialBg}
                        isContentOrThankYouSlide={isContentOrThankYouSlide}
                        theme={theme}
                        handleContentUpdate={handleContentUpdate}
                        handleTitleChange={handleTitleChange}
                        handleHeroTitleChange={handleHeroTitleChange}
                        handlePointChange={handlePointChange}
                        handlePointDelete={handlePointDelete}
                    />
                )}
            </SlideFrame>
        </div>
    );
});


const PresentationEditor = ({
    // State props
    rawMeta,
    presentation,
    isLoading,
    loadingProgress, 
    selectedSlideIndex,
    setSelectedSlideIndex,
    theme,
    themeKey,
    setThemeKey,
    showModal,
    setShowModal,
    modalMessage,
    
    // Refs
    fileInputRef,
    mainSlideRef,
    
    // Handlers
    handleFileChange,
    triggerFileInput,
    onExport,
    handleContentUpdate,
    handleTitleChange,
    handleHeroTitleChange,
    handlePointChange,
    handlePointDelete,
    handleAddPoint,
    undo,
    redo,
    historyIndex,
    history,
    
    // Utils
    allSlides,
    currentSlide,
    isSpecialBg,
    isContentOrThankYouSlide
}) => {
    return (
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
                {/* Left Sidebar - Slide Navigation */}
                <LeftSidebar 
                    theme={theme}
                    presentation={presentation}
                    allSlides={allSlides}
                    selectedSlideIndex={selectedSlideIndex}
                    setSelectedSlideIndex={setSelectedSlideIndex}
                    isLoading={isLoading}
                />
                
                {/* Main Editor Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 flex flex-col items-center relative">
                    
                    {/* 1. Status Bar (Rendered ONLY ONCE here when loading) */}
                    {isLoading && (
                        <LoadingStatusBar 
                            loadingProgress={loadingProgress} 
                            theme={theme}
                            rawMeta={rawMeta}
                        />
                    )}
                    
                    {/* 2. Slide Counter (Always rendered) */}
                    <SlideCounter 
                        selectedSlideIndex={selectedSlideIndex}
                        allSlides={allSlides}
                    />
                    
                    {/* 3. Slide Editor (Always renders the slide frame, with skeleton/overlay inside) */}
                    <SlideEditor 
                        ref={mainSlideRef}
                        theme={theme}
                        isSpecialBg={isSpecialBg}
                        isLoading={isLoading}
                        presentation={presentation}
                        currentSlide={currentSlide}
                        isContentOrThankYouSlide={isContentOrThankYouSlide}
                        handleContentUpdate={handleContentUpdate}
                        handleTitleChange={handleTitleChange}
                        handleHeroTitleChange={handleHeroTitleChange}
                        handlePointChange={handlePointChange}
                        handlePointDelete={handlePointDelete}
                    />

                    <div className="h-20"></div>
                </main>
                
                {/* Right Design Panel */}
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
                    // Loading Overlay over the panel itself
                    className={isLoading ? 'relative after:content-[""] after:absolute after:inset-0 after:bg-white/70 after:z-10 after:cursor-wait' : ''}
                />
            </div>
            
            {/* File Input (hidden) */}
            <input 
                type="file" 
                onChange={handleFileChange} 
                className="hidden" 
                ref={fileInputRef} 
                accept=".xlsx,.xls,.csv" 
            />
            
            {/* Modal */}
            {showModal && (
                <Modal 
                    theme={theme}
                    modalMessage={modalMessage}
                    setShowModal={setShowModal}
                />
            )}
        </div>
    );
};


// --- Helper Components (Unchanged) ---

const SlideContent = ({
    currentSlide,
    isSpecialBg,
    isContentOrThankYouSlide,
    theme,
    handleContentUpdate,
    handleTitleChange,
    handleHeroTitleChange,
    handlePointChange,
    handlePointDelete
}) => {
    
    // Render appropriate slide content based on slide type
    if (currentSlide.isSectionTitle) {
        return (
            <SectionTitleSlideContent 
                title={currentSlide.sectionTitle}
                isSpecialBg={isSpecialBg}
                onTitleChange={handleTitleChange}
            />
        );
    }
    if (currentSlide.isHero) {
        return (
            <HeroSlideContent 
                title={currentSlide.sectionTitle}
                theme={theme}
                onTitleChange={handleHeroTitleChange}
                isSpecialBg={isSpecialBg}
            />
        );
    }
    if (currentSlide.isChartSlide) {
        return (
            <ChartSlide 
                slide={currentSlide}
                theme={theme}
                isSpecialBg={isSpecialBg}
            />
        );
    }
    if (isContentOrThankYouSlide) {
        if (currentSlide.sectionTitle.toLowerCase() === 'contents') {
            return (
                <ContentsSlideContent 
                    slide={currentSlide}
                    theme={theme}
                    onPointChange={handlePointChange}
                    isSpecialBg={isSpecialBg}
                />
            );
        }
        if (currentSlide.isThankYou) {
            return (
                <ThankYouSlideContent 
                    slide={currentSlide}
                    theme={theme}
                    onTitleChange={handleTitleChange}
                    onPointChange={handlePointChange}
                    onPointDelete={handlePointDelete}
                    isSpecialBg={isSpecialBg}
                />
            );
        }
        return (
            <ContentSlideContent 
                slide={currentSlide}
                theme={theme}
                onTitleChange={handleTitleChange}
                onPointChange={handlePointChange}
                onPointDelete={handlePointDelete}
                isSpecialBg={isSpecialBg}
            />
        );
    }
    return null;
};

const Modal = ({ theme, modalMessage, setShowModal }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white text-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-sm text-center border border-gray-200 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold mb-4" style={{ color: theme?.primary || '#3b82f6' }}>
                Notice</h3>
            <p className="text-gray-600 whitespace-pre-wrap mb-6 text-base leading-relaxed">
                {modalMessage}
            </p>
            <button 
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: theme?.primary || '#3b82f6' }}
                className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-colors shadow-lg shadow-blue-400/50"
            >
                Got It
            </button>
        </div>
    </div>
);


export default PresentationEditor;