// Background service worker

class SustainaBuyBackground {
    constructor() {
        this.init();
    }

    init() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener(() => {
            console.log('EcoZen extension installed');
            this.setDefaultSettings();
        });

        // Listen for messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Listen for tab updates to detect navigation to supported sites
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkSupportedSite(tab);
            }
        });

        // Listen for action button clicks
        chrome.action.onClicked.addListener((tab) => {
            this.handleActionClick(tab);
        });
    }

    setDefaultSettings() {
        // Set default extension settings
        chrome.storage.local.set({
            sustainabilityThreshold: 6,
            showNotifications: true,
            autoAnalyze: true,
            preferredAlternatives: 3
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'productScraped':
                    await this.handleProductScraped(request.data, sender.tab);
                    sendResponse({ success: true });
                    break;

                case 'analyzeProduct':
                    const analysis = await this.analyzeProduct(request.data);
                    sendResponse({ success: true, analysis });
                    break;

                case 'getAlternatives':
                    const alternatives = await this.getAlternatives(request.data);
                    sendResponse({ success: true, alternatives });
                    break;

                case 'updateBadge':
                    await this.updateBadge(request.score, sender.tab?.id);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleProductScraped(productData, tab) {
        if (!productData || !productData.title) return;

        // Store the product data
        await chrome.storage.local.set({
            [`product_${tab.id}`]: productData,
            lastScrapedProduct: productData
        });

        // Update extension badge
        await this.updateBadge('NEW', tab.id);

        // Show notification if enabled
        const settings = await chrome.storage.local.get(['showNotifications']);
        if (settings.showNotifications !== false) {
            this.showNotification(productData);
        }
    }

    async updateBadge(text, tabId) {
        if (!tabId) return;

        try {
            await chrome.action.setBadgeText({
                text: text.toString(),
                tabId: tabId
            });

            // Set badge color based on text
            let color = '#4CAF50'; // Green default
            if (typeof text === 'number') {
                if (text < 5) color = '#f44336'; // Red for low scores
                else if (text < 7) color = '#FF9800'; // Orange for medium scores
            } else if (text === 'NEW') {
                color = '#2196F3'; // Blue for new products
            }

            await chrome.action.setBadgeBackgroundColor({
                color: color,
                tabId: tabId
            });
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    showNotification(productData) {
        const options = {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'EcoZen',
            message: `Product detected: ${productData.title.substring(0, 50)}...`,
            contextMessage: `Click to analyze sustainability on ${productData.platform}`,
            priority: 1
        };

        chrome.notifications.create('product-detected', options, (notificationId) => {
            if (chrome.runtime.lastError) {
                console.error('Notification error:', chrome.runtime.lastError);
            }
        });

        // Auto-clear notification after 5 seconds
        setTimeout(() => {
            chrome.notifications.clear('product-detected');
        }, 5000);
    }

    checkSupportedSite(tab) {
        const supportedSites = [
            'amazon.com',
            'amazon.in',
            'flipkart.com',
            'meesho.com'
        ];

        const isSupported = supportedSites.some(site => tab.url.includes(site));
        
        if (isSupported) {
            // Check if it's a product page
            const isProductPage = this.isProductPage(tab.url);
            
            if (isProductPage) {
                // Enable the extension icon
                chrome.action.enable(tab.id);
                
                // Inject content script if not already present
                this.injectContentScript(tab.id);
            } else {
                // Clear badge for non-product pages
                chrome.action.setBadgeText({ text: '', tabId: tab.id });
            }
        } else {
            // Disable for unsupported sites
            chrome.action.disable(tab.id);
        }
    }

    isProductPage(url) {
        const productPatterns = [
            /amazon\.(com|in)\/([^\/]+\/)?(dp|gp\/product)\/[A-Z0-9]+/,
            /flipkart\.com\/[^\/]+\/p\/[^\/]+/,
            /meesho\.com\/[^\/]+\/p\/[^\/]+/
        ];

        return productPatterns.some(pattern => pattern.test(url));
    }

    async injectContentScript(tabId) {
        try {
            // Check if content script is already injected
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => window.sustainaBuyInjected || false
            });

            if (!results[0].result) {
                // Inject content script
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });

                // Mark as injected
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: () => { window.sustainaBuyInjected = true; }
                });
            }
        } catch (error) {
            console.error('Error injecting content script:', error);
        }
    }

    handleActionClick(tab) {
        // This is called when the user clicks the extension icon
        // The popup will handle the rest
        console.log('Extension icon clicked for tab:', tab.id);
    }

    async analyzeProduct(productData) {
        // This would typically call the Gemini API
        // For now, return a mock analysis
        return {
            sustainabilityScore: Math.floor(Math.random() * 10) + 1,
            co2Emissions: Math.random() * 5 + 0.5,
            scoreExplanation: "Based on material composition and manufacturing process",
            insights: [
                "Consider recycled materials",
                "Check for eco-certifications",
                "Look for local production"
            ]
        };
    }

    async getAlternatives(productData) {
        // Mock alternatives for now
        return [
            {
                name: "Eco-friendly alternative",
                price: "Similar price range",
                co2Reduction: "50% less CO2",
                benefits: "Made from recycled materials",
                searchTerm: "eco friendly " + (productData.category || "product")
            }
        ];
    }

    // Cleanup when extension is disabled/uninstalled
    async cleanup() {
        // Clear all stored data
        await chrome.storage.local.clear();
        
        // Clear all notifications
        chrome.notifications.getAll((notifications) => {
            Object.keys(notifications).forEach(id => {
                chrome.notifications.clear(id);
            });
        });
    }
}

// Initialize background service worker
const sustainaBuyBackground = new SustainaBuyBackground();

// Handle extension shutdown
chrome.runtime.onSuspend.addListener(() => {
    sustainaBuyBackground.cleanup();
});