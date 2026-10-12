import type { School } from '@/types/school'

const IMAGE_MAP: Array<{ match: RegExp; src: string }> = [
  { match: /katoro/i, src: '/Katoro.jpeg' },
  { match: /mlimani/i, src: '/Mlimani.jpeg' },
]

export function getSchoolImage(school: Pick<School, 'name' | 'code'>): string | null {
  for (const { match, src } of IMAGE_MAP) {
    if (match.test(school.name) || match.test(school.code)) return src
  }
  return null
}
