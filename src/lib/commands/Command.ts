import { TimelineItem } from '@/types/editor';

export interface Command {
    execute(): void;
    undo(): void;
    description: string;
}

export class AddItemCommand implements Command {
    public description: string;

    constructor(
        private item: TimelineItem,
        private addItem: (item: TimelineItem) => void,
        private deleteItem: (id: string) => void
    ) {
        this.description = `Add ${item.type}`;
    }

    execute(): void {
        this.addItem(this.item);
    }

    undo(): void {
        this.deleteItem(this.item.id);
    }
}

export class DeleteItemCommand implements Command {
    public description: string;

    constructor(
        private item: TimelineItem,
        private addItem: (item: TimelineItem) => void,
        private deleteItem: (id: string) => void
    ) {
        this.description = `Delete ${item.type}`;
    }

    execute(): void {
        this.deleteItem(this.item.id);
    }

    undo(): void {
        this.addItem(this.item);
    }
}

export class UpdateItemCommand implements Command {
    public description: string;

    constructor(
        private itemId: string,
        private oldValues: Partial<TimelineItem>,
        private newValues: Partial<TimelineItem>,
        private updateItem: (id: string, updates: Partial<TimelineItem>) => void
    ) {
        this.description = `Update ${itemId}`;
    }

    execute(): void {
        this.updateItem(this.itemId, this.newValues);
    }

    undo(): void {
        this.updateItem(this.itemId, this.oldValues);
    }
}

export class MoveItemCommand implements Command {
    public description: string;

    constructor(
        private itemId: string,
        private oldStartTime: number,
        private newStartTime: number,
        private oldY: number,
        private newY: number,
        private updateItem: (id: string, updates: Partial<TimelineItem>) => void
    ) {
        this.description = `Move ${itemId}`;
    }

    execute(): void {
        this.updateItem(this.itemId, {
            startTime: this.newStartTime,
            transform: {
                y: this.newY,
                x: 0,
                width: 0,
                height: 0,
                rotation: 0,
                scale: 0
            }
        });
    }

    undo(): void {
        this.updateItem(this.itemId, {
            startTime: this.oldStartTime,
            transform: {
                y: this.oldY,
                x: 0,
                width: 0,
                height: 0,
                rotation: 0,
                scale: 0
            }
        });
    }
}

export class BatchCommand implements Command {
    public description: string;

    constructor(
        private commands: Command[],
        description?: string
    ) {
        this.description = description || `Batch: ${commands.length} operations`;
    }

    execute(): void {
        this.commands.forEach(command => command.execute());
    }

    undo(): void {
        // Undo in reverse order
        [...this.commands].reverse().forEach(command => command.undo());
    }
}

export class CommandManager {
    private history: Command[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;

    executeCommand(command: Command): void {
        // Remove any commands after current index (when we're in middle of history)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Execute the command
        command.execute();

        // Add to history
        this.history.push(command);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        console.log(`🔄 Executed: ${command.description}`);
    }

    undo(): boolean {
        if (this.currentIndex >= 0) {
            const command = this.history[this.currentIndex];
            command.undo();
            this.currentIndex--;
            console.log(`↶ Undid: ${command.description}`);
            return true;
        }
        return false;
    }

    redo(): boolean {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            command.execute();
            console.log(`↷ Redid: ${command.description}`);
            return true;
        }
        return false;
    }

    canUndo(): boolean {
        return this.currentIndex >= 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    getHistoryInfo(): { canUndo: boolean; canRedo: boolean; historySize: number } {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            historySize: this.history.length
        };
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }
}