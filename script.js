// --- 1. DOM ELEMENTS ---
        const dropZone = document.getElementById('dropZone');
        const emptyState = document.getElementById('emptyState');
        const commandListEl = document.getElementById('commandList');
        const pinnedListEl = document.getElementById('pinnedList');
        const presetListEl = document.getElementById('presetList');
        const customPresetListEl = document.getElementById('customPresetList');
        const blockViewContainer = document.getElementById('blockViewContainer');
        const codeViewContainer = document.getElementById('codeViewContainer');
        const codePreviewBlock = document.getElementById('codePreviewBlock');
        const placeholder = document.createElement('div'); 
        placeholder.className = 'drop-placeholder';

        // --- 2. DATA ---
        let selectedPresetIcon = 'terminal';
        let renamingIcon = 'terminal';

        // --- 3. STATE ---
        let currentContext = 'Batch';
        let historyStack = [], redoStack = [], isInternalUpdate = false;
        let draggedItem = null; 
        let editingScriptBlock = null;
        let editingPresetId = null;
        let presetToDeleteId = null;
        let pendingAction = null;
        const MAX_HISTORY = 20;
        let lastRenderedContext = null;

        // --- 4. INITIALIZATION SEQUENCE ---
        document.getElementById('yearSpan').textContent = new Date().getFullYear();
        
        // Popover Close Logic
        document.addEventListener('click', (e) => {
            const popover = document.getElementById('clearPopover');
            const btn = document.getElementById('btnClear');
            if (popover.classList.contains('active') && !popover.contains(e.target) && !btn.contains(e.target)) {
                popover.classList.remove('active');
            }

            const deletePopover = document.getElementById('deletePresetPopover');
            // Close delete popover if clicking outside
            if (deletePopover.classList.contains('active') && !deletePopover.contains(e.target)) {
                closeDeletePresetPopover();
            }

            // Close mobile menu if clicking outside
            const mobileMenu = document.getElementById('mobileMenu');
            const toggler = document.querySelector('.navbar-toggler');
            if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && !toggler.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
            if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.classList.contains('script-block')) {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                    e.preventDefault();
                    document.activeElement.querySelector('.remove-btn').click();
                }
            }
        });

        renderSidebar();
        renderPresets();
        loadCustomPresets();
        saveState(); 
        initTheme();
        document.getElementById('welcomeToggle').checked = localStorage.getItem('bb_always_welcome') === 'true';
        
        const isCompact = localStorage.getItem('bb_compact_sidebar') === 'true';
        document.getElementById('sidebarCompactToggle').checked = isCompact;
        if (isCompact) document.getElementById('mainSidebar').classList.add('sidebar-compact');

        checkFirstVisit();
        
        // --- MOBILE DRAG DROP POLYFILL ---
        if (typeof MobileDragDrop !== 'undefined') {
            MobileDragDrop.polyfill({ dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride });
            // Fix for scrolling while dragging on mobile
            window.addEventListener('touchmove', function() {}, {passive: false});
        }

        // --- 5. LOGIC & FUNCTIONS ---

        function showToast(message, type = 'error') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'toast-box';
            
            // Apply Success styling if needed
            if (type === 'success') {
                toast.classList.add('success');
            }

            const iconName = type === 'success' ? 'check_circle' : 'error';
            const iconColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';

            toast.innerHTML = `<span class="material-symbols-rounded" style="color:${iconColor}">${iconName}</span> ${message} <div class="toast-bar"></div>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('exiting');
                setTimeout(() => toast.remove(), 400); 
            }, 3000);
        }

        function initTheme() {
            const savedTheme = localStorage.getItem('bb_theme') || 'system';
            document.getElementById('themeSelect').value = savedTheme;
            applyTheme(savedTheme);
            
            // Listen for system changes if on system mode
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if(localStorage.getItem('bb_theme') === 'system' || !localStorage.getItem('bb_theme')) {
                    applyTheme('system');
                }
            });
        }

        function changeTheme(val) {
            localStorage.setItem('bb_theme', val);
            applyTheme(val);
        }

        function applyTheme(theme) {
            let effectiveTheme = theme;
            if (theme === 'system') {
                effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', effectiveTheme);
        }

        function checkFirstVisit() {
            const alwaysShow = localStorage.getItem('bb_always_welcome') === 'true';
            if (!localStorage.getItem('bb_visited') || alwaysShow) {
                setTimeout(() => openModal('welcomeModal'), 500);
                localStorage.setItem('bb_visited', 'true');
            }
        }

        // --- WELCOME MODAL LOGIC ---
        function nextWelcomeStep() {
            document.getElementById('welcome-step-1').style.display = 'none';
            document.getElementById('welcome-step-2').style.display = 'block';
            document.getElementById('welcomeBackBtn').style.display = 'flex';
            const nextBtn = document.getElementById('welcomeNextBtn');
            nextBtn.textContent = 'Get Started';
            nextBtn.onclick = () => closeModal('welcomeModal');
        }

        function prevWelcomeStep() {
            document.getElementById('welcome-step-1').style.display = 'block';
            document.getElementById('welcome-step-2').style.display = 'none';
            document.getElementById('welcomeBackBtn').style.display = 'none';
            const nextBtn = document.getElementById('welcomeNextBtn');
            nextBtn.textContent = 'Next';
            nextBtn.onclick = nextWelcomeStep;
        }

        function selectWelcomeMode(mode) {
            document.querySelectorAll('.mode-card').forEach(el => el.classList.remove('selected'));
            document.getElementById(`card-${mode}`).classList.add('selected');
            
            const isCompact = mode === 'compact';
            document.getElementById('sidebarCompactToggle').checked = isCompact;
            toggleSidebarCompact();
        }

        function loadExample() {
            const exampleBlocks = [
                { id: 'echo_off', values: [] },
                { id: 'title', values: ['My First Script'] },
                { id: 'echo', values: ['Hello! Welcome to Batch Builder.'] },
                { id: 'echo', values: ['This is how a script looks.'] },
                { id: 'pause', values: [] }
            ];
            loadState(exampleBlocks);
            saveState();
        }

        // --- CONTEXT SWITCHING ---
        function switchContext(ctx) {
            currentContext = ctx;
            document.querySelectorAll('.context-icon').forEach(el => el.classList.remove('active'));
            document.getElementById(`ctx-${ctx.toLowerCase()}`).classList.add('active');
            switchTab('commands'); 
            renderSidebar();
        }

        // --- SIDEBAR RENDER ---
        function renderSidebar(filter = "") {
            const list = document.getElementById('commandList');
            const pinned = document.getElementById('pinnedList');
            const warning = document.getElementById('sidebar-warning');
            
            // Optimization: Only rebuild DOM if context changed
            if (currentContext !== lastRenderedContext) {
                list.innerHTML = ''; pinned.innerHTML = ''; warning.innerHTML = '';
                lastRenderedContext = currentContext;

                if (currentContext === 'Python') warning.innerHTML = '<div class="context-warning">⚠️ Ensure Python is installed and added to PATH</div>';
                else if (currentContext === 'Git') warning.innerHTML = '<div class="context-warning">⚠️ Ensure Git is installed</div>';
                else if (currentContext === 'Java') warning.innerHTML = '<div class="context-warning">⚠️ Ensure JDK is installed and added to PATH</div>';
                else if (currentContext === 'Archive') warning.innerHTML = '<div class="context-warning">⚠️ Ensure 7-Zip is installed and in your PATH</div>';

                let contextCmds = commandLibrary.filter(c => {
                    if (currentContext === 'All') return true;
                    if(currentContext === 'Batch') return !['Python', 'Git', 'Archive', 'Java'].includes(c.cat);
                    return c.cat === currentContext;
                });

                const customCmd = contextCmds.find(c => c.id === 'custom_cmd');
                if (customCmd) pinned.appendChild(createSidebarItem(customCmd, true));

                const categories = [...new Set(contextCmds.map(c => c.cat))].filter(c => c !== 'External');
                categories.forEach(cat => {
                    const header = document.createElement('div');
                    header.className = 'category-header';
                    header.textContent = cat;
                    list.appendChild(header);
                    contextCmds.filter(c => c.cat === cat).forEach(cmd => list.appendChild(createSidebarItem(cmd)));
                });
            }

            // Apply Filter (Visibility Toggle)
            const filterText = filter.toLowerCase();
            const items = list.querySelectorAll('.command-item');
            const headers = list.querySelectorAll('.category-header');
            const catVisible = new Set();

            items.forEach(item => {
                const name = item.querySelector('.cmd-name').textContent.toLowerCase();
                const desc = item.querySelector('.cmd-desc').textContent.toLowerCase();
                const match = !filterText || name.includes(filterText) || desc.includes(filterText);
                item.style.display = match ? 'flex' : 'none';
                
                if (match) {
                    item.classList.forEach(cls => {
                        if(cls.startsWith('cat-')) catVisible.add(cls.replace('cat-', ''));
                    });
                }
            });

            headers.forEach(h => {
                h.style.display = (!filterText || catVisible.has(h.textContent)) ? 'block' : 'none';
            });
        }

        function createSidebarItem(cmd, isPinned = false) {
            const el = document.createElement('div');
            el.className = `command-item cat-${cmd.cat} ${isPinned ? 'pinned' : ''}`;
            el.draggable = true;
            el.setAttribute('tabindex', '0');
            el.setAttribute('aria-label', `Add ${cmd.name} command`);
            el.innerHTML = `
                <div class="cmd-icon"><span class="material-symbols-rounded">${cmd.icon}</span></div>
                <div class="cmd-info"><div class="cmd-name">${cmd.name}</div><div class="cmd-desc">${cmd.desc}</div></div>
            `;
            el.addEventListener('dragstart', (e) => {
                draggedItem = { type: 'new', data: cmd }; 
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', JSON.stringify(cmd));
                const ghost = document.getElementById('dragGhost');
                document.getElementById('ghostText').textContent = cmd.name;
                document.getElementById('ghostIcon').textContent = cmd.icon;
                e.dataTransfer.setDragImage(ghost, 20, 20);
            });
            el.onclick = () => {
                const block = createBlock(cmd);
                dropZone.appendChild(block);
                block.scrollIntoView({ behavior: 'smooth', block: 'end' });
                checkEmpty(); updateIndentation(); saveState();
            };
            return el;
        }

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(dropZone, e.clientY);
            
            if (afterElement == null) {
                if (placeholder.parentElement !== dropZone || placeholder.nextElementSibling !== null) {
                    dropZone.appendChild(placeholder);
                    updateIndentation();
                }
            } else {
                if (placeholder.nextElementSibling !== afterElement) {
                    dropZone.insertBefore(placeholder, afterElement);
                    updateIndentation();
                }
            }
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem.nodeType === 1 && draggedItem.classList.contains('script-block')) {
                if (placeholder.parentElement) {
                    placeholder.replaceWith(draggedItem);
                    draggedItem.classList.remove('dragging');
                    draggedItem.style.display = 'flex';
                }
            } else if (draggedItem && draggedItem.type === 'new') {
                if(placeholder.parentElement) {
                    const newBlock = createBlock(draggedItem.data);
                    placeholder.replaceWith(newBlock);
                    
                    // UI Improvement: Auto-close containers
                    if(draggedItem.data.isContainerStart) {
                        const endCmd = commandLibrary.find(c => c.id === 'block_end');
                        if(endCmd) {
                            const endBlock = createBlock(endCmd);
                            newBlock.after(endBlock);

                            // Specific case for IF: Add ELSE in between
                            if(draggedItem.data.id === 'if_start') {
                                const elseCmd = commandLibrary.find(c => c.id === 'else_start');
                                if(elseCmd) {
                                    const elseBlock = createBlock(elseCmd);
                                    newBlock.after(elseBlock);
                                }
                            }
                        }
                    }
                }
            } else if (draggedItem && draggedItem.type === 'preset') {
                if(placeholder.parentElement) {
                    const fragment = document.createDocumentFragment();
                    draggedItem.data.blocks.forEach(blkData => {
                        const cmd = commandLibrary.find(c => c.id === blkData.id);
                        if(cmd) fragment.appendChild(createBlock(cmd, blkData.values));
                    });
                    placeholder.parentElement.insertBefore(fragment, placeholder);
                    placeholder.remove();
                }
            }
            if(placeholder.parentElement) placeholder.remove();
            checkEmpty(); updateIndentation(); saveState(); draggedItem = null;
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.script-block:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function createBlock(cmdData, values = []) {
            const block = document.createElement('div');
            block.className = 'script-block new-item';
            block.setAttribute('data-cmd-id', cmdData.id);
            block.setAttribute('draggable', 'true');
            block.setAttribute('tabindex', '0');
            block.dataset.name = cmdData.name;
            block.dataset.desc = cmdData.desc;
            block.dataset.usecase = cmdData.useCase || 'No example available';

            if(cmdData.cat === 'Flow') block.style.borderLeftColor = 'var(--danger-color)';
            if(cmdData.cat === 'Python') block.style.borderLeftColor = '#FFD700';
            if(cmdData.cat === 'Java') block.style.borderLeftColor = '#e76f00';
            if(cmdData.cat === 'Git') block.style.borderLeftColor = '#F05032';

            let badgeHtml = '';
            if (cmdData.cat === 'Git') badgeHtml = '<div class="block-badge git"><span class="material-symbols-rounded" style="font-size:12px">call_merge</span> Git</div>';
            if (cmdData.cat === 'Python') badgeHtml = '<div class="block-badge python"><span class="material-symbols-rounded" style="font-size:12px">code</span> Python</div>';
            if (cmdData.cat === 'Java') badgeHtml = '<div class="block-badge java"><span class="material-symbols-rounded" style="font-size:12px">coffee</span> Java</div>';
            if (cmdData.cat === 'Archive') badgeHtml = '<div class="block-badge archive"><span class="material-symbols-rounded" style="font-size:12px">archive</span> 7-Zip</div>';

            let inputsHtml = '';
            cmdData.fields.forEach((field, index) => {
                const val = values[index] || '';
                let inputElement = field.type === 'select' 
                    ? `<select class="form-select cmd-input" data-req="${field.req||false}" onchange="saveState(); validateInput(this)">${field.options.map(o => `<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}</select>`
                    : `<input type="${field.type}" class="form-control cmd-input" data-req="${field.req||false}" value="${val}" placeholder="${field.placeholder||''}" onchange="saveState(); validateInput(this)" oninput="validateInput(this)" onmousedown="event.stopPropagation()">`;
                
                inputsHtml += `<div><label class="form-label">${field.label}</label>${inputElement}<div class="validation-msg"></div></div>`;
            });

            let extrasHtml = '';
            if(cmdData.id === 'py_run') extrasHtml = `<div style="margin-top:8px; display:flex; justify-content:flex-end;"><button class="edit-script-btn" onclick="openScriptEditor(this)">Edit Source</button></div>`;

            block.innerHTML = `
                <div class="block-header">
                    <div class="block-title">
                        <span class="material-symbols-rounded" style="font-size:18px; color: var(--text-secondary)">${cmdData.icon}</span>
                        ${cmdData.name}
                        ${badgeHtml}
                    </div>
                    <span class="material-symbols-rounded remove-btn" onclick="removeBlock(this)">close</span>
                </div>
                ${inputsHtml ? `<div class="block-body">${inputsHtml}${extrasHtml}</div>` : ''}
            `;
            
            block.addEventListener('dragstart', (e) => { draggedItem = block; block.classList.add('dragging'); setTimeout(() => block.style.display = 'none', 0); });
            block.addEventListener('dragend', () => { block.classList.remove('dragging'); block.style.display = 'flex'; if(placeholder.parentElement) placeholder.remove(); draggedItem = null; updateIndentation(); saveState(); });
            
            block.addEventListener('dblclick', (e) => {
                if(document.querySelector('.canvas-area').classList.contains('overview-mode')) {
                    toggleOverview();
                    setTimeout(() => {
                        block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        block.classList.add('highlight-pulse');
                        setTimeout(() => block.classList.remove('highlight-pulse'), 1500);
                    }, 50);
                }
            });
            
            block.addEventListener('animationend', () => {
                block.classList.remove('new-item');
            }, { once: true });

            if(cmdData.id === 'py_run' && values.length > cmdData.fields.length) block.dataset.scriptContent = values[cmdData.fields.length];

            return block;
        }

        function removeBlock(btn) {
            const block = btn.closest('.script-block');
            block.classList.add('exiting');
            block.addEventListener('animationend', () => {
                block.remove();
                checkEmpty();
                saveState();
            });
        }

        // --- VALIDATION ---
        let linterDebounceTimer;
        function validateInput(input) {
            const isValid = input.dataset.req !== 'true' || input.value.trim() !== '';
            const parent = input.parentElement;
            const msgEl = parent.querySelector('.validation-msg');

            if (!isValid) {
                input.classList.add('invalid');
                input.classList.remove('warning'); // Error overrides warning
                if(msgEl) {
                    msgEl.innerHTML = `<span class="material-symbols-rounded" style="font-size:12px">error</span> Required`;
                    msgEl.style.display = 'flex';
                    msgEl.style.color = 'var(--danger-color)';
                }
            } else {
                input.classList.remove('invalid');
                if(msgEl) msgEl.style.display = 'none';
                // Run Linter checks if basic validation passes
                if(typeof Linter !== 'undefined') {
                    clearTimeout(linterDebounceTimer);
                    linterDebounceTimer = setTimeout(() => Linter.checkInput(input), 300);
                }
            }
        }

        function checkAndProceed(callback) {
            // 0. Check for empty canvas
            const blocks = dropZone.querySelectorAll('.script-block');
            if (blocks.length === 0) {
                showToast("Canvas is empty! Nothing to process.");
                return;
            }

            // 1. Force full Linter scan
            if(typeof Linter !== 'undefined') {
                Linter.scan();
                Linter.checkAll();
            }
            
            let hasIssues = false;
            
            // 2. Check Inputs (Errors & Warnings)
            document.querySelectorAll('.cmd-input').forEach(input => {
                validateInput(input);
                if (input.classList.contains('invalid') || input.classList.contains('warning')) hasIssues = true;
            });

            // 3. Check Structure (Nesting)
            if (!validateStructure()) hasIssues = true;

            if (hasIssues) {
                pendingAction = callback;
                openModal('errorModal');
            } else {
                callback();
            }
        }

        function proceedWithAction() {
            closeModal('errorModal');
            if (pendingAction) pendingAction();
            pendingAction = null;
        }

        function validateStructure() {
            const blocks = dropZone.querySelectorAll('.script-block');
            let stack = [];
            let isValid = true;

            blocks.forEach(block => {
                block.classList.remove('error'); // Reset previous errors
                const id = block.getAttribute('data-cmd-id');
                
                if (id === 'if_start' || id === 'for_loop') {
                    stack.push(id);
                } else if (id === 'else_start') {
                    // ELSE must be inside an IF block (top of stack must be if_start)
                    if (stack.length === 0 || stack[stack.length - 1] !== 'if_start') {
                        block.classList.add('error');
                        isValid = false;
                    }
                } else if (id === 'block_end') {
                    if (stack.length === 0) {
                        block.classList.add('error'); // Orphan end
                        isValid = false;
                    } else {
                        stack.pop();
                    }
                }
            });

            if(stack.length > 0) isValid = false; // Unclosed blocks exist
            return isValid;
        }

        // --- SCRIPT EDITOR ---
        function openScriptEditor(btn) {
            editingScriptBlock = btn.closest('.script-block');
            const content = editingScriptBlock.dataset.scriptContent || '';
            document.getElementById('scriptContentArea').value = content;
            openModal('scriptEditorModal');
        }

        function saveScriptContent() {
            if(editingScriptBlock) {
                const content = document.getElementById('scriptContentArea').value;
                editingScriptBlock.dataset.scriptContent = content;
                saveState();
            }
            closeModal('scriptEditorModal');
        }

        // --- PRESETS & SAVING ---
        function loadCustomPresets() {
            const list = document.getElementById('customPresetList');
            list.innerHTML = '';
            const saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
            
            if(saved.length === 0) {
                list.innerHTML = '<div style="color:var(--text-secondary); font-size:0.8rem; text-align:center; padding:10px;">Add your presets by making one</div>';
                return;
            }

            saved.forEach((preset, index) => {
                const el = document.createElement('div');
                el.className = `command-item cat-Preset`;
                el.draggable = true; 
                el.innerHTML = `
                    <div class="cmd-icon"><span class="material-symbols-rounded">${preset.icon}</span></div>
                    <div class="cmd-info"><div class="cmd-name">${preset.name}</div><div class="cmd-desc">${preset.desc}</div></div>
                    <div class="preset-controls">
                        <div class="preset-btn" onclick="movePreset(event, ${index}, -1)" title="Move Up"><span class="material-symbols-rounded" style="font-size:16px">arrow_upward</span></div>
                        <div class="preset-btn" onclick="movePreset(event, ${index}, 1)" title="Move Down"><span class="material-symbols-rounded" style="font-size:16px">arrow_downward</span></div>
                        <div class="preset-btn" onclick="renamePresetPrompt(event, ${preset.id})" title="Rename"><span class="material-symbols-rounded" style="font-size:16px">edit</span></div>
                        <div class="preset-btn" onclick="deletePreset(event, ${preset.id})" title="Delete" style="color:var(--danger-color)"><span class="material-symbols-rounded" style="font-size:16px">delete</span></div>
                    </div>
                    <span class="material-symbols-rounded" style="color:var(--text-secondary); margin-left:4px;">add_circle</span>
                `;
                el.onclick = (e) => { if(e.target.closest('.preset-controls')) return; loadPreset(preset); };
                el.addEventListener('dragstart', (e) => {
                    draggedItem = { type: 'preset', data: preset }; 
                    e.dataTransfer.effectAllowed = 'copy';
                    const ghost = document.getElementById('dragGhost');
                    document.getElementById('ghostText').textContent = preset.name;
                    document.getElementById('ghostIcon').textContent = "bookmark";
                    e.dataTransfer.setDragImage(ghost, 20, 20);
                });
                list.appendChild(el);
            });
        }

        function movePreset(e, index, direction) {
            e.stopPropagation();
            const saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
            if (index + direction < 0 || index + direction >= saved.length) return;
            const temp = saved[index]; saved[index] = saved[index + direction]; saved[index + direction] = temp;
            localStorage.setItem('bb_custom_presets', JSON.stringify(saved));
            loadCustomPresets();
        }

        function renamePresetPrompt(e, id) {
            e.stopPropagation();
            editingPresetId = id;
            const saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
            const preset = saved.find(p => p.id === id);
            if(preset) { 
                const input = document.getElementById('renameInput');
                input.value = preset.name;
                input.classList.remove('invalid');
                renamingIcon = preset.icon || 'terminal';
                renderIconGrid('renameIconGrid', renamingIcon, (icon) => { renamingIcon = icon; });
                openModal('renameModal'); 
            }
        }

        function confirmRename() {
            const input = document.getElementById('renameInput');
            const newName = input.value.trim();
            
            if(!newName) {
                input.classList.add('invalid');
                return;
            }
            if(editingPresetId) {
                const saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
                const idx = saved.findIndex(p => p.id === editingPresetId);
                if(idx !== -1) { 
                    saved[idx].name = newName; 
                    saved[idx].icon = renamingIcon;
                    localStorage.setItem('bb_custom_presets', JSON.stringify(saved)); 
                    loadCustomPresets(); 
                }
            }
            closeModal('renameModal');
        }

        function renderPresets() {
            const list = document.getElementById('presetList'); list.innerHTML = '';
            presetLibrary.forEach(p => {
                const el = createPresetElement(p);
                list.appendChild(el);
            });
        }

        function createPresetElement(preset) {
            const el = document.createElement('div'); 
            el.className = 'command-item cat-Preset';
            el.draggable = true; 
            el.innerHTML = `<div class="cmd-icon"><span class="material-symbols-rounded">${preset.icon}</span></div><div class="cmd-info"><div class="cmd-name">${preset.name}</div><div class="cmd-desc">${preset.desc}</div></div><span class="material-symbols-rounded" style="color:var(--text-secondary)">add_circle</span>`;
            el.onclick = () => loadPreset(preset);
            el.addEventListener('dragstart', (e) => {
                draggedItem = { type: 'preset', data: preset }; e.dataTransfer.effectAllowed = 'copy';
                const ghost = document.getElementById('dragGhost');
                document.getElementById('ghostText').textContent = preset.name;
                document.getElementById('ghostIcon').textContent = "bookmark";
                e.dataTransfer.setDragImage(ghost, 20, 20);
            });
            return el;
        }

        // --- SAVE PRESET MODAL LOGIC ---
        function openSavePresetModal() {
            const blocks = serializeCanvas();
            if(blocks.length === 0) { showToast("Canvas is empty! Cannot save preset."); return; }
            
            const input = document.getElementById('presetNameInput');
            input.value = '';
            input.classList.remove('invalid');
            renderIconGrid('presetIconGrid', selectedPresetIcon, (icon) => { selectedPresetIcon = icon; });
            openModal('savePresetModal');
        }

        function renderIconGrid(containerId, currentIcon, onSelect) {
            const grid = document.getElementById(containerId);
            grid.innerHTML = '';
            commonIcons.forEach(icon => {
                const div = document.createElement('div');
                div.className = `icon-option ${icon === currentIcon ? 'selected' : ''}`;
                div.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
                div.onclick = () => {
                    onSelect(icon);
                    grid.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                };
                grid.appendChild(div);
            });
        }

        function confirmSavePreset() {
            const input = document.getElementById('presetNameInput');
            const name = input.value.trim();
            
            if(!name) { 
                input.classList.add('invalid');
                return; 
            }

            const blocks = serializeCanvas();
            const newPreset = { id: Date.now(), name: name, desc: 'User defined preset', icon: selectedPresetIcon, blocks: blocks };
            const savedPresets = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
            savedPresets.push(newPreset);
            localStorage.setItem('bb_custom_presets', JSON.stringify(savedPresets));
            
            loadCustomPresets();
            showToast("Preset saved successfully!", "success");
            closeModal('savePresetModal');
            switchTab('presets');
        }

        function deletePreset(e, id) {
            e.stopPropagation();
            presetToDeleteId = id;
            const popover = document.getElementById('deletePresetPopover');
            
            // Position popover under the button
            const rect = e.currentTarget.getBoundingClientRect();
            popover.style.position = 'fixed';
            popover.style.top = (rect.bottom + 5) + 'px';
            popover.style.left = (rect.left + (rect.width / 2) - 120) + 'px'; // Center (240px width)
            popover.style.transform = 'none'; // Override CSS transform
            
            popover.classList.add('manual-pos');
            popover.classList.add('active');
        }

        function confirmDeletePreset() {
            if (presetToDeleteId) {
                let saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
                saved = saved.filter(p => p.id !== presetToDeleteId);
                localStorage.setItem('bb_custom_presets', JSON.stringify(saved));
                loadCustomPresets();
                showToast("Preset deleted", "success");
            }
            closeDeletePresetPopover();
        }

        function closeDeletePresetPopover() {
            const popover = document.getElementById('deletePresetPopover');
            popover.classList.remove('active');
            popover.classList.remove('manual-pos');
            presetToDeleteId = null;
        }

        function loadPreset(preset) {
            saveState();
            preset.blocks.forEach(blkData => {
                const cmd = commandLibrary.find(c => c.id === blkData.id);
                if(cmd) {
                    const block = createBlock(cmd, blkData.values);
                    if(blkData.scriptContent) block.dataset.scriptContent = blkData.scriptContent;
                    dropZone.appendChild(block);
                }
            });
            checkEmpty(); updateIndentation(); saveState();
        }

        function checkEmpty() { const blocks = dropZone.querySelectorAll('.script-block'); document.getElementById('emptyState').style.display = blocks.length === 0 ? 'block' : 'none'; }
        function updateIndentation() {
            let depth = 0;
            [...dropZone.children].forEach(el => {
                if(el.classList.contains('drop-placeholder')) { el.style.marginLeft = (depth*28)+'px'; return; }
                const cmd = commandLibrary.find(c => c.id === el.getAttribute('data-cmd-id'));
                if(!cmd) return;
                if(cmd.isContainerEnd || cmd.isContainerMid) depth = Math.max(0, depth-1);
                el.setAttribute('data-indent', depth);
                if(cmd.isContainerStart || cmd.isContainerMid) depth++;
            });
        }

        function serializeCanvas() {
            return Array.from(dropZone.querySelectorAll('.script-block')).map(b => {
                const data = { id: b.getAttribute('data-cmd-id'), values: Array.from(b.querySelectorAll('.cmd-input')).map(i => i.value) };
                if(b.dataset.scriptContent) data.scriptContent = b.dataset.scriptContent;
                return data;
            });
        }

        function loadState(stateData) {
            isInternalUpdate = true; dropZone.innerHTML = ''; dropZone.appendChild(emptyState); 
            stateData.forEach(item => {
                const cmd = commandLibrary.find(c => c.id === item.id);
                if(cmd) {
                    const block = createBlock(cmd, item.values);
                    if(item.scriptContent) block.dataset.scriptContent = item.scriptContent;
                    dropZone.appendChild(block);
                }
            });
            checkEmpty(); updateIndentation(); isInternalUpdate = false;
        }

        function updateCodeViewIfActive() {
            if (document.getElementById('codeViewContainer').classList.contains('active')) {
                renderCodeEditor();
            }
        }

        function saveState() {
            if (isInternalUpdate) return;
            const s = serializeCanvas();
            if(typeof Linter !== 'undefined') {
                requestAnimationFrame(() => {
                    Linter.scan(); // Update definitions
                    Linter.checkAll(); // Refresh warnings on all blocks
                });
            }
            if (historyStack.length && JSON.stringify(historyStack[historyStack.length-1]) === JSON.stringify(s)) return;
            historyStack.push(s); if (historyStack.length > MAX_HISTORY) historyStack.shift(); redoStack = []; updateButtons();
            updateCodeViewIfActive();
        }

        function undo() { if(historyStack.length <= 1) return; redoStack.push(historyStack.pop()); loadState(historyStack[historyStack.length - 1]); updateButtons(); updateCodeViewIfActive(); }
        function redo() { if(!redoStack.length) return; const next = redoStack.pop(); historyStack.push(next); loadState(next); updateButtons(); updateCodeViewIfActive(); }
        function updateButtons() { document.getElementById('btnUndo').disabled = historyStack.length <= 1; document.getElementById('btnRedo').disabled = redoStack.length === 0; }

        function toggleClearPopover(e) { 
            const popover = document.getElementById('clearPopover');
            if (popover.classList.contains('active')) {
                popover.classList.remove('active');
                popover.classList.remove('manual-pos');
            } else {
                if (e && e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    popover.style.position = 'fixed';
                    popover.style.top = (rect.bottom + 5) + 'px';
                    popover.style.left = (rect.left + (rect.width / 2) - 120) + 'px';
                    popover.style.transform = 'none';
                    popover.classList.add('manual-pos');
                }
                popover.classList.add('active');
            }
        }
        function confirmClear() { saveState(); dropZone.innerHTML = ''; dropZone.appendChild(emptyState); checkEmpty(); saveState(); toggleClearPopover(); showToast("Canvas cleared successfully", "success"); }

        function toggleOverview() {
            const canvas = document.querySelector('.canvas-area'); canvas.classList.toggle('overview-mode');
            const btn = document.getElementById('btnOverview');
            if(canvas.classList.contains('overview-mode')) { btn.style.color = 'var(--text-primary)'; btn.style.background = 'rgba(255,255,255,0.1)'; }
            else { btn.style.color = 'var(--text-secondary)'; btn.style.background = 'none'; }
        }

        function toggleSidebarCompact() { 
            const isCompact = document.getElementById('sidebarCompactToggle').checked;
            document.getElementById('mainSidebar').classList.toggle('sidebar-compact', isCompact);
            localStorage.setItem('bb_compact_sidebar', isCompact);
        }
        
        function toggleMobileMenu() {
            document.getElementById('mobileMenu').classList.toggle('active');
        }

        function toggleWelcomeEveryTime() { localStorage.setItem('bb_always_welcome', document.getElementById('welcomeToggle').checked); }
        function toggleView(mode) {
            document.querySelectorAll('.view-option').forEach(el => el.classList.remove('active'));
            document.getElementById(`view-${mode}`).classList.add('active');
            document.getElementById('btnOverview').style.display = mode === 'block' ? 'flex' : 'none';
            
            if(mode === 'block') { 
                blockViewContainer.style.display = 'block'; 
                codeViewContainer.classList.remove('active'); 
            } else { 
                blockViewContainer.style.display = 'none'; 
                codeViewContainer.classList.add('active'); 
                renderCodeEditor();
            }
        }

        function jumpToBlock(index) {
            toggleView('block');
            const blocks = dropZone.querySelectorAll('.script-block');
            if (index > 0 && index <= blocks.length) {
                const block = blocks[index - 1];
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                block.classList.add('highlight-pulse');
                setTimeout(() => block.classList.remove('highlight-pulse'), 1500);
            }
        }

        function renderCodeEditor() {
            const lines = generateBatchCode(true);
            const container = document.getElementById('codePreviewBlock');
            
            let lineNumsHtml = '';
            let codeHtml = '';

            lines.forEach((line, idx) => {
                lineNumsHtml += `<div>${idx + 1}</div>`;
                const pill = line.blockIndex ? `<span class="block-pill">Block ${line.blockIndex}</span>` : '';
                // Escape HTML to prevent injection in code view
                const safeText = line.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const clickAttr = line.blockIndex ? `onclick="jumpToBlock(${line.blockIndex})"` : '';
                const cursorStyle = line.blockIndex ? 'style="cursor: pointer;"' : '';
                codeHtml += `<div class="code-line" ${clickAttr} ${cursorStyle}>${safeText || '&nbsp;'}${pill}</div>`;
            });

            container.innerHTML = `
                <div class="editor-container">
                    <div class="line-numbers">${lineNumsHtml}</div>
                    <div class="code-content">${codeHtml}</div>
                </div>
            `;
        }

        function openModal(id) { document.getElementById(id).classList.add('active'); }
        function closeModal(id) { document.getElementById(id).classList.remove('active'); }
        function switchTab(t) {
            document.querySelectorAll('.segment-tab').forEach(e => e.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(e => e.classList.remove('active'));
            document.getElementById(`tabBtn-${t}`).classList.add('active');
            document.getElementById(`tab-${t}`).classList.add('active');
        }
        
        let searchDebounceTimer;
        function filterCommands() { 
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                renderSidebar(document.getElementById('searchInput').value);
            }, 300);
        }

        function escapeBatchStr(str) {
            // Escape special characters for use inside an ECHO command
            return str.replace(/%/g, '%%')
                      .replace(/\^/g, '^^')
                      .replace(/&/g, '^&')
                      .replace(/</g, '^<')
                      .replace(/>/g, '^>')
                      .replace(/\|/g, '^|');
        }

        function generateBatchCode(returnLines = false) {
            const blocks = dropZone.querySelectorAll('.script-block');
            let outputLines = [];
            const addLine = (text, blockIdx = null) => outputLines.push({ text, blockIndex: blockIdx });

            addLine("@ECHO OFF");
            addLine("REM Generated by Batch Builder");
            addLine("");

            let indentLevel = 0;
            blocks.forEach((block, index) => {
                const id = block.getAttribute('data-cmd-id');
                const values = Array.from(block.querySelectorAll('.cmd-input')).map(i => i.value);
                const cmd = commandLibrary.find(c => c.id === id);
                if(cmd && (cmd.isContainerEnd || cmd.isContainerMid)) indentLevel = Math.max(0, indentLevel - 1);
                let line = "";
                const getVal = (v) => { const match = v.match(/\((.*?)\)/); return match ? match[1] : v; };
                const indent = "    ".repeat(indentLevel);
                
                if(id === 'py_run' && block.dataset.scriptContent) {
                    const scriptName = values[0];
                    const lines = block.dataset.scriptContent.split('\n');
                    addLine(`${indent}REM --- Generating ${scriptName} ---`, index + 1);
                    addLine(`${indent}(`, index + 1);
                    lines.forEach(l => addLine(`${indent}echo ${escapeBatchStr(l)}`, index + 1));
                    addLine(`${indent}) > ${scriptName}`, index + 1);
                    addLine("", index + 1);
                }

                if(id === 'if_start') { 
                    const [t, tgt, val] = values; 
                    if(t.includes('EQU')) line = `IF "${tgt}"=="${val}" (`; 
                    else if(t.includes('NEQ')) line = `IF "${tgt}" NEQ "${val}" (`;
                    else if(t.includes('DEFINED')) line = `IF ${t} ${tgt} (`;
                    else line = `IF ${t} "${tgt}" (`; 
                }
                else if(id === 'else_start') line = `) ELSE (`;
                else if(id === 'block_end') line = `)`;
                else if(id === 'shutdown') line = `SHUTDOWN ${getVal(values[0])} /t ${values[1]}`;
                else if(id === 'for_loop') line = `FOR ${values[0]} IN ${values[1]} DO (`;
                else if(id === 'set') line = `SET "${values[0]}=${values[1]}"`;
                else if(id === 'set_p') line = `SET /P "${values[0]}=${values[1]}"`;
                else if(id === 'choice') line = `CHOICE /C ${values[1] || 'YN'} /M "${values[0]}"`;
                else if(id === 'timeout') line = `TIMEOUT /T ${values[0]} /NOBREAK`;
                else if(id === 'mklink') { const type = getVal(values[0]); line = `MKLINK ${type === 'File' ? '' : type} "${values[1]}" "${values[2]}"`; }
                else if(id === 'custom_cmd') line = `REM [Custom] ${values[0]}\r\n${"    ".repeat(indentLevel)}${values[0]}`;
                else if(id === 'color') line = `COLOR ${values[0].substring(0,2)}`;
                else if(id === 'del') line = values[1].includes('Yes') ? `DEL /F /Q "${values[0]}"` : `DEL "${values[0]}"`;
                else if(id === 'rd') line = values[1].includes('Yes') ? `RMDIR /S /Q "${values[0]}"` : `RMDIR "${values[0]}"`;
                else if(id === 'md') line = `MKDIR "${values[0]}"`;
                else if(id === 'copy') line = `COPY "${values[0]}" "${values[1]}"`;
                else if(id === 'move') line = `MOVE "${values[0]}" "${values[1]}"`;
                else if(id === 'ren') line = `REN "${values[0]}" "${values[1]}"`;
                else if(id === 'type') line = `TYPE "${values[0]}"`;
                else if(id === 'attrib') line = `ATTRIB ${values[0]} "${values[1]}"`;
                else if(id === 'xcopy') line = `XCOPY "${values[0]}" "${values[1]}" ${values[2]}`;
                else if(id === 'robocopy') line = `ROBOCOPY "${values[0]}" "${values[1]}" ${values[2]}`;
                else if(id === 'ipconfig') line = `IPCONFIG ${getVal(values[0])}`;
                else if(id === 'echo_to_file') line = `ECHO ${values[0]} ${values[2].includes('>>') ? '>>' : '>'} "${values[1]}"`;
                
                // System & Admin
                else if(id === 'schtasks_create') line = `SCHTASKS /Create /SC ${values[0]} /TN "${values[1]}" /TR "${values[2]}"`;
                else if(id === 'sc_create') line = `SC CREATE "${values[0]}" binPath= "${values[1]}" ${values[2]}`;
                else if(id === 'icacls_grant') line = `ICACLS "${values[0]}" /grant ${values[1]}:${getVal(values[2])}`;
                else if(id === 'icacls_deny') line = `ICACLS "${values[0]}" /deny ${values[1]}:${getVal(values[2])}`;
                else if(id === 'icacls_remove') line = `ICACLS "${values[0]}" /remove ${values[1]}`;
                
                // Git Suite
                else if(id.startsWith('git_')) {
                    const action = id.replace('git_', '');
                    if(action === 'commit') line = `git commit -m "${values[0]}"`;
                    else if(action === 'add') line = `git add ${values[0]}`;
                    else if(action === 'clone') line = `git clone ${values[0]}`;
                    else if(action === 'checkout') line = `git checkout ${values[0]}`;
                    else line = `git ${action}`;
                }
                // Python/Pip Suite
                else if(id === 'py_venv') line = `python -m venv ${values[0]}`;
                else if(id === 'pip_install') line = `pip install ${values[0]}`;
                else if(id === 'pip_freeze') line = `pip freeze > ${values[0]}`;
                else if(id === 'pip_upgrade') line = `python -m pip install --upgrade pip`;
                // Java Suite
                else if(id === 'java_run') line = `java ${values[0]} ${values[1]}`;
                else if(id === 'javac') line = `javac ${values[1]} ${values[0]}`;
                else if(id === 'jar_create') line = `jar ${values[2] || 'cf'} "${values[0]}" ${values[1]}`;
                else if(id === 'jar_extract') line = `jar ${values[1] || 'xf'} "${values[0]}"`;
                else if(id === 'javadoc') line = `javadoc ${values[1]} ${values[0]}`;
                else if(id === 'java_version') line = `java -version`;
                else if(id === 'jps') line = `jps ${values[0]}`;
                else if(id === 'jshell') line = `jshell`;
                else if(id === 'keytool_gen') line = `keytool -genkeypair -alias "${values[1]}" -keyalg RSA -keysize 2048 -keystore "${values[0]}" -validity 365`;
                else if(id === 'keytool_list') line = `keytool -list -v -keystore "${values[0]}"`;
                // Archive
                else if(id === '7zip_create') line = `7z a "${values[0]}" ${values[1]} ${values[2]}`;
                else if(id === '7zip_extract') line = `7z x "${values[0]}" ${values[1]}`;
                // Network
                else if(id.startsWith('net_') && id !== 'netstat') line = `NET ${id.replace('net_', '').toUpperCase()} ${values.join(' ')}`;
                
                else line = `${cmd.name.split(' ')[0]} ${values.join(' ')}`;

                if (line) {
                    const parts = line.split(/\r?\n/);
                    parts.forEach((part, pIdx) => {
                        // First part gets loop indentation, subsequent parts (like in custom_cmd) usually handle their own or are raw
                        addLine((pIdx === 0 ? indent : "") + part, index + 1);
                    });
                }

                if(cmd && (cmd.isContainerStart || cmd.isContainerMid)) indentLevel++;
            });
            
            if (returnLines) return outputLines;
            return outputLines.map(l => l.text).join('\r\n');
        }

        function exportBatch() { 
            checkAndProceed(() => {
                const blob = new Blob([generateBatchCode()], {type:'text/plain'});
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'script.bat'; a.click();
            });
        }

        function copyToClipboard() {
            checkAndProceed(() => {
                const code = generateBatchCode();
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(code)
                        .then(() => showToast("Script copied to clipboard!", "success"))
                        .catch(() => fallbackCopy(code));
                } else {
                    fallbackCopy(code);
                }
            });
        }

        function fallbackCopy(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try { document.execCommand('copy'); showToast("Script copied to clipboard!", "success"); } 
            catch (err) { showToast("Failed to copy script."); }
            document.body.removeChild(textArea);
        }

        function saveDraft() {
            checkAndProceed(() => {
                const blob = new Blob([JSON.stringify({ version: 5, timestamp: new Date().toISOString(), blocks: serializeCanvas() }, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `project_${Date.now()}.dbat`; a.click();
            });
        }

        function loadFile(input) {
            if (!input.files[0]) return;
            const r = new FileReader();
            r.onload = (e) => { 
                const content = e.target.result;
                try { 
                    const d = JSON.parse(content); 
                    if(d.blocks) { saveState(); loadState(d.blocks); saveState(); } 
                } catch(err) { 
                    saveState(); parseBatchContent(content); saveState(); 
                } 
            };
            r.readAsText(input.files[0]); input.value = '';
        }

        function parseBatchContent(text) {
            const lines = text.split(/\r?\n/);
            const blocks = [];
            lines.forEach(line => {
                line = line.trim();
                if(!line) return;
                const parts = line.split(/\s+/);
                const cmdName = parts[0].toUpperCase();
                const args = line.substring(cmdName.length).trim();

                if(cmdName === 'ECHO') blocks.push({id:'echo', values:[args]});
                else if(cmdName === 'REM') blocks.push({id:'rem', values:[args]});
                else if(cmdName === 'TITLE') blocks.push({id:'title', values:[args]});
                else if(cmdName === 'CLS') blocks.push({id:'cls', values:[]});
                else if(cmdName === 'PAUSE') blocks.push({id:'pause', values:[]});
                else if(line.toUpperCase() === '@ECHO OFF') blocks.push({id:'echo_off', values:[]});
                else if(cmdName === 'CD') blocks.push({id:'cd', values:[args]});
                else if(cmdName === 'GOTO') blocks.push({id:'goto', values:[args]});
                else if(cmdName === 'EXIT') blocks.push({id:'exit', values:[]});
                else if(cmdName === 'SET') {
                    if (args.toUpperCase().startsWith('/P')) {
                        const pArgs = args.substring(2).trim();
                        const eqIndex = pArgs.indexOf('=');
                        if(eqIndex > -1) blocks.push({id:'set_p', values:[pArgs.substring(0, eqIndex), pArgs.substring(eqIndex+1)]});
                        else blocks.push({id:'custom_cmd', values:[line]});
                    } else {
                        const eqIndex = args.indexOf('=');
                        if(eqIndex > -1) blocks.push({id:'set', values:[args.substring(0, eqIndex), args.substring(eqIndex+1)]});
                        else blocks.push({id:'custom_cmd', values:[line]});
                    }
                }
                else blocks.push({id:'custom_cmd', values:[line]});
            });
            loadState(blocks);
        }
