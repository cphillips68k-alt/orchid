import { h } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';

export default function Surfer() {
    const [tabs, setTabs] = useState([
        { id: 1, title: 'Google', url: 'https://www.google.com/search?igu=1' }
    ]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [inputUrl, setInputUrl] = useState(tabs[0].url);

    const activeTab = tabs.find(t => t.id === activeTabId);

    const addTab = () => {
        const newId = Date.now();
        const newTab = { id: newId, title: 'New Tab', url: 'about:blank' };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        setInputUrl('');
    };

    const closeTab = (e, id) => {
        e.stopPropagation();
        if (tabs.length === 1) return;
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTabId === id) {
            const nextTab = remaining[remaining.length - 1];
            setActiveTabId(nextTab.id);
            setInputUrl(nextTab.url);
        }
    };

    const navigate = (e) => {
        e.preventDefault();
        let url = inputUrl;
        if (!url.startsWith('http') && url !== 'about:blank') {
            url = 'https://' + url;
        }

        setTabs(tabs.map(t =>
        t.id === activeTabId ? { ...t, url, title: url.split('/')[2] || url } : t
        ));
    };

    return h('div', {
        style: 'display:flex; flex:1; min-height:0; background:#e7eef8; overflow:hidden; border-radius:14px;'
    }, [
        h('div', {
            style: 'width:240px; min-width:240px; display:flex; flex-direction:column; gap:14px; padding:16px; background:#f4f7fb; border-right:1px solid rgba(15,23,42,0.08);'
        }, [
            h('div', { style: 'font-size:14px; font-weight:700; color:#1f2937; letter-spacing:0.02em;' }, 'Browser tabs'),
            h('div', { style: 'flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:4px;' },
                tabs.map(tab => h('button', {
                    key: tab.id,
                    type: 'button',
                    onClick: () => { setActiveTabId(tab.id); setInputUrl(tab.url); },
                    style: `display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; padding:12px 14px; border-radius:14px; border:1px solid ${tab.id === activeTabId ? '#5b9bd5' : 'transparent'}; background:${tab.id === activeTabId ? '#ffffff' : 'rgba(255,255,255,0.92)'}; color:${tab.id === activeTabId ? '#111827' : '#475569'}; cursor:pointer; text-align:left; font-size:13px; box-shadow:${tab.id === activeTabId ? '0 12px 30px rgba(91,155,213,0.12)' : 'none'};`,
                }, [
                    h('span', { style: 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' }, tab.title),
                    h('span', {
                        onClick: (e) => closeTab(e, tab.id),
                        style: 'flex-shrink:0; color:#64748b; font-size:16px; opacity:0.7;'
                    }, '×')
                ]))
            ),
            h('button', {
                onClick: addTab,
                style: 'border:none; background:#5b9bd5; color:white; padding:12px 14px; border-radius:14px; cursor:pointer; font-size:13px; font-weight:700; box-shadow:0 10px 25px rgba(91,155,213,0.16);'
            }, '+ New tab')
        ]),
        h('div', { style: 'flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; background:#f8fbff;' }, [
            h('div', {
                style: 'display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; background:#fff; border-bottom:1px solid #e2e8f0;'
            }, [
                h('div', { style: 'min-width:0; flex:1; display:flex; flex-direction:column; gap:6px; overflow:hidden;' }, [
                    h('div', { style: 'font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:0.14em;' }, 'Current tab'),
                    h('div', { style: 'font-size:16px; font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' }, activeTab.title)
                ]),
                h('button', {
                    type: 'button',
                    onClick: addTab,
                    style: 'border:none; background:rgba(91,155,213,0.12); color:#1d4ed8; padding:10px 16px; border-radius:12px; cursor:pointer; font-size:13px; font-weight:700;'
                }, 'New tab')
            ]),
            h('form', {
                onSubmit: navigate,
                style: 'display:flex; gap:10px; padding:14px 18px; background:#f8fafc; border-bottom:1px solid #e2e8f0;'
            }, [
                h('input', {
                    value: inputUrl,
                    onInput: (e) => setInputUrl(e.target.value),
                    placeholder: 'Enter a URL or search terms',
                    style: 'flex:1; padding:12px 14px; border-radius:14px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; font-size:14px; outline:none;'
                }),
                h('button', {
                    type: 'submit',
                    style: 'border:none; background:#5b9bd5; color:white; padding:12px 18px; border-radius:14px; cursor:pointer; font-size:14px; font-weight:700;'
                }, 'Go')
            ]),
            h('div', { style: 'flex:1; min-height:0; background:#ffffff; position:relative; overflow:hidden;' }, [
                h('iframe', {
                    src: activeTab.url,
                    sandbox: 'allow-forms allow-scripts allow-same-origin',
                    style: 'width:100%; height:100%; border:none;'
                })
            ])
        ])
    ]);
}
