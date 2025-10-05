import React from 'react';

// --- MOCK DATA AND CONSTANTS FOR RUNNABILITY ---
// In a real application, these would be imported from a separate file.
const THEMES = {
    TEXT_FONT: 'Inter, sans-serif',
    PRIMARY_COLOR: '#4F46E5', // Indigo 600 - Clean, vibrant primary color
    SECONDARY_COLOR: '#06B6D4', // Cyan 600
};

const mockTheme = {
    primary: THEMES.PRIMARY_COLOR,
    secondary: THEMES.SECONDARY_COLOR,
};

const mockData = {
    bar: [
        { category: 'Q1', value: 12000, color: THEMES.PRIMARY_COLOR },
        { category: 'Q2', value: 18500, color: THEMES.PRIMARY_COLOR },
        { category: 'Q3', value: 15000, color: THEMES.PRIMARY_COLOR },
        { category: 'Q4', value: 24000, color: THEMES.PRIMARY_COLOR },
    ],
    pie: [
        { category: 'Sales', value: 45.2, color: '#3B82F6' }, // Blue
        { category: 'Marketing', value: 25.8, color: '#10B981' }, // Emerald
        { category: 'R&D', value: 15.0, color: '#F59E0B' }, // Amber
        { category: 'Admin', value: 14.0, color: '#EC4899' }, // Pink
    ],
    line: [
        { month: 'Jan', value: 150 },
        { month: 'Feb', value: 210 },
        { month: 'Mar', value: 180 },
        { month: 'Apr', value: 250 },
        { month: 'May', value: 300 },
        { month: 'Jun', value: 270 },
    ],
    horizontal: [
        { category: 'North Region', value: 850, color: '#EF4444' },
        { category: 'South Region', value: 1100, color: '#3B82F6' },
        { category: 'East Region', value: 950, color: '#10B981' },
    ],
    area: [
        { month: 'Jan', value: 80 },
        { month: 'Feb', value: 120 },
        { month: 'Mar', value: 90 },
        { month: 'Apr', value: 160 },
        { month: 'May', value: 180 },
        { month: 'Jun', value: 150 },
    ]
};

const ALL_CHART_DATA = [
    { sectionTitle: "Quarterly Revenue (Bar Chart)", chartType: 'bar', chartData: mockData.bar },
    { sectionTitle: "Departmental Budget Allocation (Pie Chart)", chartType: 'pie', chartData: mockData.pie },
    { sectionTitle: "Monthly User Sign-ups (Line Chart)", chartType: 'line', chartData: mockData.line },
    { sectionTitle: "Regional Performance (Horizontal Bar Chart)", chartType: 'horizontal', chartData: mockData.horizontal },
    { sectionTitle: "Monthly Active Users (Area Chart)", chartType: 'area', chartData: mockData.area },
];

// --- UTILITY COMPONENTS ---

const YAxisLabels = ({ maxValue, height, textColor }) => {
    const ticks = [0, 0.25, 0.5, 0.75, 1.0];
    return (
        <div className="absolute inset-0 right-auto w-16 flex flex-col justify-between pb-6 pt-0 pr-2">
            {ticks.slice().reverse().map((tick, i) => (
                <div 
                    key={i} 
                    className="text-right text-xs font-medium" 
                    style={{ color: '#6B7280', height: i === 0 || i === ticks.length - 1 ? 'auto' : `${height / (ticks.length - 1)}px` }}
                >
                    {Math.round(maxValue * tick).toLocaleString()}
                </div>
            ))}
        </div>
    );
};

// --- CHART COMPONENTS START ---

/**
 * Simple Bar Chart (Vertical)
 * Changes: Removed bar border, ensured faint grid lines, and cleaner label placement.
 */
