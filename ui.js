// --- UI & THEME MANAGEMENT ---
let settingsUIInitialized = false;

function initTheme() {
    const savedTheme = localStorage.getItem('bb_theme') || 'system';
    applyTheme(savedTheme);

    // Apply saved preferences without rendering UI yet
    applyEditorTheme(localStorage.getItem('bb_editor_theme') || 'default');
    applyIconSettings();
    applyPreferences();
    initEduState(); // Initialize Education Toolbar
    
    // Listen for system changes if on system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if(localStorage.getItem('bb_theme') === 'system' || !localStorage.getItem('bb_theme')) {
            applyTheme('system');
        }
    });
}

function setTheme(val) {
    changeTheme(val);
    updateThemeUI(val);
}

function updateThemeUI(val) {
    // Only clear selection from theme options, not all .theme-option elements (which includes sidebar layout)
    ['themeOpt-light', 'themeOpt-dark', 'themeOpt-system'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('selected');
    });
    const active = document.getElementById(`themeOpt-${val}`);
    if(active) active.classList.add('selected');
    
    // Update main settings icon
    const iconMap = { 'system': 'brightness_auto', 'dark': 'dark_mode', 'light': 'light_mode' };
    const iconEl = document.getElementById('themeSettingIcon');
    if(iconEl) iconEl.textContent = iconMap[val] || 'dark_mode';
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

// --- EDITOR THEME LOGIC ---
function initEditorTheme() {
    // Only render if not already done
    const container = document.getElementById('editorThemeList');
    if(!container || container.children.length > 0) return;

    const themes = [
        { id: 'default', name: 'Default' },
        { id: 'monokai', name: 'Monokai' },
        { id: 'dracula', name: 'Dracula' },
        { id: 'github', name: 'GitHub' },
        { id: 'solarized', name: 'Solarized' }
    ];
    
    const current = localStorage.getItem('bb_editor_theme') || 'default';
    // setEditorTheme(current, false); // Removed: handled by applyEditorTheme

    themes.forEach(t => {
        const el = document.createElement('div');
        el.className = `editor-theme-item ${t.id === current ? 'selected' : ''}`;
        el.id = `edTheme-${t.id}`;
        el.onclick = () => setEditorTheme(t.id);
        el.innerHTML = `<div class="et-preview ${t.id}">Aa</div><div class="et-label">${t.name}</div>`;
        container.appendChild(el);
    });
}

function applyEditorTheme(id) {
    if (id === 'default') {
        document.documentElement.removeAttribute('data-editor-theme');
    } else {
        document.documentElement.setAttribute('data-editor-theme', id);
    }
}

function setEditorTheme(id, save = true) {
    if (save) {
        localStorage.setItem('bb_editor_theme', id);
        // Update UI selection if visible
        const items = document.querySelectorAll('.editor-theme-item');
        if (items.length > 0) {
            items.forEach(el => el.classList.remove('selected'));
            const active = document.getElementById(`edTheme-${id}`);
            if(active) active.classList.add('selected');
        }
    }
    applyEditorTheme(id);
}

// --- ICON SETTINGS LOGIC ---
function initIconSettings() {
    // Only render if empty
    if(document.getElementById('iconStyleControl').children.length > 0) return;

    const style = localStorage.getItem('bb_icon_style') || 'outlined';
    const size = localStorage.getItem('bb_icon_size') || 'standard';
    
    renderSegmentedControl('iconStyleControl', [
        { id: 'outlined', label: 'Outline' },
        { id: 'bold', label: 'Thick' },
        { id: 'filled', label: 'Filled' }
    ], style, setIconStyle);

    renderSegmentedControl('iconSizeControl', [
        { id: 'standard', label: 'Standard' },
        { id: 'large', label: 'Large' }
    ], size, setIconSize);

    // setIconStyle/Size called by applyIconSettings at startup
}

