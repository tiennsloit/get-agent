interface GenerateInlineDocumentInput {
    code_file: string;
    target_code: string;
    entity_name: string;
    entity_type: string;
    user_instructions?: string;
}

export { GenerateInlineDocumentInput };