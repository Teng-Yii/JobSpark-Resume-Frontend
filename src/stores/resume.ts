import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ResumeOptimizedResponse, ResumeDetailResponse } from '@/api/resume'
import { getResumeList } from '@/api/resume'

export const useResumeStore = defineStore('resume', () => {
  const currentResumeId = ref<string | null>(null)
  const currentResumeContent = ref<string | null>(null) // 可以先存一下解析后的内容，如果有的话
  const optimizationResult = ref<ResumeOptimizedResponse | null>(null)
  const resumeList = ref<ResumeDetailResponse[]>([])

  // 解析后的优化建议
  const parsedSuggestion = computed(() => {
    if (!optimizationResult.value?.suggestionText) {
      return { advantages: null, weaknesses: null, improvements: null }
    }

    const text = optimizationResult.value.suggestionText
    const result: { advantages: string[] | null, weaknesses: string[] | null, improvements: string[] | null } = {
      advantages: null,
      weaknesses: null,
      improvements: null
    }

    // 解析优势亮点
    const advantagesIndex = text.indexOf('优势亮点')
    const weaknessesIndex = text.indexOf('不足之处')
    const improvementsIndex = text.indexOf('改进建议')

    if (advantagesIndex !== -1) {
      const endIndex = weaknessesIndex !== -1 ? weaknessesIndex : (improvementsIndex !== -1 ? improvementsIndex : text.length)
      const advantagesText = text.substring(advantagesIndex, endIndex)
      result.advantages = advantagesText
        .split(/\d+\.\s+/)
        .filter(item => item.trim() && !item.includes('优势亮点'))
        .map(item => item.replace(/;$/, '').trim())
    }

    // 解析不足之处
    if (weaknessesIndex !== -1) {
      const endIndex = improvementsIndex !== -1 ? improvementsIndex : text.length
      const weaknessesText = text.substring(weaknessesIndex, endIndex)
      result.weaknesses = weaknessesText
        .split(/\d+\.\s+/)
        .filter(item => item.trim() && !item.includes('不足之处'))
        .map(item => item.replace(/;$/, '').trim())
    }

    // 解析改进建议
    if (improvementsIndex !== -1) {
      const improvementsText = text.substring(improvementsIndex)
      result.improvements = improvementsText
        .split(/\d+\.\s+/)
        .filter(item => item.trim() && !item.includes('改进建议'))
        .map(item => item.replace(/;$/, '').trim())
    }

    return result
  })

  function setResumeId(id: string) {
    currentResumeId.value = id
  }

  function setResumeContent(content: string) {
    currentResumeContent.value = content
  }

  function setOptimizationResult(result: ResumeOptimizedResponse) {
    optimizationResult.value = result
  }

  function clearResume() {
    currentResumeId.value = null
    currentResumeContent.value = null
    optimizationResult.value = null
  }

  async function fetchResumeList() {
    try {
      const response = await getResumeList()
      resumeList.value = response
    } catch (error) {
      console.error('Failed to fetch resume list:', error)
      throw error
    }
  }

  return {
    currentResumeId,
    currentResumeContent,
    optimizationResult,
    parsedSuggestion,
    resumeList,
    setResumeId,
    setResumeContent,
    setOptimizationResult,
    clearResume,
    fetchResumeList
  }
})