// settings.js — Orchid settings application
import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { settings } from '/sys/settings.js';
import { getFS } from '/sys/fs.js';
import { bus } from '/sys/bus.js';

const ACCENTS = {
    blue: '#5b9bd5',
    coral: '#e8736a',
    mint: '#a8d5c8',
    lime: '#c8e05a'
};

const section = (title, children) => h('div', {
    style: 'margin-bottom:22px; color:inherit;'
}, [
    h('div', { style: 'font-size:13px; font-weight:700; color:inherit; margin-bottom:10px;' }, title),
    children
]);

const control = (label, input, hint) => h('label', {
    style: 'display:flex; flex-direction:column; gap:6px; font-size:13px; color:inherit; margin-bottom:14px;'
}, [
    h('span', { style: 'display:flex; justify-content:space-between; align-items:center; gap:12px;' }, [
        h('span', { style: 'flex:1; min-width:0;' }, label),
        input
    ]),
    hint ? h('span', { style: 'color:#777; font-size:12px;' }, hint) : null
]);

export default function Settings() {
    const [prefs, setPrefs] = useState(settings.get());

    useEffect(() => settings.onChange(setPrefs), []);

    const update = (key, value) => settings.set(key, value);

    const resetSettings = () => {
        if (!confirm('Reset all Orchid preferences to defaults?')) return;
        settings.reset();
        window.location.reload();
    };

    const resetFilesystem = () => {
        if (!confirm('Reset the virtual filesystem? This will delete all files.')) return;
        getFS().reset();
        bus.emit('fs-changed');
        alert('Filesystem has been reset.');
    };

    const themeBackground = prefs.theme === 'dark' ? '#12131d' : '#fafafa';
    const themeText = prefs.theme === 'dark' ? '#f7f7fb' : '#1a1a1a';
    const themePanel = prefs.theme === 'dark' ? '#1f2130' : '#ffffff';
    const borderColor = prefs.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    return h('div', {
        style: `display:flex; flex-direction:column; height:100%; min-height:0; overflow:auto; background:${themeBackground}; color:${themeText}; padding:18px;`
    }, [
        h('div', { style: `font-size:17px; font-weight:700; color:${themeText}; margin-bottom:18px;` }, 'Settings'),

        section('Appearance', h('div', null, [
            control('Theme', h('select', {
                value: prefs.theme,
                onChange: e => update('theme', e.target.value),
                style: `padding:9px 10px; border:1px solid ${borderColor}; border-radius:10px; background:${themePanel}; color:${themeText};`
            }, [
                h('option', { value: 'light' }, 'Light'),
                h('option', { value: 'dark' }, 'Dark')
            ]), 'Choose the main Orchid color scheme.'),
            control('Accent color', h('select', {
                value: prefs.accent,
                onChange: e => update('accent', e.target.value),
                style: `padding:9px 10px; border:1px solid ${borderColor}; border-radius:10px; background:${themePanel}; color:${themeText};`
            }, Object.entries(ACCENTS).map(([key, value]) => h('option', { value: key }, key.charAt(0).toUpperCase() + key.slice(1)))), 'Accent color for taskbar and highlight text.'),
            control('Window blur', h('select', {
                value: prefs.windowBlur,
                onChange: e => update('windowBlur', e.target.value),
                style: `padding:9px 10px; border:1px solid ${borderColor}; border-radius:10px; background:${themePanel}; color:${themeText};`
            }, [
                h('option', { value: 'soft' }, 'Soft'),
                h('option', { value: 'medium' }, 'Medium'),
                h('option', { value: 'strong' }, 'Strong')
            ]), 'Choose how much blur the window glass uses.'),
            control('Terminal theme', h('select', {
                value: prefs.terminalTheme,
                onChange: e => update('terminalTheme', e.target.value),
                style: `padding:9px 10px; border:1px solid ${borderColor}; border-radius:10px; background:${themePanel}; color:${themeText};`
            }, [
                h('option', { value: 'auto' }, 'Follow Orchid theme'),
                h('option', { value: 'light' }, 'Light'),
                h('option', { value: 'dark' }, 'Dark')
            ]), 'Terminal colors can follow Orchid or use a dedicated theme.')
        ])),

        section('Taskbar', h('div', null, [
            control('Taskbar position', h('select', {
                value: prefs.taskbarPosition,
                onChange: e => update('taskbarPosition', e.target.value),
                style: `padding:9px 10px; border:1px solid ${borderColor}; border-radius:10px; background:${themePanel}; color:${themeText};`
            }, [
                h('option', { value: 'bottom' }, 'Bottom'),
                h('option', { value: 'top' }, 'Top'),
                h('option', { value: 'left' }, 'Left'),
                h('option', { value: 'right' }, 'Right')
            ]), 'Where the Orchid taskbar appears on screen.'),
            control('Compact taskbar', h('input', {
                type: 'checkbox',
                checked: prefs.compactTaskbar,
                onChange: e => update('compactTaskbar', e.target.checked)
            }), 'Use smaller taskbar icons and padding.'),
            control('Show taskbar labels', h('input', {
                type: 'checkbox',
                checked: prefs.showTaskbarLabels,
                onChange: e => update('showTaskbarLabels', e.target.checked)
            }), 'Show names under taskbar icons.')
        ])),

        section('Behavior', h('div', null, [
            control('Show welcome card', h('input', {
                type: 'checkbox',
                checked: prefs.showWelcome,
                onChange: e => update('showWelcome', e.target.checked)
            }), 'Show the Orchid welcome card when the desktop starts.')
        ])),

        section('System', h('div', null, [
            h('button', {
                onClick: resetSettings,
                style: 'width:100%; margin-bottom:10px; background:#5b9bd5; color:white; border:none; padding:10px 12px; border-radius:10px; cursor:pointer; font-size:13px;'
            }, 'Reset settings'),
            h('button', {
                onClick: resetFilesystem,
                style: 'width:100%; background:#e8736a; color:white; border:none; padding:10px 12px; border-radius:10px; cursor:pointer; font-size:13px;'
            }, 'Reset filesystem')
        ]))
    ]);
}
