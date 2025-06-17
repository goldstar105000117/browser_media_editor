'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TimelineItem as TimelineItemType } from '@/types/editor';
import { GripVertical } from 'lucide-react';

interface TimelineItemProps {
    item: TimelineItemType;
    isSelected: boolean;
    pixelsPerSecond: number;
    trackHeight: number;
    onSelect: (id: string) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
    item,
    isSelected,
    pixelsPerSecond,
    trackHeight,
    onSelect,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        left: `${item.startTime * pixelsPerSecond}px`,
        width: `${item.duration * pixelsPerSecond}px`,
        height: `${trackHeight - 10}px`,
        top: '5px',
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(item.id);
    };

    const getItemColor = () => {
        switch (item.type) {
            case 'text':
                return isSelected ? 'bg-blue-600 border-blue-400' : 'bg-blue-500 border-blue-400';
            case 'video':
                return isSelected ? 'bg-purple-600 border-purple-400' : 'bg-purple-500 border-purple-400';
            case 'image':
                return isSelected ? 'bg-green-600 border-green-400' : 'bg-green-500 border-green-400';
            default:
                return isSelected ? 'bg-gray-600 border-gray-400' : 'bg-gray-500 border-gray-400';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`absolute rounded border-2 cursor-pointer transition-all duration-200 ${getItemColor()} ${isDragging ? 'opacity-50 z-10' : 'hover:brightness-110'
                }`}
            onClick={handleClick}
            {...attributes}
        >
            {/* Drag handle */}
            <div
                {...listeners}
                className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center bg-black bg-opacity-20 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={12} className="text-white opacity-70" />
            </div>

            {/* Content */}
            <div className="ml-6 p-2 h-full flex items-center">
                <div className="text-sm font-medium text-white truncate">
                    {item.type === 'text' && (item.properties.text || 'Text')}
                    {item.type === 'video' && 'Video Clip'}
                    {item.type === 'image' && 'Image'}
                </div>
            </div>

            {/* Duration indicator */}
            <div className="absolute bottom-1 right-2 text-xs text-white opacity-70">
                {item.duration.toFixed(1)}s
            </div>

            {/* Selection highlight */}
            {isSelected && (
                <div className="absolute inset-0 border-2 border-white rounded pointer-events-none opacity-50" />
            )}
        </div>
    );
};