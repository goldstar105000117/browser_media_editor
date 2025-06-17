'use client';

import React, { useState } from 'react';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const presetColors = [
        '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
        '#ffc0cb', '#a52a2a', '#808080', '#90ee90', '#add8e6'
    ];

    return (
        <div className="relative">
            {/* Color Display */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 border border-gray-600 rounded flex items-center justify-between px-3 bg-gray-800"
            >
                <div
                    className="w-6 h-6 rounded border border-gray-500"
                    style={{ backgroundColor: value }}
                />
                <span className="text-white text-sm font-mono">{value}</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-12 left-0 right-0 bg-gray-800 border border-gray-600 rounded p-3 z-10">
                    {/* Hex Input */}
                    <div className="mb-3">
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                            placeholder="#ffffff"
                        />
                    </div>

                    {/* Color Input */}
                    <div className="mb-3">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-8 rounded cursor-pointer"
                        />
                    </div>

                    {/* Preset Colors */}
                    <div className="grid grid-cols-5 gap-2">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                onClick={() => {
                                    onChange(color);
                                    setIsOpen(false);
                                }}
                                className="w-8 h-8 rounded border border-gray-500 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};