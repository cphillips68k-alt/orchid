// bus.js — Tiny singleton event bus for inter-app communication
const listeners = {};

export const bus = {
    on(event, fn) {
        if (!listeners[event]) listeners[event] = new Set();
        listeners[event].add(fn);
        // Return unsubscribe function
        return () => listeners[event].delete(fn);
    },
    emit(event, data) {
        listeners[event]?.forEach(fn => fn(data));
    }
};