function applyIconSettings() {
    const style = localStorage.getItem('bb_icon_style') || 'outlined';
    const size = localStorage.getItem('bb_icon_size') || 'standard';
    document.documentElement.setAttribute('data-icon-style', style);
    document.documentElement.setAttribute('data-icon-size', size);
}

function renderSegmentedControl(containerId, options, activeId, callback) {
    const container = document.getElementById(containerId);
    if(!container) return;
    // Ensure callback name is available as string for onclick
    const fnName = callback.name; 
    container.innerHTML = options.map(o => 
        `<div class="seg-item ${o.id === activeId ? 'selected' : ''}" onclick="${fnName}('${o.id}')" id="${containerId}-${o.id}">${o.label}</div>`
    ).join('');
}

function setIconStyle(val, save = true) {
    if(save) localStorage.setItem('bb_icon_style', val);
    document.documentElement.setAttribute('data-icon-style', val);
    updateSegmentedUI('iconStyleControl', val);
}

function setIconSize(val, save = true) {
    if(save) localStorage.setItem('bb_icon_size', val);
    document.documentElement.setAttribute('data-icon-size', val);
    updateSegmentedUI('iconSizeControl', val);
}

function updateSegmentedUI(containerId, val) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.querySelectorAll('.seg-item').forEach(el => el.classList.remove('selected'));
    const active = document.getElementById(`${containerId}-${val}`);
    if(active) active.classList.add('selected');
}

// --- PREFERENCES LOGIC ---
function initPreferences() {
    if(document.getElementById('tooltipDetailControl').children.length > 0) return;

    const sidebarMode = localStorage.getItem('bb_compact_sidebar') === 'true' ? 'compact' : 'normal';
    updateSidebarVisualUI(sidebarMode);

    const tooltipDetail = localStorage.getItem('bb_tooltip_detail') || 'detailed';
    renderSegmentedControl('tooltipDetailControl', [
        { id: 'simple', label: 'Description' },
        { id: 'detailed', label: 'Detailed' }
    ], tooltipDetail, setTooltipDetail);
}

function applyPreferences() {
    const sidebarMode = localStorage.getItem('bb_compact_sidebar') === 'true' ? 'compact' : 'normal';
    setSidebarMode(sidebarMode, false);
    applyPerformanceMode();
}

function setSidebarMode(mode, save = true) {
    const isCompact = mode === 'compact';
    document.getElementById('mainSidebar').classList.toggle('sidebar-compact', isCompact);
    if(save) localStorage.setItem('bb_compact_sidebar', isCompact);
    updateSidebarVisualUI(mode);
}

function updateSidebarVisualUI(mode) {
    document.getElementById('sidebarOpt-normal')?.classList.toggle('selected', mode === 'normal');
    document.getElementById('sidebarOpt-compact')?.classList.toggle('selected', mode === 'compact');
}

function setTooltipDetail(val) {
    localStorage.setItem('bb_tooltip_detail', val);
    updateSegmentedUI('tooltipDetailControl', val);
}

function applyPerformanceMode() {
    const isEnabled = localStorage.getItem('bb_perf_mode') === 'true';
    const linkId = 'perf-mode-css';
    let link = document.getElementById(linkId);

    if (isEnabled) {
        document.documentElement.setAttribute('data-perf-mode', 'true');
        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = 'performance.css';
            document.head.appendChild(link);
        }
    } else {
        document.documentElement.removeAttribute('data-perf-mode');
        if (link) link.remove();
    }
}

function togglePerformanceMode() {
    const isEnabled = document.getElementById('perfModeToggle').checked;
    localStorage.setItem('bb_perf_mode', isEnabled);
    applyPerformanceMode();
}

function checkFirstVisit() {
    const alwaysShow = localStorage.getItem('bb_always_welcome') === 'true';
    if (!localStorage.getItem('bb_visited') || alwaysShow) {
        setTimeout(() => openModal('welcomeModal'), 500);
        localStorage.setItem('bb_visited', 'true');
    }
}

