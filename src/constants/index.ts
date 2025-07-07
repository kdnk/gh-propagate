// Version
export const VERSION = '0.2.3';

// Edit operations
export const EDIT_OPERATIONS = {
    TITLE: 'title',
    INTEGRATION: 'integration',
} as const;

export const VALID_EDIT_OPERATIONS = Object.values(EDIT_OPERATIONS);

// Regex patterns
export const PR_NUMBER_PREFIX_PATTERN = /^\[\d+\/\d+\]\s*/;

// Status icons
export const STATUS_ICONS = {
    MERGED: '✓',
    OPEN: '○',
    MERGED_EMOJI: '✅',
    OPEN_EMOJI: '🔄',
} as const;

// Messages
export const MESSAGES = {
    NO_PRS_FOUND: 'No PRs found in chain',
    NO_PRS_TO_UPDATE: 'No PRs found to update',
    UPDATING_PR_TITLES: '🔄 Updating PR titles with sequential numbering...',
    EXECUTING_EDIT_OPERATIONS: '🔄 Editing PRs',
    UPDATING_INTEGRATION_PR: '🔄 Updating integration PR description with PR chain...',
    INTEGRATION_PR_NOT_FOUND: '❌ Could not find integration PR',
    INTEGRATION_BRANCH_NOT_FOUND: '❌ Could not find integration branch',
    INVALID_EDIT_OPERATIONS: '❌ Invalid edit operations',
} as const;
