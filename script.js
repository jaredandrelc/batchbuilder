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
let currentEngine = BatchEngine; // Default to Batch
let currentContext = 'Batch';
let historyStack = [], redoStack = [], isInternalUpdate = false;
let draggedItem = null;
let editingScriptBlock = null;
let editingPresetId = null;
let presetToDeleteId = null;
let pendingAction = null;
const MAX_HISTORY = 15; // Reduced for memory optimization
let lastRenderedContext = null;
let deferredPrompt;
let settingsStack = [];
let presetsLoaded = false;

// Completion State
let completionActive = false;
let completionIndex = 0;

// --- 4. INITIALIZATION SEQUENCE ---
document.getElementById('yearSpan').textContent = new Date().getFullYear();

// Global Click Listener
// Popover Close Logic
document.addEventListener('mousedown', (e) => {
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

    // Close theme dropdown
    const themeSelect = document.getElementById('themeCustomSelect');
    if (themeSelect && !themeSelect.contains(e.target)) {
        document.getElementById('themeDropdown').classList.remove('active');
    }

    // Close block dropdowns
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-options.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.script-block.dropdown-active').forEach(el => el.classList.remove('dropdown-active'));
    }

    // Close settings dropdowns
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.select-dropdown.active').forEach(el => el.classList.remove('active'));
    }

    // Close completion menu
    const menu = document.getElementById('completionMenu');
    // Close if clicking outside menu AND outside the target input
    if (completionActive && !e.target.closest('.completion-menu') && e.target !== menu.targetInput && !e.target.classList.contains('action-item')) {
        closeCompletionMenu();
    }
});

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = document.querySelectorAll('.script-block.selected');
        if (selected.length > 0) {
            deleteSelected();
        } else if (document.activeElement.classList.contains('script-block')) {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                e.preventDefault();
                document.activeElement.querySelector('.remove-btn').click();
            }
        }
    }

    // Auto-focus search on typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        const isInput = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable;
        if (!isInput) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
    }
});

// Resize Listener for Settings Modal
window.addEventListener('resize', () => {
    if (document.getElementById('settingsModal').classList.contains('active')) {
        const isDesktop = window.innerWidth >= 800;
        const currentId = settingsStack[settingsStack.length - 1];

        if (!isDesktop) {
            // Mobile Mode
            updateSettingsHeader(false);
            if (currentId !== 'main') {
                document.getElementById('settings-main-view').classList.remove('active');
                document.getElementById('settings-main-view').classList.add('slide-out-left');

                const currentView = document.getElementById(`settings-${currentId}-view`);
                currentView.classList.add('active', 'slide-in-right');
            } else {
                document.getElementById('settings-main-view').classList.add('active');
                document.getElementById('settings-main-view').classList.remove('slide-out-left');
                // Ensure no subviews are active overlapping
                document.querySelectorAll('.settings-view:not(#settings-main-view)').forEach(el => el.classList.remove('active'));
            }
        } else {
            // Desktop Mode
            document.getElementById('settings-main-view').classList.add('active');
            document.getElementById('settings-main-view').classList.remove('slide-out-left');

            // Ensure title is correct
            const currentView = document.getElementById(`settings-${currentId}-view`);
            if (currentView) document.getElementById('settingsTitle').textContent = currentView.getAttribute('data-title');
        }
    }
});

renderSidebar();
saveState();
initTheme();
document.getElementById('welcomeToggle').checked = localStorage.getItem('bb_always_welcome') === 'true';

const tooltipState = localStorage.getItem('bb_sidebar_tooltips') !== 'false';
document.getElementById('sidebarTooltipToggle').checked = tooltipState;
const welcomeTooltip = document.getElementById('welcomeTooltipToggle');
if (welcomeTooltip) welcomeTooltip.checked = tooltipState;

checkFirstVisit();
initSelectionUI();
initSidebarTooltip();

