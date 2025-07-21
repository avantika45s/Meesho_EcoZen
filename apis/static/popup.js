class SustainaBuyPopup {
    constructor() {
        this.apiKey = 'AIzaSyDuWUCV2xaDNhdoDIHAR07_MVJz01_cIWM';
        this.currentProduct = null;
        this.init();
    }

    async init() {
        // Load stored API key
        const stored = await chrome.storage.local.get(['geminiApiKey']);
        this.apiKey = stored.geminiApiKey || '';

        if (this.apiKey) {
            document.getElementById('apiKey').value = this.apiKey;
        }

        this.setupEventListeners();
        this.checkForProduct();
    }

    setupEventListeners() {
        // Settings toggle
        document.getElementById('settingsBtn').addEventListener('click', () => {
            const panel = document.getElementById('settingsPanel');
            panel.classList.toggle('active');
        });

        // Save API key
        document.getElementById('saveApiKey').addEventListener('click', () => {
            const apiKey = document.getElementById('apiKey').value.trim();
            if (apiKey) {
                this.apiKey = apiKey;
                chrome.storage.local.set({ geminiApiKey: apiKey });
                this.showMessage('API key saved successfully!', 'success');
                document.getElementById('settingsPanel').classList.remove('active');
                this.checkForProduct();
            } else {
                this.showMessage('Please enter a valid API key', 'error');
            }
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.checkForProduct();
        });
    }

    // Generate a unique key for the current page
    generatePageKey(url) {
        // Remove query parameters and fragments for consistent caching
        const cleanUrl = url.split('?')[0].split('#')[0];
        return btoa(cleanUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
    }

    // Save analysis results to local storage
    async saveAnalysisToStorage(url, productData, analysis, alternatives) {
        const pageKey = this.generatePageKey(url);
        const cacheData = {
            url: url,
            timestamp: Date.now(),
            productData: productData,
            analysis: analysis,
            alternatives: alternatives
        };

        try {
            await chrome.storage.local.set({ [`analysis_${pageKey}`]: cacheData });
            console.log('Analysis saved to storage for page:', pageKey);
        } catch (error) {
            console.error('Error saving analysis to storage:', error);
        }
    }

    // Load analysis results from local storage
    async loadAnalysisFromStorage(url) {
        const pageKey = this.generatePageKey(url);
        
        try {
            const result = await chrome.storage.local.get([`analysis_${pageKey}`]);
            const cacheData = result[`analysis_${pageKey}`];

            if (cacheData && cacheData.url === url) {
                // Check if cache is still valid (within 24 hours)
                const hoursSinceCache = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
                if (hoursSinceCache < 24) {
                    console.log('Loading cached analysis for page:', pageKey);
                    return cacheData;
                }
            }
        } catch (error) {
            console.error('Error loading analysis from storage:', error);
        }

        return null;
    }

    // Clear cached analysis for a specific page
    async clearPageCache(url) {
        const pageKey = this.generatePageKey(url);
        try {
            await chrome.storage.local.remove([`analysis_${pageKey}`]);
            console.log('Cache cleared for page:', pageKey);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // Clean up old cached analyses (older than 7 days)
    async cleanupOldCache() {
        try {
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            for (const key in allData) {
                if (key.startsWith('analysis_') && allData[key].timestamp < sevenDaysAgo) {
                    keysToRemove.push(key);
                }
            }

            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log('Cleaned up old cache entries:', keysToRemove.length);
            }
        } catch (error) {
            console.error('Error cleaning up old cache:', error);
        }
    }

    async checkForProduct() {
        if (!this.apiKey) {
            this.showState('settings');
            return;
        }

        this.showState('loading');

        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if we're on a supported platform
            const supportedPlatforms = ['amazon.com', 'amazon.in', 'flipkart.com', 'meesho.com'];
            const isSupported = supportedPlatforms.some(platform => tab.url.includes(platform));

            if (!isSupported) {
                this.showState('noProduct');
                return;
            }

            // Clean up old cache entries
            await this.cleanupOldCache();

            // Try to load cached analysis first
            const cachedAnalysis = await this.loadAnalysisFromStorage(tab.url);
            if (cachedAnalysis) {
                this.currentProduct = cachedAnalysis.productData;
                this.displayProductInfo(cachedAnalysis.productData);
                this.displayAnalysis(cachedAnalysis.analysis);
                this.displayAlternatives(cachedAnalysis.alternatives);
                this.showState('analysis');
                this.showMessage('Loaded cached analysis', 'success');
                return;
            }

            // If no cache, scrape fresh data
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            // Get product data
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeProduct' });

            if (response && response.success && response.data) {
                this.currentProduct = response.data;
                await this.analyzeProduct(this.currentProduct, tab.url);
            } else {
                throw new Error('Failed to scrape product data');
            }
        } catch (error) {
            console.error('Error checking for product:', error);
            this.showState('error', error.message);
        }
    }

    async analyzeProduct(productData, pageUrl) {
        if (!productData || !productData.title) {
            this.showState('noProduct');
            return;
        }

        try {
            // Display basic product info
            this.displayProductInfo(productData);

            // Get sustainability analysis
            const analysis = await this.getSustainabilityAnalysis(productData);
            this.displayAnalysis(analysis);

            // Get sustainable alternatives
            const alternatives = await this.getSustainableAlternatives(productData);
            this.displayAlternatives(alternatives);

            // Save results to storage
            await this.saveAnalysisToStorage(pageUrl, productData, analysis, alternatives);

            this.showState('analysis');
        } catch (error) {
            console.error('Analysis error:', error);
            this.showState('error', 'Failed to analyze product: ' + error.message);
        }
    }

    displayProductInfo(productData) {
        document.getElementById('productTitle').textContent = productData.title;
        document.getElementById('platformBadge').textContent = productData.platform;

        // Set platform badge color
        const badge = document.getElementById('platformBadge');
        const platformColors = {
            'Amazon': '#ff9800',
            'Flipkart': '#2874f0',
            'Meesho': '#9c27b0'
        };
        badge.style.backgroundColor = platformColors[productData.platform] || '#666';
        badge.style.color = 'white';
    }

    async getSustainabilityAnalysis(productData) {
        const prompt = `
        Analyze the sustainability of this product and provide a comprehensive assessment:

        Product: ${productData.title}
        Platform: ${productData.platform}
        Price: ${productData.price}
        Material: ${productData.material || 'Unknown'}
        Weight: ${productData.weight || 'Unknown'}
        Dimensions: ${productData.dimensions || 'Unknown'}
        Brand: ${productData.brand || 'Unknown'}
        Category: ${productData.category || 'Unknown'}
        Description: ${productData.description ? productData.description.substring(0, 500) : 'No description'}

        Please provide:
        1. A sustainability score from 0-10 (10 being most sustainable)
        2. Estimated CO2 emissions in kg for production and shipping
        3. 3-5 specific environmental insights or concerns in short about 1 lines each
        4. Brief explanation of the score

        Format your response as JSON:
        {
            "sustainabilityScore": number,
            "co2Emissions": number,
            "scoreExplanation": "brief explanation",
            "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"]
        }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey  // Use header instead of query parameter
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            console.log(content);

            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            else {
                // Fallback parsing
                return this.parseAnalysisResponse(content);
            }
        } catch (error) {
            console.error('Sustainability analysis error:', error);
            // Return default analysis
            return {
                sustainabilityScore: 5,
                co2Emissions: 2.5,
                scoreExplanation: "Unable to analyze - using default values",
                insights: ["Analysis temporarily unavailable", "Consider checking product materials", "Look for eco-friendly certifications"]
            };
        }
    }

    parseAnalysisResponse(content) {
        // Fallback parser for non-JSON responses
        const scoreMatch = content.match(/sustainability.{0,20}score.{0,20}(\d+)/i);
        const co2Match = content.match(/co2.{0,20}emissions.{0,20}(\d+\.?\d*)/i);

        return {
            sustainabilityScore: scoreMatch ? parseInt(scoreMatch[1]) : 5,
            co2Emissions: co2Match ? parseFloat(co2Match[1]) : 2.5,
            scoreExplanation: "Estimated based on product category and materials",
            insights: ["Consider material sustainability", "Check for eco-certifications", "Look for local alternatives"]
        };
    }

    displayAnalysis(analysis) {
        // Update score circle
        const scoreValue = document.getElementById('scoreValue');
        const scoreCircle = document.getElementById('scoreCircle');
        const scoreDescription = document.getElementById('scoreDescription');

        scoreValue.textContent = analysis.sustainabilityScore;
        scoreDescription.textContent = analysis.scoreExplanation;

        // Update score circle color and progress
        const percentage = (analysis.sustainabilityScore / 10) * 360;
        const color = this.getScoreColor(analysis.sustainabilityScore);
        scoreCircle.style.background = `conic-gradient(${color} ${percentage}deg, #e0e0e0 ${percentage}deg)`;

        // Update CO2 and material info
        document.getElementById('co2Value').textContent = `${analysis.co2Emissions} kg`;
        document.getElementById('materialValue').textContent = this.currentProduct.material || 'Unknown';

        // Update insights
        const insightsList = document.getElementById('insightsList');
        insightsList.innerHTML = '';
        analysis.insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            insightsList.appendChild(li);
        });
    }

    getScoreColor(score) {
        if (score >= 8) return '#4CAF50'; // Green
        if (score >= 6) return '#FF9800'; // Orange
        if (score >= 4) return '#FF5722'; // Red-orange
        return '#f44336'; // Red
    }

    async getSustainableAlternatives(productData) {
    const prompt = `
    Find 3-5 sustainable alternatives for this product with higher score:

    Product: ${productData.title}
    Category: ${productData.category || 'Unknown'}
    Price Range: ${productData.price || 'Unknown'}
    Platform: ${productData.platform}

    Please suggest eco-friendly alternatives with:
    1. Product name (be specific and realistic)
    2. Estimated price
    3. Sustainability benefits
    4. Estimated CO2 reduction
    5. Why it's more sustainable
    6. Specific search keywords that would help find this product

    Format as JSON array:
    [
        {
            "name": "Product name",
            "price": "Price estimate",
            "co2Reduction": "CO2 reduction in kg",
            "benefits": "Why it's more sustainable",
            "searchKeywords": "specific keywords to search for this product",
            "category": "product category"
        }
    ]

    Focus on real, existing eco-friendly brands and products in the market.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyDuWUCV2xaDNhdoDIHAR07_MVJz01_cIWM`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;

        // Extract JSON from the response (looking for array)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const alternatives = JSON.parse(jsonMatch[0]);
            return this.addPlatformUrls(alternatives);
        } else {
            return this.parseAlternativesResponse(content, productData);
        }
    } catch (error) {
        console.error('Alternatives error:', error);
        return this.getDefaultAlternatives(productData);
    }
}

    parseAlternativesResponse(content, productData) {
        // Simple fallback parser
        return this.getDefaultAlternatives(productData);
    }

    getDefaultAlternatives(productData) {
        const category = productData.category || 'product';
        const baseSearchTerm = `eco friendly sustainable ${category}`;
        
        const alternatives = [
            {
                name: "Eco-friendly Alternative",
                price: "Similar price range",
                co2Reduction: "1-2 kg less CO2",
                benefits: "Made from sustainable materials with recyclable packaging",
                searchKeywords: `sustainable ${category} eco friendly`,
                category: category
            },
            {
                name: "Organic/Natural Option",
                price: "Slightly higher price",
                co2Reduction: "2-3 kg less CO2",
                benefits: "Organic materials, biodegradable, minimal environmental impact",
                searchKeywords: `organic natural ${category}`,
                category: category
            },
            {
                name: "Recycled Material Product",
                price: "Competitive pricing",
                co2Reduction: "1.5-2.5 kg less CO2",
                benefits: "Made from recycled materials, reduces waste",
                searchKeywords: `recycled ${category} sustainable`,
                category: category
            }
        ];

        return this.addPlatformUrls(alternatives);
    }

    displayAlternatives(alternatives) {
        const alternativesList = document.getElementById('alternativesList');
        alternativesList.innerHTML = '';

        alternatives.forEach(alt => {
            const altDiv = document.createElement('div');
            altDiv.className = 'alternative-item';

            // Validate URL and add fallback
            let productUrl = alt.productUrl;
            if (!productUrl || !this.isValidUrl(productUrl)) {
                // Create fallback search URL
                const searchTerm = `eco friendly ${alt.name}`;
                productUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&ref=nb_sb_noss`;
            }

            altDiv.innerHTML = `
                <div class="alternative-title">${alt.name}</div>
                <div class="alternative-price">${alt.price}</div>
                <div class="alternative-platform">${alt.platform || 'Multiple platforms'}</div>
                <div class="alternative-co2">🌱 ${alt.co2Reduction}</div>
                <div class="alternative-benefits">${alt.benefits}</div>
                <a href="${productUrl}" 
                   target="_blank" class="alternative-link">
                    View Product
                </a>
            `;

            alternativesList.appendChild(altDiv);
        });
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    showState(state, message = '') {
        // Hide all states
        const states = ['loading', 'noProduct', 'productAnalysis', 'alternatives', 'error'];
        states.forEach(s => {
            const element = document.getElementById(s + 'State') || document.getElementById(s);
            if (element) element.classList.add('hidden');
        });

        // Show specific state
        switch (state) {
            case 'loading':
                document.getElementById('loadingState').classList.remove('hidden');
                break;
            case 'noProduct':
                document.getElementById('noProductState').classList.remove('hidden');
                break;
            case 'analysis':
                document.getElementById('productAnalysis').classList.remove('hidden');
                document.getElementById('alternatives').classList.remove('hidden');
                break;
            case 'error':
                document.getElementById('errorState').classList.remove('hidden');
                if (message) {
                    document.getElementById('errorMessage').textContent = message;
                }
                break;
            case 'settings':
                document.getElementById('settingsPanel').classList.add('active');
                document.getElementById('noProductState').classList.remove('hidden');
                break;
        }
    }

    showMessage(message, type = 'info') {
        // Create and show a temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            z-index: 9999;
            font-size: 14px;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}





// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SustainaBuyPopup();
});