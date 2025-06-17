import { create } from 'zustand';
import { EditorState, TimelineItem, Scene } from '@/types/editor';

interface EditorStore extends EditorState {
    // Actions
    setCurrentTime: (time: number) => void;
    addItem: (item: TimelineItem) => void;
    updateItem: (id: string, updates: Partial<TimelineItem>) => void;
    deleteItem: (id: string) => void;
    selectItem: (id: string) => void;
    selectMultiple: (ids: string[]) => void;
    clearSelection: () => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
}

const createEmptyScene = (): Scene => ({
    id: 'main-scene',
    items: [],
    duration: 30,
});

// Store the interval outside the store
let playbackInterval: NodeJS.Timeout | null = null;

export const useEditorStore = create<EditorStore>((set, get) => ({
    // Initial state
    scene: createEmptyScene(),
    currentTime: 0,
    selectedItems: [],
    isPlaying: false,

    // Actions
    setCurrentTime: (time: number) => {
        const newTime = Math.max(0, Math.min(time, get().scene.duration));
        set({ currentTime: newTime });
    },

    addItem: (item: TimelineItem) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: [...state.scene.items, item],
            },
        }));
    },

    updateItem: (id: string, updates: Partial<TimelineItem>) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: state.scene.items.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                ),
            },
        }));
    },

    deleteItem: (id: string) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: state.scene.items.filter((item) => item.id !== id),
            },
            selectedItems: state.selectedItems.filter((selectedId) => selectedId !== id),
        }));
    },

    selectItem: (id: string) => {
        set({ selectedItems: [id] });
    },

    selectMultiple: (ids: string[]) => {
        set({ selectedItems: ids });
    },

    clearSelection: () => {
        set({ selectedItems: [] });
    },

    play: () => {
        if (playbackInterval) {
            clearInterval(playbackInterval);
        }

        set({ isPlaying: true });

        playbackInterval = setInterval(() => {
            const state = get();
            if (state.isPlaying) {
                const newTime = state.currentTime + 0.1;
                if (newTime >= state.scene.duration) {
                    if (playbackInterval) {
                        clearInterval(playbackInterval);
                        playbackInterval = null;
                    }
                    set({ isPlaying: false, currentTime: 0 });
                } else {
                    set({ currentTime: newTime });
                }
            } else {
                if (playbackInterval) {
                    clearInterval(playbackInterval);
                    playbackInterval = null;
                }
            }
        }, 100);
    },

    pause: () => {
        set({ isPlaying: false });
        if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    },

    stop: () => {
        set({ isPlaying: false, currentTime: 0 });
        if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    },
}));