// Lazy Load Presets Hook
window.onTabSwitched = (tabId) => {
    if (tabId === 'presets' && !presetsLoaded) {
        renderPresets();
        loadCustomPresets();
        presetsLoaded = true;
    }
};

// Init Completion Menu DOM
const completionMenu = document.createElement('div');
completionMenu.id = 'completionMenu'; completionMenu.className = 'completion-menu'; document.body.appendChild(completionMenu);

// Close completion on scroll to prevent detachment
document.getElementById('blockViewContainer').addEventListener('scroll', () => {
    if (completionActive) closeCompletionMenu();
}, { passive: true });

// --- MOBILE DRAG DROP POLYFILL ---
if (typeof MobileDragDrop !== 'undefined') {
    MobileDragDrop.polyfill({ dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride });
    // Fix for scrolling while dragging on mobile
    window.addEventListener('touchmove', function () { }, { passive: false });
}

// --- REMOVE LOADER ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loadingOverlay');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 500);
});

// --- PWA INSTALLATION ---
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.style.display = 'none';
    showToast("App installed successfully!", "success");
});

// --- CODE COMPLETION LOGIC ---
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('cmd-input') && e.target.tagName === 'INPUT') {
        if (currentEngine.id === 'Batch') {
            handleCompletionInput(e.target);
        }
    }
});

document.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('cmd-input') && e.target.tagName === 'INPUT') {
        if (currentEngine.id === 'Batch' && e.target.value.trim() === '') {
            handleCompletionInput(e.target);
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (!completionActive) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateCompletion(1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateCompletion(-1);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        acceptCompletion();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        closeCompletionMenu();
    }
});

function handleCompletionInput(input, forceFull = false) {
    // Safety check if file failed to load
    if (typeof BatchCompletion === 'undefined') return;

    // Check if completion is enabled for current engine
    const isEnabled = localStorage.getItem(`bb_completion_${currentEngine.id}`) !== 'false';
    if (!isEnabled) {
        closeCompletionMenu();
        return;
    }

    const block = input.closest('.script-block');
    const cmdId = block ? block.getAttribute('data-cmd-id') : null;
    const cursor = input.selectionStart;
    const val = input.value;

    // Determine which field we are in (0 = first input, 1 = second, etc.)
    let fieldIndex = 0;
    if (block) {
        const inputs = Array.from(block.querySelectorAll('.cmd-input'));
        fieldIndex = inputs.indexOf(input);
    }

    let result;
    if (forceFull) {
        result = {
            list: BatchCompletion.stdCmds.map(c => ({ text: c.n, label: c.n, type: 'command', icon: 'terminal', desc: c.d })),
            token: '',
            isDefault: false
        };
    } else {
        result = BatchCompletion.getSuggestions(val, cursor, cmdId, fieldIndex);
    }

    if (result && result.list.length > 0) {
        renderCompletionMenu(result.list, input, result.token, result.isDefault);
    } else {
        closeCompletionMenu();
    }
}

