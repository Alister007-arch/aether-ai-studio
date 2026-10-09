/**
 * GenAI & RAG Studio — Frontend Controller
 * Connects with FastAPI server endpoints: RAG query, Gemini Chat, Vector embeddings & ChromaDB.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        activeTab: 'ragTab',
        isRagStreaming: false,
        isDirectStreaming: false,
        systemStatus: null,
        chunksLoaded: false
    };

    // Elements
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const systemStatusChip = document.getElementById('systemStatusChip');
    const statusLabel = document.getElementById('statusLabel');
    const headerChunkCount = document.getElementById('headerChunkCount');
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    // Tab 1 Elements: RAG
    const ragMessages = document.getElementById('ragMessages');
    const ragInput = document.getElementById('ragInput');
    const ragSendBtn = document.getElementById('ragSendBtn');
    const ragRetrievalIndicator = document.getElementById('ragRetrievalIndicator');
    const indicatorStep = document.getElementById('indicatorStep');
    const searchTypeSelect = document.getElementById('searchTypeSelect');
    const ragKInput = document.getElementById('ragKInput');
    const ragFetchKInput = document.getElementById('ragFetchKInput');
    const clearRagChatBtn = document.getElementById('clearRagChatBtn');
    const pdfUploadInput = document.getElementById('pdfUploadInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatusText = document.getElementById('uploadStatusText');

    // Tab 2 Elements: Direct Gemini
    const directMessages = document.getElementById('directMessages');
    const directInput = document.getElementById('directInput');
    const directSendBtn = document.getElementById('directSendBtn');
    const directModelSelect = document.getElementById('directModelSelect');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const tempValueDisplay = document.getElementById('tempValueDisplay');
    const systemInstructionInput = document.getElementById('systemInstructionInput');
    const clearDirectChatBtn = document.getElementById('clearDirectChatBtn');
    const directEngineBadge = document.getElementById('directEngineBadge');

    // Tab 3 Elements: Vector Lab
    const embedInputText = document.getElementById('embedInputText');
    const embedModelSelect = document.getElementById('embedModelSelect');
    const generateEmbedBtn = document.getElementById('generateEmbedBtn');
    const embedResultArea = document.getElementById('embedResultArea');
    const vectorDimValue = document.getElementById('vectorDimValue');
    const vectorValuesPreview = document.getElementById('vectorValuesPreview');
    const spectrumBars = document.getElementById('spectrumBars');
    const copyVectorBtn = document.getElementById('copyVectorBtn');

    const simText1 = document.getElementById('simText1');
    const simText2 = document.getElementById('simText2');
    const calcSimilarityBtn = document.getElementById('calcSimilarityBtn');
    const similarityResultArea = document.getElementById('similarityResultArea');
    const scorePercentage = document.getElementById('scorePercentage');
    const scoreInterpretation = document.getElementById('scoreInterpretation');
    const rawCosineScore = document.getElementById('rawCosineScore');
    const similarityProgressBar = document.getElementById('similarityProgressBar');
    const presetSimHigh = document.getElementById('presetSimHigh');
    const presetSimLow = document.getElementById('presetSimLow');

    // Tab 4 Elements: Chunks Explorer
    const chunksSearchInput = document.getElementById('chunksSearchInput');
    const searchChunksBtn = document.getElementById('searchChunksBtn');
    const resetChunksBtn = document.getElementById('resetChunksBtn');
    const chunksGrid = document.getElementById('chunksGrid');
    const ribbonTotalChunks = document.getElementById('ribbonTotalChunks');
    const ribbonDocName = document.getElementById('ribbonDocName');

    // ==========================================
    // 0. Theme Palette Management
    // ==========================================
    const themeDropdownBtn = document.getElementById('themeDropdownBtn');
    const themeMenu = document.getElementById('themeMenu');
    const themeOpts = document.querySelectorAll('.theme-opt');
    const currentThemeName = document.getElementById('currentThemeName');
    const currentThemeSwatch = document.getElementById('currentThemeSwatch');

    const themeNames = {
        spiderman: 'Spider-Man Suit',
        batman: 'Batman Dark Knight',
        ironman: 'Iron Man Arc Reactor',
        gold: 'Luxury Gold',
        indigo: 'Electric Indigo',
        cyan: 'Cyber Cyan',
        emerald: 'Emerald Matrix',
        crimson: 'Crimson Ruby',
        platinum: 'Titanium Platinum'
    };

    const themeSwatches = {
        spiderman: 'linear-gradient(135deg, #ef4444 0%, #2563eb 100%)',
        batman: 'linear-gradient(135deg, #fbbf24 0%, #18181b 100%)',
        ironman: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 50%, #06b6d4 100%)',
        gold: 'linear-gradient(135deg, #f5d77f, #d4af37)',
        indigo: 'linear-gradient(135deg, #818cf8, #6366f1)',
        cyan: 'linear-gradient(135deg, #38bdf8, #06b6d4)',
        emerald: 'linear-gradient(135deg, #34d399, #10b981)',
        crimson: 'linear-gradient(135deg, #fb7185, #f43f5e)',
        platinum: 'linear-gradient(135deg, #ffffff, #a1a1aa)'
    };

    function applyTheme(themeKey) {
        if (!themeNames[themeKey]) themeKey = 'gold';
        document.body.setAttribute('data-theme', themeKey);
        localStorage.setItem('aether_theme', themeKey);

        if (currentThemeName) currentThemeName.textContent = themeNames[themeKey];
        if (currentThemeSwatch) currentThemeSwatch.style.background = themeSwatches[themeKey];

        // Highlight selected theme card inside Profile & Settings Modal
        document.querySelectorAll('.theme-card-option').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === themeKey);
        });
    }

    // Expose selectTheme globally so inline onclick works instantly
    window.selectTheme = function(themeKey) {
        applyTheme(themeKey);
        showToast(`Theme: ${themeNames[themeKey] || themeKey}`);
    };

    // Initialize from storage or default to gold
    const savedTheme = localStorage.getItem('aether_theme') || 'gold';
    applyTheme(savedTheme);

    if (themeDropdownBtn && themeMenu) {
        themeDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!themeDropdownBtn.contains(e.target) && !themeMenu.contains(e.target)) {
                themeMenu.classList.add('hidden');
            }
        });

        themeOpts.forEach(opt => {
            opt.addEventListener('click', () => {
                const t = opt.dataset.theme;
                window.selectTheme(t);
                themeMenu.classList.add('hidden');
            });
        });
    }

    // ==========================================
    // 0.5 Profile & Settings Modal
    // ==========================================
    const settingsModal = document.getElementById('settingsModal');
    const openProfileBtn = document.getElementById('openProfileBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
    const settingsPanes = document.querySelectorAll('.settings-pane');

    const headerUserName = document.getElementById('headerUserName');
    const headerAvatarCircle = document.getElementById('headerAvatarCircle');

    // Open Modal when Profile button is clicked
    if (openProfileBtn && settingsModal) {
        openProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openSettingsTab('authSettingsTab');
        });
    }

    // Close Modal
    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.close();
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.close();
            }
        });
    }

    window.openSettingsTab = function(tabId) {
        if (settingsModal) {
            if (!settingsModal.open) settingsModal.showModal();
            settingsNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.settingsTab === tabId);
            });
            settingsPanes.forEach(pane => {
                pane.classList.toggle('active', pane.id === tabId);
            });
        }
    };

    // Settings Tabs inside modal
    settingsNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.settingsTab;
            settingsNavBtns.forEach(b => b.classList.remove('active'));
            settingsPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(target);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Style Switches (Ambient glow & compact mode)
    const ambientGlowToggle = document.getElementById('ambientGlowToggle');
    const compactChatToggle = document.getElementById('compactChatToggle');

    if (ambientGlowToggle) {
        ambientGlowToggle.addEventListener('change', () => {
            const glows = document.querySelectorAll('.ambient-glow');
            glows.forEach(g => g.style.display = ambientGlowToggle.checked ? 'block' : 'none');
            showToast(ambientGlowToggle.checked ? 'Ambient glows enabled' : 'Ambient glows disabled');
        });
    }

    if (compactChatToggle) {
        compactChatToggle.addEventListener('change', () => {
            document.body.classList.toggle('compact-mode', compactChatToggle.checked);
            showToast(compactChatToggle.checked ? 'Compact chat density enabled' : 'Normal chat density');
        });
    }

    // Auth Views & Forms
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const nameFieldGroup = document.getElementById('nameFieldGroup');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authExtras = document.getElementById('authExtras');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const authPassword = document.getElementById('authPassword');
    const authEmail = document.getElementById('authEmail');
    const authFullName = document.getElementById('authFullName');

    const authFormView = document.getElementById('authFormView');
    const loggedInView = document.getElementById('loggedInView');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    let isSignUpMode = false;

    if (showLoginBtn && showSignupBtn) {
        showLoginBtn.addEventListener('click', () => {
            isSignUpMode = false;
            showLoginBtn.classList.add('active');
            showSignupBtn.classList.remove('active');
            if (nameFieldGroup) nameFieldGroup.style.display = 'none';
            if (authExtras) authExtras.style.display = 'flex';
            if (authSubmitBtn) {
                authSubmitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Aether AI';
            }
        });

        showSignupBtn.addEventListener('click', () => {
            isSignUpMode = true;
            showSignupBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
            if (nameFieldGroup) nameFieldGroup.style.display = 'block';
            if (authExtras) authExtras.style.display = 'none';
            if (authSubmitBtn) {
                authSubmitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Aether Account';
            }
        });
    }

    // Toggle password visibility
    if (togglePasswordBtn && authPassword) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPass = authPassword.type === 'password';
            authPassword.type = isPass ? 'text' : 'password';
            togglePasswordBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });
    }

    function updateAuthUI(user) {
        if (user && user.loggedIn) {
            if (headerUserName) headerUserName.textContent = user.name;
            if (headerAvatarCircle) headerAvatarCircle.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
            if (profileUsername) profileUsername.textContent = user.name;
            if (profileEmail) profileEmail.textContent = user.email;
            if (authFormView) authFormView.classList.add('hidden');
            if (loggedInView) loggedInView.classList.remove('hidden');
        } else {
            if (headerUserName) headerUserName.textContent = 'Profile';
            if (headerAvatarCircle) headerAvatarCircle.innerHTML = '<i class="fa-solid fa-user"></i>';
            if (authFormView) authFormView.classList.remove('hidden');
            if (loggedInView) loggedInView.classList.add('hidden');
        }
    }

    // Load saved user
    try {
        const savedUser = JSON.parse(localStorage.getItem('aether_user'));
        if (savedUser) updateAuthUI(savedUser);
    } catch (e) {}

    window.handleAuthSubmit = function() {
        const emailVal = authEmail ? authEmail.value.trim() : '';
        const nameVal = isSignUpMode && authFullName && authFullName.value.trim()
            ? authFullName.value.trim()
            : (emailVal.split('@')[0] || 'User');

        const userObj = {
            name: nameVal,
            email: emailVal.includes('@') ? emailVal : `${emailVal}@aether.ai`,
            loggedIn: true
        };

        localStorage.setItem('aether_user', JSON.stringify(userObj));
        updateAuthUI(userObj);
        showToast(`Welcome, ${nameVal}!`);
        if (settingsModal) setTimeout(() => settingsModal.close(), 700);
    };

    window.fastSocialLogin = function(provider) {
        const userObj = {
            name: `${provider} Explorer`,
            email: `${provider.toLowerCase()}@aether.ai`,
            loggedIn: true
        };
        localStorage.setItem('aether_user', JSON.stringify(userObj));
        updateAuthUI(userObj);
        showToast(`Signed in with ${provider}!`);
        if (settingsModal) setTimeout(() => settingsModal.close(), 700);
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('aether_user');
            updateAuthUI(null);
            showToast('Signed out successfully');
        });
    }

    // Clear Local Data
    const clearLocalDataBtn = document.getElementById('clearLocalDataBtn');
    if (clearLocalDataBtn) {
        clearLocalDataBtn.addEventListener('click', () => {
            localStorage.removeItem('aether_user');
            updateAuthUI(null);
            showToast('All cached sessions and preferences cleared');
        });
    }

    // ==========================================
    // 1. Navigation & Tab Switching
    // ==========================================
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPaneId = tab.dataset.tab;
            navTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) targetPane.classList.add('active');
            state.activeTab = targetPaneId;

            if (targetPaneId === 'chunksTab' && !state.chunksLoaded) {
                loadChunks();
            }
        });
    });

    // ==========================================
    // 2. Global System Status Check
    // ==========================================
    async function checkSystemStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            state.systemStatus = data;

            if (data.api_key_configured) {
                statusLabel.textContent = `Online • ${data.default_model}`;
                systemStatusChip.querySelector('.status-dot').className = 'status-dot online';
            } else {
                statusLabel.textContent = 'API Key Missing in .env';
                systemStatusChip.querySelector('.status-dot').className = 'status-dot error';
            }

            if (data.chroma_chunks_count !== undefined) {
                headerChunkCount.textContent = `${data.chroma_chunks_count} Chunks`;
                ribbonTotalChunks.textContent = data.chroma_chunks_count;
                const docPagesInfo = document.getElementById('docPagesInfo');
                if (docPagesInfo) {
                    docPagesInfo.textContent = `ChromaDB &bull; ${data.chroma_chunks_count} Chunks Indexed`;
                }
            }

            if (data.pdf_files && data.pdf_files.length > 0) {
                const activeDocName = document.getElementById('activeDocName');
                if (activeDocName) activeDocName.textContent = data.pdf_files[0];
                if (ribbonDocName) ribbonDocName.textContent = data.pdf_files[0];
            }
        } catch (err) {
            console.error('Failed to query status:', err);
            statusLabel.textContent = 'Backend Offline';
            systemStatusChip.querySelector('.status-dot').className = 'status-dot error';
        }
    }
    checkSystemStatus();

    // Toast helper
    function showToast(msg, duration = 3000) {
        toastMessage.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), duration);
    }

    // Markdown Parser fallback helper
    function renderMarkdown(content) {
        if (window.marked && typeof window.marked.parse === 'function') {
            return window.marked.parse(content);
        }
        // Fallback lightweight regex formatting
        let escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        escaped = escaped.replace(/\n\n/g, '<p></p>');
        return escaped;
    }

    // Auto-expand Textareas
    function setupAutoResize(textarea) {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 130) + 'px';
        });
    }
    setupAutoResize(ragInput);
    setupAutoResize(directInput);

    // ==========================================
    // 3. Tab 1: RAG Assistant
    // ==========================================
    function appendRagMessage(sender, text, chunks = null) {
        const welcome = ragMessages.querySelector('.welcome-banner');
        if (welcome) welcome.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.innerHTML = sender === 'user'
            ? '<i class="fa-solid fa-user"></i>'
            : '<i class="fa-solid fa-brain"></i>';

        const body = document.createElement('div');
        body.className = 'msg-body';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerHTML = sender === 'user' ? `<p>${escapeHtml(text)}</p>` : renderMarkdown(text);
        body.appendChild(bubble);

        // If chunks are attached, add accordion
        if (chunks && chunks.length > 0) {
            const accordion = document.createElement('div');
            accordion.className = 'context-accordion';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'accordion-toggle';
            toggleBtn.innerHTML = `<span><i class="fa-solid fa-layer-group"></i> Retrieved Context (${chunks.length} MMR Chunks)</span> <i class="fa-solid fa-chevron-down"></i>`;

            const accordionContent = document.createElement('div');
            accordionContent.className = 'accordion-content hidden';

            chunks.forEach((chunk, idx) => {
                const snippet = document.createElement('div');
                snippet.className = 'chunk-snippet-card';
                const pageNo = chunk.metadata && chunk.metadata.page !== undefined ? `Page ${chunk.metadata.page + 1}` : 'Chunk';
                const source = chunk.metadata && chunk.metadata.source ? chunk.metadata.source.split(/[\\/]/).pop() : 'Document';

                snippet.innerHTML = `
                    <div class="chunk-snippet-header">
                        <span>#${idx + 1} &bull; ${source} (${pageNo})</span>
                        <span>${chunk.length} chars</span>
                    </div>
                    <div class="chunk-snippet-text">${escapeHtml(chunk.content)}</div>
                `;
                accordionContent.appendChild(snippet);
            });

            toggleBtn.addEventListener('click', () => {
                accordionContent.classList.toggle('hidden');
                toggleBtn.querySelector('.fa-chevron-down, .fa-chevron-up')
                    .classList.toggle('fa-chevron-up');
            });

            accordion.appendChild(toggleBtn);
            accordion.appendChild(accordionContent);
            body.appendChild(accordion);
        }

        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        meta.innerHTML = `<span>${now}</span>`;
        body.appendChild(meta);

        messageEl.appendChild(avatar);
        messageEl.appendChild(body);
        ragMessages.appendChild(messageEl);

        ragMessages.scrollTop = ragMessages.scrollHeight;
    }

    async function handleRagSend() {
        const query = ragInput.value.trim();
        if (!query || state.isRagStreaming) return;

        ragInput.value = '';
        ragInput.style.height = 'auto';
        appendRagMessage('user', query);

        state.isRagStreaming = true;
        ragRetrievalIndicator.classList.remove('hidden');
        indicatorStep.textContent = 'Retrieving chunks from ChromaDB (MMR)...';

        try {
            const kVal = parseInt(ragKInput.value, 10) || 4;
            const fetchKVal = parseInt(ragFetchKInput.value, 10) || 10;
            const searchType = searchTypeSelect.value || 'mmr';

            const response = await fetch('/api/rag/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: query,
                    k: kVal,
                    fetch_k: fetchKVal,
                    search_type: searchType,
                    chat_model: 'gemini-3.7-flash',
                    embedding_model: 'gemini-embedding-001'
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to complete RAG query');
            }

            const data = await response.json();
            appendRagMessage('assistant', data.answer, data.chunks);
        } catch (err) {
            console.error('RAG Query Error:', err);
            appendRagMessage('assistant', `⚠️ **Error processing query:** ${err.message}`);
            showToast('Error answering query');
        } finally {
            state.isRagStreaming = false;
            ragRetrievalIndicator.classList.add('hidden');
            ragInput.focus();
        }
    }

    ragSendBtn.addEventListener('click', handleRagSend);
    ragInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRagSend();
        }
    });

    clearRagChatBtn.addEventListener('click', () => {
        ragMessages.innerHTML = `
            <div class="welcome-banner">
                <div class="welcome-icon">
                    <i class="fa-solid fa-file-contract"></i>
                </div>
                <h2>PDF Knowledge Assistant</h2>
                <p>Ask any question about <strong>GRU.pdf</strong> or uploaded documents. Responses are strictly grounded using ChromaDB MMR retrieval and Gemini 3.7 Flash.</p>
                <div class="welcome-badges">
                    <span><i class="fa-solid fa-circle-check"></i> Zero Hallucination Guard</span>
                    <span><i class="fa-solid fa-layer-group"></i> 222 Active Chunks</span>
                    <span><i class="fa-solid fa-magnifying-glass"></i> Context Citations</span>
                </div>
            </div>
        `;
        showToast('Chat history cleared');
    });

    // Suggested Prompt Chips for RAG
    document.querySelectorAll('.prompt-chip:not(.direct-chip)').forEach(chip => {
        chip.addEventListener('click', () => {
            const q = chip.dataset.query;
            if (q) {
                ragInput.value = q;
                handleRagSend();
            }
        });
    });

    // Upload New PDF
    pdfUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadProgress.classList.remove('hidden');
        uploadStatusText.textContent = `Uploading & chunking "${file.name}"...`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/rag/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Upload failed');
            }

            const data = await res.json();
            showToast(`Indexed ${data.chunks_created} chunks into ChromaDB!`);
            document.getElementById('activeDocName').textContent = file.name;
            checkSystemStatus();
            if (state.chunksLoaded) loadChunks();
        } catch (err) {
            console.error('Upload Error:', err);
            showToast(`Upload failed: ${err.message}`);
        } finally {
            uploadProgress.classList.add('hidden');
            pdfUploadInput.value = '';
        }
    });

    // ==========================================
    // 4. Tab 2: Gemini Direct Chat
    // ==========================================
    temperatureSlider.addEventListener('input', () => {
        tempValueDisplay.textContent = temperatureSlider.value;
    });

    directModelSelect.addEventListener('change', () => {
        directEngineBadge.textContent = directModelSelect.value;
    });

    function appendDirectMessage(sender, text) {
        const welcome = directMessages.querySelector('.welcome-banner');
        if (welcome) welcome.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.innerHTML = sender === 'user'
            ? '<i class="fa-solid fa-user"></i>'
            : '<i class="fa-solid fa-wand-magic-sparkles"></i>';

        const body = document.createElement('div');
        body.className = 'msg-body';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerHTML = sender === 'user' ? `<p>${escapeHtml(text)}</p>` : renderMarkdown(text);
        body.appendChild(bubble);

        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        meta.innerHTML = `<span>${now}</span>`;
        body.appendChild(meta);

        messageEl.appendChild(avatar);
        messageEl.appendChild(body);
        directMessages.appendChild(messageEl);

        directMessages.scrollTop = directMessages.scrollHeight;
    }

    async function handleDirectSend() {
        const text = directInput.value.trim();
        if (!text || state.isDirectStreaming) return;

        directInput.value = '';
        directInput.style.height = 'auto';
        appendDirectMessage('user', text);

        state.isDirectStreaming = true;

        try {
            const model = directModelSelect.value;
            const temp = parseFloat(temperatureSlider.value);
            const sys = systemInstructionInput.value.trim();

            const res = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    model: model,
                    temperature: temp,
                    system_instruction: sys
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to get Gemini response');
            }

            const data = await res.json();
            appendDirectMessage('assistant', data.reply);
        } catch (err) {
            console.error('Direct Chat Error:', err);
            appendDirectMessage('assistant', `⚠️ **Error:** ${err.message}`);
        } finally {
            state.isDirectStreaming = false;
            directInput.focus();
        }
    }

    directSendBtn.addEventListener('click', handleDirectSend);
    directInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleDirectSend();
        }
    });

    clearDirectChatBtn.addEventListener('click', () => {
        directMessages.innerHTML = `
            <div class="welcome-banner">
                <div class="welcome-icon direct-gradient">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h2>Gemini Direct Chat</h2>
                <p>Interact directly with Google's state-of-the-art Gemini models without document constraints, mirroring <code>main.py</code>.</p>
            </div>
        `;
        showToast('Chat history cleared');
    });

    document.querySelectorAll('.direct-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const q = chip.dataset.query;
            if (q) {
                directInput.value = q;
                handleDirectSend();
            }
        });
    });

    // ==========================================
    // 5. Tab 3: Vector & Embeddings Lab
    // ==========================================
    generateEmbedBtn.addEventListener('click', async () => {
        const text = embedInputText.value.trim();
        if (!text) return showToast('Please enter text to embed');

        generateEmbedBtn.disabled = true;
        generateEmbedBtn.innerHTML = '<div class="spinner"></div> Generating...';

        try {
            const model = embedModelSelect.value;
            const res = await fetch('/api/embeddings/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, model })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Embedding generation failed');
            }

            const data = await res.json();
            vectorDimValue.textContent = `${data.dimension} dimensions`;
            vectorValuesPreview.textContent = JSON.stringify(data.preview_first_10, null, 2);

            // Render Spectrum Bars
            spectrumBars.innerHTML = '';
            if (data.sample_30 && data.sample_30.length > 0) {
                const maxVal = Math.max(...data.sample_30.map(v => Math.abs(v))) || 1;
                data.sample_30.forEach(v => {
                    const bar = document.createElement('div');
                    bar.className = 'spectrum-bar';
                    const heightPercent = Math.max(10, Math.min(100, (Math.abs(v) / maxVal) * 100));
                    bar.style.height = `${heightPercent}%`;
                    bar.title = `Value: ${v.toFixed(4)}`;
                    spectrumBars.appendChild(bar);
                });
            }

            embedResultArea.classList.remove('hidden');
            showToast('Vector embedding generated successfully');
        } catch (err) {
            console.error('Embedding error:', err);
            showToast(`Embedding error: ${err.message}`);
        } finally {
            generateEmbedBtn.disabled = false;
            generateEmbedBtn.innerHTML = '<i class="fa-solid fa-play"></i> Generate Embedding';
        }
    });

    copyVectorBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(vectorValuesPreview.textContent);
        showToast('Vector sample copied to clipboard!');
    });

    // Semantic Similarity Matcher
    presetSimHigh.addEventListener('click', () => {
        simText1.value = 'Gated Recurrent Units solve vanishing gradient problems in deep neural networks.';
        simText2.value = 'GRU networks use reset and update gates to maintain long-term sequence dependencies.';
        calcSimilarityBtn.click();
    });

    presetSimLow.addEventListener('click', () => {
        simText1.value = 'Deep learning models with recurrent cells excel in sequence modeling and speech recognition.';
        simText2.value = 'Tomorrow morning will have sunny weather with a gentle breeze in the park.';
        calcSimilarityBtn.click();
    });

    calcSimilarityBtn.addEventListener('click', async () => {
        const text1 = simText1.value.trim();
        const text2 = simText2.value.trim();
        if (!text1 || !text2) return showToast('Please provide both sentences');

        calcSimilarityBtn.disabled = true;
        calcSimilarityBtn.innerHTML = '<div class="spinner"></div> Computing distance...';

        try {
            const res = await fetch('/api/embeddings/similarity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text1, text2 })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Similarity calculation failed');
            }

            const data = await res.json();
            scorePercentage.textContent = `${data.percentage}%`;
            rawCosineScore.textContent = data.cosine_score;
            scoreInterpretation.textContent = data.interpretation;
            similarityProgressBar.style.width = `${data.percentage}%`;

            similarityResultArea.classList.remove('hidden');
        } catch (err) {
            console.error('Similarity error:', err);
            showToast(`Error: ${err.message}`);
        } finally {
            calcSimilarityBtn.disabled = false;
            calcSimilarityBtn.innerHTML = '<i class="fa-solid fa-calculator"></i> Calculate Semantic Distance';
        }
    });

    // ==========================================
    // 6. Tab 4: Chunks & Knowledge Base Explorer
    // ==========================================
    async function loadChunks(query = '') {
        chunksGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading chunks from ChromaDB...</p>
            </div>
        `;

        try {
            const url = query
                ? `/api/chunks/sample?query=${encodeURIComponent(query)}&limit=12`
                : `/api/chunks/sample?limit=12`;

            const res = await fetch(url);
            const data = await res.json();

            state.chunksLoaded = true;
            if (data.total_count !== undefined) {
                ribbonTotalChunks.textContent = data.total_count;
            }

            if (!data.chunks || data.chunks.length === 0) {
                chunksGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                        No matching chunks found in ChromaDB.
                    </div>
                `;
                return;
            }

            chunksGrid.innerHTML = '';
            data.chunks.forEach((chunk, index) => {
                const card = document.createElement('div');
                card.className = 'chunk-card';

                const pageNo = chunk.metadata && chunk.metadata.page !== undefined
                    ? `Page ${chunk.metadata.page + 1}`
                    : `Chunk ${index + 1}`;
                const source = chunk.metadata && chunk.metadata.source
                    ? chunk.metadata.source.split(/[\\/]/).pop()
                    : 'Document';

                card.innerHTML = `
                    <div class="chunk-top">
                        <span class="chunk-tag"><i class="fa-solid fa-puzzle-piece"></i> Chunk #${chunk.id}</span>
                        <span class="chunk-meta">${source} &bull; ${pageNo}</span>
                    </div>
                    <div class="chunk-body">${escapeHtml(chunk.content)}</div>
                    <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                        <span>Length: ${chunk.char_length} chars</span>
                        <span style="color: var(--accent-cyan);"><i class="fa-solid fa-check"></i> Indexed</span>
                    </div>
                `;
                chunksGrid.appendChild(card);
            });
        } catch (err) {
            console.error('Chunks loading error:', err);
            chunksGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--accent-rose);">
                    Failed to load chunks: ${err.message}
                </div>
            `;
        }
    }

    searchChunksBtn.addEventListener('click', () => {
        const q = chunksSearchInput.value.trim();
        loadChunks(q);
    });

    chunksSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            loadChunks(chunksSearchInput.value.trim());
        }
    });

    resetChunksBtn.addEventListener('click', () => {
        chunksSearchInput.value = '';
        loadChunks();
    });

    // Helper HTML escaper
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
