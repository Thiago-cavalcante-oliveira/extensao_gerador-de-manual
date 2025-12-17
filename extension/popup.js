// Configuração
const API_URL = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
    const systemSelect = document.getElementById("systemSelect");
    const moduleSelect = document.getElementById("moduleSelect");
    const btnInject = document.getElementById("btnInject");

    let systemsData = [];

    // 1. Carregar Sistemas
    try {
        const response = await fetch(`${API_URL}/systems`);
        if (!response.ok) throw new Error("Falha ao buscar sistemas");

        systemsData = await response.json();

        // Popula Sistema Dropdown
        systemSelect.innerHTML = '<option value="">Selecione um Sistema</option>';
        systemsData.forEach(sys => {
            const option = document.createElement("option");
            option.value = sys.id;
            option.textContent = sys.name;
            systemSelect.appendChild(option);
        });

        systemSelect.disabled = false;

    } catch (err) {
        console.error(err);
        systemSelect.innerHTML = '<option value="">Erro ao conectar API</option>';
        alert("Erro ao conectar com FozDocs API. Verifique se o backend está rodando.");
        return;
    }

    // 2. Lógica de Dependência (Sistema -> Módulo)
    systemSelect.addEventListener("change", () => {
        const systemId = parseInt(systemSelect.value);
        moduleSelect.innerHTML = '<option value="">Selecione um Módulo</option>';
        moduleSelect.disabled = true;

        if (systemId) {
            const system = systemsData.find(s => s.id === systemId);
            if (system && system.modules && system.modules.length > 0) {
                system.modules.forEach(mod => {
                    const option = document.createElement("option");
                    option.value = mod.id;
                    option.textContent = mod.name;
                    moduleSelect.appendChild(option);
                });
                moduleSelect.disabled = false;
            } else {
                moduleSelect.innerHTML = '<option value="">Sem módulos cadastrados</option>';
            }
        }
    });

    // 4. Privacy Toggle Logic
    const privacyToggle = document.getElementById("privacyToggle");

    // [FIX] Default OFF (Do not load from storage)
    // chrome.storage.local.get("isPrivacyMode", (data) => {
    //    privacyToggle.checked = !!data.isPrivacyMode;
    // });
    privacyToggle.checked = false; // Force OFF on open

    privacyToggle.addEventListener("change", async () => {
        const isActive = privacyToggle.checked;
        chrome.storage.local.set({ isPrivacyMode: isActive });

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            // [FIX] Catch error if content script is not ready
            chrome.tabs.sendMessage(tab.id, {
                action: "TOGGLE_PRIVACY_MODE",
                active: isActive
            }).catch(err => {
                console.log("FozDocs: Content script not ready to receive toggle.", err);
                // Non-blocking error
            });
        }
    });

    // Cancel Button
    document.getElementById("btnCancel").addEventListener("click", () => {
        window.close();
    });

    // 3. Botão Iniciar
    btnInject.addEventListener("click", async () => {
        const title = document.getElementById("titleInput").value.trim();
        const moduleId = moduleSelect.value;
        const systemId = systemSelect.value;
        const isPrivacyMode = privacyToggle.checked; // Pass privacy state

        // Validação
        if (!systemId || !moduleId) {
            alert("Por favor, selecione o Sistema e o Módulo.");
            return;
        }

        if (!title) {
            alert("Por favor, preencha o título do manual.");
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Se a URL não estiver acessível (por restrição de permissão), assumimos string vazia para não quebrar
        const url = tab.url || "";

        if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
            alert("Esta extensão não funciona em páginas de sistema (chrome://).\nPor favor, abra um site normal para testar.");
            return;
        }

        try {
            // Injeta o content.js
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });

            // Pequeno delay para garantir que o script carregou
            await new Promise(resolve => setTimeout(resolve, 500));

            // Envia dados para o content.js
            await chrome.tabs.sendMessage(tab.id, {
                action: "INIT_RECORDER",
                title: title,
                moduleId: moduleId,
                isPrivacyMode: isPrivacyMode // [NEW]
            });

            window.close();
        } catch (err) {
            if (err.message.includes("Cannot access a chrome:// URL")) {
                alert("⚠️ Proibido pelo Navegador!\n\nVocê está tentando gravar uma página protegida do Chrome (chrome://).\n\n👉 Por favor, abra um site normal (Ex: google.com, seu-sistema.com.br) e tente lá.");
            } else {
                alert("Erro ao injetar gravador: " + err.message);
            }
        }
    });
});
