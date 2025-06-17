export interface Command {
    execute(): void;
    undo(): void;
    description: string;
}

export class MoveItemCommand implements Command {
    public description: string;

    constructor(
        private itemId: string,
        private oldStartTime: number,
        private newStartTime: number,
        private oldY: number,
        private newY: number,
        private updateItem: (id: string, updates: any) => void
    ) {
        this.description = `Move ${itemId}`;
    }

    execute(): void {
        this.updateItem(this.itemId, {
            startTime: this.newStartTime,
            transform: { y: this.newY }
        });
    }

    undo(): void {
        this.updateItem(this.itemId, {
            startTime: this.oldStartTime,
            transform: { y: this.oldY }
        });
    }
}

export class CommandManager {
    private history: Command[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;

    executeCommand(command: Command): void {
        command.execute();

        // Remove any commands after current index
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new command
        this.history.push(command);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo(): boolean {
        if (this.currentIndex >= 0) {
            const command = this.history[this.currentIndex];
            command.undo();
            this.currentIndex--;
            return true;
        }
        return false;
    }

    redo(): boolean {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            command.execute();
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
}