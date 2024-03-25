import { Tiktoken } from '@dqbd/tiktoken'

import { DEFAULT_TOKEN_LIMIT } from '../../config'
import { tikeIam } from '../util/config'
import { User as UserType, StreamingOptions } from '../types'
import { ChatInstance, UserServiceUsage, User } from '../db/models'
import { getCourseModel, getAllowedModels } from '../util/util'
import logger from '../util/logger'

export const getUsage = async (userId: string) => {
  const { usage } = await User.findByPk(userId, {
    attributes: ['usage'],
  })

  return usage
}

export const checkUsage = async (
  { id, isPowerUser, isAdmin }: UserType,
  model: string
): Promise<boolean> => {
  if (model === 'gpt-3.5-turbo') return true

  const usage = await getUsage(id)

  // 10x token limit for power users
  const tokenLimit = isPowerUser
    ? DEFAULT_TOKEN_LIMIT * 10
    : DEFAULT_TOKEN_LIMIT

  return isAdmin || usage <= tokenLimit
}

export const checkCourseUsage = async (
  user: UserType,
  courseId: string
): Promise<boolean> => {
  const service = await ChatInstance.findOne({
    where: {
      courseId,
    },
  })

  const [serviceUsage] = await UserServiceUsage.findOrCreate({
    where: {
      userId: user.id,
      chatInstanceId: service.id,
    },
  })

  if (!user.isAdmin && serviceUsage.usageCount >= service.usageLimit) {
    logger.info('Usage limit reached')

    return false
  }

  return true
}

export const calculateUsage = (
  options: StreamingOptions,
  encoding: Tiktoken
): number => {
  const { messages } = options

  let tokenCount = 0
  messages.forEach((message) => {
    const encoded = encoding.encode(message.content || '')
    tokenCount += encoded.length
  })

  return tokenCount
}

export const incrementUsage = async (user: UserType, tokenCount: number) => {
  await User.increment('usage', {
    by: tokenCount,
    where: {
      id: user.id,
    },
  })
}

export const incrementCourseUsage = async (
  user: UserType,
  courseId: string,
  tokenCount: number
) => {
  const service = await ChatInstance.findOne({
    where: {
      courseId,
    },
    attributes: ['id'],
  })

  const serviceUsage = await UserServiceUsage.findOne({
    where: {
      userId: user.id,
      chatInstanceId: service.id,
    },
  })

  if (!serviceUsage) throw new Error('User service usage not found')

  serviceUsage.usageCount += tokenCount

  await serviceUsage.save()
}

export const getUserStatus = async (user: UserType, courseId: string) => {
  const isTike = user.iamGroups.some((iam) => iam.includes(tikeIam))

  const service = await ChatInstance.findOne({
    where: {
      courseId,
    },
    attributes: ['id', 'usageLimit', 'courseId'],
  })

  const serviceUsage = await UserServiceUsage.findOne({
    where: {
      chatInstanceId: service.id,
      userId: user.id,
    },
    attributes: ['usageCount'],
  })

  const model = await getCourseModel(service.courseId)
  const models = getAllowedModels(model)

  return {
    usage: serviceUsage?.usageCount ?? 0,
    limit: service?.usageLimit ?? 0,
    model,
    models,
    isTike,
  }
}
