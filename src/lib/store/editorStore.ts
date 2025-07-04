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
    [x: string]: any;
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
        const contentDuration = get().getContentDuration();
        const newTime = Math.max(0, Math.min(time, contentDuration));
        set({ currentTime: newTime });
    },

    selectItem: (id: string) => {
        const { scene, setCurrentTime } = get();
        const item = scene.items.find(item => item.id === id);

        set({ selectedItems: [id] });

        // Auto-focus: Jump timeline to show the selected item
        if (item) {
            // Jump to the start of the selected item
            setCurrentTime(item.startTime);
            console.log(`🎯 Focused on ${item.type} at ${item.startTime}s`);
        }
    },

    keepSelectedItemInView: () => {
        const { selectedItems, scene, currentTime } = get();
        if (selectedItems.length === 0) return;

        const selectedItem = scene.items.find(item => item.id === selectedItems[0]);
        if (!selectedItem) return;

        const itemStart = selectedItem.startTime;
        const itemEnd = selectedItem.startTime + selectedItem.duration;

        // If current time is outside the item's range, jump to item start
        if (currentTime < itemStart || currentTime > itemEnd) {
            get().setCurrentTime(itemStart);
        }
    },

    selectMultiple: (ids: string[]) => {
        set({ selectedItems: ids });
    },

    clearSelection: () => {
        set({ selectedItems: [] });
    },

    getContentDuration: () => {
        const { scene } = get();
        if (scene.items.length === 0) return scene.duration; // Use default if no items

        // Find the latest end time of all items
        const latestEndTime = Math.max(
            ...scene.items.map(item => item.startTime + item.duration)
        );

        // Add a small buffer (1 second) after the last item
        return Math.max(latestEndTime + 1, 5); // Minimum 5 seconds
    },

    play: () => {
        if (playbackInterval) {
            clearInterval(playbackInterval);
        }

        set({ isPlaying: true });
        console.log('▶️ Starting playback');

        playbackInterval = setInterval(() => {
            const state = get();
            if (state.isPlaying) {
                const newTime = state.currentTime + 0.1;
                const contentDuration = state.getContentDuration();

                if (newTime >= contentDuration) {
                    // Stop at end of actual content
                    console.log(`⏹️ Reached end of content at ${contentDuration.toFixed(1)}s`);
                    if (playbackInterval) {
                        clearInterval(playbackInterval);
                        playbackInterval = null;
                    }
                    set({ isPlaying: false, currentTime: contentDuration });
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