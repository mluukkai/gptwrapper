import { format } from 'date-fns'

import { ActivityPeriod, Course } from '../../types'

export const formatDate = (activityPeriod?: ActivityPeriod) => {
  if (!activityPeriod) return ''

  const { startDate, endDate } = activityPeriod

  const start = new Date(startDate)
  const end = new Date(endDate)

  return `${format(start, 'dd.MM.')}–${format(end, 'dd.MM.yyyy')}`
}

export const sortCourses = (a: Course, b: Course) => {
  const getStartTime = (course: Course) =>
    new Date(course.activityPeriod.startDate).getTime()

  return getStartTime(b) - getStartTime(a)
}
