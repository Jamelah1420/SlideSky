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
    let result = text.replace(/([$€£]?[\d,]+(\.\d+)?%?)/g, '<strong>$1</strong>');
    
    // Bold common analytical keywords
    const keywords = ['highest', 'lowest', 'top', 'key finding', 'average', 'total', 'share', 'distribution', 'increase', 'decrease', 'growth', 'revenue', 'profit'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b(?!([^<]+)?>)`, 'gi');
    
    result = result.replace(keywordRegex, '<strong>$1</strong>');
    return result;
};

// Slide Content Components
export const HeroSlideContent = ({ title, theme, onTitleChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center p-12 h-full w-full">
            <h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 transition-colors outline-none max-w-full leading-tight" 
                style={{ fontFamily: THEMES.DISPLAY_FONT, color: textColor }}
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
                className="text-5xl md:text-6xl font-bold transition-colors outline-none leading-tight" 
                style={{ fontFamily: THEMES.DISPLAY_FONT, color: textColor }}
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
        <div className="h-full flex flex-col pt-12 pb-12 px-16" style={{ fontFamily: THEMES.TEXT_FONT }}>
            {/* Title Section */}
            <div className="flex flex-col mb-10 border-b pb-4 shrink-0" style={{ borderColor: primaryColor + '30' }}>
                <h2
                    className="text-4xl font-bold transition-colors outline-none leading-snug max-w-full break-words" 
                    style={{ fontFamily: THEMES.DISPLAY_FONT, color: titleColor }}
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(slide.sectionTitle) }}
                    onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
                />
            </div>

            {/* Main Content Section */}
            <div className="flex-1 overflow-y-auto pt-4 pr-4">
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

export const ContentsSlideContent = ({ slide, theme, onPointChange, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;

    return (
        <div className="flex flex-col h-full p-12" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 
                className="text-5xl font-bold mb-12" 
                style={{ fontFamily: THEMES.DISPLAY_FONT, color: '#000000' }}
            >
                Contents
            </h2>
            <div className="flex-1 overflow-y-auto space-y-6 pr-8">
                {slide.points.map((item, i) => {
                    const content = stripHtml(item);
                    // Extract part labels (Part 1, Section X, Chart X)
                    const partLabel = content.match(/(Part\s+\d+|Section\s+\d+|Chart\s+\d+)$/)?.[0] || '';
                    const headingText = content.replace(partLabel, '').replace(/\s*:\s*$/, '').trim();

                    return (
                        <div key={i} className="flex justify-between items-center py-4 border-b border-gray-300 last:border-b-0">
                            <span 
                                contentEditable
                                suppressContentEditableWarning
                                className="flex-1 outline-none text-2xl font-semibold p-1 rounded focus:ring-2 focus:ring-blue-300 mr-4"
                                style={{ color: textColor, fontFamily: THEMES.TEXT_FONT }}
                                dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(headingText) }}
                                onBlur={e => {
                                    const newContent = e.currentTarget.innerHTML + (partLabel ? ` ${partLabel}` : '');
                                    onPointChange(i, newContent);
                                }}
                            />
                            <span 
                                className="text-lg font-medium px-4 py-2 rounded-full whitespace-nowrap" 
                                style={{ 
                                    color: primaryColor, 
                                    backgroundColor: `${primaryColor}15`,
                                    border: `2px solid ${primaryColor}30`
                                }}
                            >
                                {partLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ThankYouSlideContent = ({ slide, theme, onTitleChange, onPointChange, onPointDelete, isSpecialBg }) => {
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <div className="flex flex-col justify-center items-center text-center h-full w-full p-12">
            <h2 
                className="text-5xl md:text-6xl font-bold mb-8 transition-colors outline-none leading-tight"
                style={{ 
                    fontFamily: THEMES.DISPLAY_FONT, 
                    color: textColor 
                }}
                contentEditable 
                suppressContentEditableWarning 
                dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(slide.sectionTitle) }}
                onBlur={e => onTitleChange(e.currentTarget.innerHTML)}
            />
            <div className="max-w-2xl">
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

// Reusable Editable Bullets Component
export const EditableBullets = ({ items, theme, onPointChange, onPointDelete, isSpecialBg }) => {
    const primaryColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : theme.primary;
    const textColor = isSpecialBg ? CUSTOM_GRADIENT_TEXT_COLOR : '#000000';

    return (
        <ul className="list-none ml-0 space-y-5">
            {items.map((item, i) => (
                <li key={i} className="text-xl font-normal flex items-start group transition-all" style={{ color: textColor, fontFamily: THEMES.TEXT_FONT, lineHeight: '1.6' }}>
                    <span style={{ color: primaryColor }} className="mr-4 mt-2 text-2xl flex-shrink-0">•</span>
                    <div className="flex-1">
                        <span
                            contentEditable
                            suppressContentEditableWarning
                            className="outline-none min-h-[1.5rem] p-1 rounded focus:ring-2 focus:ring-blue-300 block"
                            style={{ color: textColor }}
                            dangerouslySetInnerHTML={{ __html: boldKeywordsAndNumbers(item) }}
                            onBlur={e => onPointChange(i, e.currentTarget.innerHTML)}
                        />
                    </div>
                    <button
                        onClick={() => onPointDelete(i)}
                        className="ml-4 p-2 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        title="Delete bullet point"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </li>
            ))}
        </ul>
    );
};