export interface Position {
    x: number;
    y: number;
}

export interface Transform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
}

export interface TimelineItem {
    id: string;
    type: 'video' | 'text' | 'image';
    startTime: number;
    duration: number;
    transform: Transform;
    properties: {
        // Text properties
        text?: string;
        fontSize?: number;
        color?: string;

        // Effects
        brightness?: number;
        contrast?: number;
        saturation?: number;
        temperature?: number;
        blur?: number;

        // Other properties
        [key: string]: any;
    };
}

export interface Scene {
    id: string;
    items: TimelineItem[];
    duration: number;
}

export interface EditorState {
    scene: Scene;
    currentTime: number;
    selectedItems: string[];
    isPlaying: boolean;
}