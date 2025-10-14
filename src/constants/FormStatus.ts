export const FormStatus = {
    INITIALIZED: -1,
    SUCCESS: 1,
    ERROR: 2,
} as const;

export type FormStatusType = (typeof FormStatus)[keyof typeof FormStatus];
