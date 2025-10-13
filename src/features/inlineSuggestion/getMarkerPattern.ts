import { CODELENS_SUGGESTION_MARKERS } from "../../core/constants/codeLens";


// Function to get the current regex pattern based on config
const getMarkerPattern = () => {
    const startMarker = CODELENS_SUGGESTION_MARKERS.START;
    const endMarker = CODELENS_SUGGESTION_MARKERS.END;

    // Escape special regex characters in the markers
    const escapedStart = escapeRegExp(startMarker);
    const escapedEnd = escapeRegExp(endMarker);

    return new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`, 'g');
};

// Helper function to escape regex special characters
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
}

export { getMarkerPattern };