document.addEventListener('DOMContentLoaded', function() {
    console.log("Size helper script loaded");

    // Category change handler - IMPORTANT: This must be here
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            console.log("Category changed to:", this.value);
            const tabs = document.getElementById('featureTabs');
            const expenseTracker = document.getElementById('expenseTracker');
            const sizeFinder = document.getElementById('sizeFinder');
            const ecoScore = document.getElementById('ecoScore');
            const sizeFinderTab = document.querySelector('.feature-tab[data-target="sizeFinder"]');
            const ecoScoreTab = document.querySelector('.feature-tab[data-target="ecoScore"]');
            
            if (this.value === 'clothes') {
                // Show both size finder and eco score tabs for clothes
                if (sizeFinderTab) sizeFinderTab.style.display = 'block';
                if (ecoScoreTab) ecoScoreTab.style.display = 'block';
                tabs.style.display = 'flex';
                
                // Make expense tracker active by default
                document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.feature-content').forEach(c => c.classList.remove('active'));
                
                const expenseTab = document.querySelector('.feature-tab[data-target="expenseTracker"]');
                if (expenseTab) expenseTab.classList.add('active');
                if (expenseTracker) expenseTracker.classList.add('active');
            } else {
                // Show only eco score tab for other categories, hide size finder
                if (sizeFinderTab) sizeFinderTab.style.display = 'none';
                if (ecoScoreTab) ecoScoreTab.style.display = 'block';
                tabs.style.display = 'flex';
                
                // Make expense tracker active by default
                document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.feature-content').forEach(c => c.classList.remove('active'));
                
                const expenseTab = document.querySelector('.feature-tab[data-target="expenseTracker"]');
                if (expenseTab) expenseTab.classList.add('active');
                if (expenseTracker) expenseTracker.classList.add('active');
            }
        });
    }
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('.feature-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log("Tab clicked:", tab.getAttribute('data-target'));
            document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.feature-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });

    // Image preview functionality
    const frontImageInput = document.getElementById('frontImage');
    const sideImageInput = document.getElementById('sideImage');
    
    if (frontImageInput) {
        frontImageInput.addEventListener('change', function() {
            console.log("Front image selected");
            displayImagePreview(this, document.getElementById('frontPreview'));
        });
    }
    
    if (sideImageInput) {
        sideImageInput.addEventListener('change', function() {
            console.log("Side image selected");
            displayImagePreview(this, document.getElementById('sidePreview'));
        });
    }

    function displayImagePreview(input, imgElement) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    // Find size button functionality (keeping existing implementation)
    const findSizeBtn = document.getElementById('findSizeBtn');
    if (findSizeBtn) {
        console.log("Find Size button found");
        findSizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Find Size button clicked");
            
            const frontImage = document.getElementById('frontImage').files[0];
            const sideImage = document.getElementById('sideImage').files[0];
            const height = document.getElementById('height').value;
            const weight = document.getElementById('weight').value;
            
            console.log("Input values:", { 
                frontImage: frontImage ? frontImage.name : 'none',
                sideImage: sideImage ? sideImage.name : 'none',
                height, 
                weight 
            });

            // Enhanced validation
            if (!frontImage) {
                showError("Please upload a front view image of yourself");
                return;
            }
            
            if (!height || height < 100 || height > 220) {
                showError("Please enter a valid height between 100-220 cm");
                return;
            }
            
            if (!weight || weight < 30 || weight > 200) {
                showError("Please enter a valid weight between 30-200 kg");
                return;
            }
            
            // Check image file types
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(frontImage.type)) {
                showError("Please upload a valid image file (JPEG or PNG)");
                return;
            }
            
            if (sideImage && !allowedTypes.includes(sideImage.type)) {
                showError("Please upload a valid side image file (JPEG or PNG)");
                return;
            }
            
            hideError();
            showLoading("Analyzing your body measurements with AI...");
            
            // Prepare form data
            const formData = new FormData();
            formData.append('front_image', frontImage);
            
            if (sideImage) {
                formData.append('side_image', sideImage);
            }
            
            formData.append('height', height);
            formData.append('weight', weight);
            
            // Get current product information
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                const tab = tabs[0];
                formData.append('product_url', tab.url);
                formData.append('product_title', tab.title);
                
                console.log("Sending request to backend...");
                
                fetch('http://127.0.0.1:8000/api/analyze-size/', {
                    method: 'POST',
                    body: formData,
                    mode: 'cors'
                })
                .then(response => {
                    console.log("Response received:", response.status);
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.error || `Server error: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Success data:", data);
                    hideLoading();
                    showResult(data);
                })
                .catch(error => {
                    console.error("Error:", error);
                    hideLoading();
                    showError(error.message || 'An error occurred. Please try again later.');
                });
            });
        });
    }

    function showError(message) {
        const errorElement = document.getElementById('sizeError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function hideError() {
        const errorElement = document.getElementById('sizeError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    function showLoading(message = "Analyzing your measurements...") {
        const loadingElement = document.getElementById('sizeLoading');
        if (loadingElement) {
            loadingElement.querySelector('p').textContent = message;
            loadingElement.style.display = 'block';
        }
        
        const resultElement = document.getElementById('sizeResult');
        if (resultElement) {
            resultElement.style.display = 'none';
        }
    }

    function hideLoading() {
        const loadingElement = document.getElementById('sizeLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    function showResult(data) {
        const resultElement = document.getElementById('sizeResult');
        const sizeElement = document.getElementById('recommendedSize');
        const adviceElement = document.getElementById('fitAdvice');
        
        if (resultElement && sizeElement && adviceElement) {
            sizeElement.textContent = data.recommended_size;
            adviceElement.textContent = data.fit_advice || '';
            
            // Show method used
            if (data.method === 'meshcapade_api') {
                adviceElement.innerHTML += '<br><small><em>✅ Powered by Meshcapade 3D body analysis</em></small>';
            } else {
                adviceElement.innerHTML += '<br><small><em>⚠️ Basic calculation used - for better accuracy, ensure clear full-body images</em></small>';
            }
            
            resultElement.style.display = 'block';
        }
    }
    
    // Close button functionality
    const closeBtn = document.querySelector('#sizeFinder .btn-default');
    if (closeBtn) {
        console.log("Close button found");
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Close button clicked");
            
            // Switch back to expense tracker view
            document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.feature-content').forEach(c => c.classList.remove('active'));
            
            const expenseTab = document.querySelector('.feature-tab[data-target="expenseTracker"]');
            const expenseContent = document.getElementById('expenseTracker');
            
            if (expenseTab) expenseTab.classList.add('active');
            if (expenseContent) expenseContent.classList.add('active');
        });
    }

    const closeButtons = document.querySelectorAll('.btn-default[data-dismiss="modal"]');
    closeButtons.forEach(closeBtn => {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Close button clicked");
            
            // Switch back to expense tracker view
            document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.feature-content').forEach(c => c.classList.remove('active'));
            
            const expenseTab = document.querySelector('.feature-tab[data-target="expenseTracker"]');
            const expenseContent = document.getElementById('expenseTracker');
            
            if (expenseTab) expenseTab.classList.add('active');
            if (expenseContent) expenseContent.classList.add('active');
        });
    });
});