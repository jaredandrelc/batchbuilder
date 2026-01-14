const BatchCompletion = {
    // Standard Windows Environment Variables
    stdVars: [
        'APPDATA', 'CD', 'CMDCMDLINE', 'CMDEXTVERSION', 'COMPUTERNAME', 'COMSPEC', 'DATE', 'ERRORLEVEL',
        'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'LOGONSERVER', 'NUMBER_OF_PROCESSORS', 'OS', 'PATH',
        'PATHEXT', 'PROCESSOR_ARCHITECTURE', 'PROCESSOR_IDENTIFIER', 'PROCESSOR_LEVEL', 'PROCESSOR_REVISION',
        'PROMPT', 'RANDOM', 'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'TIME', 'TMP', 'USERDOMAIN',
        'USERNAME', 'USERPROFILE', 'WINDIR', 'ALLUSERSPROFILE', 'PUBLIC', 'PROGRAMDATA', 'PROGRAMFILES',
        'PROGRAMFILES(X86)', 'DRIVERDATA'
    ],

    // Common Batch Commands (for Custom Command block)
    stdCmds: [
        { n: 'ASSOC', d: 'Displays or modifies file extension associations.' },
        { n: 'ATTRIB', d: 'Displays or changes file attributes.' },
        { n: 'BREAK', d: 'Sets or clears extended CTRL+C checking.' },
        { n: 'BCDEDIT', d: 'Sets properties in boot database.' },
        { n: 'CACLS', d: 'Displays or modifies access control lists (ACLs) of files.' },
        { n: 'CALL', d: 'Calls one batch program from another.' },
        { n: 'CD', d: 'Displays the name of or changes the current directory.' },
        { n: 'CHCP', d: 'Displays or sets the active code page number.' },
        { n: 'CHDIR', d: 'Displays the name of or changes the current directory.' },
        { n: 'CHKDSK', d: 'Checks a disk and displays a status report.' },
        { n: 'CHKNTFS', d: 'Displays or modifies the checking of disk at boot time.' },
        { n: 'CLS', d: 'Clears the screen.' },
        { n: 'CMD', d: 'Starts a new instance of the Windows command interpreter.' },
        { n: 'COLOR', d: 'Sets the default console foreground and background colors.' },
        { n: 'COMP', d: 'Compares the contents of two files or sets of files.' },
        { n: 'COMPACT', d: 'Displays or alters the compression of files on NTFS partitions.' },
        { n: 'CONVERT', d: 'Converts FAT volumes to NTFS.' },
        { n: 'COPY', d: 'Copies one or more files to another location.' },
        { n: 'DATE', d: 'Displays or sets the date.' },
        { n: 'DEL', d: 'Deletes one or more files.' },
        { n: 'DIR', d: 'Displays a list of files and subdirectories in a directory.' },
        { n: 'DISKPART', d: 'Displays or configures Disk Partition properties.' },
        { n: 'DOSKEY', d: 'Edits command lines, recalls Windows commands, and creates macros.' },
        { n: 'DRIVERQUERY', d: 'Enables an administrator to display a list of installed device drivers.' },
        { n: 'ECHO', d: 'Displays messages, or turns command echoing on or off.' },
        { n: 'ENDLOCAL', d: 'Ends localization of environment changes in a batch file.' },
        { n: 'ERASE', d: 'Deletes one or more files.' },
        { n: 'EXIT', d: 'Quits the CMD.EXE program (command interpreter).' },
        { n: 'FC', d: 'Compares two files or sets of files, and displays the differences between them.' },
        { n: 'FIND', d: 'Searches for a text string in a file or files.' },
        { n: 'FINDSTR', d: 'Searches for strings in files.' },
        { n: 'FOR', d: 'Runs a specified command for each file in a set of files.' },
        { n: 'FORMAT', d: 'Formats a disk for use with Windows.' },
        { n: 'FSUTIL', d: 'Displays or configures the file system properties.' },
        { n: 'FTYPE', d: 'Displays or modifies file types used in file extension associations.' },
        { n: 'GOTO', d: 'Directs the Windows command interpreter to a labeled line in a batch program.' },
        { n: 'GPRESULT', d: 'Displays Group Policy information for machine or user.' },
        { n: 'HELP', d: 'Provides Help information for Windows commands.' },
        { n: 'ICACLS', d: 'Display, modify, backup, or restore ACLs for files and directories.' },
        { n: 'IF', d: 'Performs conditional processing in batch programs.' },
        { n: 'LABEL', d: 'Creates, changes, or deletes the volume label of a disk.' },
        { n: 'MD', d: 'Creates a directory.' },
        { n: 'MKDIR', d: 'Creates a directory.' },
        { n: 'MKLINK', d: 'Creates Symbolic Links and Hard Links.' },
        { n: 'MODE', d: 'Configures a system device.' },
        { n: 'MORE', d: 'Displays output one screen at a time.' },
        { n: 'MOVE', d: 'Moves one or more files from one directory to another directory.' },
        { n: 'OPENFILES', d: 'Displays files opened by remote users for a file share.' },
        { n: 'PATH', d: 'Displays or sets a search path for executable files.' },
        { n: 'PAUSE', d: 'Suspends processing of a batch file and displays a message.' },
        { n: 'POPD', d: 'Restores the previous value of the current directory saved by PUSHD.' },
        { n: 'PRINT', d: 'Prints a text file.' },
        { n: 'PROMPT', d: 'Changes the Windows command prompt.' },
        { n: 'PUSHD', d: 'Saves the current directory then changes it.' },
        { n: 'RD', d: 'Removes a directory.' },
        { n: 'RECOVER', d: 'Recovers readable information from a bad or defective disk.' },
        { n: 'REM', d: 'Records comments (remarks) in batch files or CONFIG.SYS.' },
        { n: 'REN', d: 'Renames a file or files.' },
        { n: 'RENAME', d: 'Renames a file or files.' },
        { n: 'REPLACE', d: 'Replaces files.' },
        { n: 'RMDIR', d: 'Removes a directory.' },
        { n: 'ROBOCOPY', d: 'Advanced utility to copy files and directory trees.' },
        { n: 'SET', d: 'Displays, sets, or removes Windows environment variables.' },
        { n: 'SETLOCAL', d: 'Begins localization of environment changes in a batch file.' },
        { n: 'SC', d: 'Displays or configures services (background processes).' },
        { n: 'SCHTASKS', d: 'Schedules commands and programs to run on a computer.' },
        { n: 'SHIFT', d: 'Shifts the position of replaceable parameters in batch files.' },
        { n: 'SHUTDOWN', d: 'Allows proper local or remote shutdown of machine.' },
        { n: 'SORT', d: 'Sorts input.' },
        { n: 'START', d: 'Starts a separate window to run a specified program or command.' },
        { n: 'SUBST', d: 'Associates a path with a drive letter.' },
        { n: 'SYSTEMINFO', d: 'Displays machine specific properties and configuration.' },
        { n: 'TASKKILL', d: 'Terminates or stops a running process or application.' },
        { n: 'TASKLIST', d: 'Displays all currently running tasks including services.' },
        { n: 'TIME', d: 'Displays or sets the system time.' },
        { n: 'TITLE', d: 'Sets the window title for a CMD.EXE session.' },
        { n: 'TREE', d: 'Graphically displays the directory structure of a drive or path.' },
        { n: 'TYPE', d: 'Displays the contents of a text file.' },
        { n: 'VER', d: 'Displays the Windows version.' },
        { n: 'VERIFY', d: 'Tells Windows whether to verify that your files are written correctly to a disk.' },
        { n: 'VOL', d: 'Displays a disk volume label and serial number.' },
        { n: 'XCOPY', d: 'Copies files and directory trees.' },
        { n: 'WMIC', d: 'Displays WMI information inside interactive command shell.' },
        { n: 'NET', d: 'Manage network resources.' },
        { n: 'PING', d: 'Verify IP-level connectivity to another TCP/IP computer.' },
        { n: 'IPCONFIG', d: 'Displays all current TCP/IP network configuration values.' }
    ],

    // Common Flags for generic commands
    stdFlags: [
        { n: '/?', d: 'Help' }
    ],

    // Expanded Command Arguments Database
    commandArgs: {
        'DIR': [
            { n: '/A', d: 'Attributes' }, { n: '/B', d: 'Bare format' }, { n: '/S', d: 'Recursive' },
            { n: '/O', d: 'Order' }, { n: '/P', d: 'Pause per screen' }, { n: '/W', d: 'Wide list' }
        ],
        'DEL': [
            { n: '/P', d: 'Prompt before delete' }, { n: '/F', d: 'Force delete' },
            { n: '/S', d: 'Delete from subfiles' }, { n: '/Q', d: 'Quiet mode' },
            { n: '/A', d: 'Select by attribute' }
        ],
        'COPY': [
            { n: '/V', d: 'Verify' }, { n: '/N', d: 'Short filenames' }, { n: '/Y', d: 'Suppress prompt' },
            { n: '/-Y', d: 'Prompt overwrite' }, { n: '/Z', d: 'Restartable' }
        ],
        'ROBOCOPY': [
            { n: '/MIR', d: 'Mirror directory tree' }, { n: '/E', d: 'Copy subdirectories (includes empty)' },
            { n: '/S', d: 'Copy subdirectories (excludes empty)' }, { n: '/Z', d: 'Restartable mode' },
            { n: '/R:n', d: 'Number of retries' }, { n: '/W:n', d: 'Wait time between retries' },
            { n: '/MT:n', d: 'Multi-threaded copy' }, { n: '/LOG:file', d: 'Output status to log file' },
            { n: '/NFL', d: 'No file list logging' }, { n: '/NDL', d: 'No directory list logging' }
        ],
        'XCOPY': [
            { n: '/S', d: 'Copy folders except empty' }, { n: '/E', d: 'Copy folders including empty' },
            { n: '/C', d: 'Continue on error' }, { n: '/I', d: 'Assume dest is folder if multiple files' },
            { n: '/Q', d: 'Quiet mode' }, { n: '/F', d: 'Display full source/dest names' },
            { n: '/H', d: 'Copy hidden/system files' }, { n: '/Y', d: 'Suppress overwrite prompt' }
        ],
        'ATTRIB': [
            { n: '+R', d: 'Set Read-only' }, { n: '-R', d: 'Clear Read-only' },
            { n: '+A', d: 'Set Archive' }, { n: '-A', d: 'Clear Archive' },
            { n: '+S', d: 'Set System' }, { n: '-S', d: 'Clear System' },
            { n: '+H', d: 'Set Hidden' }, { n: '-H', d: 'Clear Hidden' },
            { n: '/S', d: 'Process subfolders' }, { n: '/D', d: 'Process folders' }
        ],
        'NETSTAT': [
            { n: '-a', d: 'All connections & ports' }, { n: '-b', d: 'Executable involved' },
            { n: '-n', d: 'Numerical addresses' }, { n: '-o', d: 'Owning process ID' }
        ],
        'IPCONFIG': [
            { n: '/all', d: 'Display full config' }, { n: '/release', d: 'Release IPv4 address' },
            { n: '/renew', d: 'Renew IPv4 address' }, { n: '/flushdns', d: 'Purge DNS Resolver cache' }
        ],
        'SHUTDOWN': [
            { n: '/s', d: 'Shutdown' }, { n: '/r', d: 'Restart' }, { n: '/a', d: 'Abort' },
            { n: '/t', d: 'Time delay (sec)' }, { n: '/f', d: 'Force close apps' }
        ],
        'SCHTASKS': [
            { n: '/Create', d: 'Create new task' }, { n: '/Delete', d: 'Delete task' },
            { n: '/Query', d: 'Display tasks' }, { n: '/Run', d: 'Run task immediately' },
            { n: '/End', d: 'Stop running task' }, { n: '/Change', d: 'Change task properties' }
        ]
        ,
        'SET': [
            { n: '/A', d: 'Arithmetic expression' }, { n: '/P', d: 'Prompt for input' }
        ]
    },

    // Field-Specific Completion Rules (Block ID -> Field Index -> Rule)
    blockFieldRules: {
        // Basic
        'color': { 0: { type: 'enum', options: ['07', '0A', '0B', '0C', '0D', '0E', '0F', 'F0'] } },
        'start': { 0: { type: 'file' } },
        'call': { 0: { type: 'file', ext: ['.bat', '.cmd'] } },

        // Flow
        'goto': { 0: { type: 'label' } },
        'call_label': { 0: { type: 'label' } },
        'pushd': { 0: { type: 'file', dirOnly: true } },

        // FileSystem
        'cd': { 0: { type: 'file', dirOnly: true } },
        'md': { 0: { type: 'none' } },
        'rd': { 0: { type: 'file', dirOnly: true } },
        'del': { 0: { type: 'file' } },
        'ren': { 0: { type: 'file' } },
        'copy': { 0: { type: 'file' }, 1: { type: 'file', dirOnly: true } },
        'move': { 0: { type: 'file' }, 1: { type: 'file', dirOnly: true } },
        'robocopy': { 0: { type: 'file', dirOnly: true }, 1: { type: 'file', dirOnly: true }, 2: { type: 'flag', cmd: 'ROBOCOPY' } },
        'xcopy': { 0: { type: 'file' }, 1: { type: 'file' }, 2: { type: 'flag', cmd: 'XCOPY' } },
        'attrib': { 0: { type: 'flag', cmd: 'ATTRIB' }, 1: { type: 'file' } },
        'type': { 0: { type: 'file' } },
        'echo_to_file': { 1: { type: 'file' } },
        'find': { 1: { type: 'file' } },
        'findstr': { 1: { type: 'file' }, 2: { type: 'flag', cmd: 'FINDSTR' } },
        'print': { 0: { type: 'file' } },
        'comp': { 0: { type: 'file' }, 1: { type: 'file' } },
        'fc': { 0: { type: 'file' }, 1: { type: 'file' }, 2: { type: 'flag', cmd: 'FC' } },
        'sort': { 0: { type: 'file' } },
        'recover': { 0: { type: 'file' } },
        'mklink': { 2: { type: 'file' } },
        'compact': { 1: { type: 'file' } },

        // System
        'assoc': { 0: { type: 'enum', options: ['.txt', '.bat', '.cmd', '.ps1', '.exe'] } },
        'icacls': { 0: { type: 'file' } },
        'schtasks_create': { 2: { type: 'file' } },

        // Network
        'ftp': { 1: { type: 'file' } },
        'curl': { 1: { type: 'file' } },

        // External / Scripts
        'py_run': { 0: { type: 'file', ext: ['.py'] } },
        'java_run': { 0: { type: 'file', ext: ['.jar', '.class'] } },
        '7zip_create': { 1: { type: 'file' } }
    },

    // Common File System Paths
    fileSystemItems: [
        { n: '.\\', d: 'Current Directory' },
        { n: '..\\', d: 'Parent Directory' },
        { n: '*.*', d: 'All Files' },
        { n: 'C:\\', d: 'Root Drive' },
        { n: '%USERPROFILE%', d: 'User Profile' },
        { n: '%TEMP%', d: 'Temp Folder' },
        { n: '%WINDIR%', d: 'Windows Directory' },
        { n: '*.txt', d: 'Text Files' },
        { n: '*.bat', d: 'Batch Files' },
        { n: '*.exe', d: 'Executables' },
        { n: '?', d: 'Single Wildcard' },
        { n: '*', d: 'Multi Wildcard' }
    ],

    getSuggestions: function (inputVal, cursorIndex, blockId, fieldIndex) {
        // Get the word being typed at the cursor
        const prefix = inputVal.substring(0, cursorIndex);

        // 1. Identify the "Active Token" (word being typed)
        // Match last token: starts with %, :, /, -, \, ., or just alphanumeric
        // Added ? and * to regex to support wildcard typing
        const tokenMatch = prefix.match(/([%:\w\\/\.\-\*\?]+)$/);
        const token = tokenMatch ? tokenMatch[1] : '';

        // 2. Identify "Active Command" or Context
        let cmdName = null;

        if (blockId === 'custom_cmd') {
            // Check if we are past the first word (command) using regex on prefix
            // Matches: Start, optional space, non-space (cmd), required space
            const cmdMatch = prefix.match(/^\s*(\S+)\s+/);
            if (cmdMatch) {
                cmdName = cmdMatch[1].toUpperCase();
            }
        } else {
            // Map blockId to command name (simple mapping)
            cmdName = blockId.toUpperCase();
            // Handle specific block IDs that don't match command names exactly
            if (blockId === 'schtasks_create') cmdName = 'SCHTASKS';
        }

        // Handle Empty Input Defaults (Compact Mode)
        if (!tokenMatch && !cmdName) {
            if (inputVal.trim() === '') {
                const defaults = ['ECHO', 'SET', 'IF', 'GOTO'];
                const list = defaults.map(name => {
                    const cmd = this.stdCmds.find(c => c.n === name) || { n: name, d: '' };
                    return { text: cmd.n, label: cmd.n, type: 'command', icon: 'terminal', desc: cmd.d, appendSpace: true };
                });
                return { list: list, token: '', isDefault: true };
            }
            return { list: [], token: '' };
        }

        let suggestions = [];
        const search = token.toUpperCase();

        // 3. Check Block Field Rules (Priority)
        if (this.blockFieldRules[blockId] && this.blockFieldRules[blockId][fieldIndex]) {
            const rule = this.blockFieldRules[blockId][fieldIndex];

            if (rule.type === 'enum') {
                suggestions = rule.options.filter(o => o.toUpperCase().startsWith(search)).map(o => ({
                    text: o, label: o, type: 'value', icon: 'list', desc: 'Option'
                }));
            } else if (rule.type === 'label') {
                // Fallthrough to label logic below
            } else if (rule.type === 'file') {
                // Fallthrough to file logic below, but prioritize
                cmdName = 'DIR'; // Force file logic
            } else if (rule.type === 'flag') {
                cmdName = rule.cmd; // Force flag logic for specific cmd
            } else if (rule.type === 'none') {
                return { list: [], token: token };
            }
        }

        // 4. Logic Branching

        // 3. Logic Branching

        // A. Variable Completion (%VAR)
        if (token.startsWith('%')) {
            // Get defined vars from Linter if available, plus standards
            const defined = typeof BatchLinter !== 'undefined' ? Array.from(BatchLinter.definedVars) : [];
            const allVars = [...new Set([...this.stdVars, ...defined])];

            suggestions = allVars
                .filter(v => v.startsWith(search))
                .map(v => ({
                    text: `%${v}%`,
                    label: v,
                    type: 'variable',
                    icon: 'data_object',
                    desc: 'Variable'
                }));
        }
        // B. Label Completion (:LABEL)
        else if (token.startsWith(':') || (this.blockFieldRules[blockId]?.[fieldIndex]?.type === 'label')) {
            const labelSearch = token.startsWith(':') ? search.substring(1) : search;
            const labels = this.scanLabels();
            suggestions = labels
                .filter(l => l.toUpperCase().startsWith(labelSearch))
                .map(l => ({
                    text: token.startsWith(':') ? `:${l}` : l,
                    label: l,
                    type: 'label',
                    icon: 'label',
                    desc: 'Label'
                }));
        }
        // C. Command Args / Flags / File System
        else if (cmdName) {
            // 1. Check for Arguments/Flags
            let argMatches = [];
            if (this.commandArgs[cmdName]) {
                const args = this.commandArgs[cmdName];
                argMatches = args.filter(a => a.n.toUpperCase().startsWith(search));
            } else {
                // Generic flags if command not known but looks like flag typing
                if (token.startsWith('/') || token.startsWith('-')) {
                    argMatches = this.stdFlags.filter(a => a.n.toUpperCase().startsWith(search));
                }
            }

            suggestions.push(...argMatches.map(a => ({
                text: a.n, label: a.n, type: 'flag', icon: 'flag', desc: a.d
            })));

            // 2. File System Priority
            // If command expects files OR token looks like a path
            const fileCmds = ['CD', 'DIR', 'DEL', 'COPY', 'MOVE', 'REN', 'TYPE', 'ROBOCOPY', 'XCOPY', 'ATTRIB', 'START'];
            const isFileCmd = fileCmds.includes(cmdName);

            if (isFileCmd || token.includes('\\') || token.includes('/') || token === '.' || token.includes('*') || token.includes('?')) {
                const fsMatches = this.fileSystemItems.filter(f => f.n.toUpperCase().startsWith(search));
                const fsSuggestions = fsMatches.map(f => ({
                    text: f.n, label: f.n, type: 'file', icon: 'folder', desc: f.d
                }));

                // Prioritize FS suggestions if it's a file command
                if (isFileCmd) {
                    suggestions = [...fsSuggestions, ...suggestions];
                } else {
                    suggestions = [...suggestions, ...fsSuggestions];
                }
            }
        }
        // D. New Command (Start of line or custom_cmd start)
        else if (!cmdName && blockId === 'custom_cmd') {
            // Only suggest if length >= 1 to avoid spamming on every letter
            if (search.length >= 1) {
                suggestions = this.stdCmds
                    .filter(c => c.n.startsWith(search))
                    .map(c => ({
                        text: c.n,
                        label: c.n,
                        type: 'command',
                        icon: 'terminal',
                        desc: c.d,
                        appendSpace: true
                    }));
            }
        }

        // Filter out exact matches to prevent menu sticking (e.g. if I typed "ECHO", don't suggest "ECHO")
        suggestions = suggestions.filter(s => s.text.toUpperCase() !== token.toUpperCase());

        return { list: suggestions.slice(0, 12), token: token }; // Increased limit
    },

    scanLabels: function () {
        const labels = [];
        document.querySelectorAll('.script-block[data-cmd-id="label"]').forEach(b => {
            const inputs = b.querySelectorAll('.cmd-input');
            if (inputs.length > 0) {
                const val = inputs[0].value.trim();
                if (val) labels.push(val.replace(/^:/, ''));
            }
        });
        return labels;
    }
};
