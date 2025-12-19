import React from 'react';
import ReactDOM from 'react-dom/client';
import RecordingWidget from './components/RecordingWidget';
import { PrivacyEngine } from './privacy-engine';
import './index.css'; // Make sure CSS is injected too? Or we use Shadow DOM style injection.

// Listen for messages from Background Script
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.type === 'SHOW_WIDGET') {
        // Remove preview frame if exists
        removePreviewFrame();

        // Start Privacy Engine if requested
        if (request.payload.privacyMode) {
            PrivacyEngine.getInstance().setConfig(true, request.payload.activeTool || 'mask');
        }
        mountWidget(request.payload);
    }

    if (request.type === 'SHOW_PREVIEW_FRAME') {
        showPreviewFrame();
    }

    if (request.type === 'HIDE_PREVIEW_FRAME') {
        removePreviewFrame();
    }
});

function showPreviewFrame() {
    if (document.getElementById('fozdocs-preview-frame')) return;
    const frame = document.createElement('div');
    frame.id = 'fozdocs-preview-frame';
    frame.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: 5px solid #ef4444; /* red-500 */
        box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.5);
        z-index: 2147483647;
        pointer-events: none;
        box-sizing: border-box;
    `;
    document.body.appendChild(frame);
}

function removePreviewFrame() {
    const frame = document.getElementById('fozdocs-preview-frame');
    if (frame) frame.remove();
}

function mountWidget(payload: any) {
    // Create container
    const container = document.createElement('div');
    container.id = 'fozdocs-widget-root';
    document.body.appendChild(container);

    // Use Shadow DOM to isolate styles
    const shadow = container.attachShadow({ mode: 'open' });

    // Inject Tailwind CSS into Shadow DOM
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('index.css');
    shadow.appendChild(link);

    const root = ReactDOM.createRoot(shadow);
    root.render(
        <React.StrictMode>
            <RecordingWidget
                chapterName={payload.chapterName}
                systemModule="FozDocs" // Customize based on payload
                onStop={() => {
                    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
                    root.unmount();
                    container.remove();
                }}
                onPause={() => chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' })}
                onDiscard={() => {
                    chrome.runtime.sendMessage({ type: 'DISCARD_RECORDING' });
                    root.unmount();
                    container.remove();
                }}
            />
        </React.StrictMode>
    );
}
