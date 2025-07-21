// Content script for scraping product data from e-commerce platforms
class ProductScraper {
    constructor() {
        this.platform = this.detectPlatform();
        this.productData = null;
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'scrapeProduct') {
                this.scrapeProduct()
                    .then(data => sendResponse({ success: true, data }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true; // Keep the message channel open for async response
            }
        });

        // Auto-scrape when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoScrape());
        } else {
            this.autoScrape();
        }
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        if (hostname.includes('amazon.com') || hostname.includes('amazon.in')) {
            return 'amazon';
        } else if (hostname.includes('flipkart.com')) {
            return 'flipkart';
        } else if (hostname.includes('meesho.com')) {
            return 'meesho';
        }
        return 'unknown';
    }

    async autoScrape() {
        try {
            const data = await this.scrapeProduct();
            if (data) {
                // Store the scraped data
                chrome.storage.local.set({ currentProduct: data });
                // Notify background script
                chrome.runtime.sendMessage({ action: 'productScraped', data });
            }
        } catch (error) {
            console.error('Auto-scrape failed:', error);
        }
    }

    async scrapeProduct() {
        switch (this.platform) {
            case 'amazon':
                return this.scrapeAmazon();
            case 'flipkart':
                return this.scrapeFlipkart();
            case 'meesho':
                return this.scrapeMeesho();
            default:
                throw new Error('Unsupported platform');
        }
    }

    scrapeAmazon() {
        const data = {
            platform: 'Amazon',
            url: window.location.href,
            title: '',
            price: '',
            image: '',
            description: '',
            material: '',
            weight: '',
            dimensions: '',
            brand: '',
            category: ''
        };

        // Product title
        const titleSelectors = [
            '#productTitle',
            '.product-title',
            'h1[data-automation-id="product-title"]'
        ];
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.title = element.textContent.trim();
                break;
            }
        }

        // Price
        const priceSelectors = [
            '.a-price-whole',
            '.a-price .a-offscreen',
            '.a-price-symbol + .a-price-whole',
            '.a-price-range .a-price .a-offscreen'
        ];
        for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.price = element.textContent.trim();
                break;
            }
        }

        // Image
        const imageSelectors = [
            '#landingImage',
            '.a-dynamic-image',
            '#ebooksImgBlkFront'
        ];
        for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
                data.image = element.src;
                break;
            }
        }

        // Description
        const descSelectors = [
            '#feature-bullets ul',
            '#productDescription',
            '.a-unordered-list.a-nostyle.a-vertical'
        ];
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.description = element.textContent.trim();
                break;
            }
        }

        // Extract product details from feature bullets or product details
        const detailsTable = document.querySelector('#productDetails_detailBullets_sections1');
        if (detailsTable) {
            const rows = detailsTable.querySelectorAll('tr');
            rows.forEach(row => {
                const label = row.querySelector('td:first-child')?.textContent.trim().toLowerCase();
                const value = row.querySelector('td:last-child')?.textContent.trim();
                
                if (label && value) {
                    if (label.includes('material') || label.includes('fabric')) {
                        data.material = value;
                    } else if (label.includes('weight') || label.includes('item weight')) {
                        data.weight = value;
                    } else if (label.includes('dimensions') || label.includes('product dimensions')) {
                        data.dimensions = value;
                    } else if (label.includes('brand')) {
                        data.brand = value;
                    }
                }
            });
        }

        // Brand
        if (!data.brand) {
            const brandSelectors = [
                '#bylineInfo',
                '.a-link-normal[data-attribute="brand"]'
            ];
            for (const selector of brandSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    data.brand = element.textContent.trim();
                    break;
                }
            }
        }

        // Category
        const breadcrumbSelectors = [
            '#wayfinding-breadcrumbs_container',
            '.a-unordered-list.a-horizontal.a-size-small'
        ];
        for (const selector of breadcrumbSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.category = element.textContent.trim();
                break;
            }
        }

        return data;
    }

    scrapeFlipkart() {
        const data = {
            platform: 'Flipkart',
            url: window.location.href,
            title: '',
            price: '',
            image: '',
            description: '',
            material: '',
            weight: '',
            dimensions: '',
            brand: '',
            category: ''
        };

        // Product title
        const titleSelectors = [
            '._35KyD6',
            '.B_NuCI',
            'h1.yhB1nd'
        ];
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.title = element.textContent.trim();
                break;
            }
        }

        // Price
        const priceSelectors = [
            '._30jeq3._16Jk6d',
            '._25b18c',
            '._3I9_wc._2p6lqe'
        ];
        for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.price = element.textContent.trim();
                break;
            }
        }

        // Image
        const imageSelectors = [
            '._396cs4._2amPTt._3qGmMb',
            '._2r_T1I._396cs4',
            '.CXW8mj img'
        ];
        for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
                data.image = element.src;
                break;
            }
        }

        // Description
        const descSelectors = [
            '._1mXcCf',
            '.RmoJUa',
            '._3WHvuP'
        ];
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.description = element.textContent.trim();
                break;
            }
        }

        // Product specifications
        const specRows = document.querySelectorAll('._1s_Smc');
        specRows.forEach(row => {
            const label = row.querySelector('._1hKmbr')?.textContent.trim().toLowerCase();
            const value = row.querySelector('._21lJbe')?.textContent.trim();
            
            if (label && value) {
                if (label.includes('material') || label.includes('fabric')) {
                    data.material = value;
                } else if (label.includes('weight')) {
                    data.weight = value;
                } else if (label.includes('dimensions')) {
                    data.dimensions = value;
                } else if (label.includes('brand')) {
                    data.brand = value;
                }
            }
        });

        // Brand
        if (!data.brand) {
            const brandElement = document.querySelector('._2I9KP_');
            if (brandElement) {
                data.brand = brandElement.textContent.trim();
            }
        }

        // Category from breadcrumb
        const breadcrumbs = document.querySelectorAll('._2whKao a');
        if (breadcrumbs.length > 0) {
            data.category = Array.from(breadcrumbs).map(b => b.textContent.trim()).join(' > ');
        }

        return data;
    }

    scrapeMeesho() {
        const data = {
            platform: 'Meesho',
            url: window.location.href,
            title: '',
            price: '',
            image: '',
            description: '',
            material: '',
            weight: '',
            dimensions: '',
            brand: '',
            category: ''
        };

        // Product title
        const titleSelectors = [
            '[data-testid="product-title"]',
            '.ProductTitle__StyledH1-sc-1y9vdgs-0'
        ];
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.title = element.textContent.trim();
                break;
            }
        }

        // Price
        const priceSelectors = [
            '[data-testid="product-price"]',
            '.Text-sc-16hglo3-0.Text__StyledText-sc-16hglo3-1'
        ];
        for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes('₹')) {
                data.price = element.textContent.trim();
                break;
            }
        }

        // Image
        const imageSelectors = [
            '[data-testid="product-image"]',
            '.ProductImageCarousel__StyledImg-sc-1lm6cg2-4'
        ];
        for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
                data.image = element.src;
                break;
            }
        }

        // Description
        const descSelectors = [
            '[data-testid="product-description"]',
            '.ProductDescription__StyledDiv-sc-1y9vdgs-0'
        ];
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                data.description = element.textContent.trim();
                break;
            }
        }

        // Extract specifications
        const specElements = document.querySelectorAll('[data-testid*="specification"]');
        specElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes('material') || text.includes('fabric')) {
                data.material = element.textContent.trim();
            } else if (text.includes('weight')) {
                data.weight = element.textContent.trim();
            }
        });

        // Category
        const breadcrumbs = document.querySelectorAll('nav a');
        if (breadcrumbs.length > 0) {
            data.category = Array.from(breadcrumbs).map(b => b.textContent.trim()).join(' > ');
        }

        return data;
    }
}

// Initialize the scraper
new ProductScraper();