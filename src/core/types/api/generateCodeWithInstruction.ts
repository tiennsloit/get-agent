interface GenerateCodeWithInstructionInput {
    code_file: string;
    target_code: string;
    user_instructions: string;
}

interface GenerateCodeWithInstructionOutput {
    code: string;
    type: string;
    language: string;
    replacedCode?: string;
}

export {
    GenerateCodeWithInstructionInput,
    GenerateCodeWithInstructionOutput
};