// terminal.js — Orchid terminal, dark pane inside light window
import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { getFS } from '/sys/fs.js';
import { settings } from '/sys/settings.js';

const PALETTES = {
    dark: {
        prompt: '#5b9bd5',
        err:    '#e8736a',
        dir:    '#5b9bd5',
        info:   '#aaa',
        out:    '#e0e0e0',
        bg:     '#1e2128',
        inputBg:'#161a20',
    },
    light: {
        prompt: '#5b9bd5',
        err:    '#e8736a',
        dir:    '#5b9bd5',
        info:   '#555',
        out:    '#1a1a1a',
        bg:     '#fafafa',
        inputBg:'#f3f4f6',
    }
};

function parseLine(raw) {
    const tokens = [];
    let cur = '', inQuote = false;
    for (const c of raw) {
        if (c === '"' || c === "'") { inQuote = !inQuote; continue; }
        if (c === ' ' && !inQuote) { if (cur) { tokens.push(cur); cur = ''; } continue; }
        cur += c;
    }
    if (cur) tokens.push(cur);
    return tokens;
}

const HELP = `Available commands:
  ls [path]        list directory
  cd [path]        change directory
  pwd              print working directory
  cat <file>       read file
  touch <file>     create file
  mkdir <dir>      create directory
  rm [-r] <path>   remove
  mv <src> <dst>   move / rename
  cp <src> <dst>   copy
  echo [text]      print text
  echo t > file    write to file
  clear            clear screen
  reset-fs         reset filesystem
  help             this message`;

