// notepad.js — Orchid light theme
import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { getFS } from './sys/fs.js';
import { bus } from './sys/bus.js';

const btn = (accent) => `
    background: ${accent ? 'rgba(94,53,177,0.1)' : 'rgba(0,0,0,0.05)'};
    border: 1px solid ${accent ? 'rgba(94,53,177,0.25)' : 'rgba(0,0,0,0.1)'};
    color: ${accent ? '#5e35b1' : '#555'};
    padding: 4px 12px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-family: 'DM Sans', system-ui;
    font-weight: 500;
`;

export default function Notepad() {
    const fs = getFS();
    const [content, setContent] = useState('');
    const [currentPath, setCurrentPath] = useState(null);
    const [saved, setSaved] = useState(true);
    const textareaRef = useRef(null);

    useEffect(() => {
        const result = fs.cat('/home/user/readme.txt');
        if (result.content !== undefined) {
            setContent(result.content);
            setCurrentPath('/home/user/readme.txt');
            setSaved(true);
        }
    }, []);

    useEffect(() => {
        const unsub = bus.on('open-file', (path) => {
            if (!saved && !confirm('Discard unsaved changes?')) return;
            const result = fs.cat(path);
            if (result.error) { alert(result.error); return; }
            setContent(result.content);
            setCurrentPath(path);
            setSaved(true);
            setTimeout(() => textareaRef.current?.focus(), 50);
        });
        return unsub;
    }, [saved]);

    const saveFile = () => {
        if (!currentPath) {
            const p = prompt('Save as (e.g. /home/user/file.txt):');
            if (!p) return;
            const r = fs.write(p, content);
            if (r.error) { alert(r.error); return; }
            setCurrentPath(p);
        } else {
            const r = fs.write(currentPath, content);
            if (r.error) { alert(r.error); return; }
        }
        setSaved(true);
        bus.emit('fs-changed');
    };

    const newFile = () => {
        if (!saved && !confirm('Discard unsaved changes?')) return;
        setContent(''); setCurrentPath(null); setSaved(true);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
        if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.target, start = el.selectionStart, end = el.selectionEnd;
            const next = content.substring(0, start) + '    ' + content.substring(end);
            setContent(next);
            setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4; }, 0);
        }
    };

    const fileName = currentPath ? currentPath.split('/').pop() : 'new file';
    const lineCount = content.split('\n').length;
    const wordCount = content.split(/\s+/).filter(w => w.length).length;

    return h('div', { style: 'display:flex; flex-direction:column; height:320px; background:#fafafa;' }, [
        h('div', {
            style: 'display:flex; gap:6px; padding:7px 12px; border-bottom:1px solid rgba(0,0,0,0.07); align-items:center; flex-shrink:0; background:rgba(255,255,255,0.8);'
        }, [
            h('button', { onClick: newFile, style: btn(false) }, '+ New'),
            h('button', { onClick: saveFile, style: btn(true) }, '💾 Save'),
            h('span', { style: 'margin-left:auto; font-size:11px; font-family:"DM Mono",monospace; color:#aaa;' },
                fileName + ' ' + (saved ? '●' : '○'))
        ]),
        h('textarea', {
            ref: textareaRef,
            value: content,
            onInput: e => { setContent(e.target.value); setSaved(false); },
            onKeyDown: handleKeyDown,
            style: 'flex:1; background:transparent; color:#1a1a2e; border:none; outline:none; padding:14px 16px; font-family:"DM Mono","Fira Code",monospace; font-size:13px; resize:none; line-height:1.7;',
            placeholder: 'Start typing...\nCtrl+S to save  ·  Double-click files in Files to open here',
            spellcheck: false
        }),
        h('div', {
            style: 'padding:4px 14px; border-top:1px solid rgba(0,0,0,0.06); color:#bbb; font-size:11px; display:flex; gap:16px; font-family:"DM Mono",monospace; flex-shrink:0; background:rgba(255,255,255,0.6);'
        }, [
            h('span', null, 'Ln ' + lineCount),
            h('span', null, wordCount + ' words'),
            h('span', null, content.length + ' chars'),
            currentPath && h('span', { style: 'margin-left:auto; color:#ccc;' }, currentPath)
        ])
    ]);
}
