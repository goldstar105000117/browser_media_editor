'use client';

import React, { useRef, useCallback, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragEndEvent,
    DragMoveEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEditorStore } from '@/lib/store/editorStore';
import { TimelineItem } from './TimelineItem';
import { TimelineTrack } from './TimelineTrack';
import { TimelineItem as TimelineItemType } from '@/types/editor';

export const Timeline: React.FC = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const {
        scene,
        currentTime,
        setCurrentTime,
        selectedItems,
        selectItem,
        updateItem,
        clearSelection,
        getContentDuration
    } = useEditorStore();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const displayDuration = Math.max(getContentDuration(), 30);
    const contentDuration = getContentDuration();

    const pixelsPerSecond = 50;
    const trackHeight = 60;

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Group items into tracks
    const tracks = React.useMemo(() => {
        const trackMap = new Map<number, TimelineItemType[]>();

        scene.items.forEach((item) => {
            // Simple track assignment based on Y position
            const trackIndex = Math.floor((item.transform?.y || 0) / 100);
            if (!trackMap.has(trackIndex)) {
                trackMap.set(trackIndex, []);
            }
            trackMap.get(trackIndex)!.push(item);
        });

        // Convert to array and sort
        const tracksArray = Array.from(trackMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([trackIndex, items]) => ({
                id: trackIndex,
                items: items.sort((a, b) => a.startTime - b.startTime)
            }));

        // Ensure we have at least 3 empty tracks
        while (tracksArray.length < 3) {
            const maxTrack = tracksArray.length > 0 ? Math.max(...tracksArray.map(t => t.id)) : -1;
            tracksArray.push({
                id: maxTrack + 1,
                items: []
            });
        }

        return tracksArray;
    }, [scene.items]);

    const handleTimelineClick = useCallback((event: React.MouseEvent) => {
        const timeline = timelineRef.current;
        if (!timeline) return;

        // Check if click was on empty timeline area
        if (event.target === timeline || (event.target as Element).classList.contains('timeline-background')) {
            const rect = timeline.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const newTime = Math.max(0, x / pixelsPerSecond);
            setCurrentTime(newTime);
            clearSelection();
        }
    }, [setCurrentTime, clearSelection, pixelsPerSecond]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);

        // Calculate initial drag offset
        const item = scene.items.find(item => item.id === active.id);
        if (item && event.activatorEvent) {
            const rect = timelineRef.current?.getBoundingClientRect();
            if (rect) {
                let clientX: number = 0;
                if ('clientX' in event.activatorEvent) {
                    clientX = (event.activatorEvent as MouseEvent).clientX;
                } else if (
                    typeof TouchEvent !== 'undefined' &&
                    event.activatorEvent instanceof TouchEvent &&
                    event.activatorEvent.touches.length > 0
                ) {
                    clientX = event.activatorEvent.touches[0].clientX;
                }

                const itemStartX = item.startTime * pixelsPerSecond;
                setDragOffset({
                    x: clientX - rect.left - itemStartX,
                    y: 0
                });
            }
        }
    };

    const handleDragMove = (event: DragMoveEvent) => {
        // Real-time preview during drag (optional)
        // You could update a preview state here
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const itemId = active.id as string;

        if (delta.x !== 0 || delta.y !== 0) {
            const item = scene.items.find(item => item.id === itemId);
            if (item) {
                // Calculate new start time based on horizontal movement
                const timeChange = delta.x / pixelsPerSecond;
                const newStartTime = Math.max(0, item.startTime + timeChange);

                // Calculate track change based on vertical movement
                const trackChange = Math.round(delta.y / trackHeight);
                const currentTrack = Math.floor((item.transform?.y || 0) / 100);
                const newTrack = Math.max(0, currentTrack + trackChange);
                const newY = newTrack * 100;

                // Update the item
                updateItem(itemId, {
                    startTime: newStartTime,
                    transform: {
                        ...item.transform,
                        y: newY
                    }
                });
            }
        }

        setActiveId(null);
        setDragOffset({ x: 0, y: 0 });
    };

    const activeItem = activeId ? scene.items.find(item => item.id === activeId) : null;

    return (
        <div className="h-full flex flex-col bg-gray-800">
            {/* Timeline Header */}
            <div className="h-8 bg-gray-700 border-b border-gray-600 relative flex-shrink-0">
                {/* Time markers - use display duration for markers */}
                {Array.from({ length: Math.ceil(displayDuration) + 1 }, (_, i) => (
                    <div
                        key={i}
                        className={`absolute top-0 h-full border-l text-xs pl-1 flex items-center ${i <= contentDuration ? 'border-gray-500 text-gray-300' : 'border-gray-600 text-gray-500'
                            }`}
                        style={{ left: `${i * pixelsPerSecond}px` }}
                    >
                        {i}s
                    </div>
                ))}

                {/* Content end indicator */}
                <div
                    className="absolute top-0 w-0.5 h-full bg-yellow-500 z-15 pointer-events-none"
                    style={{ left: `${contentDuration * pixelsPerSecond}px` }}
                    title={`Content ends at ${contentDuration.toFixed(1)}s`}
                />

                {/* Playhead */}
                <div
                    className="absolute top-0 w-0.5 h-full bg-red-500 z-20 pointer-events-none"
                    style={{ left: `${currentTime * pixelsPerSecond}px` }}
                />
            </div>

            {/* Timeline Content */}
            <div
                ref={timelineRef}
                className="flex-1 relative overflow-auto timeline-background"
                onClick={handleTimelineClick}
            >
                {/* Content area background */}
                <div
                    className="absolute top-0 bottom-0 bg-gray-750 pointer-events-none opacity-30"
                    style={{
                        left: 0,
                        width: `${contentDuration * pixelsPerSecond}px`
                    }}
                />

                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={scene.items.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {/* Tracks */}
                        {tracks.map((track, index) => (
                            <TimelineTrack
                                key={track.id}
                                trackIndex={index}
                                items={track.items}
                                pixelsPerSecond={pixelsPerSecond}
                                trackHeight={trackHeight}
                                selectedItems={selectedItems}
                                onItemSelect={selectItem}
                            />
                        ))}

                        {/* Grid lines for visual feedback */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Vertical grid lines (time) */}
                            {Array.from({ length: Math.ceil(displayDuration * 2) }, (_, i) => (
                                <div
                                    key={`vline-${i}`}
                                    className={`absolute top-0 bottom-0 border-l opacity-30 ${(i * 0.5) <= contentDuration ? 'border-gray-700' : 'border-gray-800'
                                        }`}
                                    style={{ left: `${(i * 0.5) * pixelsPerSecond}px` }}
                                />
                            ))}

                            {/* Horizontal grid lines (tracks) */}
                            {tracks.map((_, index) => (
                                <div
                                    key={`hline-${index}`}
                                    className="absolute left-0 right-0 border-t border-gray-700 opacity-30"
                                    style={{ top: `${index * trackHeight}px` }}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeItem ? (
                            <div
                                className="bg-blue-600 border-2 border-blue-400 rounded shadow-lg opacity-80"
                                style={{
                                    width: `${activeItem.duration * pixelsPerSecond}px`,
                                    height: `${trackHeight - 10}px`,
                                }}
                            >
                                <div className="p-2 text-sm font-medium text-white truncate">
                                    {activeItem.type === 'text' && activeItem.properties.text}
                                    {activeItem.type === 'video' && 'Video'}
                                    {activeItem.type === 'image' && 'Image'}
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};