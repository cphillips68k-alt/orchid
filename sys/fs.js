// fs.js — Virtual Filesystem Engine
// Tree structure: { type: 'dir'|'file', name, children?: {}, content?: string, created, modified }

const FS_KEY = 'dreamos_fs';

function defaultFS() {
    return {
        type: 'dir',
        name: '/',
        created: Date.now(),
        modified: Date.now(),
        children: {
            home: {
                type: 'dir', name: 'home', created: Date.now(), modified: Date.now(),
                children: {
                    user: {
                        type: 'dir', name: 'user', created: Date.now(), modified: Date.now(),
                        children: {
                            'readme.txt': {
                                type: 'file', name: 'readme.txt',
                                content: 'Welcome to Dream OS.\nYour personal userspace lives here.\n',
                                created: Date.now(), modified: Date.now()
                            },
                            'notes.txt': {
                                type: 'file', name: 'notes.txt',
                                content: '// your notes go here\n',
                                created: Date.now(), modified: Date.now()
                            }
                        }
                    }
                }
            },
            etc: {
                type: 'dir', name: 'etc', created: Date.now(), modified: Date.now(),
                children: {
                    'motd': {
                        type: 'file', name: 'motd',
                        content: 'Dream OS — Vibe Edition\nKernel: L4/Genode\nStatus: operational\n',
                        created: Date.now(), modified: Date.now()
                    }
                }
            },
            tmp: {
                type: 'dir', name: 'tmp', created: Date.now(), modified: Date.now(),
                children: {}
            }
        }
    };
}

function load() {
    try {
        const raw = localStorage.getItem(FS_KEY);
        return raw ? JSON.parse(raw) : defaultFS();
    } catch {
        return defaultFS();
    }
}

function save(tree) {
    localStorage.setItem(FS_KEY, JSON.stringify(tree));
}

