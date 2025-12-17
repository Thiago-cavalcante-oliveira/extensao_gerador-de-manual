import type { Chapter, System, Module } from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown Error' }));
        throw new Error(error.detail || `Error ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    systems: {
        list: () => request<System[]>('/systems'),
        create: (data: { name: string; context_prompt: string }) =>
            request<System>('/systems', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: { name: string; context_prompt: string }) =>
            request<System>(`/systems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: number) => request(`/systems/${id}`, { method: 'DELETE' }),
    },
    modules: {
        create: (systemId: number, data: { name: string; context_prompt: string }) =>
            request<Module>(`/systems/${systemId}/modules`, { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: { name: string; context_prompt: string }) =>
            request<Module>(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: number) => request(`/modules/${id}`, { method: 'DELETE' }),
    },
    chapters: {
        list: () => request<Chapter[]>('/chapters'),
        get: (id: number) => request<Chapter>(`/chapters/${id}`),
        delete: (id: number) => request(`/chapters/${id}`, { method: 'DELETE' }),
        regenerateAudio: (id: number, stepIndex: number, text: string) =>
            request<{ audio_url: string }>(`/chapters/${id}/regenerate_audio`, {
                method: 'POST',
                body: JSON.stringify({ step_index: stepIndex, text })
            }),
        update: (id: number, data: { title?: string; content?: any }) =>
            request<{ ok: boolean }>(`/chapters/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
    }
};
