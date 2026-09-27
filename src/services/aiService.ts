import type { AIExplanationRequest } from '@/types/ai'

import { apiClient } from './apiClient'

export async function checkAiHealth() {
  const response = await apiClient.get<{ data: { healthy: boolean } }>('/ai/health/')
  return response.data.data.healthy
}

export async function requestExplanation(studentAnswerId: number, context = '') {
  const response = await apiClient.post<{ data: AIExplanationRequest }>('/ai/explain-mistake/', {
    student_answer: studentAnswerId,
    context,
  })
  return response.data.data
}

export async function retryExplanation(id: number) {
  const response = await apiClient.post<{ data: AIExplanationRequest }>(`/ai/explain-mistake/${id}/retry/`)
  return response.data.data
}
