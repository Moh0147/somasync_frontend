import { deleteQuestion, listQuestionsForQuiz, upsertQuestion } from '@/db/repositories/questionsRepository'
import { deleteSectionQuiz, getQuizForSection, upsertSectionQuiz } from '@/db/repositories/sectionQuizzesRepository'
import type { OfflineQuestion, OfflineSectionQuiz } from '@/types/offline'

export async function saveQuiz(quiz: OfflineSectionQuiz) {
  return upsertSectionQuiz(quiz)
}

export async function getQuiz(sectionId: number) {
  return getQuizForSection(sectionId)
}

export async function removeQuiz(id: number) {
  return deleteSectionQuiz(id)
}

export async function saveQuestion(question: OfflineQuestion) {
  return upsertQuestion(question)
}

export async function getQuizQuestions(quizId: number) {
  return listQuestionsForQuiz(quizId)
}

export async function removeQuestion(id: number) {
  return deleteQuestion(id)
}
