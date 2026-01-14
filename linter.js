const BatchLinter = {
    definedVars: new Set(),

    scan: function (blocks) {
        this.definedVars.clear();
        // Add Standard Windows Environment Variables
        ['USERNAME', 'COMPUTERNAME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP', 'PATH', 'SystemRoot', 'windir', 'OS', 'DATE', 'TIME', 'CD', 'ERRORLEVEL', 'RANDOM', 'NUMBER_OF_PROCESSORS', 'HOMEDRIVE', 'HOMEPATH'].forEach(v => this.definedVars.add(v));

        blocks.forEach(block => {
            const id = block.getAttribute('data-cmd-id');
            const inputs = block.querySelectorAll('.cmd-input');
            if (!inputs.length) return;

            // Harvest Definitions (SET, FOR)
            if (id === 'set' || id === 'set_p') {
                const val = inputs[0].value.trim().split('=')[0]; // Handle "var=val" or just "var"
                if (val) this.definedVars.add(val.toUpperCase());
            } else if (id === 'for_loop') {
                const val = inputs[0].value.trim().replace(/[% ]/g, ''); // Clean %%G -> G
                if (val) this.definedVars.add(val.toUpperCase());
            }
        });
    },

    checkInput: function (input) {
        const val = input.value;
        // Check: Undefined Variables
        const usedVars = val.match(/%(\w+)%/g);
        if (usedVars) {
            for (const v of usedVars) {
                const varName = v.replace(/%/g, '').toUpperCase();
                if (!this.definedVars.has(varName)) {
                    return { type: 'warning', message: `Variable '%${varName}%' might be undefined` };
                }
            }
        }
        return null;
    }
};

const PowerShellLinter = {
    scan: function (blocks) {
        // Placeholder for PowerShell variable scanning
    },

    checkInput: function (input) {
        // Placeholder for PowerShell validation
        return null;
    }
};

const Linter = {
    scan: function () {
        const blocks = document.querySelectorAll('.script-block');
        if (typeof currentEngine !== 'undefined' && currentEngine.id === 'PowerShell') {
            PowerShellLinter.scan(blocks);
        } else {
            BatchLinter.scan(blocks);
        }
    },

    checkAll: function () {
        document.querySelectorAll('.cmd-input').forEach(input => this.checkInput(input));
    },

    checkInput: function (input) {
        // If it's already an error (empty required field), skip warning checks
        if (input.classList.contains('invalid')) return;

        const parent = input.parentElement;
        const msgEl = parent.querySelector('.validation-msg');

        // Reset Warning State
        input.classList.remove('warning');
        if (msgEl) { msgEl.style.display = 'none'; msgEl.style.color = ''; }

        let result = null;
        if (typeof currentEngine !== 'undefined' && currentEngine.id === 'PowerShell') {
            result = PowerShellLinter.checkInput(input);
        } else {
            result = BatchLinter.checkInput(input);
        }

        if (result) {
            input.classList.add(result.type);
            if (msgEl) {
                msgEl.innerHTML = `<span class="material-symbols-rounded" style="font-size:12px">${result.type === 'error' ? 'error' : 'warning'}</span> ${result.message}`;
                msgEl.style.display = 'flex';
                msgEl.style.color = result.type === 'error' ? 'var(--danger-color)' : 'var(--warning-color)';
            }
        }
    }
};