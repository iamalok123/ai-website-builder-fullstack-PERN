export interface User {
    id: string;
    email: string;
    fullName?: string;
    imageUrl?: string;
    name?: string;
    image?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface Version {
    id: string;
    timestamp: string;
    code: string;
}

export type GenerationStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Project {
    id: string;
    name: string;
    initial_prompt: string;
    current_code: string | null;
    currentVersionId?: string | null;
    generationStatus?: GenerationStatus;
    generationError?: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: User;
    isPublished?: boolean;
    versionId?: string;
    conversation: Message[];
    versions: Version[];
    current_version_index: string;
}
