// --- CANVAS & BLOCK LOGIC ---

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
        let inputElement;
        if (field.type === 'select') {
            const initialVal = val || field.options[0];
            inputElement = `
                <div class="custom-select-wrapper" onclick="toggleBlockDropdown(this, event)">
                    <div class="custom-select-trigger ${field.req && !initialVal ? 'invalid' : ''}">
                        <span class="selected-text">${initialVal}</span>
                        <span class="material-symbols-rounded chevron">unfold_more</span>
                    </div>
                    <div class="custom-select-options">
                        ${field.options.map(o => `<div class="custom-option ${o===initialVal?'selected':''}" data-value="${o}" onclick="selectBlockOption(this, event)">${o}</div>`).join('')}
                    </div>
                    <input type="hidden" class="cmd-input" data-req="${field.req||false}" value="${initialVal}">
                </div>`;
        } else {
            inputElement = `<input type="${field.type}" class="form-control cmd-input" data-req="${field.req||false}" value="${val}" placeholder="${field.placeholder||''}" onchange="saveState(); validateInput(this)" oninput="validateInput(this)">`;
        }
        
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
            <span class="material-symbols-rounded remove-btn">close</span>
        </div>
        ${inputsHtml ? `<div class="block-body">${inputsHtml}${extrasHtml}</div>` : ''}
    `;
    
    block.addEventListener('dragstart', (e) => { 
        if (e.altKey) {
            draggedItem = { type: 'duplicate', sourceBlock: block };
            e.dataTransfer.effectAllowed = 'copy';
        } else {
            const group = getBlockGroup(block);
            if (group.length > 1) {
                draggedItem = { type: 'group_move', blocks: group };
                group.forEach(b => {
                    b.classList.add('dragging');
                    setTimeout(() => b.style.display = 'none', 0);
                });
                const ghost = document.getElementById('dragGhost');
                document.getElementById('ghostText').textContent = `${group.length} Blocks`;
                document.getElementById('ghostIcon').textContent = "layers";
                e.dataTransfer.setDragImage(ghost, 20, 20);
            } else {
                draggedItem = block; block.classList.add('dragging'); setTimeout(() => block.style.display = 'none', 0); 
            }
        }
    });
    block.addEventListener('dragend', () => { 
        if (draggedItem && draggedItem.type === 'group_move') {
            draggedItem.blocks.forEach(b => { b.classList.remove('dragging'); b.style.display = 'flex'; });
        } else {
            block.classList.remove('dragging'); block.style.display = 'flex'; 
        }
        const placeholder = document.querySelector('.drop-placeholder');
        if(placeholder && placeholder.parentElement) placeholder.remove(); 
        draggedItem = null; updateIndentation(); saveState(); 
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

    const cleanup = () => {
        if (!block.parentElement) return; // Already removed by a competing event
        block.remove();
        checkEmpty();
        saveState();
        const scroller = document.getElementById('blockViewContainer');
        if (scroller.scrollHeight <= scroller.clientHeight) scroller.scrollTop = 0;
    };

    block.addEventListener('animationend', cleanup, { once: true });
    // Safety fallback in case animation event fails (e.g., in performance mode)
    setTimeout(cleanup, 400);
}

function getBlockGroup(startBlock) {
    const group = [startBlock];
    const startId = startBlock.getAttribute('data-cmd-id');
    const startCmd = currentEngine.commands.find(c => c.id === startId);
    
    if (!startCmd || (!startCmd.isContainerStart && !startCmd.isContainerMid)) return group;

    let depth = 1;
    let current = startBlock.nextElementSibling;
    
    while (current && depth > 0) {
        if (current.classList.contains('script-block') && !current.classList.contains('drop-placeholder') && !current.classList.contains('exiting')) {
            const id = current.getAttribute('data-cmd-id');
            const cmd = currentEngine.commands.find(c => c.id === id);
            if (cmd) {
                if (cmd.isContainerStart) depth++;
                if (cmd.isContainerEnd) depth--;
            }
            group.push(current);
        }
        if (depth > 0) current = current.nextElementSibling;
    }
    return group;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.script-block:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- CUSTOM DROPDOWN LOGIC ---
function toggleBlockDropdown(wrapper, e) {
    if (document.querySelector('.canvas-area').classList.contains('overview-mode')) return;
    e.stopPropagation();
    
    document.querySelectorAll('.custom-select-options.active').forEach(el => {
        if (el.parentElement !== wrapper) el.classList.remove('active');
    });
    document.querySelectorAll('.script-block.dropdown-active').forEach(b => {
        if (!b.contains(wrapper)) b.classList.remove('dropdown-active');
    });

    const options = wrapper.querySelector('.custom-select-options');
    options.classList.toggle('active');
    
    const block = wrapper.closest('.script-block');
    if(block) {
        if(options.classList.contains('active')) block.classList.add('dropdown-active');
        else block.classList.remove('dropdown-active');
    }
}

function selectBlockOption(option, e) {
    e.stopPropagation();
    const wrapper = option.closest('.custom-select-wrapper');
    const input = wrapper.querySelector('.cmd-input');
    const triggerText = wrapper.querySelector('.selected-text');
    const optionsMenu = wrapper.querySelector('.custom-select-options');
    const val = option.dataset.value;

    triggerText.textContent = val;
    wrapper.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
    
    input.value = val;
    optionsMenu.classList.remove('active');
    
    const block = wrapper.closest('.script-block');
    if(block) block.classList.remove('dropdown-active');

    validateInput(input);
    saveState();
}

// --- VALIDATION ---
let linterDebounceTimer;
function validateInput(input) {
    const isValid = input.dataset.req !== 'true' || input.value.trim() !== '';
    const isCustomSelect = input.type === 'hidden' && input.parentElement.classList.contains('custom-select-wrapper');
    const visualTarget = isCustomSelect ? input.parentElement.querySelector('.custom-select-trigger') : input;
    const parent = isCustomSelect ? input.parentElement.parentElement : input.parentElement;
    const msgEl = parent.querySelector('.validation-msg');

    if (!isValid) {
        visualTarget.classList.add('invalid');
        input.classList.add('invalid');
        visualTarget.classList.remove('warning'); 
        if(msgEl) {
            msgEl.innerHTML = `<span class="material-symbols-rounded" style="font-size:12px">error</span> Required`;
            msgEl.style.display = 'flex';
            msgEl.style.color = 'var(--danger-color)';
        }
    } else {
        visualTarget.classList.remove('invalid');
        input.classList.remove('invalid');
        if(msgEl) msgEl.style.display = 'none';
        if(typeof Linter !== 'undefined') {
            const isEnabled = localStorage.getItem(`bb_linter_${currentEngine.id}`) !== 'false';
            if (isEnabled) {
                clearTimeout(linterDebounceTimer);
                linterDebounceTimer = setTimeout(() => Linter.checkInput(input), 300);
            }
        }
    }
}

function checkAndProceed(callback) {
    const blocks = document.getElementById('dropZone').querySelectorAll('.script-block');
    if (blocks.length === 0) {
        showToast("Canvas is empty! Nothing to process.");
        return;
    }

    if(typeof Linter !== 'undefined') {
        const isEnabled = localStorage.getItem(`bb_linter_${currentEngine.id}`) !== 'false';
        if (isEnabled) {
            Linter.scan();
            Linter.checkAll();
        }
    }
    
    let hasIssues = false;
    document.querySelectorAll('.cmd-input').forEach(input => {
        validateInput(input);
        if (input.classList.contains('invalid') || input.classList.contains('warning')) hasIssues = true;
    });

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
    const blocks = document.getElementById('dropZone').querySelectorAll('.script-block');
    let stack = [];
    let isValid = true;

    blocks.forEach(block => {
        block.classList.remove('error');
        const id = block.getAttribute('data-cmd-id');
        
        if (id === 'if_start' || id === 'for_loop') {
            stack.push(id);
        } else if (id === 'else_start') {
            if (stack.length === 0 || stack[stack.length - 1] !== 'if_start') {
                block.classList.add('error');
                isValid = false;
            }
        } else if (id === 'block_end') {
            if (stack.length === 0) {
                block.classList.add('error');
                isValid = false;
            } else {
                stack.pop();
            }
        }
    });

    if(stack.length > 0) isValid = false;
    return isValid;
}

// --- SELECTION LOGIC ---
function initSelectionUI() {
    const toast = document.createElement('div');
    toast.id = 'selectionToast';
    toast.className = 'selection-toast';
    toast.innerHTML = `
        <span class="selection-count" id="selectionCount">0 selected</span>
        <div class="selection-actions">
            <button class="btn-sm-danger" onclick="deleteSelected()">Delete</button>
            <button class="btn-sm-secondary" onclick="clearSelection()">Cancel</button>
        </div>
    `;
    document.querySelector('.canvas-area').appendChild(toast);

    const box = document.createElement('div');
    box.id = 'selectionBox';
    box.className = 'selection-box';
    document.body.appendChild(box);

    const container = document.getElementById('blockViewContainer');
    let isSelecting = false;
    let startX, startY;

    container.addEventListener('mousedown', (e) => {
        if (e.target.closest('.script-block') || e.target.closest('.drop-placeholder')) return;
        if (e.button !== 0) return;

        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        
        if (!e.ctrlKey && !e.shiftKey) clearSelection();

        const box = document.getElementById('selectionBox');
        box.style.left = startX + 'px';
        box.style.top = startY + 'px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        const box = document.getElementById('selectionBox');
        box.style.width = width + 'px';
        box.style.height = height + 'px';
        box.style.left = left + 'px';
        box.style.top = top + 'px';

        const blocks = document.querySelectorAll('.script-block');
        blocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            if (left < rect.right && left + width > rect.left && top < rect.bottom && top + height > rect.top) {
                block.classList.add('selected');
            } else if (!e.ctrlKey) {
                block.classList.remove('selected');
            }
        });
    });

    window.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            document.getElementById('selectionBox').style.display = 'none';
            updateSelectionToast();
        }
    });
}

function updateSelectionToast() {
    const count = document.querySelectorAll('.script-block.selected').length;
    const toast = document.getElementById('selectionToast');
    const countEl = document.getElementById('selectionCount');
    const toastContainer = document.getElementById('toastContainer');
    
    if (count > 0) {
        countEl.textContent = `${count} selected`;
        toast.classList.add('active');
        if (toastContainer) toastContainer.classList.add('shifted');
    } else {
        toast.classList.remove('active');
        if (toastContainer) toastContainer.classList.remove('shifted');
    }
}

function clearSelection() {
    document.querySelectorAll('.script-block.selected').forEach(el => el.classList.remove('selected'));
    updateSelectionToast();
}

function deleteSelected() {
    const selected = document.querySelectorAll('.script-block.selected');
    selected.forEach(el => el.remove());
    clearSelection();
    checkEmpty();
    saveState();
    showToast(`${selected.length} blocks deleted`, 'success');
    const scroller = document.getElementById('blockViewContainer');
    if (scroller.scrollHeight <= scroller.clientHeight) scroller.scrollTop = 0;
}

// --- STATE & HISTORY ---
function serializeCanvas() {
    return Array.from(document.getElementById('dropZone').querySelectorAll('.script-block')).map(b => {
        const data = { id: b.getAttribute('data-cmd-id'), values: Array.from(b.querySelectorAll('.cmd-input')).map(i => i.value) };
        if(b.dataset.scriptContent) data.scriptContent = b.dataset.scriptContent;
        return data;
    });
}

function loadState(stateData) {
    isInternalUpdate = true; 
    const dropZone = document.getElementById('dropZone');
    dropZone.innerHTML = ''; 
    dropZone.appendChild(document.getElementById('emptyState')); 
    
    stateData.forEach(item => {
        const cmd = currentEngine.commands.find(c => c.id === item.id);
        if(cmd) {
            const block = createBlock(cmd, item.values);
            if(item.scriptContent) block.dataset.scriptContent = item.scriptContent;
            dropZone.appendChild(block);
        }
    });
    checkEmpty(); updateIndentation(); isInternalUpdate = false;
}

function saveState() {
    if (isInternalUpdate) return;
    const s = serializeCanvas();
    
    if(typeof Linter !== 'undefined') {
        const isEnabled = localStorage.getItem(`bb_linter_${currentEngine.id}`) !== 'false';
        if (isEnabled) {
            requestAnimationFrame(() => {
                Linter.scan(); 
                Linter.checkAll(); 
                updateCodeViewIfActive(); 
            });
        } else {
            updateCodeViewIfActive();
        }
    } else {
        updateCodeViewIfActive();
    }
    
    if (historyStack.length && JSON.stringify(historyStack[historyStack.length-1]) === JSON.stringify(s)) return;
    historyStack.push(s); 
    if (historyStack.length > MAX_HISTORY) historyStack.shift(); 
    redoStack = []; 
    updateButtons();
}

function undo() { 
    if(historyStack.length <= 1) return; 
    redoStack.push(historyStack.pop()); 
    loadState(historyStack[historyStack.length - 1]); 
    updateButtons(); 
    updateCodeViewIfActive(); 
}

function redo() { 
    if(!redoStack.length) return; 
    const next = redoStack.pop(); 
    historyStack.push(next); 
    loadState(next); 
    updateButtons(); 
    updateCodeViewIfActive(); 
}

function updateButtons() { 
    document.getElementById('btnUndo').disabled = historyStack.length <= 1; 
    document.getElementById('btnRedo').disabled = redoStack.length === 0; 
}

function checkEmpty() { 
    const blocks = document.getElementById('dropZone').querySelectorAll('.script-block'); 
    document.getElementById('emptyState').style.display = blocks.length === 0 ? 'block' : 'none'; 
}

function updateIndentation() {
    let depth = 0;
    const dropZone = document.getElementById('dropZone');
    const children = Array.from(dropZone.children).filter(el => !el.classList.contains('exiting'));
    
    children.forEach(el => {
        if(el.classList.contains('drop-placeholder')) { 
            el.style.marginLeft = (depth*28)+'px'; 
            el.setAttribute('data-indent', depth);
            return; 
        }
        const cmd = currentEngine.commands.find(c => c.id === el.getAttribute('data-cmd-id'));
        if(!cmd) return;
        if(cmd.isContainerEnd || cmd.isContainerMid) depth = Math.max(0, depth-1);
        el.setAttribute('data-indent', depth);
        if(cmd.isContainerStart || cmd.isContainerMid) depth++;
    });

    for(let i = 0; i < children.length; i++) {
        const el = children[i];
        if(el.classList.contains('drop-placeholder')) continue;
        
        const currentIndent = parseInt(el.getAttribute('data-indent') || '0');
        if(currentIndent === 0) {
            el.removeAttribute('data-last-child');
            continue;
        }

        let isLast = true;
        for(let j = i + 1; j < children.length; j++) {
            const next = children[j];
            const nextIndent = parseInt(next.getAttribute('data-indent') || '0');
            if (nextIndent === currentIndent) { isLast = false; break; }
            if (nextIndent < currentIndent) { isLast = true; break; }
        }
        if(isLast) el.setAttribute('data-last-child', 'true');
        else el.removeAttribute('data-last-child');
    }
}