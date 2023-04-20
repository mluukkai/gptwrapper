import React from 'react'
import { Box, TextField, Typography, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { Set } from '../../types'

const Info = () => {
  const { t } = useTranslation()

  return (
    <Box mb={1}>
      <Tooltip placement="right" title={t('chat:systemMessageInfo')}>
      <Typography variant="h6" display="inline">
        {t('chat:systemMessage')}
      </Typography>
      </Tooltip>
    </Box>
  )
}

const SystemMessage = ({
  system,
  setSystem,
  disabled,
}: {
  system: string
  setSystem: Set<string>
  disabled: boolean
}) => {
  const { t } = useTranslation()

  return (
    <Box mb={2}>
      <Info />
      <TextField
        fullWidth
        multiline
        minRows={1}
        value={system}
        onChange={(e) => setSystem(e.target.value)}
        placeholder={disabled ? '' : t('chat:exampleSystemMessage') as string}
        disabled={disabled}
      />
    </Box>
  )
}

export default SystemMessage
