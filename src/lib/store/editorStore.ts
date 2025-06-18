import { create } from 'zustand';
import { EditorState, TimelineItem, Scene } from '@/types/editor';
import {
    CommandManager,
    AddItemCommand,
    DeleteItemCommand,
    UpdateItemCommand,
    MoveItemCommand
} from '@/lib/commands/Command';

interface EditorStore extends EditorState {
    // Command system
    commandManager: CommandManager;

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

    // Command actions
    addItemWithUndo: (item: TimelineItem) => void;
    updateItemWithUndo: (id: string, updates: Partial<TimelineItem>) => void;
    deleteItemWithUndo: (id: string) => void;
    moveItemWithUndo: (id: string, newStartTime: number, newY: number) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Internal actions (used by commands)
    _addItem: (item: TimelineItem) => void;
    _updateItem: (id: string, updates: Partial<TimelineItem>) => void;
    _deleteItem: (id: string) => void;
}

const createEmptyScene = (): Scene => ({
    id: 'main-scene',
    items: [],
    duration: 30,
});

let playbackInterval: NodeJS.Timeout | null = null;

export const useEditorStore = create<EditorStore>((set, get) => ({
    // Initial state
    scene: createEmptyScene(),
    currentTime: 0,
    selectedItems: [],
    isPlaying: false,
    commandManager: new CommandManager(),

    // Basic actions
    setCurrentTime: (time: number) => {
        const newTime = Math.max(0, Math.min(time, get().scene.duration));
        set({ currentTime: newTime });
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

    // Playback controls
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

    // Internal actions (used by commands, no undo tracking)
    _addItem: (item: TimelineItem) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: [...state.scene.items, item],
            },
        }));
    },

    _updateItem: (id: string, updates: Partial<TimelineItem>) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: state.scene.items.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                ),
            },
        }));
    },

    _deleteItem: (id: string) => {
        set((state) => ({
            scene: {
                ...state.scene,
                items: state.scene.items.filter((item) => item.id !== id),
            },
            selectedItems: state.selectedItems.filter((selectedId) => selectedId !== id),
        }));
    },

    // Public actions (legacy, direct manipulation)
    addItem: (item: TimelineItem) => {
        get()._addItem(item);
    },

    updateItem: (id: string, updates: Partial<TimelineItem>) => {
        get()._updateItem(id, updates);
    },

    deleteItem: (id: string) => {
        get()._deleteItem(id);
    },

    // Command-based actions (with undo/redo)
    addItemWithUndo: (item: TimelineItem) => {
        const { commandManager, _addItem, _deleteItem } = get();
        const command = new AddItemCommand(item, _addItem, _deleteItem);
        commandManager.executeCommand(command);
    },

    updateItemWithUndo: (id: string, updates: Partial<TimelineItem>) => {
        const { scene, commandManager, _updateItem } = get();
        const item = scene.items.find(item => item.id === id);
        if (!item) return;

        // Store old values for undo
        const oldValues: Partial<TimelineItem> = {};
        if (updates.transform) {
            oldValues.transform = { ...item.transform };
        }
        if (updates.properties) {
            oldValues.properties = { ...item.properties };
        }
        if (updates.startTime !== undefined) {
            oldValues.startTime = item.startTime;
        }
        if (updates.duration !== undefined) {
            oldValues.duration = item.duration;
        }

        const command = new UpdateItemCommand(id, oldValues, updates, _updateItem);
        commandManager.executeCommand(command);
    },

    deleteItemWithUndo: (id: string) => {
        const { scene, commandManager, _addItem, _deleteItem } = get();
        const item = scene.items.find(item => item.id === id);
        if (!item) return;

        const command = new DeleteItemCommand(item, _addItem, _deleteItem);
        commandManager.executeCommand(command);
    },

    moveItemWithUndo: (id: string, newStartTime: number, newY: number) => {
        const { scene, commandManager, _updateItem } = get();
        const item = scene.items.find(item => item.id === id);
        if (!item) return;

        const command = new MoveItemCommand(
            id,
            item.startTime,
            newStartTime,
            item.transform.y,
            newY,
            _updateItem
        );
        commandManager.executeCommand(command);
    },

    // Undo/Redo
    undo: () => {
        const { commandManager } = get();
        commandManager.undo();
    },

    redo: () => {
        const { commandManager } = get();
        commandManager.redo();
    },

    canUndo: () => {
        const { commandManager } = get();
        return commandManager.canUndo();
    },

    canRedo: () => {
        const { commandManager } = get();
        return commandManager.canRedo();
    },
}));