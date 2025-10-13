import * as path from "path";
import * as fs from "fs/promises";
import * as vscode from "vscode";
import { Parser, Language, Tree, Node } from "web-tree-sitter";

type LanguageParser = {
  language: Language;
  extensions: string[];
};

export class ParserManager {
  private parser: Parser | null = null;
  private languages: Record<string, LanguageParser> = {};
  private extensionToLanguage: Record<string, string> = {};

  constructor(private context: vscode.ExtensionContext) { }

  /**
   * Initializes the parser by setting up the language parsers and extensions.
   * 
   * @param report - A callback function to report the progress of the initialization. 
   *                 Takes an object with a message and an optional increment value.
   * 
   * Initializes the `Parser` instance and loads the language-specific parsers 
   * from their respective WebAssembly files. The languages and their file 
   * extensions are configured in the `languageConfig` object. Reports progress 
   * at various stages of initialization and logs errors if any language parser 
   * fails to load.
   */
  public async initialize(
    report: (params: { message: string, increment?: number }) => void
  ): Promise<void> {
    // Report progress
    report({ message: "Initializing parser..." });

    // Initialize parser
    await Parser.init();
    this.parser = new Parser();

    // Report progress
    report({ message: "Loading language parsers...", increment: 10 });

    // Load language parsers
    const languageConfig = {
      bash: { wasm: "tree-sitter-bash.wasm", extensions: [".sh", ".bash"] },
      c: { wasm: "tree-sitter-c.wasm", extensions: [".c", ".h"] },
      csharp: { wasm: "tree-sitter-c_sharp.wasm", extensions: [".cs"] },
      cpp: {
        wasm: "tree-sitter-cpp.wasm",
        extensions: [".cpp", ".cc", ".cxx", ".hpp"],
      },
      go: { wasm: "tree-sitter-go.wasm", extensions: [".go"] },
      html: { wasm: "tree-sitter-html.wasm", extensions: [".html"] },
      java: { wasm: "tree-sitter-java.wasm", extensions: [".java"] },
      javascript: {
        wasm: "tree-sitter-javascript.wasm",
        extensions: [".js", ".jsx"],
      },
      typescript: {
        wasm: "tree-sitter-typescript.wasm",
        extensions: [".ts", ".tsx"],
      },
      php: { wasm: "tree-sitter-php.wasm", extensions: [".php"] },
      python: { wasm: "tree-sitter-python.wasm", extensions: [".py"] },
      ruby: { wasm: "tree-sitter-ruby.wasm", extensions: [".rb"] },
      rust: { wasm: "tree-sitter-rust.wasm", extensions: [".rs"] },
      toml: { wasm: "tree-sitter-toml.wasm", extensions: [".toml"] },
      yaml: { wasm: "tree-sitter-yaml.wasm", extensions: [".yaml", ".yml"] },
    };

    for (const [lang, config] of Object.entries(languageConfig)) {
      // Report progress
      report({
        message: `Loading ${lang} parser...`,
        increment: 90 / Object.keys(languageConfig).length,
      });

      try {
        const wasmPath = path.join(
          this.context.extensionPath,
          "assets",
          "parsers",
          config.wasm
        );
        const language = await Language.load(await fs.readFile(wasmPath));
        this.languages[lang] = { language, extensions: config.extensions };
        config.extensions.forEach(
          (ext) => (this.extensionToLanguage[ext] = lang)
        );
      } catch (error) {
        console.error(`Failed to load ${lang} parser:`, error);
        vscode.window.showErrorMessage(
          `Failed to load ${lang} parser: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Parses a file using the tree-sitter parser and extracts the code chunks.
   * If the file extension is not recognized, it will fall back to a simple
   * text-based parse.
   *
   * @param filePath File path to parse
   * @returns An array of code chunks
   */
  public async parseFile(filePath: string): Promise<string[]> {
    if (!this.parser) {
      throw new Error("Parser not initialized");
    }

    const ext = path.extname(filePath).toLowerCase();
    const lang = this.extensionToLanguage[ext];
    if (!lang || !this.languages[lang]) {
      return this.fallbackParse(filePath);
    }

    this.parser.setLanguage(this.languages[lang].language);
    const tree = this.parser.parse(await fs.readFile(filePath, "utf-8"));
    return this.genericParse(tree!);
  }

  /**
   * Fallback parser that reads the entire file content as a single string.
   *
   * @param filePath - The path to the file to be parsed.
   * @returns A promise that resolves to an array containing the file content as a single string.
   */
  private async fallbackParse(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, "utf-8");
    return [content]; // Simple fallback
  }

  /**
   * Traverses the given tree and returns an array of code chunks. Currently, a
   * code chunk is any node that contains the string "function", "class", or
   * "method" in its type. If no such nodes exist, it returns an array with the
   * text of the root node.
   * @param tree The tree to traverse
   * @returns An array of code chunks
   */
  private genericParse(tree: Tree): string[] {
    const chunks: string[] = [];
    const walk = (node: Node) => {
      if (["function", "class", "method"].some((t) => node.type.includes(t))) {
        chunks.push(node.text);
      }
      for (let i = 0; i < node.childCount; i++) {
        walk(node.child(i)!);
      }
    };
    walk(tree.rootNode);
    return chunks.length > 0 ? chunks : [tree.rootNode.text];
  }
}
