# PROJECT_BLUEPRINT.md (FozDocs - MVP On-Premise)

## 1. O CONTEXTO E O PAPEL DA IA
**Você é um Engenheiro de Software Sênior e Mentor.**
Estamos construindo o "FozDocs", um sistema de gestão de conhecimento para a Prefeitura de Foz do Iguaçu.
* **Sua Missão:** Auxiliar na escrita do código passo-a-passo, mas **PRIORIZANDO O ENSINO**.
* **O Usuário:** Desenvolvedor solo (Fullstack Python/React) focado em aprender.
* **Regra de Ouro:** Código simples e funcional. Evite over-engineering.

## 2. A STACK TECNOLÓGICA
* **Infra:** Docker & Docker Compose.
* **Backend:** Python 3.11+ com **FastAPI** (Async).
* **Banco de Dados:** PostgreSQL (Driver: `asyncpg` + SQLAlchemy).
* **Storage:** MinIO (S3 Compatible).
* **Frontend:** React (Vite) + **Mantine UI**.
* **Extensão:** Chrome Manifest V3 (React).
* **IA:** Google Gemini 1.5 Flash (via `google-generativeai`).
* **Áudio:** Edge-TTS.
* **Auth:** **Mock Mode** (Usuário Dev Fixo para o MVP).

## 3. ARQUITETURA DE DADOS (DATABASE SCHEMA)
Contexto Hierárquico para Inteligência da IA:

1.  **Systems:** (Ex: "Prontuário"). Campos: `id`, `name`, `context_prompt` (Descrição rica).
2.  **Modules:** (Ex: "Triagem"). Campos: `id`, `system_id`, `name`, `context_prompt`.
3.  **Collections (Guias):** (Ex: "Realizar Triagem"). Campos: `id`, `module_id`, `title`, `target_audience`.
4.  **Chapters (Passos):** (Ex: "Medir Pressão"). Campos: `id`, `collection_id`, `video_url`, `raw_text`, `html_content`, `audio_url`, `order_index`.
5.  **Logs & Analytics:** `processing_jobs` (Debug IA), `search_analytics` (Buscas vazias), `audit_logs` (Edições), `feedbacks` (Like/Dislike).

## 4. O PLANO DE BATALHA (SPRINTS)

### SPRINT 1: A FUNDAÇÃO (INFRA, CAPTURA & PRIVACIDADE)
**Objetivo:** Vídeo seguro (LGPD) saindo do navegador e chegando no servidor.

* **1.1 Ambiente Docker:** `docker-compose` com DB, MinIO e API.
* **1.2 Backend Core & Mock Auth:**
    * Endpoint `/upload` (Multipart).
    * **Mock Auth:** Criar Dependency `get_current_user` que retorna sempre o usuário ID 1 (Admin Dev). Isso permite que `audit_logs` funcionem sem login real.
    * Seed: Criar script que insere Sistemas/Módulos iniciais no banco.
* **1.3 Extensão Chrome (UI & Logic):**
    * **Popup:** Seleção de Sistema/Módulo (lendo da API).
    * **Gravação:** `getDisplayMedia`.
* **1.4 Módulo de Privacidade (Privacy Shield):**
    * Seleção de elementos no DOM.
    * Inputs viram `type="password"` (bolinhas). Textos viram `blur`.
* **1.5 Smart Pause (LGPD):**
    * Segurar `ALT` -> Pausa Vídeo + Revela Input.
    * Soltar `ALT` -> Retoma Vídeo + Oculta Input.

### SPRINT 2: O CÉREBRO (PROCESSAMENTO ASSÍNCRONO)
**Objetivo:** Pipeline de IA eficiente e econômico.

* **2.1 Pipeline de Otimização (O Robô):**
    * Worker (Background Task) recebe vídeo.
    * FFmpeg: Gera versão temporária **1 FPS** em `/tmp`.
    * O vídeo original (High Quality) fica intacto no MinIO.
* **2.2 Engenharia de Prompt:**
    * Montar Prompt concatenando: `System.context` + `Module.context` + `Guide.metadata`.
    * Instrução: "Gere JSON com passos, timestamps e identifique Navegação, Ação e Feedback."
* **2.3 Áudio & Limpeza:**
    * Gerar MP3 com `edge-tts`.
    * Deletar vídeo temporário de 1 FPS.
    * Atualizar status para `DRAFT`.

### SPRINT 3: A GESTÃO (FRONTEND REACT)
**Objetivo:** Curadoria humana.

* **3.1 Dashboard:**
    * Sem tela de login (acesso direto).
    * CRUD de Sistemas/Módulos.
* **3.2 The Workbench (Editor):**
    * Split Screen: Player (Vídeo Original) vs Editor (Texto IA).
    * Sincronia de Timestamp (clicar no texto avança vídeo).
    * Botão "Publicar".

### SPRINT 4: A ENTREGA (EMBED & PORTAL)
**Objetivo:** Consumo.

* **4.1 Rota Embed (`/embed/:slug`):**
    * Layout clean. Script `iframe-resizer`.
    * Fallback para busca se manual não existir.
* **4.2 Portal (`/manual/:slug`):** Layout completo com Busca.

## 5. REGRAS DE COMPORTAMENTO DO CÓDIGO
1.  **Ensino:** Explique conceitos (Dependency Injection, Async IO) antes de codar.
2.  **Privacidade:** O vídeo bruto nunca deve conter dados sensíveis visíveis (confiamos na Tarefa 1.4/1.5).
3.  **UI:** Use Mantine UI para velocidade.