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
        style: 'display:flex; flex-direction:column; height:100%; background:#f0f0f0; overflow:hidden;'
    }, [
        // Tab Bar
        h('div', {
            style: 'display:flex; background:#d0d0d0; padding:6px 6px 0; gap:4px; align-items:center; border-bottom:1px solid #bbb;'
        }, [
            tabs.map(tab => h('div', {
                onClick: () => { setActiveTabId(tab.id); setInputUrl(tab.url); },
                              style: `
                              display:flex; align-items:center; gap:10px; padding:6px 14px; font-size:11px; border-radius:6px 6px 0 0; cursor:pointer;
                              background: ${tab.id === activeTabId ? '#fff' : 'rgba(255,255,255,0.3)'};
                              color: ${tab.id === activeTabId ? '#000' : '#555'};
                              border: 1px solid ${tab.id === activeTabId ? '#bbb' : 'transparent'};
                              border-bottom: none;
                              transition: background 0.2s;
                              `
            }, [
                h('span', { style: 'max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' }, tab.title),
                              h('span', {
                                  onClick: (e) => closeTab(e, tab.id),
                                style: 'font-weight:bold; opacity:0.4; font-size:14px;'
                              }, '×')
            ])),
          h('button', {
              onClick: addTab,
              style: 'border:none; background:transparent; font-size:20px; cursor:pointer; color:#666; padding-bottom:4px;'
          }, '+')
        ]),

        // URL bar
        h('form', {
            onSubmit: navigate,
          style: 'display:flex; padding:6px 10px; background:#fff; border-bottom:1px solid #ddd;'
        }, [
            h('input', {
                value: inputUrl,
                onInput: (e) => setInputUrl(e.target.value),
              style: 'flex:1; padding:5px 12px; border-radius:4px; border:1px solid #ccc; font-size:12px; outline:none; background:#f9f9f9;'
            })
        ]),

        // The Magic Iframe
        h('div', { style: 'flex:1; background:#fff; position:relative;' }, [
            h('iframe', {
                src: activeTab.url,
                /* Removing 'allow-popups' ensures that target="_blank" links
                 *                  are forced to try and open within the frame (or fail gracefully)
                 *                  rather than opening a real browser tab.
                 */
                sandbox: 'allow-forms allow-scripts allow-same-origin',
                style: 'width:100%; height:100%; border:none;'
            })
        ])
    ]);
}
