interface GeneralChatInput {
  code_files: CodeFile[];
  target_code?: string;
  messages: Array<{ role: string; content: string }>
}

interface CodeFile {
  filename: string;
  content: string;
}

export { GeneralChatInput };
