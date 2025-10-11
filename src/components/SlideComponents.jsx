import React from "react";
import { THEMES, CUSTOM_GRADIENT_BG, CUSTOM_GRADIENT_TEXT_COLOR } from "../Constants";

// Helper function
const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

// Bold keywords helper for better readability
const boldKeywordsAndNumbers = (text) => {
    if (!text) return text;
    
    // Bold numbers, including currency symbols and percentages
    let result = text.replace(/([$€£¥]?[\d,]+(\.\d+)?%?)/g, '<strong>$1</strong>');
    
    // Bold common analytical keywords
    const keywords = ['highest', 'lowest', 'top', 'key finding', 'average', 'total', 'share', 'distribution', 'increase', 'decrease', 'growth', 'revenue', 'profit', 'employees', 'salary', 'position', 'dataset', 'scope', 'records', 'data', 'analysis'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b(?!([^<]+)?>)`, 'gi');
    
    result = result.replace(keywordRegex, '<strong>$1</strong>');
    return result;
};

// Modern font setup - Using Inter as a modern, professional font
const MODERN_FONTS = {
    DISPLAY_FONT: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    TEXT_FONT: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

// Load Inter font dynamically
const loadModernFonts = () => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
};
loadModernFonts();

// Slide Content Components
export const HeroSlideContent = ({ title, theme, onTitleChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 transition-colors outline-none max-w-4xl leading-tight break-words" 
                style={{ 
                    fontFamily: MODERN_FONTS.DISPLAY_FONT, 
                    color: textColor,
                    lineHeight: '1.2',
                    fontWeight: 700
                }}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(title) }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            />
        </div>
    );
};

export const SectionTitleSlideContent = ({ title, isSpecialBg, onTitleChange }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1 
                className="text-4xl md:text-5xl font-bold transition-colors outline-none max-w-4xl leading-tight break-words" 
                style={{ 
                    fontFamily: MODERN_FONTS.DISPLAY_FONT, 
                    color: textColor,
                    lineHeight: '1.2',
                    fontWeight: 700
                }}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(title) }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            />
        </div>
    );
};

export const ContentSlideContent = ({ slide, theme, onTitleChange, onPointChange, onPointDelete, isSpecialBg }) => {
    const titleColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;

    return (
        <div className="h-full flex pt-16 pb-16 px-16" style={{ fontFamily: MODERN_FONTS.TEXT_FONT }}>
            {/* Title Section - Left aligned */}
            <div className="w-2/5 pr-12 flex flex-col justify-center">
                <h2
                    className="text-3xl font-bold transition-colors outline-none leading-tight break-words" 
                    style={{ 
                        fontFamily: MODERN_FONTS.DISPLAY_FONT, 
                        color: titleColor,
                        lineHeight: '1.3',
                        fontWeight: 600
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(slide.sectionTitle) }}
                    onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
                />
            </div>

            {/* Main Content Section - Right aligned with vertical separator */}
            <div className="w-3/5 flex flex-col">
                <div className="h-full border-l border-gray-200 pl-12 flex flex-col justify-center">
                    <div className="flex-1 overflow-y-auto">
                        <EditableBullets 
                            items={slide.points} 
                            theme={theme} 
                            onPointChange={onPointChange}
                            onPointDelete={onPointDelete}
                            isSpecialBg={isSpecialBg}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Improved Contents Slide Component
// Contents Slide Component
export const ContentsSlideContent = ({ slide, theme, onPointChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;

    return (
        <div className="flex flex-col h-full p-16" style={{ fontFamily: MODERN_FONTS.TEXT_FONT }}>
            {/* Main Title */}
            <h2 
                className="text-4xl font-bold mb-16 break-words text-center" 
                style={{ 
                    fontFamily: MODERN_FONTS.DISPLAY_FONT, 
                    color: '#000000',
                    lineHeight: '1.2',
                    fontWeight: 700
                }}
            >
                Contents
            </h2>

            {/* Content Sections */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* About the Dataset Section */}
                    <div className="space-y-6">
                         <div className="space-y-3">
                      
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-lg text-gray-600">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                                    <span> About the dataset</span>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Part 1 </span>
                            </div>
                             {/* Horizontal Divider */}
                    <div className="border-t border-gray-200 my-8"></div>
   <div className="flex items-center justify-between">
                                <div className="flex items-center text-lg text-gray-600">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                                    <span>  Relevant inquiries</span>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"> Part 2 </span>
                            </div>
                        </div>
                    </div>

              
              
                </div>
            </div>
        </div>
    );
};


export const ThankYouSlideContent = ({ slide, theme, onTitleChange, onPointChange, onPointDelete, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center h-full w-full p-16">
            <h2 
                className="text-4xl md:text-5xl font-bold mb-12 transition-colors outline-none max-w-3xl leading-tight break-words"
                style={{ 
                    fontFamily: MODERN_FONTS.DISPLAY_FONT, 
                    color: textColor,
                    lineHeight: '1.2',
                    fontWeight: 700
                }}
                contentEditable 
                suppressContentEditableWarning 
                dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(slide.sectionTitle) }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            />
            <div className="max-w-2xl w-full mt-8">
                <EditableBullets 
                    items={slide.points}
                    theme={theme}
                    onPointChange={onPointChange}
                    onPointDelete={onPointDelete}
                    isSpecialBg={isSpecialBg}
                />
            </div>
        </div>
    );
};

// Reusable Editable Bullets Component - Modern Design
export const EditableBullets = ({ items, theme, onPointChange, onPointDelete, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <ul className="list-none ml-0 space-y-6">
            {items.map((item, i) => (
                <li key={i} className="text-lg font-normal flex items-start group transition-all break-words" 
                    style={{ 
                        color: textColor, 
                        fontFamily: MODERN_FONTS.TEXT_FONT, 
                        lineHeight: '1.6' 
                    }}>
                    <span 
                        style={{ color: primaryColor }} 
                        className="mr-4 mt-1 text-xl flex-shrink-0 font-bold"
                    >
                        •
                    </span>
                    <div className="flex-1 min-w-0">
                        <span
                            contentEditable
                            suppressContentEditableWarning
                            className="outline-none min-h-[2rem] p-2 rounded-lg focus:ring-2 focus:ring-blue-300 block break-words w-full"
                            style={{ 
                                color: textColor,
                                lineHeight: '1.6',
                                fontWeight: 400
                            }}
                            dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(item) }}
                            onBlur={e => onPointChange(i, e.currentTarget.innerHTML)}
                        />
                    </div>
                    <button
                        onClick={() => onPointDelete(i)}
                        className="ml-4 p-2 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all duration-200 flex-shrink-0"
                        title="Delete bullet point"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                            <path d="M18 6 6 18"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </li>
            ))}
        </ul>
    );
};