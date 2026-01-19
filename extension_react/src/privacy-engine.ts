export class PrivacyEngine {
    private static instance: PrivacyEngine;
    private isEnabled: boolean = false;
    private activeTool: 'mask' | 'blur' = 'mask';
    private originalTypes: Map<HTMLInputElement, string> = new Map();
    private blurredElements: Set<HTMLElement> = new Set();
    private isPaused: boolean = false; // "Smart Pause" state

    private constructor() {
        this.setupGlobalListeners();
    }

    public static getInstance(): PrivacyEngine {
        if (!PrivacyEngine.instance) {
            PrivacyEngine.instance = new PrivacyEngine();
        }
        return PrivacyEngine.instance;
    }

    private listeners: ((isPaused: boolean) => void)[] = [];

    public setConfig(enabled: boolean, tool: 'mask' | 'blur') {
        this.isEnabled = enabled;
        this.activeTool = tool;
        console.log(`[PrivacyEngine] Config updated: Enabled=${enabled}, Tool=${tool}`);

        if (!enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    private setupGlobalListeners() {
        // Click listener for applying masks/blurs
        document.addEventListener('click', (e) => {
            if (!this.isEnabled || this.isPaused) return;

            // Don't interact with the widget itself
            const target = e.target as HTMLElement;
            if (target.closest('#fozdocs-widget-root')) return;

            if (this.activeTool === 'mask') {
                this.handleMaskClick(target);
            } else if (this.activeTool === 'blur') {
                this.handleBlurClick(target);
            }
        }, true); // Capture phase to intervene early

        // "Smart Pause" (ALT Key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') {
                this.togglePeek(true);
            }
        });
    }

    private handleMaskClick(target: HTMLElement) {
        if (target instanceof HTMLInputElement) {
            // Store original type if not already stored
            if (!this.originalTypes.has(target)) {
                this.originalTypes.set(target, target.type);
            }
            // Toggle Password
            const currentType = target.type;
            target.type = currentType === 'password' ? this.originalTypes.get(target) || 'text' : 'password';

            // Visual feedback
            target.style.outline = target.type === 'password' ? '2px solid blue' : 'none';
        } else {
            // Generic Masking for non-inputs (Text Redaction)
            if (target.classList.contains('fozdocs-mask')) {
                target.classList.remove('fozdocs-mask');
                this.blurredElements.delete(target);
            } else {
                target.classList.add('fozdocs-mask');
                this.blurredElements.add(target);
            }
        }
    }

    private handleBlurClick(target: HTMLElement) {
        // Toggle class
        if (target.classList.contains('fozdocs-blur')) {
            target.classList.remove('fozdocs-blur');
            this.blurredElements.delete(target);
        } else {
            target.classList.add('fozdocs-blur');
            this.blurredElements.add(target);
        }
    }

    public subscribe(callback: (isPaused: boolean) => void) {
        this.listeners.push(callback);
    }

    public forceResume() {
        this.togglePeek(false);
    }

    private togglePeek(isPeeking: boolean) {
        if (this.isPaused === isPeeking) return; // No change
        this.isPaused = isPeeking;

        // Notify Listeners
        this.listeners.forEach(cb => cb(isPeeking));

        if (isPeeking) {
            // Remove blur visually but keep state
            this.blurredElements.forEach(el => el.classList.remove('fozdocs-blur'));
            chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING_SMART' });
            console.log("[PrivacyEngine] Peeking (Smart Pause Active)");
        } else {
            // Restore state
            this.blurredElements.forEach(el => el.classList.add('fozdocs-blur'));
            chrome.runtime.sendMessage({ type: 'RESUME_RECORDING_SMART' });
            console.log("[PrivacyEngine] Resume (Smart Pause Inactive)");
        }
    }

    private enable() {
        document.body.classList.add('fozdocs-privacy-active');
    }

    private disable() {
        document.body.classList.remove('fozdocs-privacy-active');
        // Não limpamos automaticamente aqui para permitir persistência se apenas desabilitar a engine,
        // mas para o caso de STOP/CANCEL, chamaremos cleanup().
    }

    public cleanup() {
        // Remove classes from all tracked elements
        this.blurredElements.forEach(el => {
            el.classList.remove('fozdocs-blur');
            el.classList.remove('fozdocs-mask');
        });
        this.blurredElements.clear();

        // Restore input types
        this.originalTypes.forEach((type, input) => {
            input.type = type;
            input.style.outline = 'none';
        });
        this.originalTypes.clear();

        this.disable();
        console.log("[PrivacyEngine] Cleanup complete. All masks removed.");
    }
}
