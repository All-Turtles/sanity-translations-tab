import React, { useContext, useState } from 'react'
import { Box, Button, Flex, Text, Stack, useToast } from '@sanity/ui'

import { TranslationContext } from './TranslationContext'
import { TranslationLocale, TranslationTask } from '../types'
import { LanguageStatus } from './LanguageStatus'

type JobProps = {
  task: TranslationTask
  locales: TranslationLocale[]
  refreshTask: () => Promise<void>
}

const getLocale = (
  localeId: string,
  locales: TranslationLocale[]
): TranslationLocale | undefined => locales.find(l => l.localeId === localeId)

export const TaskView = ({ task, locales, refreshTask }: JobProps) => {
  const context = useContext(TranslationContext)
  const toast = useToast()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const importFile = async (localeId: string) => {
    if (!context) {
      toast.push({
        title:
          'Missing context, unable to import translation. Try refreshing or clicking away from this tab and back.',
        status: 'error',
        closable: true,
      })
      return
    }

    const locale = getLocale(localeId, locales)
    const localeTitle = locale?.description || localeId
    const sanityId = context.localeIdAdapter
      ? context.localeIdAdapter(localeId)
      : localeId

    try {
      const translation = await context.adapter.getTranslation(
        task.taskId,
        localeId,
        context.secrets
      )
      await context.importTranslation(sanityId, translation)

      toast.push({
        title: `Imported ${localeTitle} translation`,
        status: 'success',
        closable: true,
      })
    } catch (err) {
      let errorMsg
      if (err instanceof Error) {
        errorMsg = err.message
      } else {
        errorMsg = err ? String(err) : null
      }

      toast.push({
        title: `Error getting ${localeTitle} translation`,
        description: errorMsg,
        status: 'error',
        closable: true,
      })
    }
  }

  const handleRefreshClick = async () => {
    setIsRefreshing(true)
    await refreshTask()
    setIsRefreshing(false)
  }

  return (
    <Stack space={4}>
      <Flex align="center" justify="space-between">
        <Text as="h2" weight="semibold" size={2}>
          Current Job Progress
        </Text>

        <Button
          fontSize={1}
          padding={2}
          text={isRefreshing ? 'Refreshing' : 'Refresh Status'}
          onClick={handleRefreshClick}
          disabled={isRefreshing}
        />
      </Flex>

      <Box>
        {task.locales.map(localeTask => {
          const reportPercent = localeTask.progress || 0
          const locale = getLocale(localeTask.localeId, locales)
          return (
            <LanguageStatus
              key={[task.taskId, localeTask.localeId].join('.')}
              importFile={async () => {
                await importFile(localeTask.localeId)
              }}
              title={locale?.description || localeTask.localeId}
              progress={reportPercent}
            />
          )
        })}
      </Box>
    </Stack>
  )
}
