'use client';

import React from 'react';
import { TimelineItem } from './TimelineItem';
import { TimelineItem as TimelineItemType } from '@/types/editor';

interface TimelineTrackProps {
    trackIndex: number;
    items: TimelineItemType[];
    pixelsPerSecond: number;
    trackHeight: number;
    selectedItems: string[];
    onItemSelect: (id: string) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
    trackIndex,
    items,
    pixelsPerSecond,
    trackHeight,
    selectedItems,
    onItemSelect,
}) => {
    return (
        <div
            className="relative border-b border-gray-700"
            style={{ height: trackHeight }}
        >
            {/* Track background */}
            <div className="absolute inset-0 bg-gray-800 hover:bg-gray-750 transition-colors">
                <div className="absolute left-2 top-2 text-xs text-gray-500">
                    Track {trackIndex + 1}
                </div>
            </div>

            {/* Timeline Items */}
            {items.map((item) => (
                <TimelineItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    pixelsPerSecond={pixelsPerSecond}
                    trackHeight={trackHeight}
                    onSelect={onItemSelect}
                />
            ))}
        </div>
    );
};