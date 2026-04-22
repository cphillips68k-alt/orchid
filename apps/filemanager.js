// filemanager.js — Orchid light theme
import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useRef, useCallback } from 'https://esm.sh/preact/hooks';
import { getFS } from '/sys/fs.js';
import { bus } from '/sys/bus.js';

const SEL = '#5e35b1';
const DIR = '#1565c0';
const FILE = '#2d2d44';
const BORDER = 'rgba(0,0,0,0.07)';

const tbtn = `background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.09);color:#555;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'DM Sans',system-ui;font-weight:500;`;
const dbtn = `background:rgba(198,40,40,0.07);border:1px solid rgba(198,40,40,0.18);color:#c62828;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'DM Sans',system-ui;font-weight:500;`;

export default function FileManager() {
    const fs = getFS();
    const [cwd, setCwd] = useState('/');
    const [entries, setEntries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [renamingName, setRenamingName] = useState(null);
    const [renameVal, setRenameVal] = useState('');
    const [creatingType, setCreatingType] = useState(null);
    const [createVal, setCreateVal] = useState('');
    const [lastClick, setLastClick] = useState({ name: null, time: 0 });
    const renameRef = useRef(null);
    const createRef = useRef(null);

    const refresh = useCallback(() => {
        const result = fs.ls(cwd);
        if (result.error) { setEntries([]); return; }
        setEntries([...result.entries].sort((a,b) =>
            a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)
        ));
        setSelected(null);
    }, [cwd]);

    useEffect(() => { refresh(); }, [cwd]);
    useEffect(() => { const u = bus.on('fs-changed', refresh); return u; }, [refresh]);
    useEffect(() => { if (renamingName !== null) renameRef.current?.focus(); }, [renamingName]);
    useEffect(() => { if (creatingType !== null) createRef.current?.focus(); }, [creatingType]);

    const fullPath = (name) => cwd === '/' ? '/' + name : cwd + '/' + name;

    const goUp = () => {
        if (cwd === '/') return;
        const parts = cwd.split('/').filter(Boolean); parts.pop();
        setCwd(parts.length ? '/' + parts.join('/') : '/');
    };

    const handleClick = (name, type) => {
        const now = Date.now();
        const isDouble = lastClick.name === name && now - lastClick.time < 400;
        setLastClick({ name, time: now });
        if (isDouble) {
            if (type === 'dir') setCwd(fullPath(name));
            else { bus.emit('open-file', fullPath(name)); bus.emit('focus-app', 'notepad'); }
        } else setSelected(name === selected ? null : name);
    };

    const commitRename = () => {
        const newName = renameVal.trim();
        if (newName && newName !== renamingName) {
            const r = fs.mv(fullPath(renamingName), fullPath(newName));
            if (r.error) alert(r.error);
        }
        setRenamingName(null); setRenameVal(''); refresh();
    };

    const handleRenameKey = (e) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') { setRenamingName(null); setRenameVal(''); }
        e.stopPropagation();
    };

    const deleteSelected = () => {
        if (!selected) return;
        const isDir = entries.find(e => e.name === selected)?.type === 'dir';
        if (!confirm('Delete "' + selected + '"' + (isDir ? ' and all contents?' : '?'))) return;
        const r = fs.rm(fullPath(selected), isDir);
        if (r.error) alert(r.error);
        refresh();
    };

    const commitCreate = () => {
        const name = createVal.trim();
        if (name) {
            const r = creatingType === 'dir' ? fs.mkdir(fullPath(name)) : fs.touch(fullPath(name));
            if (r.error) alert(r.error);
        }
        setCreatingType(null); setCreateVal(''); refresh();
    };

    const handleCreateKey = (e) => {
        if (e.key === 'Enter') commitCreate();
        if (e.key === 'Escape') { setCreatingType(null); setCreateVal(''); }
        e.stopPropagation();
    };

    const breadcrumbs = () => {
        const parts = cwd.split('/').filter(Boolean);
        const crumbs = [{ label: '/', path: '/' }];
        let acc = '';
        for (const p of parts) { acc += '/' + p; crumbs.push({ label: p, path: acc }); }
        return crumbs;
    };

    const dis = (cond) => cond ? '' : 'opacity:0.35;pointer-events:none;';

    return h('div', { style: 'display:flex; flex-direction:column; height:360px; font-family:"DM Sans",system-ui; background:#fafafa;' }, [
        // Toolbar
        h('div', { style: 'display:flex; gap:6px; padding:8px 12px; border-bottom:1px solid ' + BORDER + '; align-items:center; flex-shrink:0; background:rgba(255,255,255,0.7); flex-wrap:wrap;' }, [
            h('button', { onClick: goUp, style: tbtn }, '↑ Up'),
            h('button', { onClick: () => { setCreatingType('dir'); setCreateVal(''); setSelected(null); }, style: tbtn }, '📁 Folder'),
            h('button', { onClick: () => { setCreatingType('file'); setCreateVal(''); setSelected(null); }, style: tbtn }, '📄 File'),
            h('button', { onClick: () => { if (selected) { setRenamingName(selected); setRenameVal(selected); } }, style: tbtn + dis(!!selected) }, '✏️ Rename'),
            h('button', { onClick: deleteSelected, style: dbtn + dis(!!selected) }, '🗑 Delete'),
        ]),

        // Breadcrumb
        h('div', { style: 'display:flex; align-items:center; gap:2px; padding:5px 14px; border-bottom:1px solid ' + BORDER + '; font-size:12px; flex-shrink:0; overflow:hidden; background:rgba(255,255,255,0.5);' },
            breadcrumbs().map((c, i, arr) => [
                h('span', { onClick: () => setCwd(c.path), style: 'cursor:pointer; color:' + (i===arr.length-1 ? SEL : '#aaa') + '; padding:1px 4px; border-radius:3px; font-weight:' + (i===arr.length-1?'500':'400') + ';' }, c.label),
                i < arr.length-1 && h('span', { style: 'color:#ddd;' }, '/')
            ])
        ),

        // File list
        h('div', { style: 'flex:1; overflow-y:auto; padding:4px 0;' }, [
            creatingType !== null && h('div', { style: 'display:flex; align-items:center; gap:10px; padding:7px 16px; background:rgba(94,53,177,0.06); border-left:2px solid ' + SEL + ';' }, [
                h('span', null, creatingType === 'dir' ? '📁' : '📄'),
                h('input', {
                    ref: createRef, value: createVal,
                    onInput: e => setCreateVal(e.target.value),
                    onKeyDown: handleCreateKey, onBlur: commitCreate,
                    placeholder: creatingType === 'dir' ? 'folder-name' : 'filename.txt',
                    style: 'background:transparent; border:none; border-bottom:1px solid ' + SEL + '; color:' + SEL + '; font-family:"DM Mono",monospace; font-size:13px; outline:none; width:200px;'
                })
            ]),

            entries.length === 0 && creatingType === null && h('div', { style: 'padding:24px; color:#ccc; font-size:12px; text-align:center;' }, '(empty directory)'),

            ...entries.map(entry => {
                const isSel = selected === entry.name;
                const isRenaming = renamingName === entry.name;
                return h('div', {
                    key: entry.name,
                    onClick: () => handleClick(entry.name, entry.type),
                    style: 'display:flex; align-items:center; gap:10px; padding:7px 16px; cursor:pointer; background:' + (isSel ? 'rgba(94,53,177,0.08)' : 'transparent') + '; border-left:2px solid ' + (isSel ? SEL : 'transparent') + '; color:' + (isSel ? SEL : entry.type === 'dir' ? DIR : FILE) + '; font-size:13px; user-select:none;'
                }, [
                    h('span', { style: 'font-size:16px; flex-shrink:0;' }, entry.type === 'dir' ? '📁' : '📄'),
                    isRenaming
                        ? h('input', {
                            ref: renameRef, value: renameVal,
                            onInput: e => setRenameVal(e.target.value),
                            onKeyDown: handleRenameKey, onBlur: commitRename,
                            onClick: e => e.stopPropagation(),
                            style: 'background:transparent; border:none; border-bottom:1px solid ' + SEL + '; color:' + SEL + '; font-family:"DM Mono",monospace; font-size:13px; outline:none; flex:1;'
                        })
                        : h('span', { style: 'flex:1;' }, entry.name),
                    entry.type === 'dir' && !isRenaming && h('span', { style: 'color:#ddd; font-size:14px;' }, '›')
                ]);
            })
        ]),

        // Status bar
        h('div', { style: 'padding:4px 14px; border-top:1px solid ' + BORDER + '; color:#ccc; font-size:11px; display:flex; gap:12px; flex-shrink:0; font-family:"DM Mono",monospace; background:rgba(255,255,255,0.5);' }, [
            h('span', null, entries.length + ' item' + (entries.length !== 1 ? 's' : '')),
            selected && h('span', { style: 'color:#aaa;' }, '"' + selected + '" selected'),
            h('span', { style: 'margin-left:auto; color:#ddd;' }, 'dbl-click to open')
        ])
    ]);
}
