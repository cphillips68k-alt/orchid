// clock.js — Orchid Clock, light mode
import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';

export default function Clock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    return h('div', {
        style: 'display:flex; flex-direction:column; align-items:center; justify-content:center; padding:28px 20px; gap:8px;'
    }, [
        h('div', {
            style: 'font-size:44px; font-weight:200; color:#2a2a2a; letter-spacing:2px; font-variant-numeric:tabular-nums;'
        }, timeStr),
        h('div', {
            style: 'font-size:14px; color:#aaa; letter-spacing:0.5px;'
        }, dateStr)
    ]);
}
