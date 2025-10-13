import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import go from 'highlight.js/lib/languages/go';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import dart from "highlight.js/lib/languages/dart";
import 'highlight.js/styles/github-dark.css';
import { escapeHtml } from '@/utilities/escapeHtml';
import { throttle } from '@/utilities/throttle';

// Register most common languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('go', go);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('dart', dart);

// Highlight directive for Vue components
const Highlight = {
    mounted(el: HTMLElement) {
        const blocks = el.querySelectorAll('pre code');
        blocks.forEach((block) => highlightCode(block));
    },

    async updated(el: HTMLElement) {
        await throttle(() => {
            const blocks = el.querySelectorAll('pre code');
            blocks.forEach((block) => highlightCode(block));
        }, 1000)();
    },
};


const highlightCode = (block: any) => {
    try {
        // Store original content securely
        const originalContent = block.textContent || '';

        // Reset if previously highlighted
        if (block.dataset.highlighted === 'yes') {
            delete block.dataset.highlighted;
            block.textContent = originalContent;
            block.className = block.className.replace('hljs', '').trim();
        }

        // Escape HTML before processing
        const safeContent = escapeHtml(originalContent);
        block.innerHTML = safeContent;

        // Highlight the safe content
        hljs.highlightElement(block);
    } catch (e) { }
};

// File extension to language mapping
export const FILE_EXTENSION_MAP: Record<string, string> = {
    // JavaScript ecosystem
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'vue': 'javascript',
    'svelte': 'javascript',
    'astro': 'javascript',
    'es6': 'javascript',

    // TypeScript ecosystem
    'ts': 'typescript',
    'tsx': 'typescript',
    'mts': 'typescript',
    'cts': 'typescript',

    // HTML and templates
    'html': 'html',
    'htm': 'html',
    'xhtml': 'html',
    'ejs': 'html',
    'hbs': 'handlebars',
    'handlebars': 'handlebars',
    'mustache': 'html',
    'pug': 'pug',
    'jade': 'pug',
    'twig': 'twig',
    'liquid': 'liquid',

    // CSS and preprocessors
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'styl': 'stylus',
    'stylus': 'stylus',
    'postcss': 'css',

    // Markup and documentation
    'md': 'markdown',
    'markdown': 'markdown',
    'mdx': 'markdown',
    'rst': 'restructuredtext',
    'tex': 'latex',

    // Configuration files
    'json': 'json',
    'jsonc': 'json',
    'json5': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'properties': 'ini',

    // Scripting and shells
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'ps1': 'powershell',
    'psm1': 'powershell',
    'psd1': 'powershell',
    'bat': 'dos',
    'cmd': 'dos',

    // Python ecosystem
    'py': 'python',
    'pyw': 'python',
    'pyi': 'python',
    'pyx': 'python',
    'pxd': 'python',
    'pxi': 'python',
    'rpy': 'python',
    'cpy': 'python',

    // Ruby ecosystem
    'rb': 'ruby',
    'ruby': 'ruby',
    'gemspec': 'ruby',
    'rake': 'ruby',

    // PHP ecosystem
    'php': 'php',
    'phtml': 'php',
    'php3': 'php',
    'php4': 'php',
    'php5': 'php',
    'php7': 'php',
    'phps': 'php',

    // Java ecosystem
    'java': 'java',
    'jsp': 'java',
    'class': 'java',
    'jar': 'java',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'scala': 'scala',
    'groovy': 'groovy',

    // C family
    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'hpp': 'cpp',
    'hxx': 'cpp',
    'ino': 'cpp',  // Arduino

    // C# and .NET
    'cs': 'csharp',
    'csx': 'csharp',

    // Go
    'go': 'go',
    'mod': 'go',  // Go modules

    // Rust
    'rs': 'rust',
    'rlib': 'rust',

    // Swift
    'swift': 'swift',

    // Dart
    'dart': 'dart',

    // SQL and databases
    'sql': 'sql',
    'ddl': 'sql',
    'dml': 'sql',
    'pgsql': 'sql',
    'plsql': 'sql',
    'psql': 'sql',
    'mysql': 'sql',
    'hql': 'sql',

    // WebAssembly
    'wat': 'wasm',
    'wasm': 'wasm',

    // R
    'r': 'r',
    'rdata': 'r',
    'rds': 'r',
    'rda': 'r',

    // Julia
    'jl': 'julia',

    // Haskell
    'hs': 'haskell',
    'lhs': 'haskell',

    // Elixir/Erlang
    'ex': 'elixir',
    'exs': 'elixir',
    'erl': 'erlang',
    'hrl': 'erlang',

    // Clojure
    'clj': 'clojure',
    'cljs': 'clojure',
    'cljc': 'clojure',
    'edn': 'clojure',

    // Lisp/Scheme
    'lisp': 'lisp',
    'lsp': 'lisp',
    'cl': 'lisp',
    'scm': 'scheme',
    'ss': 'scheme',
    'rkt': 'scheme',

    // Other languages
    'd': 'd',
    'f': 'fortran',
    'f90': 'fortran',
    'for': 'fortran',
    'fth': 'forth',
    '4th': 'forth',
    'nim': 'nim',
    'pascal': 'pascal',
    'pas': 'pascal',
    'pp': 'pascal',
    'ml': 'ocaml',
    'mli': 'ocaml',
    'fs': 'fsharp',
    'fsx': 'fsharp',
    'fsi': 'fsharp',
    'v': 'verilog',  // Also used by V language
    'sv': 'systemverilog',
    'vhd': 'vhdl',
    'vhdl': 'vhdl',

    // Build tools
    'Makefile': 'makefile',
    'make': 'makefile',
    'mk': 'makefile',
    'cmake': 'cmake',
    'dockerfile': 'dockerfile',
    'docker': 'dockerfile',

    // Misc
    'diff': 'diff',
    'patch': 'diff',
    'log': 'accesslog',
    'csv': 'csv',
    'tsv': 'csv',
    'xml': 'xml',
    'xsl': 'xml',
    'xslt': 'xml',
    'svg': 'xml'
};

export default Highlight;