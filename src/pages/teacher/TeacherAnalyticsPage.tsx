import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { BarChart } from '@/components/ui/BarChart'
import { Select } from '@/components/ui/Select'
import { StatTile } from '@/components/ui/StatTile'
import { CheckIcon } from '@/components/ui/icons'
import { Table } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { getApiErrorMessage } from '@/services/apiError'
import {
  getTeacherClassPerformance,
  getTeacherExamPerformance,
  getTeacherLessonCompletion,
  getTeacherQuestionPerformance,
  getTeacherQuizPerformance,
  getTeacherStudentPerformance,
} from '@/services/analyticsService'
import type {
  ClassPerformance,
  ExamPerformance,
  LessonCompletion,
  QuestionPerformance,
  QuizPerformance,
  StudentPerformance,
} from '@/types/analytics'

function percent(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

export default function TeacherAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('students')
  const [classes, setClasses] = useState<ClassPerformance[] | null>(null)
  const [students, setStudents] = useState<StudentPerformance[] | null>(null)
  const [quizzes, setQuizzes] = useState<QuizPerformance[] | null>(null)
  const [lessons, setLessons] = useState<LessonCompletion[] | null>(null)
  const [exams, setExams] = useState<ExamPerformance[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [questions, setQuestions] = useState<QuestionPerformance[] | null>(null)

  async function load() {
    setError(null)
    try {
      const [classesData, studentsData, quizzesData, lessonsData, examsData] = await Promise.all([
        getTeacherClassPerformance(),
        getTeacherStudentPerformance(),
        getTeacherQuizPerformance(),
        getTeacherLessonCompletion(),
        getTeacherExamPerformance(),
      ])
      setClasses(classesData)
      setStudents(studentsData)
      setQuizzes(quizzesData)
      setLessons(lessonsData)
      setExams(examsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!selectedQuizId) {
      setQuestions(null)
      return
    }
    getTeacherQuestionPerformance(Number(selectedQuizId)).then(setQuestions)
  }, [selectedQuizId])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!classes || !students || !quizzes || !lessons || !exams) return <LoadingState message="Loading analytics…" />

  const quizScores = students
    .map((student) => student.avg_quiz_percentage ?? student.avg_exam_percentage)
    .filter((value): value is number => value !== null)
  const highest = quizScores.length > 0 ? Math.max(...quizScores) : null
  const lowest = quizScores.length > 0 ? Math.min(...quizScores) : null

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Highest score" value={percent(highest)} tone="success" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Lowest score" value={percent(lowest)} tone="secondary" />
      </div>

      <Tabs
        tabs={[
          { id: 'students', label: 'Student progress' },
          { id: 'classes', label: 'Class average' },
          { id: 'lessons', label: 'Completion rate' },
          { id: 'quizzes', label: 'Question performance' },
          { id: 'exams', label: 'Exams' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'students' && (
        <>
          {students.length === 0 ? (
            <EmptyState title="No student data yet." />
          ) : (
            <Table
              columns={[
                { key: 'username', header: 'Student', render: (row: StudentPerformance) => row.username },
                { key: 'quiz', header: 'Avg quiz %', render: (row: StudentPerformance) => percent(row.avg_quiz_percentage) },
                { key: 'exam', header: 'Avg exam %', render: (row: StudentPerformance) => percent(row.avg_exam_percentage) },
                {
                  key: 'completion',
                  header: 'Lesson completion',
                  render: (row: StudentPerformance) => percent(row.lesson_completion_rate),
                },
              ]}
              data={students}
              getRowKey={(row) => String(row.student_id)}
            />
          )}
        </>
      )}

      {activeTab === 'classes' && (
        <>
          {classes.length === 0 ? (
            <EmptyState title="You have no classes yet." />
          ) : (
            <BarChart
              items={classes.map((c) => ({ label: c.class_name, value: c.avg_quiz_percentage ?? 0 }))}
              valueFormatter={(v) => percent(v)}
            />
          )}
        </>
      )}

      {activeTab === 'lessons' && (
        <>
          {lessons.length === 0 ? (
            <EmptyState title="No lessons yet." />
          ) : (
            <Table
              columns={[
                { key: 'title', header: 'Lesson', render: (row: LessonCompletion) => row.title },
                { key: 'started', header: 'Started', render: (row: LessonCompletion) => String(row.started_count) },
                { key: 'completed', header: 'Completed', render: (row: LessonCompletion) => String(row.completed_count) },
                { key: 'rate', header: 'Completion rate', render: (row: LessonCompletion) => percent(row.completion_rate) },
              ]}
              data={lessons}
              getRowKey={(row) => String(row.lesson_id)}
            />
          )}
        </>
      )}

      {activeTab === 'quizzes' && (
        <div className="flex flex-col gap-4">
          {quizzes.length === 0 ? (
            <EmptyState title="No quizzes yet." />
          ) : (
            <Table
              columns={[
                { key: 'title', header: 'Quiz', render: (row: QuizPerformance) => row.title },
                { key: 'attempts', header: 'Attempts', render: (row: QuizPerformance) => String(row.attempt_count) },
                { key: 'avg', header: 'Avg %', render: (row: QuizPerformance) => percent(row.avg_percentage) },
              ]}
              data={quizzes}
              getRowKey={(row) => String(row.quiz_id)}
            />
          )}
          <Select
            label="View question performance for"
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="max-w-xs"
          >
            <option value="">Select a quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.quiz_id} value={quiz.quiz_id}>
                {quiz.title}
              </option>
            ))}
          </Select>
          {questions && (
            <BarChart
              items={questions.map((q) => ({ label: q.text.slice(0, 40), value: q.percent_correct ?? 0 }))}
              valueFormatter={(v) => percent(v)}
            />
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <>
          {exams.length === 0 ? (
            <EmptyState title="No exams yet." />
          ) : (
            <Table
              columns={[
                { key: 'title', header: 'Exam', render: (row: ExamPerformance) => row.title },
                { key: 'candidates', header: 'Candidates', render: (row: ExamPerformance) => String(row.candidate_count) },
                { key: 'avg', header: 'Avg %', render: (row: ExamPerformance) => percent(row.avg_percentage) },
              ]}
              data={exams}
              getRowKey={(row) => String(row.exam_id)}
            />
          )}
        </>
      )}
    </div>
  )
}
