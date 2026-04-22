// registry.js — Orchid application registry
import Terminal from '../apps/terminal.js';
import Clock from '../apps/clock.js';
import Notepad from '../apps/notepad.js';
import Surfer from '../apps/surfer.js';
import FileManager from '../apps/filemanager.js';
import TaskManager from '../apps/taskmanager.js';
import Settings from '../apps/settings.js';

const iconify = (name) => `https://api.iconify.design/${name}.svg?inline=false&color=%23323`;

export const APPS = {
    surfer:      { title: 'Surfer',      iconUrl: iconify('mdi:web'),                  component: Surfer,      width: 800 },
    terminal:    { title: 'Terminal',    iconUrl: iconify('mdi:console-line'),       component: Terminal,    width: 560 },
    clock:       { title: 'Clock',       iconUrl: iconify('mdi:clock-outline'),      component: Clock,       width: 300 },
    notepad:     { title: 'Notepad',     iconUrl: iconify('mdi:file-document-outline'), component: Notepad,   width: 520 },
    filemanager: { title: 'File Manager', iconUrl: iconify('mdi:folder-outline'),      component: FileManager, width: 400 },
    taskmanager: { title: 'Task Manager', iconUrl: iconify('mdi:clipboard-text-outline'), component: TaskManager, width: 400 },
    settings:    { title: 'Settings',    iconUrl: iconify('mdi:cog-outline'),         component: Settings,    width: 420 },
};
