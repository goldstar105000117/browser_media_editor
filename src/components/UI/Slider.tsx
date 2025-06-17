'use client';

import React from 'react';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    className?: string;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    min,
    max,
    step = 1,
    className = ''
}) => {
    return (
        <div className={`relative ${className}`}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{min}</span>
                <span className="text-white font-medium">{value.toFixed(step < 1 ? 1 : 0)}</span>
                <span>{max}</span>
            </div>

            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
        </div>
    );
};