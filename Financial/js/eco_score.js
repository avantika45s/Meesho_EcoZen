class EcoScoreAnalyzer {
    constructor() {
        this.apiKey = 'YOUR_GEMINI_API';
        this.currentProduct = null;
        this.init();
    }

    async init() {
        console.log('EcoScoreAnalyzer initialized');
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 1000);
    }

    setupEventListeners() {
        console.log('Setting up eco score event listeners...');
        const analyzeBtn = document.getElementById('startEcoAnalysis');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                window.location.href = chrome.runtime.getURL('html/ecozen.html');
            });
        }
        const startBtn = document.getElementById('startEcoAnalysis');
        if (startBtn) {
            console.log('Start analysis button found');
            startBtn.addEventListener('click', () => {
                console.log('Start eco analysis clicked');
                this.checkForProduct();
            });
        } else {
            console.error('Start analysis button not found');
        }

        const retryBtn1 = document.getElementById('ecoRetryBtn');
        if (retryBtn1) {
            retryBtn1.addEventListener('click', () => {
                console.log('Retry button 1 clicked');
                this.checkForProduct();
            });
        }

        const retryBtn2 = document.getElementById('ecoRetryBtn2');
        if (retryBtn2) {
            retryBtn2.addEventListener('click', () => {
                console.log('Retry button 2 clicked');
                this.checkForProduct();
            });
        }
    }

    async checkForProduct() {
        console.log('=== Starting product check ===');
        this.showEcoState('loading');

        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            console.log('Current tab:', tab.url);

            // Check if we're on a supported platform
            const supportedPlatforms = ['amazon.com', 'amazon.in', 'flipkart.com', 'meesho.com'];
            const isSupported = supportedPlatforms.some(platform => tab.url.includes(platform));
            console.log('Platform supported:', isSupported, 'for URL:', tab.url);

            if (!isSupported) {
                console.log('Platform not supported');
                this.showEcoState('noProduct');
                return;
            }

            // Try to ping the content script first
            console.log('Pinging content script...');
            try {
                const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
                console.log('Content script is alive:', pingResponse);
            } catch (pingError) {
                console.log('Content script not responding, may need injection');
                // Don't inject here since it should be loaded via manifest
            }

            // Wait a moment then try to get product data
            console.log('Requesting product data...');
            
            const response = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout waiting for product data (10s)'));
                }, 10000);

                chrome.tabs.sendMessage(tab.id, { action: 'scrapeProduct' }, (response) => {
                    clearTimeout(timeout);
                    
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        reject(new Error(`Runtime error: ${chrome.runtime.lastError.message}`));
                        return;
                    }
                    
                    console.log('Raw response from content script:', response);
                    resolve(response);
                });
            });

            console.log('Product data response:', response);

            if (response && response.success && response.data && response.data.title) {
                this.currentProduct = response.data;
                console.log('✅ Product data received:', this.currentProduct);
                await this.analyzeProduct(this.currentProduct, tab.url);
            } else {
                const errorMsg = response && response.error ? response.error : 'No valid product data found. Make sure you are on a product page.';
                console.error('❌ Product scraping failed:', errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('❌ Error in checkForProduct:', error);
            this.showEcoState('error', `Error: ${error.message}`);
        }
    }

    async analyzeProduct(productData, pageUrl) {
        console.log('Starting product analysis for:', productData.title);
        
        try {
            // Display basic product info
            this.displayProductInfo(productData);

            // Get sustainability analysis
            const analysis = await this.getSustainabilityAnalysis(productData);
            this.displayAnalysis(analysis);

            // Get sustainable alternatives
            const alternatives = await this.getSustainableAlternatives(productData);
            this.displayAlternatives(alternatives);

            this.showEcoState('analysis');
            console.log('✅ Analysis complete');
        } catch (error) {
            console.error('Analysis error:', error);
            this.showEcoState('error', 'Failed to analyze product: ' + error.message);
        }
    }

    async getSustainabilityAnalysis(productData) {
        console.log('Getting sustainability analysis...');
        
        // For now, return a default analysis to test the flow
        return {
            sustainabilityScore: 6,
            co2Emissions: 3.2,
            scoreExplanation: "Moderate sustainability score based on product category and typical manufacturing processes.",
            insights: [
                "Consider checking for eco-friendly certifications",
                "Look for products made from recycled materials",
                "Check if the brand has sustainability commitments",
                "Consider the product's durability and longevity"
            ]
        };
    }

    async getSustainableAlternatives(productData) {
        console.log('Getting sustainable alternatives...');
        
        const category = productData.category || 'product';
        
        return [
            {
                name: "Eco-friendly Alternative",
                price: "Similar price range",
                co2Reduction: "1-2 kg less CO2",
                benefits: "Made from sustainable materials with recyclable packaging",
                searchKeywords: `sustainable ${category} eco friendly`
            },
            {
                name: "Organic/Natural Option",
                price: "Slightly higher price",
                co2Reduction: "2-3 kg less CO2",
                benefits: "Organic materials, biodegradable, minimal environmental impact",
                searchKeywords: `organic natural ${category}`
            }
        ];
    }

    displayProductInfo(productData) {
        console.log('Displaying product info:', productData);
        
        const titleElement = document.getElementById('ecoProductTitle');
        const badgeElement = document.getElementById('ecoPlatformBadge');
        
        if (titleElement) {
            titleElement.textContent = productData.title;
            console.log('✅ Title displayed');
        } else {
            console.error('❌ Title element not found');
        }
        
        if (badgeElement) {
            badgeElement.textContent = productData.platform;
            
            const platformColors = {
                'Amazon': '#ff9800',
                'Flipkart': '#2874f0',
                'Meesho': '#9c27b0'
            };
            badgeElement.style.backgroundColor = platformColors[productData.platform] || '#666';
            badgeElement.style.color = 'white';
            console.log('✅ Badge displayed');
        } else {
            console.error('❌ Badge element not found');
        }
    }

    displayAnalysis(analysis) {
        console.log('Displaying analysis:', analysis);
        
        const scoreElement = document.getElementById('ecoScoreValue');
        if (scoreElement) {
            scoreElement.textContent = analysis.sustainabilityScore;
        }
        
        const descElement = document.getElementById('ecoScoreDescription');
        if (descElement) {
            descElement.textContent = analysis.scoreExplanation;
        }
        
        const co2Element = document.getElementById('ecoCo2Value');
        if (co2Element) {
            co2Element.textContent = `${analysis.co2Emissions} kg`;
        }
        
        const insightsList = document.getElementById('ecoInsightsList');
        if (insightsList) {
            insightsList.innerHTML = '';
            analysis.insights.forEach(insight => {
                const li = document.createElement('li');
                li.textContent = insight;
                insightsList.appendChild(li);
            });
        }
        
        console.log('✅ Analysis displayed');
    }

    displayAlternatives(alternatives) {
        console.log('Displaying alternatives:', alternatives);
        
        const alternativesList = document.getElementById('ecoAlternativesList');
        if (!alternativesList) {
            console.error('❌ Alternatives list element not found');
            return;
        }
        
        alternativesList.innerHTML = '';

        alternatives.forEach(alt => {
            const altDiv = document.createElement('div');
            altDiv.className = 'alternative-item';
            altDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 3px solid #4CAF50;
            `;

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(alt.searchKeywords)}`;

            altDiv.innerHTML = `
                <div class="alternative-title" style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">${alt.name}</div>
                <div style="color: #4CAF50; font-size: 12px; margin: 4px 0;">${alt.price}</div>
                <div style="color: #ff9800; font-size: 12px; margin: 4px 0;">🌱 ${alt.co2Reduction}</div>
                <div class="alternative-benefits" style="color: rgba(255, 255, 255, 0.8); margin: 8px 0;">${alt.benefits}</div>
                <a href="${searchUrl}" target="_blank" style="color: #4CAF50; text-decoration: none; font-size: 12px;">
                    🔍 Search Product
                </a>
            `;

            alternativesList.appendChild(altDiv);
        });
        
        console.log('✅ Alternatives displayed');
    }

    showEcoState(state, message = '') {
        console.log('Showing eco state:', state, message);
        
        // Hide all states first
        const states = ['ecoLoadingState', 'ecoNoProductState', 'ecoProductAnalysis', 'ecoAlternatives', 'ecoErrorState'];
        states.forEach(s => {
            const element = document.getElementById(s);
            if (element) {
                element.classList.add('hidden');
                element.style.display = 'none';
            }
        });

        // Show specific state
        switch (state) {
            case 'loading':
                const loadingElement = document.getElementById('ecoLoadingState');
                if (loadingElement) {
                    loadingElement.classList.remove('hidden');
                    loadingElement.style.display = 'block';
                }
                break;
            case 'noProduct':
                const noProductElement = document.getElementById('ecoNoProductState');
                if (noProductElement) {
                    noProductElement.classList.remove('hidden');
                    noProductElement.style.display = 'block';
                }
                break;
            case 'analysis':
                const analysisElement = document.getElementById('ecoProductAnalysis');
                const alternativesElement = document.getElementById('ecoAlternatives');
                if (analysisElement) {
                    analysisElement.classList.remove('hidden');
                    analysisElement.style.display = 'block';
                }
                if (alternativesElement) {
                    alternativesElement.classList.remove('hidden');
                    alternativesElement.style.display = 'block';
                }
                break;
            case 'error':
                const errorElement = document.getElementById('ecoErrorState');
                if (errorElement) {
                    errorElement.classList.remove('hidden');
                    errorElement.style.display = 'block';
                }
                const errorMessage = document.getElementById('ecoErrorMessage');
                if (errorMessage && message) {
                    errorMessage.textContent = message;
                }
                break;
        }
        
        console.log('✅ State display updated');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing EcoScoreAnalyzer...');
    setTimeout(() => {
        if (typeof window.ecoScoreAnalyzer === 'undefined') {
            window.ecoScoreAnalyzer = new EcoScoreAnalyzer();
            console.log('✅ EcoScoreAnalyzer created');
        }
    }, 500);
});
