(function () {
    // === GLOBAL CLEANUP & INITIALIZATION ===
    if (window.fozdocsCleanup) {
        console.log("FozDocs: Executando cleanup anterior...");
        window.fozdocsCleanup();
    }

    // Define variables FIRST so they are available
    let manualTitle = "";
    let manualModuleId = "";
    let isPrivacyMode = false;
    let maskedSelectors = new Set();
    const DOMAIN_KEY = `fozdocs_masks_${window.location.hostname}`;

    // Helper references for cleanup
    let handleMouseOverRef = null;
    let handleMouseOutRef = null;
    let handleClickRef = null;
    let handleKeyDownRef = null;
    let handleKeyUpRef = null;

    // Define cleanup function globally so next injection can find it
    window.fozdocsCleanup = () => {
        const root = document.getElementById("fozdocs-root");
        if (root) root.remove();

        // Remove ALL listeners (checking if refs exist)
        if (handleMouseOverRef) document.removeEventListener("mouseover", handleMouseOverRef);
        if (handleMouseOutRef) document.removeEventListener("mouseout", handleMouseOutRef);
        if (handleClickRef) document.removeEventListener("click", handleClickRef, true);
        if (handleKeyDownRef) document.removeEventListener("keydown", handleKeyDownRef);
        if (handleKeyUpRef) document.removeEventListener("keyup", handleKeyUpRef);

        // Cleanup visuals (Force Remove ALL classes)
        document.body.classList.remove("fozdocs-privacy-editing");
        document.body.classList.remove("fozdocs-recording-paused"); // [FIX] Remove paused border
        document.body.classList.remove("fozdocs-peeking"); // [FIX] Remove peek mode
        document.querySelectorAll(".fozdocs-hover-target").forEach(el => el.classList.remove("fozdocs-hover-target"));

        // Remove scoped listener cleaner if it exists
        window.fozdocsRemoveScopedListeners = null;

        console.log("FozDocs: Cleanup completo.");
    };

    // Load persisted masks
    const savedMasks = localStorage.getItem(DOMAIN_KEY);
    if (savedMasks) {
        try {
            maskedSelectors = new Set(JSON.parse(savedMasks));
            setTimeout(applyMasksToPage, 1000);
        } catch (e) { console.error("Error loading masks", e); }
    }

    // Styles for masking
    const style = document.createElement("style");
    style.textContent = `
        .fozdocs-blur { filter: blur(6px) !important; user-select: none !important; pointer-events: none !important; }
        /* Quando estiver editando (Privacy Mode ON), permite clicar no blur para remover */
        body.fozdocs-privacy-editing .fozdocs-blur { 
            pointer-events: auto !important; 
            cursor: pointer !important; 
            outline: 2px dashed #ff4444; /* Mostra que está selecionado */
        }
        /* VISUAL FEEDBACK ROBUSTO PARA O MODO EDIÇÃO */
        body.fozdocs-privacy-editing {
            border: 4px solid #ff4444 !important;
            box-sizing: border-box !important;
            cursor: crosshair !important;
        }
        /* Garantir que o cursor propague */
        body.fozdocs-privacy-editing * {
            cursor: crosshair !important;
        }
        
        .fozdocs-hover-target { outline: 2px dashed #ff4444 !important; background: rgba(255, 68, 68, 0.1) !important; }
        .fozdocs-recording-paused { border: 5px solid #ffca28 !important; }

        /* PEEK MODE (Smart Pause) - Remove o blur temporariamente */
        body.fozdocs-peeking .fozdocs-blur {
            filter: none !important;
        }
    `;
    document.head.appendChild(style);

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("FozDocs: Mensagem recebida", request);

        if (request.action === "INIT_RECORDER") {
            manualTitle = request.title;
            manualModuleId = request.moduleId;
            // Force privacy mode from request if present, otherwise default off
            isPrivacyMode = request.isPrivacyMode || false;

            if (isPrivacyMode) {
                enablePrivacySelector();
            }
            createFloatingUI();

            // Re-apply masks just in case
            applyMasksToPage();
            sendResponse({ status: "ok" });
        }

        if (request.action === "TOGGLE_PRIVACY_MODE") {
            isPrivacyMode = request.active;
            if (isPrivacyMode) {
                enablePrivacySelector();
                alert("🛡️ Modo Privacidade ATIVADO.");
            } else {
                disablePrivacySelector();
            }
        }
    });

    // === Privacy Logic Functions ===

    function removeHoverEffect() {
        if (lastHovered) {
            lastHovered.classList.remove("fozdocs-hover-target");
            lastHovered = null;
        }
        document.querySelectorAll(".fozdocs-hover-target").forEach(el => el.classList.remove("fozdocs-hover-target"));
    }

    let lastHovered = null;

    // Define event handlers as named functions to assign to refs
    function handleMouseOver(e) {
        if (e.target.id === "fozdocs-root" || e.target.closest("#fozdocs-root")) return;
        lastHovered = e.target;
        lastHovered.classList.add("fozdocs-hover-target");
    }

    function handleMouseOut(e) {
        if (e.target) e.target.classList.remove("fozdocs-hover-target");
    }

    function handleClick(e) {
        if (e.target.id === "fozdocs-root" || e.target.closest("#fozdocs-root")) return;
        if (!isPrivacyMode) return;

        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        const selector = generateSelector(el);

        if (maskedSelectors.has(selector)) {
            // Unmask
            maskedSelectors.delete(selector);
            el.classList.remove("fozdocs-blur");
            if (el.tagName === "INPUT") el.type = el.dataset.originalType || "text";
        } else {
            // Mask
            maskedSelectors.add(selector);
            applyMaskToElement(el);
        }

        // Save
        localStorage.setItem(DOMAIN_KEY, JSON.stringify([...maskedSelectors]));
        return false;
    }

    function enablePrivacySelector() {
        document.body.classList.add("fozdocs-privacy-editing");

        handleMouseOverRef = handleMouseOver;
        handleMouseOutRef = handleMouseOut;
        handleClickRef = handleClick;

        document.addEventListener("mouseover", handleMouseOverRef);
        document.addEventListener("mouseout", handleMouseOutRef);
        document.addEventListener("click", handleClickRef, true);
    }

    function disablePrivacySelector() {
        document.body.classList.remove("fozdocs-privacy-editing");

        if (handleMouseOverRef) document.removeEventListener("mouseover", handleMouseOverRef);
        if (handleMouseOutRef) document.removeEventListener("mouseout", handleMouseOutRef);
        if (handleClickRef) document.removeEventListener("click", handleClickRef, true);

        removeHoverEffect();
    }

    function generateSelector(el) {
        // 1. ID
        if (el.id) return `#${el.id}`;

        // 2. Classes
        if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ')
                .filter(c => !c.startsWith('fozdocs') && c.length > 2)
                .join('.');
            if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
        }

        // 3. Path Fallback
        let path = [];
        while (el.nodeType === Node.ELEMENT_NODE && el.tagName !== 'HTML') {
            let selector = el.tagName.toLowerCase();
            if (el.id) {
                selector += `#${el.id}`;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.tagName.toLowerCase() == selector) nth++;
                }
                if (nth > 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    function applyMaskToElement(el) {
        if (!el) return;
        if (el.tagName === "BODY" || el.tagName === "HTML" || el.id === "fozdocs-root") return;

        if (el.tagName === "INPUT" && el.type !== "password" && el.type !== "submit" && el.type !== "button") {
            el.dataset.originalType = el.type;
            el.type = "password";
        } else {
            el.classList.add("fozdocs-blur");
        }
    }

    function applyMasksToPage() {
        maskedSelectors.forEach(sel => {
            try {
                const elements = document.querySelectorAll(sel);
                elements.forEach(applyMaskToElement);
            } catch (e) {
                console.warn("Seletor inválido ignorado:", sel);
            }
        });
    }

    const observer = new MutationObserver(() => applyMasksToPage());
    observer.observe(document.body, { childList: true, subtree: true });


    // === Floating UI ===

    function createFloatingUI() {
        const host = document.createElement("div");
        host.id = "fozdocs-root";
        (document.documentElement || document.body).appendChild(host);

        const shadow = host.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = `
          .floating-bar {
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: #1e1e1e; color: white; padding: 8px 16px; border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px;
            z-index: 2147483647; font-family: 'Segoe UI', sans-serif; font-size: 14px;
            transition: all 0.3s ease;
          }
          .floating-bar.minimized {
            width: 40px; height: 40px; padding: 0; justify-content: center; overflow: hidden;
            left: 20px; bottom: 20px; transform: none; border-radius: 50%;
            opacity: 0.5;
          }
          .floating-bar.minimized:hover { opacity: 1; }
          .floating-bar.minimized > *:not(.btn-maximize) { display: none !important; }
          .floating-bar:not(.minimized) .btn-maximize { display: none; }
          
          .btn {
            border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: transform 0.2s; font-weight: bold;
          }
          .btn:hover { transform: scale(1.1); }
          .btn-record { background: #ff4444; color: white; }
          .btn-pause { background: #ffca28; color: black; display: none; }
          .btn-resume { background: #4caf50; color: white; display: none; }
          .btn-stop { background: #ffffff; color: #ff4444; display: none; }
          .btn-close { background: transparent; color: #aaa; font-size: 18px; width: 24px; height: 24px; margin-left: 5px; }
          .btn-close:hover { color: white; }
          .btn-privacy { background: #555; font-size: 14px; margin-right: 5px; }
          .btn-privacy.active { background: #4CAF50; border: 2px solid white; }
          .btn-trash { background: #555; font-size: 14px; margin-right: 15px; color: #ff9999; display: none; }
          .btn-minimize { background: transparent; color: #aaa; font-size: 14px; width: 20px; height: 20px; }
          .btn-maximize { background: #ff4444; color: white; width: 100%; height: 100%; border-radius: 50%; font-size: 20px; }
          
          .timer { font-family: monospace; font-size: 14px; font-weight: bold; min-width: 45px; }
          .status { font-size: 11px; color: #ccc; }
          
          /* Click Effect */
          .click-ripple {
             position: fixed; pointer-events: none; z-index: 2147483646;
             width: 40px; height: 40px; margin-left: -20px; margin-top: -20px;
             background: radial-gradient(circle, rgba(255,0,0,0.4) 0%, rgba(255,0,0,0) 70%);
             border: 2px solid rgba(255, 68, 68, 0.8);
             border-radius: 50%; animation: ripple 0.5s ease-out forwards;
          }
          @keyframes ripple {
             0% { transform: scale(0.5); opacity: 1; }
             100% { transform: scale(2.0); opacity: 0; }
          }
          
          /* Countdown Overlay */
          .countdown-overlay {
             position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
             background: rgba(0,0,0,0.7); z-index: 2147483647;
             display: flex; align-items: center; justify-content: center;
             color: white; font-size: 120px; font-weight: bold; font-family: sans-serif;
             pointer-events: none;
          }
        `;
        shadow.appendChild(style);

        const container = document.createElement("div");
        container.className = "floating-bar";
        container.innerHTML = `
          <!-- Maximize Button (Only visible when minimized) -->
          <button class="btn btn-maximize" title="Expandir">●</button>

          <div class="info-group">
            <div id="timer" class="timer">00:00</div>
          </div>
          
          <button id="btnPrivacy" class="btn btn-privacy ${isPrivacyMode ? 'active' : ''}" title="Alternar Modo Privacidade">🛡️</button>
          <button id="btnTrash" class="btn btn-trash" title="Limpar TODAS as máscaras" style="${isPrivacyMode ? 'display:flex' : 'display:none'}">🗑️</button>

          <button id="btnRecord" class="btn btn-record" title="Iniciar">●</button>
          <button id="btnPause" class="btn btn-pause" title="Pausar">⏸</button>
          <button id="btnResume" class="btn btn-resume" title="Retomar">▶</button>
          <button id="btnStop" class="btn btn-stop" title="Finalizar">⏹</button>
          
          <button id="btnMinimize" class="btn btn-minimize" title="Minimizar">_</button>
          <button id="btnClose" class="btn btn-close" title="Fechar/Cancelar">×</button>
        `;
        shadow.appendChild(container); // Fix: Append container to shadow, not host directly

        // Add Click Effect Container to Body (Not Shadow, so it overlays page content correctly?)
        // Actually shadow is safer for styles. But we need it on the page.
        // We will append ripples to the SHADOW to ensure isolation.

        setupLogic(shadow, host, container);
    }

    function setupLogic(shadow, host, container) {
        let mediaRecorder;
        let recordedChunks = [];
        let startTime;
        let timerInterval;
        let pausedTime = 0;
        let isPaused = false;
        let pauseStart = 0;
        let isCancelled = false;

        const btnRecord = shadow.getElementById("btnRecord");
        const btnPrivacy = shadow.getElementById("btnPrivacy");
        const btnTrash = shadow.getElementById("btnTrash");
        const btnPause = shadow.getElementById("btnPause");
        const btnResume = shadow.getElementById("btnResume");
        const btnStop = shadow.getElementById("btnStop");
        const btnClose = shadow.getElementById("btnClose");
        const btnMinimize = shadow.getElementById("btnMinimize");
        const btnMaximize = container.querySelector(".btn-maximize");
        const timerDisplay = shadow.getElementById("timer");

        // Click Effects Logic
        const showClickEffect = (e) => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
            // Create ripple inside shadow DOM to protect styles
            const ripple = document.createElement("div");
            ripple.className = "click-ripple";
            // We need to map page coordinates to viewport if fixed
            // But since our shadow host is in body, usually works.
            // Wait, shadow root elements are relative to the host if position absolute?
            // Fixed position works relative to viewport.
            ripple.style.left = e.clientX + "px";
            ripple.style.top = e.clientY + "px";
            // We need to use left/top not margin trick for precision
            ripple.style.marginLeft = "0";
            ripple.style.marginTop = "0";
            ripple.style.transform = "translate(-50%, -50%)"; // Center it

            shadow.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };
        // Capture phase to catch all clicks
        document.addEventListener("mousedown", showClickEffect, true);
        window.fozdocsRemoveScopedListeners = () => {
            document.removeEventListener("mousedown", showClickEffect, true);
        };

        // Min/Max Logic
        btnMinimize.addEventListener("click", () => container.classList.add("minimized"));
        btnMaximize.addEventListener("click", () => container.classList.remove("minimized"));

        // Privacy Toggle
        btnPrivacy.addEventListener("click", () => {
            isPrivacyMode = !isPrivacyMode;
            if (isPrivacyMode) {
                enablePrivacySelector();
                btnPrivacy.classList.add("active");
                btnTrash.style.display = "flex";
            } else {
                disablePrivacySelector();
                btnPrivacy.classList.remove("active");
                btnTrash.style.display = "none";
            }
        });

        // Trash
        btnTrash.addEventListener("click", () => {
            if (confirm("Remover TODAS as máscaras desta página?")) {
                maskedSelectors.clear();
                localStorage.removeItem(DOMAIN_KEY);
                document.querySelectorAll(".fozdocs-blur").forEach(el => el.classList.remove("fozdocs-blur"));
            }
        });

        // Close/Cancel
        btnClose.addEventListener("click", () => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                if (!confirm("Tem certeza que deseja cancelar a gravação?")) return;
                isCancelled = true;
                try { mediaRecorder.stop(); } catch (e) { }
            } else {
                isCancelled = true;
            }
            if (window.fozdocsCleanup) window.fozdocsCleanup();
        });

        // ... MediaRecorder Logic ...
        btnRecord.addEventListener("click", async () => {
            try {
                // 1. Get Stream interactively
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        displaySurface: "browser",
                    },
                    audio: false,
                    preferCurrentTab: true
                });

                // 2. Countdown
                const countdownEl = document.createElement("div");
                countdownEl.className = "countdown-overlay";
                shadow.appendChild(countdownEl);

                // Minimize UI during countdown/record to be unobtrusive
                container.classList.add("minimized");

                for (let i = 3; i > 0; i--) {
                    countdownEl.textContent = i;
                    await new Promise(r => setTimeout(r, 1000));
                }
                countdownEl.remove(); // Remove overlay

                // 3. Start Recording
                mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
                recordedChunks = [];

                mediaRecorder.ondataavailable = e => {
                    if (e.data.size > 0) recordedChunks.push(e.data);
                };

                mediaRecorder.onstop = uploadVideo;
                stream.getVideoTracks()[0].onended = () => {
                    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
                };

                mediaRecorder.start(1000);
                startTimer();

                btnRecord.style.display = "none";
                btnPause.style.display = "flex";
                btnStop.style.display = "flex";

            } catch (err) {
                console.error(err);
                alert("Erro ao iniciar captura: " + err.message);
            }
        });

        btnPause.addEventListener("click", () => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.pause();
                isPaused = true;
                clearInterval(timerInterval);
                btnPause.style.display = "none";
                btnResume.style.display = "flex";
            }
        });

        btnResume.addEventListener("click", () => {
            if (mediaRecorder && mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                isPaused = false;
                startTimer(Date.now() - (Date.now() - startTime - pausedTime));
                btnResume.style.display = "none";
                btnPause.style.display = "flex";
            }
        });

        btnStop.addEventListener("click", () => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(t => t.stop());
            }
        });

        function startTimer(customStart = null) {
            startTime = customStart || Date.now();
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (isPaused) return;
                const diff = Math.floor((Date.now() - startTime) / 1000);
                const mins = Math.floor(diff / 60).toString().padStart(2, '0');
                const secs = (diff % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${mins}:${secs}`;
            }, 1000);
        }

        async function uploadVideo() {
            if (isCancelled) return;

            clearInterval(timerInterval);
            // Restore UI to show status
            container.classList.remove("minimized");
            timerDisplay.textContent = "Upload...";

            btnStop.disabled = true;
            btnPause.style.display = "none";
            btnResume.style.display = "none";

            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const formData = new FormData();
            formData.append("file", blob, `capture_${Date.now()}.webm`);
            formData.append("title", manualTitle);
            formData.append("module_id", manualModuleId);

            try {
                const response = await fetch("http://localhost:8000/api/v1/upload", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    timerDisplay.textContent = "✅ OK!";
                    timerDisplay.style.color = "#4CAF50";
                    setTimeout(() => {
                        if (window.fozdocsRemoveScopedListeners) window.fozdocsRemoveScopedListeners();
                        host.remove();
                        disablePrivacySelector();
                    }, 3000);
                } else {
                    const err = await response.json();
                    timerDisplay.textContent = "Erro!";
                    alert("Erro API: " + (err.detail || "Desconhecido"));
                    btnStop.disabled = false;
                }
            } catch (err) {
                timerDisplay.textContent = "Erro Conexão";
                btnStop.disabled = false;
            }
        }
    }

    // Protection against navigation
    window.onbeforeunload = (e) => {
        // We can't easily check mediaRecorder state here because it's scoped, 
        // but we can check if the UI is present and implies recording
        const root = document.getElementById("fozdocs-root");
        if (root && root.shadowRoot.getElementById("btnPause").style.display !== "none") {
            const msg = "A gravação será perdida.";
            e.returnValue = msg;
            return msg;
        }
    };

})();
