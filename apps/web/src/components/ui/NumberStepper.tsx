'use client'

import React from 'react'
import { Box, IconButton, Typography, Stack } from '@mui/material'
import { Add, Remove } from '@mui/icons-material'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  unit?: string
  size?: 'small' | 'medium'
}

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  label,
  unit = 'hrs',
  size = 'medium',
}: NumberStepperProps) {
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
    onChange(Number(newValue.toFixed(2)))
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(Number(newValue.toFixed(2)))
  }

  const buttonSize = size === 'small' ? 36 : 44
  const fontSize = size === 'small' ? '1rem' : '1.25rem'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: size === 'small' ? 1 : 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        minWidth: size === 'small' ? 100 : 120,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mb: 1,
          textAlign: 'center',
          lineHeight: 1.2,
          fontSize: size === 'small' ? '0.7rem' : '0.75rem',
        }}
        noWrap={false}
      >
        {label}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton
          onClick={handleDecrement}
          disabled={value <= min}
          size="small"
          sx={{
            width: buttonSize,
            height: buttonSize,
            bgcolor: 'action.hover',
            '&:active': { bgcolor: 'action.selected' },
          }}
        >
          <Remove fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            minWidth: size === 'small' ? 40 : 50,
            textAlign: 'center',
            fontWeight: 600,
            fontSize,
          }}
        >
          {value}
        </Typography>

        <IconButton
          onClick={handleIncrement}
          disabled={value >= max}
          size="small"
          sx={{
            width: buttonSize,
            height: buttonSize,
            bgcolor: 'action.hover',
            '&:active': { bgcolor: 'action.selected' },
          }}
        >
          <Add fontSize={size === 'small' ? 'small' : 'medium'} />
        </IconButton>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, fontSize: size === 'small' ? '0.65rem' : '0.7rem' }}
      >
        {unit}
      </Typography>
    </Box>
  )
}
