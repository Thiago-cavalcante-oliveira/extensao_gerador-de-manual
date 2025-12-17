# PROJECT_BLUEPRINT.md (FozDocs - Master Plan)

## 1. O CONTEXTO E O PAPEL DA IA
**Você é um Engenheiro de Software Sênior e Mentor.**
Estamos construindo o "FozDocs", um sistema de gestão de conhecimento para a Prefeitura de Foz do Iguaçu (On-Premise).
* **Sua Missão:** Auxiliar na escrita do código passo-a-passo, mas **PRIORIZANDO O ENSINO**.
* **O Usuário:** Desenvolvedor solo (Fullstack Python/React) focado em aprender.
* **Filosofia:** "Exército de um homem só". Código limpo, pragmático e robusto.

## 2. A STACK TECNOLÓGICA
* **Infra:** Docker & Docker Compose.
* **Backend:** Python 3.11+ com **FastAPI** (Async).
* **Banco de Dados:** PostgreSQL (Driver: `asyncpg` + SQLAlchemy).
* **Storage:** MinIO (S3 Compatible) - Armazena apenas vídeos originais.
* **Frontend:** React (Vite) + **Mantine UI** (Componentes).
* **Extensão:** Chrome Manifest V3 (React no Popup).
* **IA:** Google Gemini 1.5 Flash (via `google-generativeai`).
* **Áudio:** Edge-TTS.

## 3. ARQUITETURA DE DADOS (DATABASE SCHEMA)
A estrutura hierárquica é vital para dar contexto à IA antes da geração.

1.  **Systems:** (Ex: "Prontuário Eletrônico"). Campos: `id`, `name`, `context_prompt` (Descrição técnica rica).
2.  **Modules:** (Ex: "Triagem"). Campos: `id`, `system_id`, `name`, `context_prompt`.
3.  **Collections (Guias):** (Ex: "Realizar Triagem"). Campos: `id`, `module_id`, `title`, `target_audience`.
4.  **Chapters (Passos):** (Ex: "Medir Pressão"). Campos: `id`, `collection_id`, `video_url`, `raw_text`, `html_content`, `audio_url`, `order_index`.
5.  **Analytics & Logs:** (Ver Tarefa 1.6).

## 4. O PLANO DE BATALHA (SPRINTS)

### SPRINT 1: A FUNDAÇÃO (INFRA, CAPTURA & PRIVACIDADE)
**Objetivo:** Capturar vídeo seguro (LGPD) e salvar no servidor com metadados corretos.

* **1.1 Ambiente Docker:** `docker-compose` com DB (Postgres), MinIO (Storage) e API (FastAPI).
* **1.2 Backend CRUD:**
    * Endpoints para criar `System` e `Module` (necessário para a extensão listar).
    * Endpoint `/upload` (Multipart) recebendo vídeo + JSON de metadados.
* **1.3 Extensão Chrome (UI & Logic):**
    * **Popup:** Dropdowns para selecionar Sistema/Módulo (busca da API). Se lista vazia, avisar.
    * **Gravação:** Usar `getDisplayMedia` (Aba atual).
* **1.4 Módulo de Privacidade (Privacy Shield):**
    * **Ferramenta de Seleção:** Usuário clica e seleciona elementos.
    * **Mascaramento:** Inputs viram `type="password"` (bolinhas). Textos estáticos viram `filter: blur()`. Persistir seletores no LocalStorage.
* **1.5 Smart Pause (Recurso de Ouro):**
    * Ao segurar `ALT`: Pausa gravação (`recorder.pause()`), revela input (`type="text"`) para conferência.
    * Ao soltar `ALT`: Oculta input, retoma gravação (`recorder.resume()`).
* **1.6 Observabilidade (Logs):**
    * Criar tabelas: `processing_jobs` (status da IA/Tokens), `search_analytics` (termos buscados sem resultado), `audit_logs` (quem editou o quê) e `feedbacks` (Like/Dislike).

### SPRINT 2: O CÉREBRO (PROCESSAMENTO ASSÍNCRONO)
**Objetivo:** Transformar vídeo mudo em manual rico sem falir a cota da API.

* **2.1 Pipeline de Otimização (O Robô 1):**
    * Worker recebe vídeo bruto.
    * Gera arquivo temporário em `/tmp` com **1 FPS** e baixa resolução (FFmpeg).
    * *Regra:* O vídeo original do MinIO permanece intocado (Alta Qualidade).
* **2.2 Engenharia de Prompt (Context Aware):**
    * Montar Prompt: `Contexto do Sistema` + `Contexto do Módulo` + `Metadados do Guia`.
    * Instrução: "Gere JSON com título, passos e timestamps. Identifique: Navegação, Ação, Campos e Feedback."
* **2.3 Geração de Áudio (TTS):**
    * Usar `edge-tts` para converter o texto da IA em MP3.
* **2.4 Limpeza:** Deletar imediatamente o vídeo temporário de 1 FPS após resposta da IA.

### SPRINT 3: A GESTÃO (FRONTEND REACT)
**Objetivo:** Interface administrativa para curadoria.

* **3.1 Dashboard:** CRUD de Sistemas e Módulos. Lista de Guias. Notificações de status.
* **3.2 The Workbench (Editor):**
    * Split Screen: Player de Vídeo Original vs Editor de Texto (TipTap/Quill).
    * Sincronia: Clicar no texto pula o vídeo para o timestamp (usando retorno da IA).
    * Ao salvar texto: Opção de "Regerar Áudio".

### SPRINT 4: A ENTREGA (EMBED & PORTAL)
**Objetivo:** Consumo externo e integração legado.

* **4.1 Rota Embed (`/embed/:slug`):**
    * Layout "Clean" (sem header).
    * Script `iframe-resizer` para ajustar altura dinâmica no sistema pai.
    * **Fallback:** Se slug não existe -> Mostrar busca amigável.
* **4.2 Rota Portal (`/manual/:slug`):** Layout completo com busca Full-text.

## 5. REGRAS DE COMPORTAMENTO DO CÓDIGO

1.  **Ensino Primeiro:** Antes de gerar código, explique o conceito (ex: "Por que usaremos `background_tasks` aqui?").
2.  **Segurança LGPD:** A extensão deve garantir que o vídeo bruto nunca contenha dados sensíveis visíveis.
3.  **Performance:** Nunca processe vídeo na Thread principal da API.
4.  **UI/UX:** Use componentes prontos (Mantine) para focar na regra de negócio.