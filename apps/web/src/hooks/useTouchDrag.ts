'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface TouchDragState {
  isDragging: boolean
  draggedItem: any | null
  dragPosition: { x: number; y: number } | null
  dropTarget: { date: Date; hour: number } | null
}

interface UseTouchDragOptions {
  onDragStart?: (item: any) => void
  onDragMove?: (position: { x: number; y: number }) => void
  onDragEnd?: (dropTarget: { date: Date; hour: number } | null) => void
  longPressDelay?: number
}

export function useTouchDrag(options: UseTouchDragOptions = {}) {
  const { onDragStart, onDragMove, onDragEnd, longPressDelay = 500 } = options

  const [state, setState] = useState<TouchDragState>({
    isDragging: false,
    draggedItem: null,
    dragPosition: null,
    dropTarget: null,
  })

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const startPosition = useRef<{ x: number; y: number } | null>(null)
  const itemRef = useRef<any>(null)

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent, item: any) => {
    const touch = e.touches[0]
    startPosition.current = { x: touch.clientX, y: touch.clientY }
    itemRef.current = item

    // Start long press timer for drag initiation
    longPressTimer.current = setTimeout(() => {
      setState({
        isDragging: true,
        draggedItem: item,
        dragPosition: { x: touch.clientX, y: touch.clientY },
        dropTarget: null,
      })
      onDragStart?.(item)

      // Vibrate for haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, longPressDelay)
  }, [longPressDelay, onDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    // If we haven't started dragging yet, check if we moved too much (cancel long press)
    if (!state.isDragging && startPosition.current) {
      const deltaX = Math.abs(touch.clientX - startPosition.current.x)
      const deltaY = Math.abs(touch.clientY - startPosition.current.y)

      // If moved more than 10px, it's a scroll, not a long press
      if (deltaX > 10 || deltaY > 10) {
        clearLongPress()
        return
      }
    }

    // If dragging, update position
    if (state.isDragging) {
      e.preventDefault() // Prevent scrolling while dragging

      const newPosition = { x: touch.clientX, y: touch.clientY }
      setState(prev => ({ ...prev, dragPosition: newPosition }))
      onDragMove?.(newPosition)
    }
  }, [state.isDragging, clearLongPress, onDragMove])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPress()

    if (state.isDragging) {
      // Calculate drop target based on final position
      onDragEnd?.(state.dropTarget)
    }

    setState({
      isDragging: false,
      draggedItem: null,
      dragPosition: null,
      dropTarget: null,
    })
    startPosition.current = null
    itemRef.current = null
  }, [state.isDragging, state.dropTarget, clearLongPress, onDragEnd])

  const setDropTarget = useCallback((target: { date: Date; hour: number } | null) => {
    setState(prev => ({ ...prev, dropTarget: target }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPress()
    }
  }, [clearLongPress])

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    setDropTarget,
  }
}

// Hook for detecting device type and screen size
export function useDeviceDetection() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
  })

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        screenWidth: width,
      })
    }

    updateDevice()
    window.addEventListener('resize', updateDevice)
    return () => window.removeEventListener('resize', updateDevice)
  }, [])

  return device
}

// Responsive breakpoint values
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
}

// Device-specific calendar configurations
export function getCalendarConfig(device: ReturnType<typeof useDeviceDetection>) {
  if (device.isMobile) {
    return {
      hourHeight: 44,
      bandWidth: 16,
      minBlockHeight: 40,
      cardRadius: 1,
      fontSize: {
        title: '10px',
        subtitle: '8px',
        band: '8px',
      },
      defaultView: 'day' as const,
      showTimeColumn: true,
      columnWidth: '100%',
    }
  }

  if (device.isTablet) {
    return {
      hourHeight: 48,
      bandWidth: 18,
      minBlockHeight: 44,
      cardRadius: 1.2,
      fontSize: {
        title: '11px',
        subtitle: '9px',
        band: '9px',
      },
      defaultView: 'week' as const,
      showTimeColumn: true,
      columnWidth: `${100 / 7}%`,
    }
  }

  // Desktop
  return {
    hourHeight: 52,
    bandWidth: 22,
    minBlockHeight: 50,
    cardRadius: 1.4,
    fontSize: {
      title: '11px',
      subtitle: '9.5px',
      band: '10px',
    },
    defaultView: 'week' as const,
    showTimeColumn: true,
    columnWidth: `${100 / 7}%`,
  }
}