function renderCompletionMenu(suggestions, input, token, isCompact = false) {
    const menu = document.getElementById('completionMenu');

    // Reset exit state if we are re-rendering quickly
    menu.classList.remove('exiting');
    menu.style.overflow = '';
    menu.innerHTML = '';

    // If already active (e.g. switching from compact to full), disable entrance animation to let CSS transition handle resize
    if (menu.classList.contains('active')) menu.style.animation = 'none';
    else menu.style.animation = '';

    completionIndex = 0;
    completionActive = true;

    // Apply settings class
    const showDesc = localStorage.getItem('bb_completion_desc') !== 'false';
    menu.classList.toggle('hide-desc', !showDesc && !isCompact);
    menu.classList.toggle('compact', isCompact);

    if (isCompact) {
        // Ensure we don't duplicate Show More if re-rendering
        if (!suggestions.some(s => s.isAction)) {
            suggestions.push({ label: 'Show More', isAction: true, icon: 'more_horiz' });
        }
    }

    suggestions.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = `completion-item ${idx === 0 ? 'selected' : ''}`;

        if (item.isAction) {
            el.className += ' action-item';
            el.innerHTML = `<span class="completion-label" style="font-size: 0.7rem; opacity: 0.9;">${item.label}</span> <span class="material-symbols-rounded completion-icon">${item.icon}</span>`;
            el.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                handleCompletionInput(input, true);
            };
        } else {
            el.innerHTML = `
                        ${!isCompact ? `<span class="material-symbols-rounded completion-icon">${item.icon}</span>` : ''}
                        <div class="completion-info">
                            <div class="completion-label">${item.label}</div>
                            <div class="completion-desc">${item.desc}</div>
                        </div>
                        ${idx === 0 && !isCompact ? '<div class="completion-shortcut">Tab</div>' : ''}
                    `;
            el.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                completionIndex = idx;
                acceptCompletion();
            };
        }

        // Store data on element for retrieval
        el.dataset.text = item.text;
        el.dataset.token = token;
        el.dataset.inputRef = true; // Marker
        if (item.appendSpace) el.dataset.appendSpace = "true";
        menu.appendChild(el);
    });

    // Position Menu
    // Reset classes to measure correctly
    menu.classList.remove('position-above');
    menu.style.display = 'flex'; // Force display to measure
    menu.classList.add('active');

    // Measure for positioning
    const menuRect = menu.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    menu.style.left = inputRect.left + 'px';
    menu.style.minWidth = inputRect.width + 'px';

    // Flip if tight space below
    // If space below is less than menu height AND space above is greater than menu height
    if (isCompact) {
        // Compact menu positioning logic (closer to input)
        menu.style.minWidth = 'auto';
        menu.style.width = 'auto';
    }

    if (spaceBelow < 200 && spaceAbove > 200) {
        menu.classList.add('position-above');
        // For position-above, we use bottom relative to viewport or calculate top
        menu.style.top = (inputRect.top - menu.offsetHeight - (isCompact ? 2 : 6)) + 'px';
    } else {
        menu.classList.remove('position-above');
        menu.style.top = (inputRect.bottom + (isCompact ? 2 : 6)) + 'px';
    }

    // Store input reference
    menu.dataset.targetInput = input.id || 'temp_input'; // We might need a better way to ref input if no ID
    menu.targetInput = input; // Direct reference
}

function navigateCompletion(dir) {
    const menu = document.getElementById('completionMenu');
    const items = menu.querySelectorAll('.completion-item');

    // Skip action items in navigation if needed, or allow selecting them
    // For now, standard navigation works fine.

    items[completionIndex].classList.remove('selected');
    completionIndex = (completionIndex + dir + items.length) % items.length;
    items[completionIndex].classList.add('selected');
    items[completionIndex].scrollIntoView({ block: 'nearest' });
}

function acceptCompletion() {
    const menu = document.getElementById('completionMenu');
    const items = menu.querySelectorAll('.completion-item');
    const selected = items[completionIndex];
    const input = menu.targetInput;

    if (selected.classList.contains('action-item')) { selected.onmousedown(new Event('mousedown')); return; }

    if (selected && input) {
        // 1. Visual Feedback
        selected.classList.add('accepted');
        menu.style.overflow = 'hidden';

        const textToInsert = selected.dataset.text;
        const tokenToReplace = selected.dataset.token;
        const shouldAppendSpace = selected.dataset.appendSpace === "true";

        const cursor = input.selectionStart;
        const val = input.value;
        const before = val.substring(0, cursor - tokenToReplace.length);
        const after = val.substring(cursor);

        input.value = before + textToInsert + (shouldAppendSpace ? " " : "") + after;

        // Move cursor to end of inserted text
        const newCursorPos = before.length + textToInsert.length + (shouldAppendSpace ? 1 : 0);
        input.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger validation/save
        validateInput(input);
        saveState();

        // 2. Close with delay for animation
        completionActive = false; // Stop navigation immediately
        setTimeout(() => {
            // Trigger next completion context (e.g. show flags after command)
            handleCompletionInput(input);
        }, 200);
    } else {
        closeCompletionMenu();
    }
}