// Resolve a path (absolute or relative to cwd) → array of node names
function resolvePath(path, cwd = '/') {
    const base = path.startsWith('/') ? [] : cwd.replace(/^\//, '').split('/').filter(Boolean);
    const parts = path.split('/').filter(Boolean);
    const stack = [...base];
    for (const p of parts) {
        if (p === '.') continue;
        else if (p === '..') stack.pop();
        else stack.push(p);
    }
    return stack;
}

// Get node at path, returns null if not found
function getNode(tree, path, cwd = '/') {
    const parts = resolvePath(path, cwd);
    let node = tree;
    for (const p of parts) {
        if (!node.children || !node.children[p]) return null;
        node = node.children[p];
    }
    return node;
}

// Get parent node and child name
function getParent(tree, path, cwd = '/') {
    const parts = resolvePath(path, cwd);
    if (parts.length === 0) return { parent: null, name: '/' };
    const name = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    let node = tree;
    for (const p of parentParts) {
        if (!node.children || !node.children[p]) return null;
        node = node.children[p];
    }
    return { parent: node, name };
}

// Public API
export function createFS() {
    let tree = load();

    const persist = () => save(tree);

    const api = {
        // Returns string path from parts array
        partsToPath(parts) {
            return '/' + parts.join('/');
        },

        // List directory contents
        ls(path = '/', cwd = '/') {
            const node = getNode(tree, path, cwd);
            if (!node) return { error: `ls: ${path}: No such file or directory` };
            if (node.type !== 'dir') return { error: `ls: ${path}: Not a directory` };
            return { entries: Object.values(node.children).map(n => ({ name: n.name, type: n.type })) };
        },

        // Read file
        cat(path, cwd = '/') {
            const node = getNode(tree, path, cwd);
            if (!node) return { error: `cat: ${path}: No such file or directory` };
            if (node.type !== 'file') return { error: `cat: ${path}: Is a directory` };
            return { content: node.content };
        },

        // Write/create file
        write(path, content, cwd = '/') {
            const result = getParent(tree, path, cwd);
            if (!result || !result.parent) return { error: `write: ${path}: Invalid path` };
            const { parent, name } = result;
            if (parent.type !== 'dir') return { error: `write: Not a directory` };
            const existing = parent.children[name];
            parent.children[name] = {
                type: 'file', name,
                content,
                created: existing?.created ?? Date.now(),
                modified: Date.now()
            };
            persist();
            return { ok: true };
        },

        // Touch (create empty file if not exists)
        touch(path, cwd = '/') {
            const node = getNode(tree, path, cwd);
            if (node) { node.modified = Date.now(); persist(); return { ok: true }; }
            return api.write(path, '', cwd);
        },

        // Make directory
        mkdir(path, cwd = '/') {
            const result = getParent(tree, path, cwd);
            if (!result || !result.parent) return { error: `mkdir: ${path}: Invalid path` };
            const { parent, name } = result;
            if (parent.children[name]) return { error: `mkdir: ${name}: File exists` };
            parent.children[name] = { type: 'dir', name, created: Date.now(), modified: Date.now(), children: {} };
            persist();
            return { ok: true };
        },

        // Remove file or directory
        rm(path, recursive = false, cwd = '/') {
            const result = getParent(tree, path, cwd);
            if (!result || !result.parent) return { error: `rm: ${path}: Invalid path` };
            const { parent, name } = result;
            const node = parent.children[name];
            if (!node) return { error: `rm: ${path}: No such file or directory` };
            if (node.type === 'dir' && !recursive) return { error: `rm: ${path}: Is a directory (use -r)` };
            delete parent.children[name];
            persist();
            return { ok: true };
        },

        // Move / rename
        mv(src, dest, cwd = '/') {
            const srcResult = getParent(tree, src, cwd);
            if (!srcResult || !srcResult.parent) return { error: `mv: ${src}: No such file or directory` };
            const { parent: srcParent, name: srcName } = srcResult;
            const node = srcParent.children[srcName];
            if (!node) return { error: `mv: ${src}: No such file or directory` };

            const destResult = getParent(tree, dest, cwd);
            if (!destResult || !destResult.parent) return { error: `mv: ${dest}: Invalid path` };
            const { parent: destParent, name: destName } = destResult;

            node.name = destName;
            destParent.children[destName] = node;
            delete srcParent.children[srcName];
            persist();
            return { ok: true };
        },

        // Copy
        cp(src, dest, cwd = '/') {
            const node = getNode(tree, src, cwd);
            if (!node) return { error: `cp: ${src}: No such file or directory` };
            if (node.type === 'dir') return { error: `cp: ${src}: Is a directory` };

            const destResult = getParent(tree, dest, cwd);
            if (!destResult || !destResult.parent) return { error: `cp: ${dest}: Invalid path` };
            const { parent, name } = destResult;

            parent.children[name] = { ...node, name, created: Date.now(), modified: Date.now() };
            persist();
            return { ok: true };
        },

        // Check if path is a valid directory (for cd)
        isDir(path, cwd = '/') {
            const node = getNode(tree, path, cwd);
            return node?.type === 'dir';
        },

        // Resolve path string (for cd)
        resolve(path, cwd = '/') {
            const parts = resolvePath(path, cwd);
            return '/' + parts.join('/');
        },

        // Get all files recursively (for notepad file browser)
        getAllFiles(dirPath = '/', cwd = '/') {
            const node = getNode(tree, dirPath, cwd);
            if (!node || node.type !== 'dir') return [];
            const results = [];
            function walk(n, path) {
                for (const child of Object.values(n.children)) {
                    const childPath = path === '/' ? '/' + child.name : path + '/' + child.name;
                    if (child.type === 'file') results.push({ path: childPath, name: child.name });
                    else walk(child, childPath);
                }
            }
            walk(node, dirPath === '/' ? '/' : api.resolve(dirPath, cwd));
            return results;
        },

        // Tree listing for a directory (one level)
        getTree(dirPath = '/', cwd = '/') {
            const node = getNode(tree, dirPath, cwd);
            if (!node || node.type !== 'dir') return [];
            function walk(n, depth) {
                const results = [];
                for (const child of Object.values(n.children).sort((a,b) => {
                    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                    return a.name.localeCompare(b.name);
                })) {
                    results.push({ name: child.name, type: child.type, depth });
                    if (child.type === 'dir') results.push(...walk(child, depth + 1));
                }
                return results;
            }
            return walk(node, 0);
        },

        // Reset to default
        reset() {
            tree = defaultFS();
            persist();
        }
    };

    return api;
}

// Singleton
let _fs = null;
export function getFS() {
    if (!_fs) _fs = createFS();
    return _fs;
}
