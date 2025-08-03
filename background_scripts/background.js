// Background script to handle image downloads and extension state
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'downloadImage') {
        try {
            let filename = 'image.jpg';
            try {
                const url = new URL(message.imageSrc);
                const pathname = url.pathname;
                const urlFilename = pathname.split('/').pop();
                if (urlFilename && urlFilename.includes('.')) {
                    filename = urlFilename;
                }
            } catch (urlError) {
                console.warn('Could not parse URL, using default filename:', urlError);
            }
            
            console.log('Starting download with filename:', filename);
            
            browser.downloads.download({
                url: message.imageSrc,
                filename: filename,
                saveAs: false 
            }).then((downloadId) => {
                console.log('Download started with ID:', downloadId);
                sendResponse({ success: true, downloadId: downloadId });
            }).catch((error) => {
                console.error('Download failed:', error);
                sendResponse({ success: false, error: error.message });
            });
            
        } catch (error) {
            console.error('Error processing download request:', error);
            sendResponse({ success: false, error: error.message });
        }
        
        return true;
    }
    
    if (message.command === 'toggleExtension') {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            if (tabs.length === 0) {
                console.log('No active tab found');
                sendResponse({ success: false, error: 'No active tab found' });
                return;
            }
            
            const activeTab = tabs[0];
            
            browser.tabs.sendMessage(activeTab.id, {
                command: message.enabled ? 'enable' : 'disable'
            }).then((response) => {
                console.log('Toggle message sent successfully to active tab');
                sendResponse({ success: true });
            }).catch((error) => {
                console.error('Error sending toggle message to active tab:', error);
                sendResponse({ success: false, error: error.message });
            });
            
        }).catch((error) => {
            console.error('Error querying active tab:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        return true; 
    }
});