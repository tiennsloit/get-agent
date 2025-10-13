import * as vscode from "vscode";

export async function getFilesInWorkspace(): Promise<string[]> {
  if (!vscode.workspace.workspaceFolders) {
    return [];
  }

  const extensions = [
    "sh",
    "bash",
    "c",
    "h",
    "cpp",
    "cc",
    "cxx",
    "hpp",
    "cs",
    "css",
    "go",
    "html",
    "java",
    "js",
    "jsx",
    "ts",
    "tsx",
    "lua",
    "md",
    "php",
    "py",
    "rb",
    "rs",
    "toml",
    "yaml",
    "yml",
    "vue",
  ];

  // Excluded folders
  const excludeDirs = [
    "node_modules",
    "build",
    "dist",
    ".nuxt",
    ".next",
    "out",
    "coverage",
    ".git",
    ".cache",
    ".output",
    ".vercel",
    ".turbo",
    ".idea",
    ".vscode",
    ".angular",
    ".svelte-kit",
    ".expo",
    ".parcel-cache",
    ".yarn",
    ".pnpm",
    ".tmp",
    "tmp",
    "logs",
    "log",
    "public",
    "static",
    "storybook-static",
    "android",
    "ios",
    "Pods",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    ".pytest_cache",
    ".env",
    "env",
    ".venv",
    ".serverless",
    ".docusaurus",
    ".cache-loader",
    ".gradle",
    ".idea",
    ".settings",
    ".history",
    ".DS_Store"
  ];

  // Create the exclude pattern
  const excludePattern = `**/{${excludeDirs.join(",")}}/**`;

  const files: string[] = [];
  for (const folder of vscode.workspace.workspaceFolders) {
    const uris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, `**/*.{${extensions.join(",")}}`),
      excludePattern
    );
    files.push(...uris.map((uri) => uri.fsPath));
  }
  return files;
}
