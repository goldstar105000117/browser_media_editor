'use client';

import React from 'react';
import { Play, Pause, Square, Plus, Trash2, Undo, Redo } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editorStore';

export const Toolbar: React.FC = () => {
    const {
        isPlaying,
        currentTime,
        play,
        pause,
        setCurrentTime,
        addItem,
        selectedItems,
        deleteItem
    } = useEditorStore();

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    const handleAddText = () => {
        const newItem = {
            id: `text-${Date.now()}`,
            type: 'text' as const,
            startTime: currentTime,
            duration: 3,
            transform: {
                x: 100,
                y: 100,
                width: 200,
                height: 50,
                rotation: 0,
                scale: 1,
            },
            properties: {
                text: 'Sample Text',
                fontSize: 24,
                color: '#ffffff',
            },
        };
        addItem(newItem);
    };

    const handleDelete = () => {
        selectedItems.forEach(id => deleteItem(id));
    };

    return (
        <div className="flex items-center justify-between h-full px-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2 ml-4">
                <button
                    // onClick={handleUndo}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                    disabled={true} // We'll implement this in the next phase
                    title="Undo"
                >
                    <Undo size={16} />
                </button>

                <button
                    // onClick={handleRedo}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                    disabled={true} // We'll implement this in the next phase
                    title="Redo"
                >
                    <Redo size={16} />
                </button>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePlayPause}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                    onClick={() => {
                        pause();
                        setCurrentTime(0);
                    }}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                    <Square size={20} />
                </button>

                <div className="ml-4 text-sm">
                    {Math.floor(currentTime)}s
                </div>
            </div>

            {/* Add Items */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleAddText}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                >
                    <Plus size={16} />
                    <span>Add Text</span>
                </button>

                {selectedItems.length > 0 && (
                    <button
                        onClick={handleDelete}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};