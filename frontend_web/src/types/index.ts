// Force HMR update
export interface Module {
    id: number;
    name: string;
    context_prompt?: string;
    system_id?: number;
}

export interface System {
    id: number;
    name: string;
    context_prompt?: string;
    modules: Module[];
}

export interface Chapter {
    id: number;
    title: string;
    video_url: string;
    status: 'PENDING' | 'PROCESSING' | 'DRAFT' | 'PUBLISHED';
    created_at: string;
    system_name?: string;
    module_name?: string;
    // Future fields for Sprint 4
    content?: any;
}