// --- WELCOME MODAL LOGIC ---
function goToWelcomeStep(step) {
    document.getElementById('welcome-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('welcome-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('welcome-step-3').style.display = step === 3 ? 'block' : 'none';
}

function selectWelcomeMode(mode) {
    document.querySelectorAll('.mode-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`card-${mode}`).classList.add('selected');
    setSidebarMode(mode);
}

function finishWelcome(loadSample = false) {
    closeModal('welcomeModal');
    if (loadSample && typeof loadPreset === 'function' && typeof currentEngine !== 'undefined' && currentEngine.presets && currentEngine.presets.length > 0) {
        loadPreset(currentEngine.presets[0]);
        showToast("Loaded starter template", "success");
    }
}

// --- POWERSHELL WELCOME LOGIC ---
function checkPowerShellWelcome() {
    if (!localStorage.getItem('bb_psh_visited')) {
        setTimeout(() => openModal('pshWelcomeModal'), 500);
    }
}

function goToPshWelcomeStep(step) {
    document.getElementById('psh-welcome-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('psh-welcome-step-2').style.display = step === 2 ? 'block' : 'none';
}

function finishPshWelcome() {
    localStorage.setItem('bb_psh_visited', 'true');
    closeModal('pshWelcomeModal');
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

        let contextCmds = currentEngine.commands.filter(c => {
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
        document.getElementById('dropZone').appendChild(block);
        block.scrollIntoView({ behavior: 'smooth', block: 'end' });
        checkEmpty(); updateIndentation(); saveState();
    };
    return el;
}

// --- SETTINGS NAVIGATION ---
function initSettings() {
    // Lazy Load UI Components
    if (!settingsUIInitialized) {
        const savedTheme = localStorage.getItem('bb_theme') || 'system';
        updateThemeUI(savedTheme);
        
        initEditorTheme();
        initIconSettings();
        initPreferences();
        
        // Init Education State
        const eduEnabled = localStorage.getItem('bb_edu_enabled') === 'true';
        document.getElementById('eduFeaturesToggle').checked = eduEnabled;
        toggleEduFeatures(false);
        const eduMode = localStorage.getItem('bb_edu_mode') || 'student';
        setEduMode(eduMode);

        // Init Tool Toggles (Default to true)
        document.getElementById('eduToolsStudentToggle').checked = localStorage.getItem('bb_edu_tools_student') !== 'false';
        document.getElementById('eduToolsTeacherToggle').checked = localStorage.getItem('bb_edu_tools_teacher') !== 'false';

        // Init Export Settings
        const brandingToggle = document.getElementById('exportBrandingToggle');
        if(brandingToggle) brandingToggle.checked = localStorage.getItem('bb_export_branding') !== 'false';

        settingsUIInitialized = true;
    }

    settingsStack = ['main'];
    document.querySelectorAll('.settings-view').forEach(el => {
        el.classList.remove('active', 'slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
        // Reset menu selection
        if(el.id === 'settings-main-view') {
            el.querySelectorAll('.setting-item').forEach(item => item.classList.remove('selected-menu-item'));
        }
    });
    document.getElementById('settings-main-view').classList.add('active');
    updateSettingsHeader(false);

    // Desktop: Auto-select first item
    if (window.innerWidth >= 800) {
        settingsNavigate('home');
    }

    // Sync Toggles
    const batchToggle = document.getElementById('batchLinterToggle');
    if (batchToggle) batchToggle.checked = localStorage.getItem('bb_linter_Batch') !== 'false';
    
    const pshToggle = document.getElementById('pshLinterToggle');
    if (pshToggle) pshToggle.checked = localStorage.getItem('bb_linter_PowerShell') !== 'false';

    const batchComp = document.getElementById('batchCompletionToggle');
    if(batchComp) batchComp.checked = localStorage.getItem('bb_completion_Batch') !== 'false';

    const pshComp = document.getElementById('pshCompletionToggle');
    if(pshComp) pshComp.checked = localStorage.getItem('bb_completion_PowerShell') !== 'false';

    const compDesc = document.getElementById('completionDescToggle');
    if(compDesc) compDesc.checked = localStorage.getItem('bb_completion_desc') !== 'false';

    const perfMode = document.getElementById('perfModeToggle');
    if(perfMode) perfMode.checked = localStorage.getItem('bb_perf_mode') === 'true';
}

function settingsNavigate(viewId) {
    const currentId = settingsStack[settingsStack.length - 1];
    const nextView = document.getElementById(`settings-${viewId}-view`);
    const isDesktop = window.innerWidth >= 800;

    if (isDesktop) {
        // Update Stack for Desktop (Flat hierarchy for split view)
        settingsStack = ['main', viewId];

        // Split View Logic
        document.querySelectorAll('.settings-view:not(#settings-main-view)').forEach(el => el.classList.remove('active'));
        nextView.classList.add('active');
        
        // Highlight Menu Item
        const mainView = document.getElementById('settings-main-view');
        mainView.querySelectorAll('.setting-item').forEach(item => {
            if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${viewId}'`)) {
                item.classList.add('selected-menu-item');
            } else {
                item.classList.remove('selected-menu-item');
            }
        });
        
        // Update Header Title to match active view
        document.getElementById('settingsTitle').textContent = nextView.getAttribute('data-title');
    } else {
        // Mobile Stack Logic
        const currentView = document.getElementById(`settings-${currentId}-view`);
        
        currentView.classList.remove('active', 'slide-in-left', 'slide-in-right');
        currentView.classList.add('slide-out-left');
        
        nextView.classList.remove('slide-out-right', 'slide-out-left');
        nextView.classList.add('active', 'slide-in-right');

        settingsStack.push(viewId);
        updateSettingsHeader(true);
    }
}

function settingsGoBack() {
    if (settingsStack.length <= 1) return;

    const currentId = settingsStack.pop();
    const prevId = settingsStack[settingsStack.length - 1];

    const currentView = document.getElementById(`settings-${currentId}-view`);
    const prevView = document.getElementById(`settings-${prevId}-view`);

    // Animation Classes
    currentView.classList.remove('active', 'slide-in-right');
    currentView.classList.add('slide-out-right');

    prevView.classList.remove('slide-out-left');
    prevView.classList.add('active', 'slide-in-left');

    updateSettingsHeader(true);
}

function updateSettingsHeader(animate) {
    const currentId = settingsStack[settingsStack.length - 1];
    const currentView = document.getElementById(`settings-${currentId}-view`);
    const titleText = currentView.getAttribute('data-title');
    
    const backBtn = document.getElementById('settingsBackBtn');
    const titleEl = document.getElementById('settingsTitle');
    
    // Animate Title
    if (animate) {
        titleEl.classList.add('fade-out');
        setTimeout(() => {
            titleEl.textContent = titleText;
            titleEl.classList.remove('fade-out');
        }, 150);
    } else {
        titleEl.textContent = titleText;
    }

    // Update Back Button
    if (settingsStack.length > 1) {
        const prevId = settingsStack[settingsStack.length - 2];
        const prevView = document.getElementById(`settings-${prevId}-view`);
        document.getElementById('settingsBackText').textContent = prevView.getAttribute('data-title');
        backBtn.classList.add('visible');
    } else {
        backBtn.classList.remove('visible');
    }
}

function openSettingsTo(view) {
    initSettings();
    openModal('settingsModal');
    
    if (view !== 'main' && window.innerWidth < 800) {
        settingsNavigate(view);
    } else if (view !== 'main' && window.innerWidth >= 800) {
        settingsNavigate(view);
    } else if (view === 'main' && window.innerWidth >= 800) {
        settingsNavigate('home');
    }
}

function toggleEngineLinter(engineName) {
    const checkbox = document.getElementById(engineName === 'Batch' ? 'batchLinterToggle' : 'pshLinterToggle');
    const isEnabled = checkbox.checked;
    localStorage.setItem(`bb_linter_${engineName}`, isEnabled);
    
    if (currentEngine.id === engineName) {
        if (!isEnabled) {
            // Clear warnings immediately
            document.querySelectorAll('.cmd-input.warning').forEach(el => {
                el.classList.remove('warning');
                const msg = el.parentElement.querySelector('.validation-msg');
                if(msg && msg.style.color === 'var(--warning-color)') msg.style.display = 'none';
            });
            updateCodeViewIfActive();
        } else {
            saveState();
        }
    }
}

function toggleEngineCompletion(engineName) {
    const checkbox = document.getElementById(engineName === 'Batch' ? 'batchCompletionToggle' : 'pshCompletionToggle');
    const isEnabled = checkbox.checked;
    localStorage.setItem(`bb_completion_${engineName}`, isEnabled);
}

function toggleCompletionDesc() {
    const isEnabled = document.getElementById('completionDescToggle').checked;
    localStorage.setItem('bb_completion_desc', isEnabled);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-box';
    
    if (type === 'success') toast.classList.add('success');

    const iconName = type === 'success' ? 'check_circle' : 'error';
    const iconColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';

    toast.innerHTML = `<span class="material-symbols-rounded" style="color:${iconColor}">${iconName}</span> ${message} <div class="toast-bar"></div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('exiting');
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}

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

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function switchTab(t) {
    document.querySelectorAll('.segment-tab').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(e => e.classList.remove('active'));
    document.getElementById(`tabBtn-${t}`).classList.add('active');
    document.getElementById(`tab-${t}`).classList.add('active');
    
    // Toggle Sub-sidebar visibility
    const subSidebar = document.querySelector('.sub-sidebar');
    if (subSidebar) {
        subSidebar.style.display = t === 'presets' ? 'none' : 'flex';
    }

    // Reset Search Input & Placeholder
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.placeholder = t === 'presets' ? 'Search presets...' : 'Search commands...';
        // Reset filters
        if (t === 'commands' && typeof renderSidebar === 'function') renderSidebar('');
        if (t === 'presets' && typeof filterPresets === 'function') filterPresets('');
    }

    // Trigger global hook for lazy loading content
    if (window.onTabSwitched) window.onTabSwitched(t);
}

// --- FACTORY RESET LOGIC ---
let aboutClickCount = 0;
let aboutClickTimer;

function handleAboutIconClick(el) {
    aboutClickCount++;
    
    // Apple-style tactile feedback (Visual + Haptic)
    if (navigator.vibrate) navigator.vibrate(10); // Light tap
    el.style.transform = 'scale(0.92)';
    setTimeout(() => el.style.transform = 'scale(1)', 100);

    clearTimeout(aboutClickTimer);
    aboutClickTimer = setTimeout(() => { aboutClickCount = 0; }, 500);

    if (aboutClickCount >= 4) {
        aboutClickCount = 0;
        
        // Success Haptic
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        
        el.classList.add('shake-trigger');
        showToast("Resetting Application...", "error");
        
        setTimeout(async () => {
            try {
                // 1. Clear Storage
                localStorage.clear();
                sessionStorage.clear();

                // 2. Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(r => r.unregister()));
                }

                // 3. Delete All Caches
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                }
            } catch (e) {
                console.error("Factory reset error:", e);
            } finally {
                window.location.reload();
            }
        }, 800);
    }
}

// --- EDUCATION MODE LOGIC ---
function toggleEduFeatures(animate = true) {
    const isEnabled = document.getElementById('eduFeaturesToggle').checked;
    const container = document.getElementById('eduSettingsContainer');
    
    if (isEnabled) {
        container.style.display = 'block';
        
        if (animate) {
            container.style.opacity = '0';
            container.style.filter = 'blur(10px)';
            
            // Force reflow
            void container.offsetHeight;
            
            container.style.opacity = '1';
            container.style.filter = 'blur(0)';
        } else {
            container.style.opacity = '1';
            container.style.filter = 'blur(0)';
        }
        container.style.pointerEvents = 'auto';
    } else {
        if (animate) {
            container.style.opacity = '0';
            container.style.filter = 'blur(10px)';
            
            setTimeout(() => {
                if (!document.getElementById('eduFeaturesToggle').checked) {
                    container.style.display = 'none';
                }
            }, 300);
        } else {
            container.style.display = 'none';
            container.style.opacity = '0';
        }
        container.style.pointerEvents = 'none';
    }
    localStorage.setItem('bb_edu_enabled', isEnabled);
    updateEduToolbar();
}

function setEduMode(mode) {
    document.querySelectorAll('#eduClientModeControl .seg-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`eduMode-${mode}`).classList.add('selected');
    
    document.getElementById('edu-student-section').style.display = mode === 'student' ? 'block' : 'none';
    document.getElementById('edu-teacher-section').style.display = mode === 'teacher' ? 'block' : 'none';
    
    localStorage.setItem('bb_edu_mode', mode);
    updateEduToolbar();
}

function toggleEduTool(type) {
    const toggleId = type === 'student' ? 'eduToolsStudentToggle' : 'eduToolsTeacherToggle';
    const isEnabled = document.getElementById(toggleId).checked;
    localStorage.setItem(`bb_edu_tools_${type}`, isEnabled);
    updateEduToolbar();
}

function initEduState() {
    // Ensure toolbar is updated based on stored state (defaults to off if null)
    updateEduToolbar();
}

function updateEduToolbar() {
    const globalEnabled = localStorage.getItem('bb_edu_enabled') === 'true';
    const mode = localStorage.getItem('bb_edu_mode') || 'student';
    
    // Check secondary switches (Default to true if not set)
    const studentToolsEnabled = localStorage.getItem('bb_edu_tools_student') !== 'false';
    const teacherToolsEnabled = localStorage.getItem('bb_edu_tools_teacher') !== 'false';

    const teacherToolbar = document.getElementById('edu-toolbar-teacher');
    const studentToolbar = document.getElementById('edu-toolbar-student');

    if (teacherToolbar) {
        teacherToolbar.style.display = (globalEnabled && mode === 'teacher' && teacherToolsEnabled) ? 'flex' : 'none';
    }
    if (studentToolbar) {
        studentToolbar.style.display = (globalEnabled && mode === 'student' && studentToolsEnabled) ? 'flex' : 'none';
    }
    //updateEduToolbar();
}

function toggleExportBranding() {
    const isEnabled = document.getElementById('exportBrandingToggle').checked;
    localStorage.setItem('bb_export_branding', isEnabled);
    if (typeof updateCodeViewIfActive === 'function') updateCodeViewIfActive();
}

function setupClasswork() {
    showToast("Classwork Setup Wizard coming soon", "success");
}


function loadClasswork() {
    showToast("Loading Classwork...", "success");
}

function toggleTeachingMode() {
    showToast("Teaching Mode Active", "success");
}

function toggleSettingsDropdown(el) {
    const dropdown = el.nextElementSibling;
    document.querySelectorAll('.select-dropdown.active').forEach(d => { if (d !== dropdown) d.classList.remove('active'); });
    dropdown.classList.toggle('active');
}

function selectSettingsOption(el) {
    const val = el.textContent;
    const container = el.closest('.custom-select');
    container.querySelector('.current-val').textContent = val;
    container.querySelectorAll('.select-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    el.closest('.select-dropdown').classList.remove('active');
}