function closeCompletionMenu() {
    const menu = document.getElementById('completionMenu');
    if (!menu.classList.contains('active') || menu.classList.contains('exiting')) return;

    menu.classList.add('exiting');
    completionActive = false;

    const cleanup = () => {
        if (menu.classList.contains('exiting')) {
            menu.classList.remove('active', 'exiting', 'compact');
            menu.style.display = 'none';
            menu.targetInput = null;
        }
    };

    menu.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 200); // Safety fallback in case animation event fails
}

// --- 5. LOGIC & FUNCTIONS ---

// --- ENGINE SWITCHING ---
function switchEngine(engineId) {
    if (currentEngine.id === engineId) return;

    const loader = document.getElementById('loadingOverlay');
    const icon = loader.querySelector('.loader-icon');
    const text = loader.querySelector('.loader-text');

    // Visual Setup: Show loader with "Switching" state
    loader.classList.remove('hidden');
    text.textContent = engineId === 'PowerShell' ? 'Initializing PowerShell...' : 'Switching to Batch...';
    icon.textContent = engineId === 'PowerShell' ? 'code' : 'terminal';

    // Delay to allow visual transition
    setTimeout(() => {
        // 1. Update State
        currentEngine = (engineId === 'PowerShell') ? PowerShellEngine : BatchEngine;

        // Check for PowerShell Welcome Screen
        if (engineId === 'PowerShell') {
            if (typeof checkPowerShellWelcome === 'function') checkPowerShellWelcome();
        }

        // Update Help Button
        const helpBtn = document.getElementById('helpFab');
        const helpText = helpBtn.querySelector('.fab-text');
        if (engineId === 'PowerShell') {
            helpBtn.href = 'https://learn.microsoft.com/en-us/powershell/';
            helpText.textContent = 'View PowerShell Docs';
        } else {
            helpBtn.href = 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands';
            helpText.textContent = 'View Batch Docs';
        }

        // 2. Update UI (Navbar)
        document.querySelectorAll('.navbar-mode-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-btn-${engineId}`).classList.add('active');

        // 3. Reset Canvas & History
        dropZone.innerHTML = '';
        dropZone.appendChild(emptyState);
        historyStack = [];
        redoStack = [];
        updateButtons();

        // 4. Refresh Sidebar & Presets
        document.getElementById('searchInput').value = '';
        lastRenderedContext = null;
        switchContext('All'); // Reset context
        if (presetsLoaded) renderPresets(); // Only refresh if already loaded

        // 5. Hide Loader & Reset
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                text.textContent = 'WinScript Builder';
                icon.textContent = 'terminal';
            }, 500);
        }, 500);
    }, 800);
}

