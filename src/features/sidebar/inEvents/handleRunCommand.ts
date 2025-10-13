import { getTerminal } from "../../../core/utilities/getTerminal";

export function handleRunCommand(message: any) {
  getTerminal().then((activeTerminal) => {
    // Command may contain multiple lines, split them and execute each line separately
    const commandLines = message.data.code.split("\n");
    commandLines.forEach((line: string) => {
      activeTerminal?.sendText(line);
    });
  });
}