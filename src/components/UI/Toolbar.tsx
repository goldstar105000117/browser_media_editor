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
        addItemWithUndo,
        selectedItems,
        deleteItemWithUndo,
        undo,
        redo,
        canUndo,
        canRedo,
        getContentDuration
    } = useEditorStore();

    const contentDuration = getContentDuration();

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
                brightness: 1.0,
                contrast: 1.0,
                saturation: 1.0,
                temperature: 0.0,
                blur: 0.0,
            },
        };
        addItemWithUndo(newItem);
    };

    const handleDelete = () => {
        selectedItems.forEach(id => deleteItemWithUndo(id));
    };

    const handleUndo = () => {
        undo();
    };

    const handleRedo = () => {
        redo();
    };

    return (
        <div className="flex items-center justify-between h-full px-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePlayPause}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                    onClick={() => {
                        pause();
                        setCurrentTime(0);
                    }}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                    title="Stop"
                >
                    <Square size={20} />
                </button>

                {/* Enhanced time display */}
                <div className="ml-4 text-sm space-x-2">
                    <span className="text-white">
                        {currentTime.toFixed(1)}s
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-300">
                        {contentDuration.toFixed(1)}s
                    </span>
                </div>

                {/* Content duration indicator */}
                <div className="ml-2 px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                    Content: {contentDuration.toFixed(1)}s
                </div>
            </div>

            {/* Undo/Redo Controls */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleUndo}
                    className={`p-2 rounded transition-colors ${canUndo()
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    disabled={!canUndo()}
                    title="Undo"
                >
                    <Undo size={16} />
                </button>

                <button
                    onClick={handleRedo}
                    className={`p-2 rounded transition-colors ${canRedo()
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    disabled={!canRedo()}
                    title="Redo"
                >
                    <Redo size={16} />
                </button>
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
                        title="Delete Selected"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};