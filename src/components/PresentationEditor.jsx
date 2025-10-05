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
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex flex-col items-center relative">
                    
                    {isLoading && (
                        <GenerationProgress 
                            rawMeta={rawMeta} 
                            loadingProgress={loadingProgress} 
                            theme={theme} 
                        />
                    )}
                    
                    <SlideCounter 
                        selectedSlideIndex={selectedSlideIndex}
                        allSlides={allSlides}
                    />
                    
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

// Sub-components
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
    handlePointDelete
}, ref) => {
    return (
        <SlideFrame theme={theme} isSelected={true} ref={ref} isSpecialBg={isSpecialBg}>
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
    );
});

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
                Notice
            </h3>
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

// Import existing components from EditorComponents
import { 
    Header as ExistingHeader,
    GenerationProgress as ExistingGenerationProgress,
    LeftSidebar as ExistingLeftSidebar,
    DesignPanel as ExistingDesignPanel
} from "../EditorComponents";

// Wrap existing components to maintain functionality
const Header = ExistingHeader;
const GenerationProgress = ExistingGenerationProgress;
const LeftSidebar = ExistingLeftSidebar;
const DesignPanel = ExistingDesignPanel;

export default PresentationEditor;