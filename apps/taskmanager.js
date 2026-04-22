// taskmanager.js — Orchid Task Manager
import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { bus } from '/sys/bus.js';

export default function TaskManager() {
    const [tasks, setTasks] = useState([]); // Array of {id, title, appKey}

    useEffect(() => {
        // Listen for window open/close events from Desktop
        const unsubOpen = bus.on('window-opened', (task) => {
            setTasks(prev => [...prev.filter(t => t.id !== task.id), task]); // Add/update task
        });
        const unsubClose = bus.on('window-closed', (id) => {
            setTasks(prev => prev.filter(t => t.id !== id)); // Remove task
        });

        // Request initial list (optional: Desktop can emit all current windows on launch)
        bus.emit('request-task-list');

        return () => {
            unsubOpen();
            unsubClose();
        };
    }, []);

    const closeTask = (id) => {
        bus.emit('close-window', id); // Request Desktop to close the window
    };

    const taskItem = (task) => h('div', {
        key: task.id,
        style: 'display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(0,0,0,0.06); background:rgba(255,255,255,0.8);'
    }, [
        h('div', { style: 'font-size:13px; color:#2a2a2a; font-weight:500;' }, task.title),
        h('button', {
            onClick: () => closeTask(task.id),
            style: 'background:#e8736a; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; opacity:0.85;'
        }, 'Close')
    ]);

    return h('div', {
        style: 'display:flex; flex-direction:column; height:100%; background:#fafafa;'
    }, [
        h('div', {
            style: 'padding:12px 14px; border-bottom:1px solid rgba(0,0,0,0.1); background:rgba(255,255,255,0.9); font-size:14px; font-weight:600; color:#2a2a2a;'
        }, `Running Tasks (${tasks.length})`),
        h('div', {
            style: 'flex:1; overflow-y:auto;'
        }, tasks.length > 0 ? tasks.map(taskItem) : h('div', {
            style: 'padding:20px; text-align:center; color:#aaa; font-size:13px;'
        }, 'No running tasks'))
    ]);
}