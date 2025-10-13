// Regular expressions for different language constructs
export const patterns: { [key: string]: { [key: string]: RegExp } } = {
    // JavaScript/TypeScript patterns
    js: {
        // Match class declarations
        classDeclaration: /\b(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/g,

        // Match function declarations
        functionDeclaration: /\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*(?:\*\s*)?([A-Za-z_$][\w$]*)/g,

        // Match arrow functions with explicit names (const/let/var)
        arrowFunction: /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,

        // Match class methods - updated to exclude catch and control structures
        methodDeclaration: /(?:^|\s)(?!catch|if|for|while|switch|try)(?:async\s+)?(?:get\s+|set\s+|static\s+(?:get\s+|set\s+)?)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?<!\bcatch\b)\s*{/g,

        // Match object methods with better context
        objectMethod: /(?:^|[{,]\s*)(?!catch|if|for|while|switch|try)([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?<!\bcatch\b)\s*{/g,
    },
    // Python patterns
    python: {
        // Match class declarations
        classDeclaration: /\bclass\s+([A-Za-z_][\w]*)\s*(?:\([^)]*\))?\s*:/g,
        // Match function declarations
        functionDeclaration: /\bdef\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:->.*?)?\s*:/g,
    },
    // Go patterns
    go: {
        // Match function declarations
        functionDeclaration: /\bfunc\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:\([^)]*\))?\s*{/g,
        // Match method declarations
        methodDeclaration: /\bfunc\s+\(\s*[^)]*\s*\)\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:\([^)]*\))?\s*{/g,
        // Match struct (class-like) declarations
        structDeclaration: /\btype\s+([A-Za-z_][\w]*)\s+struct\s*{/g,
        // Match interface declarations
        interfaceDeclaration: /\btype\s+([A-Za-z_][\w]*)\s+interface\s*{/g,
    },
    // C# patterns
    csharp: {
        // Match class declarations
        classDeclaration: /\b(?:public|private|protected|internal|static)?\s*(?:abstract|sealed)?\s*class\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?::\s*[^{]+)?\s*{/g,
        // Match method declarations
        methodDeclaration: /\b(?:public|private|protected|internal)?\s*(?:static|virtual|abstract|override|async)?\s*(?:[A-Za-z_][\w<>[\],\s]*)\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:where\s+[^{]+)?\s*{/g,
        // Match interface declarations
        interfaceDeclaration: /\b(?:public|private|protected|internal)?\s*interface\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?::\s*[^{]+)?\s*{/g,
    },
    // Java patterns
    java: {
        // Match class declarations
        classDeclaration: /\b(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?:extends\s+[A-Za-z_][\w]*(?:<[^>]*>)?)?\s*(?:implements\s+[^{]+)?\s*{/g,
        // Match method declarations
        methodDeclaration: /\b(?:public|private|protected)?\s*(?:static|final|abstract|synchronized)?\s*(?:<[^>]*>)?\s*(?:[A-Za-z_][\w<>[\],\s]*)\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\s*{/g,
        // Match interface declarations
        interfaceDeclaration: /\b(?:public|private|protected)?\s*interface\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?:extends\s+[^{]+)?\s*{/g,
    },
    // PHP patterns
    php: {
        // Match class declarations
        classDeclaration: /\b(?:abstract|final)?\s*class\s+([A-Za-z_][\w]*)\s*(?:extends\s+[A-Za-z_][\w]*)?(?:\s+implements\s+[^{]+)?\s*{/g,
        // Match function declarations
        functionDeclaration: /\bfunction\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g,
        // Match method declarations
        methodDeclaration: /\b(?:public|private|protected)?\s*(?:static)?\s*function\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g,
    },
    // Ruby patterns
    ruby: {
        // Match class declarations
        classDeclaration: /\bclass\s+([A-Za-z_][\w]*)\s*(?:<\s*[A-Za-z_][\w:]*)?/g,
        // Match method declarations
        methodDeclaration: /\bdef\s+(?:self\.)?\s*([A-Za-z_][\w]*[!?]?)\b/g,
    },
    // Vue specific patterns (for script sections)
    vue: {
        // Match Vue component declarations
        componentDeclaration: /\bexport\s+default\s*(?:{|defineComponent\s*\()/g,
        // Match Vue methods in the methods section
        methodsSection: /\bmethods\s*:\s*{/g,
        // Match Vue computed properties
        computedSection: /\bcomputed\s*:\s*{/g,
    },
    // Angular specific patterns
    angular: {
        // Match Angular Component decorator
        componentDecorator: /@Component\s*\(\s*{/g,
        // Match Angular Directive decorator
        directiveDecorator: /@Directive\s*\(\s*{/g,
        // Match Angular Pipe decorator
        pipeDecorator: /@Pipe\s*\(\s*{/g,
        // Match Angular Service decorator
        serviceDecorator: /@Injectable\s*\(\s*{/g,
    },
    // React/JSX specific patterns (already covered mostly by JavaScript, but added specifics)
    react: {
        // Match React functional component declarations
        functionalComponent: /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(?:<|{)/g,
        // Match React.Component class declarations
        componentClass: /\bclass\s+([A-Za-z_$][\w$]*)\s+extends\s+(?:React\.)?Component/g,
    },
    // Rust patterns
    rust: {
        // Match function declarations
        functionDeclaration: /\bfn\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*(?:where\s+[^{]+)?\s*{/g,
        // Match struct declarations
        structDeclaration: /\bstruct\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?:where\s+[^{]+)?\s*{/g,
        // Match impl blocks (methods)
        implBlock: /\bimpl\s+(?:<[^>]*>)?\s*([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?:for\s+[^{]+)?\s*{/g,
        // Match trait (interface-like) declarations
        traitDeclaration: /\btrait\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*(?::\s*[^{]+)?\s*{/g,
    },
    // Swift patterns
    swift: {
        // Match class declarations
        classDeclaration: /\b(?:public|private|fileprivate|internal)?\s*(?:final)?\s*class\s+([A-Za-z_][\w]*)\s*(?::\s*[^{]+)?\s*{/g,
        // Match function declarations
        functionDeclaration: /\b(?:public|private|fileprivate|internal)?\s*func\s+([A-Za-z_][\w]*)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*{/g,
        // Match struct declarations
        structDeclaration: /\b(?:public|private|fileprivate|internal)?\s*struct\s+([A-Za-z_][\w]*)\s*(?::\s*[^{]+)?\s*{/g,
        // Match protocol (interface-like) declarations
        protocolDeclaration: /\b(?:public|private|fileprivate|internal)?\s*protocol\s+([A-Za-z_][\w]*)\s*(?::\s*[^{]+)?\s*{/g,
    },
};

// Define which pattern sets to use based on document language ID
export const languagePatterns: { [key: string]: Array<string> } = {
    'javascript': ['js', 'react'],
    'typescript': ['js', 'react', 'angular'],
    'javascriptreact': ['js', 'react'],
    'typescriptreact': ['js', 'react'],
    'vue': ['js', 'vue'],
    'python': ['python'],
    'go': ['go'],
    'csharp': ['csharp'],
    'java': ['java'],
    'php': ['php'],
    'ruby': ['ruby'],
    'rust': ['rust'],
    'swift': ['swift'],
    'unknown': ['js'],
};

// Define pattern priorities (higher number = higher priority)
export const patternPriorities: { [key: string]: number } = {
    'componentClass': 10,
    'functionalComponent': 9,
    'classDeclaration': 8,
    'methodDeclaration': 7,
    'functionDeclaration': 6,
    'arrowFunction': 5,
    'objectMethod': 4,
};

// List of supported language IDs
export const supportedLanguages = [
    'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
    'vue', 'python', 'go', 'csharp', 'java', 'php', 'ruby', 'rust', 'swift'
];