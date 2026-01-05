
import { browser } from '$app/environment';

export interface DevToolsSettings {
    visible: boolean;
    height: number; // pixels
    activeTab: 'overview' | 'structured' | 'raw' | 'paths' | 'diff';
    collapsedGroups: Record<string, boolean>;
    searchQuery: string;
    hideIdsRuntime: boolean;
    theme: 'dark' | 'light'; // In case we want themes
}

const DEFAULT_SETTINGS: DevToolsSettings = {
    visible: false,
    height: 300,
    activeTab: 'overview',
    collapsedGroups: {},
    searchQuery: '',
    hideIdsRuntime: false,
    theme: 'dark'
};

const STORAGE_KEY = 'skphp.devtool.settings';

export class DevToolsStore {
    settings: DevToolsSettings;

    constructor() {
        this.settings = this.load();
    }

    load(): DevToolsSettings {
        if (!browser) return { ...DEFAULT_SETTINGS };
        
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load devtools settings', e);
        }
        return { ...DEFAULT_SETTINGS };
    }

    save() {
        if (!browser) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save devtools settings', e);
        }
    }

    update(updater: (s: DevToolsSettings) => void) {
        updater(this.settings);
        this.save();
    }
}

// History Ring Buffer
export interface HistorySnapshot {
    id: string;
    timestamp: number;
    url: string;
    data: any;
    meta: any;
}

export class HistoryStore {
    snapshots: HistorySnapshot[] = [];
    maxSize = 10;

    add(url: string, data: any, meta: any) {
        const snapshot: HistorySnapshot = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            url,
            data,
            meta
        };
        
        this.snapshots.unshift(snapshot);
        if (this.snapshots.length > this.maxSize) {
            this.snapshots.pop();
        }
    }

    get(index: number) {
        return this.snapshots[index];
    }
    
    getLatest() {
        return this.snapshots[0];
    }
}
