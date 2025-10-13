export interface StreamResponseChunk {
    messageId: string;
    content?: string;
    endStreamData?: EndStreamData;
}

export interface EndStreamData {
    type: "error" | "length" | "stop";
    errorMessage?: string;
    tokenCount: number;
    totalTime: number;
}