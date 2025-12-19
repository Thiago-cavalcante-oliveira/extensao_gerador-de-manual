// Background Script
// Handles coordination between Popup, Content Script, and Desktop Capture

let recordingState: any = null;

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    console.log('[Background] Received message:', request);

    if (request.type === 'START_RECORDING') {
        const payload = request.payload;
        recordingState = payload;

        // 1. Get Active Tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) return;

            // 2. Inject Widget (Content Script)
            // We send a message to the content script.
            // Note: The content script must be already loaded.
            chrome.tabs.sendMessage(activeTab.id, {
                type: 'SHOW_WIDGET',
                payload: payload
            }, (_response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Content Script not responding. Injecting...", chrome.runtime.lastError);

                    // Programmatically inject content.js and index.css
                    chrome.scripting.insertCSS({
                        target: { tabId: activeTab.id! },
                        files: ['index.css']
                    });

                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id! },
                        func: () => {
                            // Dynamic import to handle ES Module format
                            const scriptUrl = chrome.runtime.getURL('content.js');
                            import(scriptUrl).catch(err => console.error("Failed to inject content module:", err));
                        }
                    }, () => {
                        // Retry sending the message after injection
                        if (chrome.runtime.lastError) {
                            console.error("Failed to inject script:", chrome.runtime.lastError);
                        } else {
                            setTimeout(() => {
                                chrome.tabs.sendMessage(activeTab.id!, {
                                    type: 'SHOW_WIDGET',
                                    payload: payload
                                });
                            }, 500); // Give it a moment to initialize
                        }
                    });
                }
            });

            // 3. Start Desktop Capture (Optional for now, user asked for Widget Visibility First)
            // if (payload.captureSource === ...)
        });
    }

    if (request.type === 'STOP_RECORDING') {
        // Handle stop logic
        console.log('[Background] Recording Stopped');
    }
});
