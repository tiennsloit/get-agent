
export enum ChatScreen {
    CHAT,
    HISTORY,
    SETTING,
}

export enum ChatMode {
    NORMAL = 'normal',
    FLOW = 'flow',
}

export interface AppState {
    screen: ChatScreen;
    chatMode: ChatMode;
}
