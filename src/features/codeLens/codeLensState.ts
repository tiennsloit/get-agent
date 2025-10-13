class CodeLensState {
    public enabled = true;
    private listeners: Array<(isActive: boolean) => void> = [];

    public enable(): void {
        this.enabled = true;
        this.notifyListeners();
    }

    public disable(): void {
        this.enabled = false;
        this.notifyListeners();
    }

    public addListener(listener: (isActive: boolean) => void): void {
        this.listeners.push(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.enabled));
    }
}

export const codeLensState = new CodeLensState();