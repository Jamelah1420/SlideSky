import React, { useState, useRef } from 'react';

const HOME_COLORS = {
    BG: '#FFFFFF', 
    TEXT_DARK: '#111827',
    TEXT_LIGHT: '#6B7280',
    ACCENT_PRIMARY: '#059669',
    ACCENT_SECONDARY: '#7C3AED',
    ACCENT_GRADIENT: 'linear-gradient(135deg, #059669, #7C3AED)',
    HEADER_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.08)',
};

const HomePage = ({ onFileProcessed }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showCookieBanner, setShowCookieBanner] = useState(true);
    const fileInputRef = useRef(null);

    // Handle contact email
    const handleContactUs = () => {
        window.location.href = 'mailto:jamelah.hadi2019@gmail.com?subject=SlideSky Inquiry&body=Hello, I would like to learn more about SlideSky...';
    };

    // Handle file upload - SIMPLIFIED VERSION
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Immediately process the file and go to editor
            let progress = 0;
            setUploadProgress(10);
            
            const interval = setInterval(() => {
                progress += 30;
                setUploadProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Create a mock event to pass to the parent component
                    const mockEvent = {
                        target: {
                            files: [file]
                        }
                    };
                    
                    // Call the parent's file processor directly
                    onFileProcessed(mockEvent);
                }
            }, 100);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files: [files[0]] } });
        }
    };

    // Features
    const features = [
        { icon: (<div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>), title: "Smart Data Analysis", description: "AI-powered insights from your spreadsheets" },
        { icon: (<div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></div>), title: "Beautiful Visualizations", description: "Automatically generated charts and graphs" },
        { icon: (<div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></div>), title: "Instant Presentations", description: "Turn data into slides in seconds" }
    ];

    // Process steps
    const processSteps = ["Upload your CSV or Excel file", "AI analyzes and extracts key insights", "Generate beautiful slides automatically"];

    // Social media links
    const socialLinks = [
        { name: "Twitter", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>), url: "#" },
        { name: "LinkedIn", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>), url: "#" },
        { name: "Email", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>), url: "mailto:jamelah.hadi2019@gmail.com" }
    ];

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Simple Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-50 rounded-full blur-3xl opacity-50"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="relative group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-70"></div>
                                    <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xl">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    SlideSky
                                </span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            {['Features', 'Use Cases', 'Templates', 'Pricing', 'Support'].map((item) => (
                                <a key={item} href="#" className={`text-sm font-medium text-gray-600 hover:text-gray-900`}>{item}</a>
                            ))}
                        </nav>

                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative pt-24 pb-16 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                AI TOOLS FOR DATA-DRIVEN PRESENTATIONS
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Master presentations and{' '}
                            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                                Data Visualization
                            </span>{' '}
                            with AI
                        </h1>

                        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Instantly turn your raw data (CSV, Excel) into polished, persuasive presentations, charts, and key insights.
                        </p>

                        {/* Upload Section - SIMPLIFIED */}
                        <div className={`max-w-2xl mx-auto mb-16 p-8 rounded-xl border-2 border-dashed transition-colors ${
                            isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 bg-white'
                        }`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                            {/* Hidden file input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept=".csv,.xlsx,.xls" 
                                className="hidden" 
                            />
                            
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Excel File</h3>
                                <p className="text-gray-600 mb-6">Drag & drop your file or click to browse</p>
                                
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
                                >
                                    Choose Excel File
                                </button>

                                {uploadProgress > 0 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-purple-600 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">Processing... {uploadProgress}%</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {features.map((feature, index) => (
                                <div key={feature.title} className="text-center p-6">
                                    <div className="flex justify-center mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* See it in Action Section */}
                    <div className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See it in Action</h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Watch how SlideSky transforms your raw data into stunning presentations with just a few clicks.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                            {/* Process Steps */}
                            <div className="space-y-6">
                                {processSteps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-gray-700">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Presentation Preview */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                                <div className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Presentation Preview</span>
                                        <div className="flex space-x-1">
                                            <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                                            <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                                            <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 bg-gradient-to-br from-emerald-50 to-purple-50 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 font-medium">Your AI-generated presentation</p>
                                        <p className="text-sm text-gray-500 mt-2">Ready in seconds</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colorful Contact Section */}
                    <div className="relative mb-20 overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-purple-600 to-blue-600 opacity-90"></div>
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        
                        {/* Floating shapes */}
                        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
                        
                        <div className="relative z-10 p-12 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Data?</h2>
                            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                                Get started with SlideSky today and experience the power of AI-driven data visualization.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                                <button 
                                    onClick={handleContactUs}
                                    className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3"
                                >
                                    <span>Contact Us Now</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
                                >
                                    Upload Excel File
                                </button>
                            </div>
                            
                            <p className="text-white/80 text-sm">
                                Email us at: <a href="mailto:jamelah.hadi2019@gmail.com" className="text-white font-semibold hover:underline">jamelah.hadi2019@gmail.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer with Social Media */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-purple-600 rounded flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-semibold">SlideSky</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 max-w-md">
                                Transform your raw data into compelling presentations with AI-powered insights and beautiful visualizations.
                            </p>
                            <div className="flex space-x-3">
                                {socialLinks.map((social) => (
                                    <a 
                                        key={social.name}
                                        href={social.url}
                                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-emerald-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-110"
                                        title={social.name}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="font-semibold mb-4">Contact</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>Email: jamelah.hadi2019@gmail.com</li>
                                <li>Support: support@SlideSky.com</li>
                                <li>Phone: +1 (555) 123-4567</li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Copyright */}
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2024 SlideSky. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Cookie Banner */}
            {showCookieBanner && (
                <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-2xl mx-auto z-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-gray-700 text-sm text-center sm:text-left">
                            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                        </p>
                        <div className="flex items-center gap-3">
                            <button className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800">Learn More</button>
                            <button 
                                onClick={() => setShowCookieBanner(false)}
                                className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-purple-600 text-white text-sm rounded hover:opacity-90 transition-opacity"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;