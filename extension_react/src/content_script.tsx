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

    // Apply Config Variables to Container (which inherits to Shadow DOM if we use variables? No, Shadow DOM styles are isolated unless variables are defined on :root or host)
    // Actually, variables defined on 'container' (host) leak into Shadow DOM? Yes.
    if (payload.appConfig) {
        const { blur_intensity, mask_style } = payload.appConfig;

        container.style.setProperty('--foz-blur-intensity', (blur_intensity || 6) + 'px');

        if (mask_style === 'solid') {
            container.style.setProperty('--foz-mask-bg-color', 'black');
            container.style.setProperty('--foz-mask-image', 'none');
        } else if (mask_style === 'dots') {
            // Default is dots, but ensure
            container.style.setProperty('--foz-mask-bg-color', '#f1f5f9');
            // Image is complex, leave default from CSS if matched
        }
    }

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
                initialPrivacyMode={payload.privacyMode}
                appConfig={payload.appConfig}
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
