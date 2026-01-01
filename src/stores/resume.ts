import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useResumeStore = defineStore('resume', () => {
  const currentResumeId = ref<string | null>(null)
  const currentResumeContent = ref<string | null>(null) // 可以先存一下解析后的内容，如果有的话

  function setResumeId(id: string) {
    currentResumeId.value = id
  }

  function setResumeContent(content: string) {
    currentResumeContent.value = content
  }

  function clearResume() {
    currentResumeId.value = null
    currentResumeContent.value = null
  }

  return {
    currentResumeId,
    currentResumeContent,
    setResumeId,
    setResumeContent,
    clearResume
  }
})