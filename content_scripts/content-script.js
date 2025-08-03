(() => {
    let extensionEnabled = true;

    function downloadImage(imageSrc, imageAlt = 'image') {
        if (!imageSrc || imageSrc === 'data:') {
            console.error('Invalid image source:', imageSrc);
            return;
        }
        
        if (window.location.protocol === 'file:') {
            console.log('Local file detected, using fallback download method');
            fallbackDownload(imageSrc, imageAlt);
            return;
        }
        
        browser.runtime.sendMessage({
            command: 'downloadImage',
            imageSrc: imageSrc,
            imageAlt: imageAlt
        }).then((response) => {
            if (!response || !response.success) {
                console.warn('Background script download failed, trying fallback method');
                console.warn('Response:', response);
                fallbackDownload(imageSrc, imageAlt);
            }
        }).catch((error) => {
            console.error('Failed to send download message, trying fallback:', error);
            fallbackDownload(imageSrc, imageAlt);
        });
    }
    
    function fallbackDownload(imageSrc, imageAlt = 'image') {
        try {
            const link = document.createElement('a');
            link.href = imageSrc;
            link.download = imageAlt || 'image';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Fallback download also failed:', error);
        }
    }

    function createDownloadIcon() {
        const downloadIconSVG = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 14M12 14L8 10M12 14L16 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 21H4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        const icon = document.createElement('div');
        icon.className = 'image-download-icon';
        icon.innerHTML = downloadIconSVG;
        icon.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: auto;
        `;
        
        icon.addEventListener('mouseenter', () => {
            icon.style.background = 'rgba(0, 0, 0, 0.9)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        
        return icon;
    }

    function addDownloadIconToImage(img) {
        let wrapper = img.parentElement;

        wrapper = document.createElement('div');
        wrapper.className = 'image-download-wrapper';
        wrapper.style.cssText = `
            position: relative;
            display: inline-block;
        `;
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    
        const downloadIcon = createDownloadIcon();
        
        downloadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadImage(img.src, img.alt || 'image');
        });

        wrapper.addEventListener('mouseenter', () => {
            wrapper.appendChild(downloadIcon);
            downloadIcon.style.opacity = '1';
        });

        wrapper.addEventListener('mouseleave', () => {
            const icon = wrapper.querySelector('.image-download-icon');
            if (icon) {
                icon.style.opacity = '0';
                setTimeout(() => {
                    if (icon.parentNode) {
                        icon.remove();
                    }
                }, 200);
            }
        });
    }

    function removeImageDownloadIcons() {
        const images = document.querySelectorAll("div[class='image-download-wrapper'");
        images.forEach((div) => {
            img = div.firstChild;
            img.removeAttribute('data-hover-handler-added');
            img.removeAttribute('data-download-icon-added');
            div.parentNode.append(img);
            div.remove();
        });
    }

    function setupImageHoverHandlers() {
        const images = document.querySelectorAll('img:not([data-hover-handler-added])');
        
        images.forEach((img) => {
            addDownloadIconToImage(img);
        });
    }

    function setExtensionState(enabled) {
        extensionEnabled = enabled;
        
        if (enabled) {
            setupImageHoverHandlers();
        } else {
            const icons = document.querySelectorAll('.image-download-icon');
            icons.forEach(icon => icon.remove());
        }
    }

    browser.runtime.onMessage.addListener((message) => {
        if (message.command === 'enable') {
            setExtensionState(true);
        } else if (message.command === 'disable') {
            setExtensionState(false);
            removeImageDownloadIcons();
        }
    });

    async function loadInitialState() {
        try {
            if (window.location.protocol === 'file:') {
                console.log('Local file detected, using default enabled state');
                extensionEnabled = true;
                return;
            }
            
            const result = await browser.storage.local.get('extensionEnabled');
            extensionEnabled = result.extensionEnabled !== false; 
            if (result.extensionEnabled === undefined) {
                await browser.storage.local.set({ extensionEnabled: true });
            }
        } catch (error) {
            console.error('Error loading initial state:', error);
            extensionEnabled = false;
        }
    }

    loadInitialState().then(() => {
        if (extensionEnabled) {
            setupImageHoverHandlers();
        }
    }).catch((error) => {
        console.error('Error during initialization:', error);
    });
})();