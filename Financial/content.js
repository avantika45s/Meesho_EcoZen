console.log('Finovate content script loaded on:', window.location.href);

// Prevent multiple injections
if (window.finovateContentLoaded) {
    console.log('Content script already loaded');
} else {
    window.finovateContentLoaded = true;

    function detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        console.log('Detecting platform for:', hostname);
        
        if (hostname.includes('amazon')) return 'Amazon';
        if (hostname.includes('flipkart')) return 'Flipkart';
        if (hostname.includes('meesho')) return 'Meesho';
        return 'Unknown';
    }

    function scrapeProductData() {
        console.log('Starting product scraping...');
        const platform = detectPlatform();
        
        if (platform === 'Unknown') {
            console.log('Unknown platform, cannot scrape');
            return null;
        }

        let productData = {
            platform: platform,
            url: window.location.href,
            title: '',
            price: '',
            brand: '',
            description: '',
            category: 'General'
        };

        try {
            if (platform === 'Amazon') {
                console.log('Scraping Amazon...');
                
                // Title selectors for Amazon
                const titleSelectors = [
                    '#productTitle',
                    'span[data-automation-id="product-title"]',
                    'h1.a-size-large',
                    '.product-title'
                ];
                
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        productData.title = element.textContent.trim();
                        console.log('Found title:', productData.title);
                        break;
                    }
                }
                
                // Price selectors for Amazon
                const priceSelectors = [
                    '.a-price .a-offscreen',
                    '.a-price-whole',
                    '.a-price-range .a-offscreen',
                    '[data-asin-price]',
                    '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen'
                ];
                
                for (const selector of priceSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        productData.price = element.textContent.trim();
                        console.log('Found price:', productData.price);
                        break;
                    }
                }
                
                // Brand
                const brandElement = document.querySelector('#bylineInfo, .author, a#bylineInfo, .a-link-normal[href*="/stores/"]');
                if (brandElement) {
                    productData.brand = brandElement.textContent.replace(/Visit the|Store|Brand:/g, '').trim();
                }
                
            } else if (platform === 'Flipkart') {
                console.log('Scraping Flipkart...');
                
                // Title for Flipkart
                const titleSelectors = [
                    '.B_NuCI',
                    '._35KyD6',
                    'h1[class*="B_NuCI"]',
                    '.yhZ4ob'
                ];
                
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        productData.title = element.textContent.trim();
                        console.log('Found Flipkart title:', productData.title);
                        break;
                    }
                }
                
                // Price for Flipkart
                const priceSelectors = [
                    '._30jeq3',
                    '._25b18c',
                    '._1_WHN1',
                    '.CEmiEU'
                ];
                
                for (const selector of priceSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        productData.price = element.textContent.trim();
                        console.log('Found Flipkart price:', productData.price);
                        break;
                    }
                }
                
                // Brand for Flipkart
                const brandElement = document.querySelector('._2I6MXz, ._6EBuvT');
                if (brandElement) {
                    productData.brand = brandElement.textContent.trim();
                }
                
            } else if (platform === 'Meesho') {
                console.log('Scraping Meesho...');
                
                // Title for Meesho
                const titleElement = document.querySelector('[data-testid="product-title"], h1, .title');
                if (titleElement) {
                    productData.title = titleElement.textContent.trim();
                    console.log('Found Meesho title:', productData.title);
                }
                
                // Price for Meesho
                const priceElement = document.querySelector('[data-testid="product-price"], .price');
                if (priceElement) {
                    productData.price = priceElement.textContent.trim();
                    console.log('Found Meesho price:', productData.price);
                }
                
                productData.brand = 'Meesho Seller';
            }

            // Fallback for title if still empty
            if (!productData.title || productData.title === '') {
                productData.title = document.title || 'Product Page';
                console.log('Using fallback title:', productData.title);
            }

            // Simple category detection
            const title = productData.title.toLowerCase();
            if (title.includes('shirt') || title.includes('dress') || title.includes('pant') || title.includes('clothing') || title.includes('t-shirt')) {
                productData.category = 'Clothing';
            } else if (title.includes('phone') || title.includes('laptop') || title.includes('electronic')) {
                productData.category = 'Electronics';
            } else if (title.includes('book')) {
                productData.category = 'Books';
            }

            console.log('Final scraped data:', productData);
            return productData;
            
        } catch (error) {
            console.error('Scraping error:', error);
            return null;
        }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        if (request.action === 'ping') {
            console.log('Ping received, responding...');
            sendResponse({ status: 'alive' });
            return true;
        }
        
        if (request.action === 'scrapeProduct') {
            console.log('Scrape request received');
            try {
                const productData = scrapeProductData();
                const response = {
                    success: !!productData && !!productData.title && productData.title !== 'Product Page',
                    data: productData,
                    url: window.location.href,
                    platform: detectPlatform()
                };
                console.log('Sending response:', response);
                sendResponse(response);
            } catch (error) {
                console.error('Error in scraping:', error);
                sendResponse({
                    success: false,
                    error: error.message,
                    url: window.location.href
                });
            }
            return true; // Keep message channel open
        }
    });

    console.log('Content script setup complete for:', detectPlatform());
}