export const BarChartSlide = ({ data, theme, isSpecialBg, title }) => {
    const chartData = data || [];
    const maxValue = Math.max(...(chartData.map(i => i.value) || [1]));
    const chartHeight = 280;
    const textColor = '#1F2937'; // Darker text for professional look
    const chartColor = theme.primary;
    
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg m-4" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 className="text-2xl font-semibold mb-10 text-center" 
                style={{ color: textColor }}>
                {title}
            </h2>
            <div className="w-full max-w-4xl px-4">
                <div className="relative h-80">
                    <YAxisLabels maxValue={maxValue} height={chartHeight} textColor={textColor} />
                    
                    <div className="absolute inset-0 left-16">
                        {/* Grid Lines (Faint and horizontal) */}
                        <div className="absolute inset-0 flex flex-col justify-between h-full">
                            {/* We use 5 lines, which creates 4 spaces. */}
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-full ${i === 4 ? 'border-b' : 'border-t'} border-gray-100`} />
                            ))}
                        </div>
                        
                        {/* Bars */}
                        <div className="flex items-end justify-between space-x-6 h-full relative z-10 pt-4">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                                    <div 
                                        className="w-4/5 rounded-t-md transition-all duration-500 ease-out hover:shadow-lg cursor-pointer"
                                        style={{ 
                                            height: `${(item.value / (maxValue || 1)) * chartHeight}px`, 
                                            backgroundColor: item.color || chartColor, 
                                            minHeight: (item.value > 0 && item.value / maxValue * chartHeight < 4) ? '4px' : '0px',
                                        }}
                                        title={`${item.category}: ${item.value.toLocaleString()}`}
                                    >
                                        {/* Value label on top of the bar */}
                                        <div className="relative bottom-8 w-full text-center">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-800 shadow-sm">
                                                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-center truncate w-full" 
                                         style={{ color: textColor }}>
                                        {item.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Simple Pie Chart
 * Changes: Maintained clean look, ensured clear legend for high contrast.
 */
export const PieChartSlide = ({ data, theme, isSpecialBg, title }) => {
    const chartData = data || [];
    let currentAngle = 0;
    const textColor = '#1F2937';
    
    // Updated color palette for a modern, distinct look
    const colorPalette = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EC4899', // Pink
        '#8B5CF6', // Violet
        '#EF4444', // Red
        '#06B6D4'  // Cyan
    ];
    
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg m-4" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 className="text-2xl font-semibold mb-10 text-center"
                style={{ color: textColor }}>
                {title}
            </h2>
            <div className="flex flex-col lg:flex-row items-center justify-center space-y-10 lg:space-y-0 lg:space-x-16">
                <div className="relative">
                    {/* The outer container is simplified */}
                    <div className="w-72 h-72 bg-white rounded-full p-4">
                        <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
                            {chartData.map((item, index) => {
                                const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1;
                                const percentage = item.value / total * 100;
                                const angle = (percentage / 100) * 360;
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                
                                const x1 = 140 + 120 * Math.cos(currentAngle * Math.PI / 180);
                                const y1 = 140 + 120 * Math.sin(currentAngle * Math.PI / 180);
                                currentAngle += angle;
                                const x2 = 140 + 120 * Math.cos(currentAngle * Math.PI / 180);
                                const y2 = 140 + 120 * Math.sin(currentAngle * Math.PI / 180);
                                
                                const segmentColor = item.color || colorPalette[index % colorPalette.length];

                                return (
                                    <path 
                                        key={index} 
                                        d={`M 140,140 L ${x1},${y1} A 120,120 0 ${largeArcFlag},1 ${x2},${y2} Z`} 
                                        fill={segmentColor} 
                                        stroke="#FFFFFF" 
                                        strokeWidth="4" 
                                        className="transition-transform duration-300 hover:scale-[1.03] origin-center"
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </div>
                {/* Legend/Key */}
                <div className="space-y-4 min-w-[240px] p-4 border rounded-lg border-gray-100 shadow-sm">
                    <div className="text-sm font-bold uppercase tracking-wider text-gray-500">Breakdown</div>
                    {chartData.map((item, index) => {
                        const segmentColor = item.color || colorPalette[index % colorPalette.length];
                        return (
                            <div key={index} className="flex items-center space-x-3">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: segmentColor }} 
                                />
                                <div className="flex-1 text-sm font-medium" style={{ color: textColor }}>
                                    {item.category}
                                </div>
                                <div className="text-base font-bold text-gray-800">
                                    {Number(item.value).toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/**
 * Simple Line Chart
 * Changes: Focused on faint grid, clear data points, and minimal axis labels.
 */
export const LineChartSlide = ({ data, theme, isSpecialBg, title }) => {
    const chartData = data || [];
    const maxValue = Math.max(...(chartData.map(item => item.value) || [1]));
    const pointRadius = 6;
    const chartHeight = 280;
    const textColor = '#1F2937';
    const chartColor = theme.primary;
    
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg m-4" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 className="text-2xl font-semibold mb-10 text-center" 
                style={{ color: textColor }}>
                {title}
            </h2>
            <div className="w-full max-w-5xl px-4">
                <div className="relative h-80">
                    <YAxisLabels maxValue={maxValue} height={chartHeight} textColor={textColor} />
                    
                    <div className="absolute inset-0 left-16">
                        <div className="relative h-full pt-0 pb-6">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-full ${i === 4 ? 'border-b' : 'border-t'} border-gray-100`} />
                                ))}
                            </div>
                            
                            {/* Line and Points SVG */}
                            <svg width="100%" height="100%" className="absolute inset-0 z-10">
                                {/* Main line */}
                                <polyline 
                                    fill="none" 
                                    stroke={chartColor} 
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={(chartData.length ? chartData : [{value:0}]).map((item, idx) => 
                                        `${(idx/Math.max(1,(chartData.length-1)))*100}%,${100 - ((item.value || 0) / (maxValue || 1))*100}`
                                    ).join(' ')} 
                                />
                                
                                {/* Data points */}
                                {chartData.map((item, idx) => (
                                    <g key={idx}>
                                        {/* Outer circle (hover target) */}
                                        <circle 
                                            cx={`${(idx/Math.max(1,(chartData.length-1)))*100}%`} 
                                            cy={`${100 - ((item.value||0)/(maxValue||1))*100}%`} 
                                            r={pointRadius + 2} 
                                            fill="transparent" 
                                            className="cursor-pointer"
                                            title={`${item.month}: ${item.value.toLocaleString()}`}
                                        />
                                        {/* Inner circle (point marker) */}
                                        <circle 
                                            cx={`${(idx/Math.max(1,(chartData.length-1)))*100}%`} 
                                            cy={`${100 - ((item.value||0)/(maxValue||1))*100}%`} 
                                            r={pointRadius} 
                                            fill="#FFFFFF" 
                                            stroke={chartColor}
                                            strokeWidth="2"
                                            className="transition-all duration-100 hover:scale-125"
                                        />
                                        <circle 
                                            cx={`${(idx/Math.max(1,(chartData.length-1)))*100}%`} 
                                            cy={`${100 - ((item.value||0)/(maxValue||1))*100}%`} 
                                            r={pointRadius - 3} 
                                            fill={chartColor}
                                        />
                                    </g>
                                ))}
                            </svg>
                            
                            {/* X-axis labels (Month and Value) */}
                            <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2">
                                {chartData.map((item, idx) => (
                                    <div key={idx} className="text-center flex-1 min-w-0">
                                        <div className="font-semibold text-xs text-gray-700 truncate">
                                            {item.month}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Horizontal Bar Chart
 * Changes: Removed gradient/shadow for a flatter, high-contrast bar.
 */
export const HorizontalBarChartSlide = ({ data, theme, isSpecialBg, title }) => {
    const chartData = data || [];
    const maxValue = Math.max(...(chartData.map(item => item.value) || [1]));
    const textColor = '#1F2937';
    const chartColor = theme.primary;
    
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg m-4" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 className="text-2xl font-semibold mb-10 text-center" 
                style={{ color: textColor }}>
                {title}
            </h2>
            <div className="w-full max-w-4xl space-y-6">
                {chartData.map((item, index) => {
                    const percentage = ((item.value || 0) / (maxValue || 1)) * 100;
                    const displayValue = typeof item.value === 'number' ? item.value.toLocaleString() : item.value;
                    const barColor = item.color || chartColor;
                    
                    return (
                        <div key={index} className="flex items-center space-x-4 group">
                            {/* Category Label */}
                            <span className="text-sm w-32 font-medium text-right pr-4 text-gray-600 truncate" 
                                  title={item.category}>
                                    {item.category}
                            </span>
                            
                            {/* Horizontal Bar */}
                            <div className="flex-1 bg-gray-100 rounded-lg h-7 overflow-hidden">
                                <div 
                                    className="h-7 rounded-lg transition-all duration-700 ease-out flex items-center pr-3 group-hover:shadow-md"
                                    style={{ 
                                        width: `${percentage}%`, 
                                        backgroundColor: barColor, 
                                        minWidth: (item.value > 0 && percentage < 10) ? '10%' : '0%', // Ensure small bar visibility
                                        justifyContent: percentage > 30 ? 'flex-end' : 'flex-start', // Place text inside or outside
                                    }}
                                >
                                    <span 
                                        className={`text-xs font-bold ${percentage > 30 ? 'text-white' : 'text-gray-800 ml-2'}`}
                                        style={{ transition: 'opacity 0.3s' }}
                                    >
                                        {displayValue}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Percentage Label */}
                            <div className="w-12 text-right">
                                <span className="text-sm font-bold text-gray-800">
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Area Chart
 * Changes: Maintained clean line/area look, using a subtle gradient fill.
 */
export const AreaChartSlide = ({ data, theme, isSpecialBg, title }) => {
    const chartData = data || [];
    const maxValue = Math.max(...(chartData.map(item => item.value) || [1]));
    const chartHeight = 280;
    const textColor = '#1F2937';
    const chartColor = theme.primary;
    const pointRadius = 4;
    
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg m-4" style={{ fontFamily: THEMES.TEXT_FONT }}>
            <h2 className="text-2xl font-semibold mb-10 text-center" 
                style={{ color: textColor }}>
                {title}
            </h2>
            <div className="w-full max-w-5xl px-4">
                <div className="relative h-80">
                    <YAxisLabels maxValue={maxValue} height={chartHeight} textColor={textColor} />
                    
                    <div className="absolute inset-0 left-16">
                        <div className="relative h-full pt-0 pb-6">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-full ${i === 4 ? 'border-b' : 'border-t'} border-gray-100`} />
                                ))}
                            </div>
                            
                            <svg width="100%" height="100%" className="absolute inset-0 z-10">
                                {/* Area fill Definition */}
                                <defs>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                                
                                {/* Area fill Polygon */}
                                <polyline 
                                    fill="url(#areaGradient)" 
                                    stroke="none"
                                    points={`0,100 ${(chartData.length ? chartData : [{value:0}]).map((item, idx) => 
                                        `${(idx/Math.max(1,(chartData.length-1)))*100},${100 - ((item.value || 0) / (maxValue || 1))*100}`
                                    ).join(' ')} 100,100`} 
                                />
                                
                                {/* Main line */}
                                <polyline 
                                    fill="none" 
                                    stroke={chartColor} 
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    points={(chartData.length ? chartData : [{value:0}]).map((item, idx) => 
                                        `${(idx/Math.max(1,(chartData.length-1)))*100},${100 - ((item.value || 0) / (maxValue || 1))*100}`
                                    ).join(' ')} 
                                />
                                
                                {/* Data points */}
                                {chartData.map((item, idx) => (
                                    <g key={idx}>
                                        <circle 
                                            cx={`${(idx/Math.max(1,(chartData.length-1)))*100}%`} 
                                            cy={`${100 - ((item.value||0)/(maxValue||1))*100}%`} 
                                            r={pointRadius + 2} 
                                            fill="transparent" 
                                            className="cursor-pointer"
                                            title={`${item.month}: ${item.value.toLocaleString()}`}
                                        />
                                        <circle 
                                            cx={`${(idx/Math.max(1,(chartData.length-1)))*100}%`} 
                                            cy={`${100 - ((item.value||0)/(maxValue||1))*100}%`} 
                                            r={pointRadius} 
                                            fill="white" 
                                            stroke={chartColor}
                                            strokeWidth="2"
                                            className="transition-all duration-100 hover:scale-125"
                                        />
                                    </g>
                                ))}
                            </svg>
                            
                            {/* X-axis labels */}
                            <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2">
                                {chartData.map((item, idx) => (
                                    <div key={idx} className="text-center flex-1 min-w-0">
                                        <div className="font-semibold text-xs text-gray-700 truncate">
                                            {item.month}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/**
 * Main Chart Slideshow Component (Unchanged logic, wrapped in a demo container)
 */
export const ChartSlide = ({ slide, theme, isSpecialBg }) => {
    const chartType = slide.chartType || 'bar';
    
    switch (chartType) {
        case 'bar': 
            return <BarChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
        case 'pie': 
            return <PieChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
        case 'line': 
            return <LineChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
        case 'horizontal': 
            return <HorizontalBarChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
        case 'area': 
            return <AreaChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
        default: 
            return <BarChartSlide data={slide.chartData} theme={theme} isSpecialBg={isSpecialBg} title={slide.sectionTitle} />;
    }
};

/**
 * Demo App Component to showcase all charts
 */
const App = () => {
    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <h1 className="text-3xl font-extrabold text-center mb-12 text-gray-800" style={{ fontFamily: THEMES.TEXT_FONT }}>
                Modern Chart Visualization Demo
            </h1>
            <div className="space-y-12">
                {ALL_CHART_DATA.map((slide, index) => (
                    <div key={index} className="flex justify-center">
                        <ChartSlide slide={slide} theme={mockTheme} isSpecialBg={false} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