export default function Terminal() {
    const fs = getFS();
    const [prefs, setPrefs] = useState(settings.get());
    useEffect(() => settings.onChange(setPrefs), []);
    const theme = prefs.terminalTheme === 'auto' ? prefs.theme : prefs.terminalTheme;
    const C = PALETTES[theme === 'dark' ? 'dark' : 'light'];
    const [cwd, setCwd] = useState('/home/user');
    const [history, setHistory] = useState([
        { type: 'info', text: 'Orchid Terminal — type "help" for commands' },
        { type: 'info', text: '─'.repeat(42) },
    ]);
    const [input, setInput] = useState('');
    const [cmdHistory, setCmdHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const push = (lines) => setHistory(p => [...p, ...(Array.isArray(lines) ? lines : [lines])]);

    const run = (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        push({ type: 'prompt', text: trimmed, cwd });
        setCmdHistory(p => [trimmed, ...p]);
        setHistIdx(-1);

        const tokens = parseLine(trimmed);
        const cmd = tokens[0];
        const args = tokens.slice(1);
        const redirIdx = args.indexOf('>');
        const echoContent = redirIdx !== -1 ? args.slice(0, redirIdx).join(' ') : null;
        const redirTarget = redirIdx !== -1 ? args[redirIdx + 1] : null;

        switch (cmd) {
            case 'help': push(HELP.split('\n').map(t => ({ type: 'info', text: t }))); break;
            case 'clear': setHistory([]); break;
            case 'pwd': push({ type: 'out', text: cwd }); break;
            case 'ls': {
                const r = fs.ls(args[0] || '.', cwd);
                if (r.error) { push({ type: 'err', text: r.error }); break; }
                if (!r.entries.length) { push({ type: 'info', text: '(empty)' }); break; }
                const sorted = [...r.entries].sort((a,b) => a.type !== b.type ? (a.type==='dir'?-1:1) : a.name.localeCompare(b.name));
                push(sorted.map(e => ({ type: 'ls', text: e.type==='dir' ? e.name+'/' : e.name, isDir: e.type==='dir' })));
                break;
            }
            case 'cd': {
                const target = args[0] ?? '/home/user';
                const resolved = fs.resolve(target, cwd);
                if (!fs.isDir(resolved)) push({ type: 'err', text: `cd: ${target}: No such directory` });
                else setCwd(resolved);
                break;
            }
            case 'cat': {
                if (!args[0]) { push({ type: 'err', text: 'cat: missing operand' }); break; }
                const r = fs.cat(args[0], cwd);
                if (r.error) { push({ type: 'err', text: r.error }); break; }
                push(r.content.split('\n').map(t => ({ type: 'out', text: t })));
                break;
            }
            case 'touch': {
                if (!args[0]) { push({ type: 'err', text: 'touch: missing operand' }); break; }
                const r = fs.touch(args[0], cwd);
                if (r.error) push({ type: 'err', text: r.error });
                break;
            }
            case 'mkdir': {
                if (!args[0]) { push({ type: 'err', text: 'mkdir: missing operand' }); break; }
                const r = fs.mkdir(args[0], cwd);
                if (r.error) push({ type: 'err', text: r.error });
                break;
            }
            case 'rm': {
                const recursive = args.includes('-r') || args.includes('-rf');
                const target = args.find(a => !a.startsWith('-'));
                if (!target) { push({ type: 'err', text: 'rm: missing operand' }); break; }
                const r = fs.rm(target, recursive, cwd);
                if (r.error) push({ type: 'err', text: r.error });
                break;
            }
            case 'mv': {
                if (args.length < 2) { push({ type: 'err', text: 'mv: missing operand' }); break; }
                const r = fs.mv(args[0], args[1], cwd);
                if (r.error) push({ type: 'err', text: r.error });
                break;
            }
            case 'cp': {
                if (args.length < 2) { push({ type: 'err', text: 'cp: missing operand' }); break; }
                const r = fs.cp(args[0], args[1], cwd);
                if (r.error) push({ type: 'err', text: r.error });
                break;
            }
            case 'echo': {
                if (redirTarget) {
                    const r = fs.write(redirTarget, (echoContent ?? '') + '\n', cwd);
                    if (r.error) push({ type: 'err', text: r.error });
                } else {
                    push({ type: 'out', text: args.join(' ') });
                }
                break;
            }
            case 'reset-fs': {
                fs.reset(); setCwd('/home/user');
                push({ type: 'info', text: 'Filesystem reset.' });
                break;
            }
            default: push({ type: 'err', text: `${cmd}: command not found` });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { run(input); setInput(''); }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const i = Math.min(histIdx + 1, cmdHistory.length - 1);
            setHistIdx(i); setInput(cmdHistory[i] ?? '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const i = Math.max(histIdx - 1, -1);
            setHistIdx(i); setInput(i === -1 ? '' : cmdHistory[i] ?? '');
        }
    };

    return h('div', {
        style: `display:flex; flex-direction:column; height:300px; background:${C.bg}; font-family:"Fira Code","Cascadia Code",monospace; font-size:13px;`,
        onClick: () => inputRef.current?.focus()
    }, [
        h('div', { style: 'flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:2px;' }, [
            ...history.map((line, i) => {
                if (line.type === 'prompt') return h('div', { key: i, style: 'display:flex; gap:6px;' }, [
                    h('span', { style: `color:${C.prompt}; flex-shrink:0;` }, line.cwd + ' $'),
                    h('span', { style: 'color:#e0e0e0;' }, line.text)
                ]);
                if (line.type === 'err')  return h('div', { key: i, style: `color:${C.err};` }, line.text);
                if (line.type === 'info') return h('div', { key: i, style: `color:${C.info};` }, line.text);
                if (line.type === 'ls')   return h('div', { key: i, style: `color:${line.isDir ? C.dir : '#e0e0e0'};` }, line.text);
                return h('div', { key: i, style: 'color:#e0e0e0;' }, line.text);
            }),
            h('div', { ref: bottomRef })
        ]),
        h('div', {
            style: `display:flex; align-items:center; gap:6px; padding:8px 14px; border-top:1px solid rgba(255,255,255,0.06); background:${C.inputBg};`
        }, [
            h('span', { style: `color:${C.prompt}; white-space:nowrap; flex-shrink:0;` }, cwd + ' $'),
            h('input', {
                ref: inputRef,
                value: input,
                onInput: e => setInput(e.target.value),
                onKeyDown: handleKeyDown,
                style: `flex:1; background:transparent; border:none; outline:none; color:#e0e0e0; font-family:inherit; font-size:inherit; caret-color:${C.prompt};`,
                spellcheck: false, autocomplete: 'off'
            })
        ])
    ]);
}
