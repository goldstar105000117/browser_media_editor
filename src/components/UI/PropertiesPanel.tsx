'use client';

import React from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { Slider } from '@/components/UI/Slider';
import { ColorPicker } from '@/components/UI/ColorPicker';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
    const {
        scene,
        selectedItems,
        updateItem,
        deleteItem,
        clearSelection,
        addItem
    } = useEditorStore();

    const selectedItem = selectedItems.length > 0
        ? scene.items.find(item => item.id === selectedItems[0])
        : null;

    const handlePropertyChange = (property: string, value: any) => {
        if (!selectedItem) return;

        const updates: any = {};

        if (property.startsWith('transform.')) {
            const transformKey = property.split('.')[1];
            updates.transform = {
                ...selectedItem.transform,
                [transformKey]: value
            };
        } else if (property.startsWith('properties.')) {
            const propKey = property.split('.')[1];
            updates.properties = {
                ...selectedItem.properties,
                [propKey]: value
            };
        } else {
            updates[property] = value;
        }

        updateItem(selectedItem.id, updates);
    };

    const handleDuplicate = () => {
        if (!selectedItem) return;

        const newItem = {
            ...selectedItem,
            id: `${selectedItem.type}-${Date.now()}`,
            transform: {
                ...selectedItem.transform,
                x: selectedItem.transform.x + 20,
                y: selectedItem.transform.y + 20,
            }
        };

        addItem(newItem);
    };

    const handleDelete = () => {
        selectedItems.forEach(id => deleteItem(id));
    };

    if (!selectedItem) {
        return (
            <div className="w-80 bg-gray-700 border-l border-gray-600 p-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
                <p className="text-gray-400">Select an item to edit properties</p>
            </div>
        );
    }

    return (
        <div className="w-80 bg-gray-700 border-l border-gray-600 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Properties</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDuplicate}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Duplicate"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={clearSelection}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Deselect"
                    >
                        <EyeOff size={16} />
                    </button>
                </div>
            </div>

            {/* Item Info */}
            <div className="mb-6 p-3 bg-gray-800 rounded">
                <div className="text-sm text-gray-300 mb-1">Type</div>
                <div className="text-white font-medium capitalize">{selectedItem.type}</div>
                <div className="text-sm text-gray-300 mt-2 mb-1">ID</div>
                <div className="text-xs text-gray-400 font-mono">{selectedItem.id}</div>
            </div>

            {/* Transform Properties */}
            <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Transform</h4>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">X Position</label>
                            <Slider
                                value={selectedItem.transform.x}
                                onChange={(value) => handlePropertyChange('transform.x', value)}
                                min={-200}
                                max={1000}
                                step={1}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Y Position</label>
                            <Slider
                                value={selectedItem.transform.y}
                                onChange={(value) => handlePropertyChange('transform.y', value)}
                                min={-200}
                                max={600}
                                step={1}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Width</label>
                            <Slider
                                value={selectedItem.transform.width}
                                onChange={(value) => handlePropertyChange('transform.width', value)}
                                min={50}
                                max={800}
                                step={1}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Height</label>
                            <Slider
                                value={selectedItem.transform.height}
                                onChange={(value) => handlePropertyChange('transform.height', value)}
                                min={20}
                                max={400}
                                step={1}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Rotation (°)</label>
                            <Slider
                                value={selectedItem.transform.rotation * (180 / Math.PI)}
                                onChange={(value) => handlePropertyChange('transform.rotation', value * (Math.PI / 180))}
                                min={-180}
                                max={180}
                                step={1}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Scale</label>
                            <Slider
                                value={selectedItem.transform.scale}
                                onChange={(value) => handlePropertyChange('transform.scale', value)}
                                min={0.1}
                                max={3}
                                step={0.1}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Text Properties */}
            {selectedItem.type === 'text' && (
                <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">Text</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Text Content</label>
                            <input
                                type="text"
                                value={selectedItem.properties.text || ''}
                                onChange={(e) => handlePropertyChange('properties.text', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                                placeholder="Enter text..."
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Font Size</label>
                            <Slider
                                value={selectedItem.properties.fontSize || 24}
                                onChange={(value) => handlePropertyChange('properties.fontSize', value)}
                                min={8}
                                max={72}
                                step={1}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-300 mb-1 block">Color</label>
                            <ColorPicker
                                value={selectedItem.properties.color || '#ffffff'}
                                onChange={(color) => handlePropertyChange('properties.color', color)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Effects */}
            <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Effects</h4>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Brightness</label>
                        <Slider
                            value={selectedItem.properties.brightness || 1.0}
                            onChange={(value) => handlePropertyChange('properties.brightness', value)}
                            min={0}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Contrast</label>
                        <Slider
                            value={selectedItem.properties.contrast || 1.0}
                            onChange={(value) => handlePropertyChange('properties.contrast', value)}
                            min={0}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Saturation</label>
                        <Slider
                            value={selectedItem.properties.saturation || 1.0}
                            onChange={(value) => handlePropertyChange('properties.saturation', value)}
                            min={0}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Temperature</label>
                        <Slider
                            value={selectedItem.properties.temperature || 0.0}
                            onChange={(value) => handlePropertyChange('properties.temperature', value)}
                            min={-1}
                            max={1}
                            step={0.1}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                            {(selectedItem.properties.temperature || 0) < 0 ? 'Cool (Blue)' :
                                (selectedItem.properties.temperature || 0) > 0 ? 'Warm (Orange)' : 'Neutral'}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Blur</label>
                        <Slider
                            value={selectedItem.properties.blur || 0.0}
                            onChange={(value) => handlePropertyChange('properties.blur', value)}
                            min={0}
                            max={10}
                            step={0.5}
                        />
                    </div>
                </div>
            </div>

            {/* Timeline Properties */}
            <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Timeline</h4>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Start Time (s)</label>
                        <Slider
                            value={selectedItem.startTime}
                            onChange={(value) => handlePropertyChange('startTime', value)}
                            min={0}
                            max={30}
                            step={0.1}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Duration (s)</label>
                        <Slider
                            value={selectedItem.duration}
                            onChange={(value) => handlePropertyChange('duration', Math.max(0.1, value))}
                            min={0.1}
                            max={10}
                            step={0.1}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};