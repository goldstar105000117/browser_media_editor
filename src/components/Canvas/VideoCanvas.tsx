'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { TimelineItem } from '@/types/editor';

export const VideoCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const { scene, currentTime, selectedItems, selectItem, clearSelection } = useEditorStore();

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render items that are active at current time
        scene.items.forEach((item) => {
            const itemEndTime = item.startTime + item.duration;

            if (currentTime >= item.startTime && currentTime <= itemEndTime) {
                renderItem(ctx, item, selectedItems.includes(item.id));
            }
        });
    }, [scene, currentTime, selectedItems]);

    const renderItem = (ctx: CanvasRenderingContext2D, item: TimelineItem, isSelected: boolean) => {
        const { transform, properties } = item;

        ctx.save();

        // Apply transform
        ctx.translate(transform.x + transform.width / 2, transform.y + transform.height / 2);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(-transform.width / 2, -transform.height / 2);

        if (item.type === 'text') {
            // Apply effects to context
            ctx.globalAlpha = 1.0;
            if (properties.brightness && properties.brightness !== 1.0) {
                ctx.filter = `brightness(${properties.brightness * 100}%)`;
            }
            if (properties.contrast && properties.contrast !== 1.0) {
                ctx.filter += ` contrast(${properties.contrast * 100}%)`;
            }
            if (properties.saturation && properties.saturation !== 1.0) {
                ctx.filter += ` saturate(${properties.saturation * 100}%)`;
            }
            if (properties.blur && properties.blur > 0) {
                ctx.filter += ` blur(${properties.blur}px)`;
            }

            // Draw text background for visibility
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, transform.width, transform.height);

            // Draw text
            ctx.fillStyle = properties.color || '#ffffff';
            ctx.font = `${properties.fontSize || 24}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                properties.text || 'Text',
                transform.width / 2,
                transform.height / 2
            );

            // Reset filter
            ctx.filter = 'none';
        }

        // Draw selection border
        if (isSelected) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, transform.width, transform.height);
        }

        ctx.restore();
    };

    const handleClick = useCallback((event: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Find clicked item
        let clickedItem: TimelineItem | null = null;

        // Check items in reverse order (top to bottom)
        for (let i = scene.items.length - 1; i >= 0; i--) {
            const item = scene.items[i];
            const { transform } = item;

            // Check if item is active and click is within bounds
            const itemEndTime = item.startTime + item.duration;
            const isActive = currentTime >= item.startTime && currentTime <= itemEndTime;

            if (isActive &&
                x >= transform.x &&
                x <= transform.x + transform.width &&
                y >= transform.y &&
                y <= transform.y + transform.height) {
                clickedItem = item;
                break;
            }
        }

        if (clickedItem) {
            selectItem(clickedItem.id);
        } else {
            clearSelection();
        }
    }, [scene.items, currentTime, selectItem, clearSelection]);

    // Animation loop
    useEffect(() => {
        const animate = () => {
            render();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [render]);

    return (
        <div className="border border-gray-600 rounded-lg overflow-hidden relative">
            <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="cursor-pointer"
                onClick={handleClick}
            />

            {/* Canvas info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Canvas: {scene.items.filter(item => {
                    const itemEndTime = item.startTime + item.duration;
                    return currentTime >= item.startTime && currentTime <= itemEndTime;
                }).length} items visible
            </div>
        </div>
    );
};