// --- CONTEXT SWITCHING ---
function switchContext(ctx) {
    currentContext = ctx;
    document.querySelectorAll('.context-icon').forEach(el => el.classList.remove('active'));
    document.getElementById(`ctx-${ctx.toLowerCase()}`).classList.add('active');
    switchTab('commands');
    renderSidebar();
}

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedItem && draggedItem.nodeType === 1 && draggedItem.classList.contains('script-block')) {
        if (placeholder.parentElement) {
            placeholder.replaceWith(draggedItem);
            draggedItem.classList.remove('dragging');
            draggedItem.style.display = 'flex';
        }
    } else if (draggedItem && draggedItem.type === 'group_move') {
        if (placeholder.parentElement) {
            const fragment = document.createDocumentFragment();
            draggedItem.blocks.forEach(b => {
                b.classList.remove('dragging');
                b.style.display = 'flex';
                fragment.appendChild(b);
            });
            placeholder.replaceWith(fragment);
        }
    } else if (draggedItem && draggedItem.type === 'duplicate') {
        if (placeholder.parentElement) {
            const cmdId = draggedItem.sourceBlock.getAttribute('data-cmd-id');
            const values = Array.from(draggedItem.sourceBlock.querySelectorAll('.cmd-input')).map(i => i.value);
            const cmd = currentEngine.commands.find(c => c.id === cmdId);
            if (cmd) {
                const newBlock = createBlock(cmd, values);
                if (draggedItem.sourceBlock.dataset.scriptContent) newBlock.dataset.scriptContent = draggedItem.sourceBlock.dataset.scriptContent;
                placeholder.replaceWith(newBlock);
            }
        }
    } else if (draggedItem && draggedItem.type === 'new') {
        if (placeholder.parentElement) {
            const newBlock = createBlock(draggedItem.data);
            placeholder.replaceWith(newBlock);

            // UI Improvement: Auto-close containers
            if (draggedItem.data.isContainerStart) {
                const endCmd = currentEngine.commands.find(c => c.id === 'block_end');
                if (endCmd) {
                    const endBlock = createBlock(endCmd);
                    newBlock.after(endBlock);

                    // Specific case for IF: Add ELSE in between
                    if (draggedItem.data.id === 'if_start') {
                        const elseCmd = currentEngine.commands.find(c => c.id === 'else_start');
                        if (elseCmd) {
                            const elseBlock = createBlock(elseCmd);
                            newBlock.after(elseBlock);
                        }
                    }
                }
            }
        }
    } else if (draggedItem && draggedItem.type === 'preset') {
        if (placeholder.parentElement) {
            const fragment = document.createDocumentFragment();
            draggedItem.data.blocks.forEach(blkData => {
                const cmd = currentEngine.commands.find(c => c.id === blkData.id);
                if (cmd) fragment.appendChild(createBlock(cmd, blkData.values));
            });
            placeholder.parentElement.insertBefore(fragment, placeholder);
            placeholder.remove();
        }
    }
    if (placeholder.parentElement) placeholder.remove();
    checkEmpty(); updateIndentation(); saveState(); draggedItem = null;
});

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

// --- SIDEBAR TOOLTIP LOGIC ---
function initSidebarTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'sidebar-tooltip';
    document.body.appendChild(tooltip);

    let tooltipTimer;
    let hideTimer;
    let isTooltipVisible = false;
    let lastX = 0, lastY = 0;
    const sidebar = document.getElementById('mainSidebar');

    const updatePosition = () => {
        const rect = tooltip.getBoundingClientRect();
        const x = lastX + 15;
        const y = lastY + 15;

        // Prevent overflow
        const finalX = (x + rect.width > window.innerWidth) ? lastX - rect.width - 10 : x;
        const finalY = (y + rect.height > window.innerHeight) ? lastY - rect.height - 10 : y;

        tooltip.style.left = finalX + 'px';
        tooltip.style.top = finalY + 'px';
    };

    sidebar.addEventListener('mousemove', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (isTooltipVisible) {
            updatePosition();

            // Reset hide timer if moving within gaps to keep it alive
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => {
                    isTooltipVisible = false;
                    tooltip.classList.remove('active');
                    hideTimer = null;
                }, 1000);
            }
        }
    });

    sidebar.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimer);
        clearTimeout(hideTimer);
        isTooltipVisible = false;
        tooltip.classList.remove('active');
        hideTimer = null;
    });

    sidebar.addEventListener('mouseover', (e) => {
        if (e.clientX) { lastX = e.clientX; lastY = e.clientY; }
        const item = e.target.closest('.command-item');
        if (item && !item.classList.contains('cat-Preset')) {
            clearTimeout(hideTimer);
            hideTimer = null;

            if (localStorage.getItem('bb_sidebar_tooltips') === 'false') return;

            const name = item.querySelector('.cmd-name').textContent;
            const cmd = currentEngine.commands.find(c => c.name === name);
            if (cmd) {
                if (isTooltipVisible) {
                    // If already visible, update immediately and keep showing
                    updateTooltipContent(cmd, item);
                    updatePosition();
                } else {
                    // If not visible, start timer
                    clearTimeout(tooltipTimer);
                    tooltipTimer = setTimeout(() => {
                        updateTooltipContent(cmd, item);
                        updatePosition();
                        isTooltipVisible = true;
                        tooltip.classList.add('active');
                    }, 600); // 600ms delay
                }
            }
        } else {
            // Hovering gaps/sidebar itself
            if (isTooltipVisible) {
                if (!hideTimer) {
                    hideTimer = setTimeout(() => {
                        isTooltipVisible = false;
                        tooltip.classList.remove('active');
                        hideTimer = null;
                    }, 1000);
                }
            } else {
                clearTimeout(tooltipTimer);
            }
        }
    });

    function updateTooltipContent(cmd, itemElement) {
        // Reset classes
        tooltip.className = 'sidebar-tooltip';
        const catClass = Array.from(itemElement.classList).find(c => c.startsWith('cat-'));
        if (catClass) tooltip.classList.add(catClass);

        const detailLevel = localStorage.getItem('bb_tooltip_detail') || 'detailed';
        const showUseCase = detailLevel === 'detailed' && cmd.useCase;

        tooltip.innerHTML = `
                    <div class="tooltip-desc">${cmd.desc}</div>
                    ${showUseCase ? `<div class="tooltip-usecase">${cmd.useCase}</div>` : ''}
                `;
    }
}

