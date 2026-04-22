// settings.js — Orchid system preferences store
import { bus } from './bus.js';

const STORAGE_KEY = 'orchid-settings';
const defaultSettings = {
    theme: 'light',
    accent: 'blue',
    showWelcome: true,
    compactTaskbar: false,
    showTaskbarLabels: false,
    taskbarPosition: 'bottom',
    windowBlur: 'medium',
    terminalTheme: 'auto'
};

const listeners = new Set();

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch (error) {
        console.warn('Failed to load settings:', error);
        return defaultSettings;
    }
}

let state = loadSettings();

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach(fn => fn(state));
    bus.emit('settings-changed', state);
}

export const settings = {
    get() {
        return { ...state };
    },
    set(key, value) {
        state = { ...state, [key]: value };
        persist();
    },
    reset() {
        state = { ...defaultSettings };
        persist();
    },
    onChange(fn) {
        listeners.add(fn);
        fn(state);
        return () => listeners.delete(fn);
    }
};