// --- SCRIPT EDITOR ---
function openScriptEditor(btn) {
    editingScriptBlock = btn.closest('.script-block');
    const content = editingScriptBlock.dataset.scriptContent || '';
    document.getElementById('scriptContentArea').value = content;
    openModal('scriptEditorModal');
}

function saveScriptContent() {
    if (editingScriptBlock) {
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

    if (saved.length === 0) {
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
        el.onclick = (e) => { if (e.target.closest('.preset-controls')) return; loadPreset(preset); };
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
    if (preset) {
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

    if (!newName) {
        input.classList.add('invalid');
        return;
    }
    if (editingPresetId) {
        const saved = JSON.parse(localStorage.getItem('bb_custom_presets') || '[]');
        const idx = saved.findIndex(p => p.id === editingPresetId);
        if (idx !== -1) {
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
    currentEngine.presets.forEach(p => {
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
    if (blocks.length === 0) { showToast("Canvas is empty! Cannot save preset."); return; }

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

    if (!name) {
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
        const cmd = currentEngine.commands.find(c => c.id === blkData.id);
        if (cmd) {
            const block = createBlock(cmd, blkData.values);
            if (blkData.scriptContent) block.dataset.scriptContent = blkData.scriptContent;
            dropZone.appendChild(block);
        }
    });
    checkEmpty(); updateIndentation(); saveState();
}

function checkEmpty() { const blocks = dropZone.querySelectorAll('.script-block'); document.getElementById('emptyState').style.display = blocks.length === 0 ? 'block' : 'none'; }
function updateIndentation() {
    let depth = 0;
    // Filter out exiting blocks to prevent calculation errors during deletion
    const children = Array.from(dropZone.children).filter(el => !el.classList.contains('exiting'));

    children.forEach(el => {
        if (el.classList.contains('drop-placeholder')) {
            el.style.marginLeft = (depth * 28) + 'px';
            el.setAttribute('data-indent', depth);
            return;
        }
        const cmd = currentEngine.commands.find(c => c.id === el.getAttribute('data-cmd-id'));
        if (!cmd) return;
        if (cmd.isContainerEnd || cmd.isContainerMid) depth = Math.max(0, depth - 1);
        el.setAttribute('data-indent', depth);
        if (cmd.isContainerStart || cmd.isContainerMid) depth++;
    });

    // Second pass: Determine last child in scope for continuous lines
    for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (el.classList.contains('drop-placeholder')) continue;

        const currentIndent = parseInt(el.getAttribute('data-indent') || '0');
        if (currentIndent === 0) {
            el.removeAttribute('data-last-child');
            continue;
        }

        let isLast = true;
        for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            const nextIndent = parseInt(next.getAttribute('data-indent') || '0');
            if (nextIndent === currentIndent) { isLast = false; break; }
            if (nextIndent < currentIndent) { isLast = true; break; }
        }
        if (isLast) el.setAttribute('data-last-child', 'true');
        else el.removeAttribute('data-last-child');
    }
}

function confirmClear() { saveState(); dropZone.innerHTML = ''; dropZone.appendChild(emptyState); checkEmpty(); saveState(); toggleClearPopover(); showToast("Canvas cleared successfully", "success"); document.getElementById('blockViewContainer').scrollTop = 0; }

function toggleOverview() {
    const canvas = document.querySelector('.canvas-area'); canvas.classList.toggle('overview-mode');
    const btn = document.getElementById('btnOverview');
    if (canvas.classList.contains('overview-mode')) { btn.style.color = '#ff9500'; btn.style.background = 'rgba(255, 149, 0, 0.1)'; }
    else { btn.style.color = 'var(--text-secondary)'; btn.style.background = 'none'; }
}

function toggleSidebarTooltip(sourceEl) {
    const state = sourceEl ? sourceEl.checked : document.getElementById('sidebarTooltipToggle').checked;
    localStorage.setItem('bb_sidebar_tooltips', state);
    if (document.getElementById('sidebarTooltipToggle')) document.getElementById('sidebarTooltipToggle').checked = state;
    if (document.getElementById('welcomeTooltipToggle')) document.getElementById('welcomeTooltipToggle').checked = state;
}


function toggleWelcomeEveryTime() { localStorage.setItem('bb_always_welcome', document.getElementById('welcomeToggle').checked); }
function toggleView(mode) {
    document.querySelectorAll('.view-option').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${mode}`).classList.add('active');
    document.getElementById('btnOverview').style.display = mode === 'block' ? 'flex' : 'none';

    if (mode === 'block') {
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

function updateCodeViewIfActive() {
    if (document.getElementById('codeViewContainer').classList.contains('active')) {
        renderCodeEditor();
    }
}

function renderCodeEditor() {
    let lines = currentEngine.generateCode(true);

    // Handle Branding Removal in Preview
    const includeBranding = localStorage.getItem('bb_export_branding') !== 'false';
    if (!includeBranding) {
        lines = lines.filter(line => !line.text.includes('WinScript Builder'));
    }

    const container = document.getElementById('codePreviewBlock');
    const blocks = document.getElementById('dropZone').querySelectorAll('.script-block');

    let lineNumsHtml = '';
    let codeHtml = '';

    lines.forEach((line, idx) => {
        lineNumsHtml += `<div>${idx + 1}</div>`;

        let lineClass = '';
        let iconHtml = '';

        if (line.blockIndex) {
            const block = blocks[line.blockIndex - 1];
            if (block) {
                const isError = block.classList.contains('error') || block.querySelector('.cmd-input.invalid');
                const isWarning = block.querySelector('.cmd-input.warning');

                if (isError) {
                    lineClass = 'line-error';
                    iconHtml = '<span class="material-symbols-rounded status-icon error">error</span>';
                } else if (isWarning) {
                    lineClass = 'line-warning';
                    iconHtml = '<span class="material-symbols-rounded status-icon warning">warning</span>';
                }
            }
        }

        const pill = line.blockIndex ? `<span class="block-pill">Block ${line.blockIndex}</span>` : '';
        const highlightedText = currentEngine.highlightSyntax(line.text);
        const clickAttr = line.blockIndex ? `onclick="jumpToBlock(${line.blockIndex})"` : '';
        const cursorStyle = line.blockIndex ? 'style="cursor: pointer;"' : '';
        codeHtml += `<div class="code-line ${lineClass}" ${clickAttr} ${cursorStyle}>${iconHtml}${highlightedText || '&nbsp;'}${pill}</div>`;
    });

    container.innerHTML = `
                <div class="editor-container">
                    <div class="line-numbers">${lineNumsHtml}</div>
                    <div class="code-content">${codeHtml}</div>
                </div>
            `;

    const codeContent = container.querySelector('.code-content');
    const lineNumbers = container.querySelector('.line-numbers');
    codeContent.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeContent.scrollTop;
    });
}


let searchDebounceTimer;
function filterCommands() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        const term = document.getElementById('searchInput').value;
        const activeTab = document.querySelector('.segment-tab.active');

        if (activeTab && activeTab.id === 'tabBtn-presets') {
            filterPresets(term);
        } else {
            renderSidebar(term);
        }
    }, 300);
}

function filterPresets(filter) {
    const filterText = filter.toLowerCase();
    const lists = [document.getElementById('presetList'), document.getElementById('customPresetList')];

    lists.forEach(list => {
        if (!list) return;
        const items = list.querySelectorAll('.command-item');
        items.forEach(item => {
            const name = item.querySelector('.cmd-name').textContent.toLowerCase();
            const desc = item.querySelector('.cmd-desc').textContent.toLowerCase();
            const match = !filterText || name.includes(filterText) || desc.includes(filterText);
            item.style.display = match ? 'flex' : 'none';
        });
    });
}

// --- DELEGATED CANVAS EVENTS ---
dropZone.addEventListener('click', (e) => {
    const block = e.target.closest('.script-block');
    if (!block) return;

    // Handle remove button click
    if (e.target.closest('.remove-btn')) {
        removeBlock(e.target);
        return;
    }

    // Handle multi-select and quick-delete
    if (e.ctrlKey || e.metaKey) {
        e.stopPropagation();
        block.classList.toggle('selected');
        updateSelectionToast();
    } else if (e.shiftKey) {
        e.stopPropagation();
        removeBlock(block.querySelector('.remove-btn'));
    }
});

dropZone.addEventListener('dblclick', (e) => {
    if (document.querySelector('.canvas-area').classList.contains('overview-mode')) {
        const block = e.target.closest('.script-block');
        if (block) {
            toggleOverview();
            setTimeout(() => {
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                block.classList.add('highlight-pulse');
                setTimeout(() => block.classList.remove('highlight-pulse'), 1500);
            }, 50);
        }
    }
});

function exportScript() {
    checkAndProceed(() => {
        let code = currentEngine.generateCode();

        // Handle Branding Removal
        const includeBranding = localStorage.getItem('bb_export_branding') !== 'false';
        if (!includeBranding) {
            code = code.split('\n').filter(line => !line.includes('WinScript Builder')).join('\n');
            code = code.replace(/^\s*[\r\n]/gm, ''); // Clean up leading empty lines
        }

        const blob = new Blob([code], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `script${currentEngine.fileExtension}`;
        a.click();
    });
}

function copyToClipboard() {
    checkAndProceed(() => {
        const code = currentEngine.generateCode();
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
        // Save as non-proprietary script file (.bat/.ps1)
        let code = currentEngine.generateCode();

        // Respect branding setting for drafts too
        const includeBranding = localStorage.getItem('bb_export_branding') !== 'false';
        if (!includeBranding) {
            code = code.split('\n').filter(line => !line.includes('WinScript Builder')).join('\n');
        }

        const blob = new Blob([code], { type: 'text/plain' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `draft_${Date.now()}${currentEngine.fileExtension}`; a.click();
    });
}

function loadFile(input) {
    if (!input.files[0]) return;
    const r = new FileReader();
    r.onload = (e) => {
        const content = e.target.result;
        try {
            const d = JSON.parse(content);
            // Basic check if file matches engine (optional, for now just load blocks)
            if (d.blocks) { saveState(); loadState(d.blocks); saveState(); }
        } catch (err) {
            saveState();
            const blocks = currentEngine.parse(content);
            loadState(blocks);
            saveState();
        }
    };
    r.readAsText(input.files[0]); input.value = '';
}

function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        deferredPrompt = null;
        if (choiceResult.outcome !== 'accepted') {
            const btn = document.getElementById('pwaInstallBtn');
            if (btn) btn.style.display = 'none';
        }
    });
}
