import { addHours, startOfDay, endOfDay, isBefore, isAfter, differenceInDays, addDays, format, addMinutes, isSameDay } from 'date-fns'

export interface EnergyPattern {
  hour: number // 0-23
  energyLevel: number // 0-100
  productivity: number // 0-100
}

export interface ScheduleTask {
  id: string
  title: string
  courseId: string
  type: 'assignment' | 'quiz' | 'exam' | 'reading' | 'study' | 'project' | 'break'
  dueDate: Date
  estimatedDuration: number // in minutes
  priority: number // 0-100
  difficulty: number // 0-100
  completed: boolean
  canSplit: boolean // Can this task be split into multiple sessions
  minimumBlockSize?: number // Minimum time in minutes if task can be split
}

export interface StudyBlock {
  id: string
  taskId: string
  taskTitle: string
  taskType: ScheduleTask['type']
  startTime: Date
  endTime: Date
  energyRequired: number // 0-100
  isOptimal: boolean // Is this during peak energy time
  confidence: number // 0-100 confidence in this scheduling
}

export interface SchedulerConfig {
  dailyStudyHours: {
    min: number
    max: number
    preferred: number
  }
  breakDuration: {
    short: number // minutes (e.g., 5-10 min)
    long: number // minutes (e.g., 15-30 min)
  }
  sessionDuration: {
    min: number // minutes (e.g., 25 min for Pomodoro)
    max: number // minutes (e.g., 90 min max focus)
    preferred: number // minutes (e.g., 50 min)
  }
  bufferTime: number // minutes between tasks
  energyThreshold: {
    high: number // 70-100
    medium: number // 40-70
    low: number // 0-40
  }
  sleepSchedule: {
    bedtime: number // hour (e.g., 23 for 11 PM)
    wakeTime: number // hour (e.g., 7 for 7 AM)
  }
  preferredStudyTimes?: {
    morning: boolean // 6am-12pm
    afternoon: boolean // 12pm-5pm
    evening: boolean // 5pm-9pm
    night: boolean // 9pm-midnight
  }
  studyDays?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  allowWeekendStudy?: boolean
  capacityLimitPercent?: number // Percentage of day to use (0.0-1.0), default 0.5 for 50% capacity rule
}

export class DynamicScheduler {
  private config: SchedulerConfig
  private energyPattern: EnergyPattern[]

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      dailyStudyHours: {
        min: 2,
        max: 8,
        preferred: 4,
        ...config?.dailyStudyHours
      },
      breakDuration: {
        short: 5,
        long: 20,
        ...config?.breakDuration
      },
      sessionDuration: {
        min: 25,
        max: 90,
        preferred: 50,
        ...config?.sessionDuration
      },
      bufferTime: 10,
      energyThreshold: {
        high: 70,
        medium: 40,
        low: 20,
        ...config?.energyThreshold
      },
      sleepSchedule: {
        bedtime: 23,
        wakeTime: 7,
        ...config?.sleepSchedule
      },
      capacityLimitPercent: 1.0, // Default: use full configured availability
      ...config
    }

    // Initialize default energy pattern (can be personalized later)
    this.energyPattern = this.generateDefaultEnergyPattern()
  }

  /**
   * Get energy level for a specific hour, adjusted for day of week
   * @param hour Hour of day (0-23)
   * @param dayOfWeek Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
   */
  private getEnergyForHourAndDay(hour: number, dayOfWeek: number): number {
    // Base circadian rhythm pattern
    const baseEnergyLevels = {
      0: 10, 1: 5, 2: 5, 3: 5, 4: 5, 5: 10, 6: 20,
      7: 40, 8: 60, 9: 80, 10: 90, 11: 85, 12: 70,
      13: 60, 14: 65, 15: 75, 16: 80, 17: 75, 18: 65,
      19: 70, 20: 65, 21: 50, 22: 30, 23: 15
    }

    const baseEnergy = baseEnergyLevels[hour as keyof typeof baseEnergyLevels]

    // Day-of-week multipliers based on StudentLife research
    // Monday: low energy (post-weekend adjustment)
    // Tuesday-Thursday: building energy
    // Friday: high energy (anticipation of weekend)
    // Weekend: moderate (recovery mode)
    const dayMultipliers = {
      0: 0.85,  // Sunday - recovery day
      1: 0.80,  // Monday - lowest energy
      2: 0.90,  // Tuesday - building up
      3: 0.95,  // Wednesday - mid-week peak
      4: 1.00,  // Thursday - peak
      5: 1.05,  // Friday - highest (weekend anticipation)
      6: 0.90   // Saturday - active but recovering
    }

    const dayMultiplier = dayMultipliers[dayOfWeek as keyof typeof dayMultipliers] || 1.0

    return baseEnergy * dayMultiplier
  }

  private generateDefaultEnergyPattern(): EnergyPattern[] {
    const pattern: EnergyPattern[] = []

    // Generate base pattern (will be adjusted by day in getEnergyForTime)
    for (let hour = 0; hour < 24; hour++) {
      // Use Thursday (day 4) as baseline since it has 1.0 multiplier
      const baseEnergy = this.getEnergyForHourAndDay(hour, 4)

      pattern.push({
        hour,
        energyLevel: baseEnergy,
        productivity: baseEnergy * 0.9 // Productivity slightly lower than energy
      })
    }

    return pattern
  }

  public updateEnergyPattern(pattern: Partial<EnergyPattern>[]): void {
    pattern.forEach(update => {
      if (update.hour !== undefined) {
        const existing = this.energyPattern.find(p => p.hour === update.hour)
        if (existing) {
          Object.assign(existing, update)
        }
      }
    })
  }

  private getEnergyAtTime(time: Date): EnergyPattern {
    const hour = time.getHours()
    const dayOfWeek = time.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Get base pattern for this hour
    const basePattern = this.energyPattern.find(p => p.hour === hour) || this.energyPattern[0]

    // Apply day-of-week adjustment
    const adjustedEnergy = this.getEnergyForHourAndDay(hour, dayOfWeek)

    return {
      hour,
      energyLevel: adjustedEnergy,
      productivity: adjustedEnergy * 0.9
    }
  }

  private calculateTaskPriority(task: ScheduleTask, currentDate: Date): number {
    const daysUntilDue = differenceInDays(task.dueDate, currentDate)

    // Urgency factor (increases as deadline approaches)
    let urgencyScore = 100
    if (daysUntilDue > 14) urgencyScore = 20
    else if (daysUntilDue > 7) urgencyScore = 40
    else if (daysUntilDue > 3) urgencyScore = 60
    else if (daysUntilDue > 1) urgencyScore = 80
    else if (daysUntilDue === 1) urgencyScore = 95
    else if (daysUntilDue === 0) urgencyScore = 100

    // Weight factors
    const weights = {
      urgency: 0.4,
      priority: 0.3,
      difficulty: 0.2,
      type: 0.1
    }

    // Type priority (exams and quizzes get higher priority)
    const typePriority = {
      exam: 100,
      quiz: 90,
      project: 80,
      assignment: 70,
      reading: 50,
      study: 40,
      break: 10
    }

    const typeScore = typePriority[task.type] || 50

    // Calculate weighted score
    const finalScore =
      urgencyScore * weights.urgency +
      task.priority * weights.priority +
      task.difficulty * weights.difficulty +
      typeScore * weights.type

    return Math.min(100, Math.max(0, finalScore))
  }

  private findOptimalTimeSlot(
    task: ScheduleTask,
    availableSlots: { start: Date; end: Date }[],
    existingBlocks: StudyBlock[]
  ): StudyBlock | null {
    // Guard against malformed config values (persisted zero/NaN)
    const safeBufferTime = Number.isFinite(this.config.bufferTime) ? Math.max(0, this.config.bufferTime) : 10
    const safeMinSession = Math.max(
      15, // hard floor to avoid zero-length blocks
      Number.isFinite(this.config.sessionDuration?.min) ? this.config.sessionDuration.min : 25
    )
    const safePreferredDuration = Math.max(
      safeMinSession,
      Number.isFinite(this.config.sessionDuration?.preferred) ? this.config.sessionDuration.preferred : 50
    )

    const requiredEnergy = this.calculateRequiredEnergy(task)
    let bestSlot: StudyBlock | null = null
    let bestScore = -1

    for (const slot of availableSlots) {
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60)

      if (!Number.isFinite(slotDuration) || slotDuration <= 0) {
        console.log(`    ⚠️  Skipping slot with non-positive duration`, {
          start: format(slot.start, 'h:mma'),
          end: format(slot.end, 'h:mma'),
          slotDuration
        })
        continue
      }

      // Check if slot is long enough (including natural buffer time between sessions)
      const minRequired = Math.min(task.estimatedDuration, safeMinSession) + safeBufferTime
      if (slotDuration < minRequired) {
        console.log(`    ⏩ Slot too short after buffers`, {
          start: format(slot.start, 'h:mma'),
          end: format(slot.end, 'h:mma'),
          slotDuration: Math.round(slotDuration),
          minRequired: Math.round(minRequired)
        })
        continue
      }

      // Prefer smaller, focused sessions (30-60 min) over long marathon sessions
      // This allows better distribution throughout the day
      const preferredDuration = safePreferredDuration // e.g., 50 min
      const maxSessionDuration = 60 // Cap at 60 minutes instead of 90

      // Calculate block duration: prefer preferred duration, but adapt to available time
      const availableDuration = slotDuration - safeBufferTime * 2
      if (availableDuration < safeMinSession) {
        console.log(`    ⏩ Available duration collapses below minimum`, {
          start: format(slot.start, 'h:mma'),
          end: format(slot.end, 'h:mma'),
          slotDuration: Math.round(slotDuration),
          availableDuration: Math.round(availableDuration),
          minSession: safeMinSession
        })
        continue
      }

      let blockDuration = Math.min(
        task.estimatedDuration,
        preferredDuration, // Prefer focused sessions
        availableDuration, // Respect buffer on both ends
        maxSessionDuration // Don't exceed 60 min per block
      )

      // Clamp to configured minimum and available duration to avoid zero-length blocks
      blockDuration = Math.min(availableDuration, Math.max(blockDuration, safeMinSession))

      if (!Number.isFinite(blockDuration) || blockDuration <= 0) {
        console.log(`    ⚠️  Computed non-positive block duration`, {
          start: format(slot.start, 'h:mma'),
          end: format(slot.end, 'h:mma'),
          slotDuration: Math.round(slotDuration),
          availableDuration: Math.round(availableDuration),
          blockDuration
        })
        continue
      }

      // Final safety: compute end time in minutes and ensure it moves forward
      const endTime = addMinutes(slot.start, blockDuration)
      if (!isAfter(endTime, slot.start)) {
        console.log(`    ⚠️  End time did not advance; skipping slot`, {
          start: format(slot.start, 'h:mma'),
          end: format(endTime, 'h:mma'),
          blockDuration
        })
        continue
      }

      // Avoid stacking the same task on the same day when time allows
      const blocksSameDay = existingBlocks.filter(b =>
        b.taskId === task.id && isSameDay(b.startTime, slot.start)
      ).length
      const daysUntilDue = Math.max(0, differenceInDays(task.dueDate, slot.start))

      // If we still have at least a full day before the deadline, skip same-day repeats
      if (blocksSameDay >= 1 && daysUntilDue > 1) {
        continue
      }

      // When we're inside the final day window, allow at most two stacked blocks
      if (blocksSameDay >= 2 && daysUntilDue > 0) {
        continue
      }

      // Get energy level at this time
      const energy = this.getEnergyAtTime(slot.start)
      const hour = slot.start.getHours()

      // === MULTI-FACTOR SCORING (StudentLife Research-Based) ===

      // 1. Energy match (how well energy level matches task requirements)
      const energyMatch = 100 - Math.abs(requiredEnergy - energy.energyLevel)

      // 2. Time until deadline (buffer time score)
      const timeScore = this.calculateTimeScore(task, slot.start)

      // 3. User preference match (preferred study times)
      const preferenceBoost = this.calculatePreferenceBoost(slot.start)

      // 4. Task type optimization (exams in morning, reading in evening)
      const taskTypeBoost = this.calculateTaskTypeBoost(task, hour)

      // 5. Clustering avoidance (space out sessions for retention)
      const clusteringScore = this.calculateClusteringPenalty(slot.start, existingBlocks)

      // 6. Time variety (avoid same time slots repeatedly)
      const varietyScore = this.calculateTimeVarietyBonus(hour, task, existingBlocks)

      // 7. Daily spread (avoid stacking same task in one day when time allows)
      const dailySpreadScore = this.calculateDailySpreadScore(task, slot.start, existingBlocks)

      // === WEIGHTED SCORING ===
      // Total max: ~700 points possible
      const score =
        (energyMatch * 0.23) +         // Energy match
        (timeScore * 0.18) +           // Deadline buffer
        (preferenceBoost * 0.18) +     // User preference
        (taskTypeBoost * 0.12) +       // Task type optimization
        (clusteringScore * 0.09) +     // Spacing within the day
        (varietyScore * 0.10) +        // Time-of-day variety
        (dailySpreadScore * 0.10)      // Spread across days

      // Debug logging (can be toggled)
      if (false) { // Set to true for detailed slot scoring
        console.log(`    Slot ${format(slot.start, 'h:mma')}: score=${score.toFixed(1)}`, {
          energy: energyMatch.toFixed(1),
          time: timeScore.toFixed(1),
          pref: preferenceBoost.toFixed(1),
          type: taskTypeBoost.toFixed(1),
          cluster: clusteringScore.toFixed(1),
          variety: varietyScore.toFixed(1)
        })
      }

      if (score > bestScore) {
        bestScore = score
        bestSlot = {
          id: `block-${Date.now()}-${Math.random()}`,
          taskId: task.id,
          taskTitle: task.title,
          taskType: task.type,
          startTime: slot.start,
          endTime,
          energyRequired: requiredEnergy,
          isOptimal: energy.energyLevel >= requiredEnergy,
          confidence: score
        }
      }
    }

    return bestSlot
  }

  private calculateRequiredEnergy(task: ScheduleTask): number {
    // Higher difficulty tasks require more energy
    // Certain task types also require more focus
    const typeEnergyRequirements = {
      exam: 90,
      quiz: 80,
      project: 75,
      assignment: 70,
      reading: 50,
      study: 60,
      break: 10
    }

    const baseEnergy = typeEnergyRequirements[task.type] || 60
    const difficultyModifier = task.difficulty * 0.3

    return Math.min(100, baseEnergy + difficultyModifier)
  }

  private calculateTimeScore(task: ScheduleTask, proposedTime: Date): number {
    const hoursUntilDue = (task.dueDate.getTime() - proposedTime.getTime()) / (1000 * 60 * 60)

    // Prefer scheduling tasks with enough buffer before deadline
    if (task.type === 'exam' || task.type === 'quiz') {
      // For exams, prefer at least 24 hours before
      if (hoursUntilDue < 24) return 20
      if (hoursUntilDue < 48) return 60
      return 100
    } else {
      // For regular tasks, prefer at least 6 hours before
      if (hoursUntilDue < 6) return 30
      if (hoursUntilDue < 24) return 70
      return 100
    }
  }

  private calculatePreferenceBoost(time: Date): number {
    const hour = time.getHours()
    const prefs = this.config.preferredStudyTimes

    // If no preferences set, return neutral score
    if (!prefs) return 50

    // Determine which time period this hour falls into
    let score = 0

    if (hour >= 6 && hour < 12 && prefs.morning) {
      score = 100 // Morning preference
    } else if (hour >= 12 && hour < 17 && prefs.afternoon) {
      score = 100 // Afternoon preference
    } else if (hour >= 17 && hour < 21 && prefs.evening) {
      score = 100 // Evening preference
    } else if (hour >= 21 && hour < 24 && prefs.night) {
      score = 100 // Night preference
    } else {
      // Time period not preferred by user
      score = 20 // Low score but not zero (still usable if needed)
    }

    return score
  }

  private calculateTaskTypeBoost(task: ScheduleTask, hour: number): number {
    // Task-type specific time preferences (based on StudentLife research)
    // Exams/quizzes best in morning when fresh
    // Reading better in evening when can focus
    // Projects flexible but avoid late night

    if (task.type === 'exam' || task.type === 'quiz') {
      if (hour >= 9 && hour < 12) return 60 // Morning: peak focus
      if (hour >= 12 && hour < 15) return 40 // Early afternoon: still good
      if (hour >= 15) return 20 // Later: fatigue sets in
    }

    if (task.type === 'reading') {
      if (hour >= 17 && hour < 21) return 40 // Evening: quiet focus time
      if (hour >= 14 && hour < 17) return 30 // Afternoon: decent
      if (hour >= 9 && hour < 12) return 20 // Morning: better for active tasks
    }

    if (task.type === 'project') {
      if (hour >= 10 && hour < 17) return 40 // Daytime: best for sustained work
      if (hour >= 17 && hour < 20) return 30 // Evening: okay
      if (hour >= 20) return 10 // Late: avoid long sessions
    }

    // Assignments flexible
    if (task.type === 'assignment') {
      if (hour >= 9 && hour < 21) return 30 // Most hours work well
      return 15
    }

    // Default: no strong preference
    return 20
  }

  private calculateClusteringPenalty(
    time: Date,
    existingBlocks: StudyBlock[]
  ): number {
    // Penalize scheduling too many blocks close together
    // Encourages spacing out study sessions for better retention
    const proposedStart = time.getTime()
    const windowHours = 2 // Look 2 hours before and after

    let nearbyBlocks = 0

    for (const block of existingBlocks) {
      const blockStart = block.startTime.getTime()
      const timeDiff = Math.abs(proposedStart - blockStart) / (1000 * 60 * 60)

      if (timeDiff < windowHours) {
        nearbyBlocks++
      }
    }

    // Each nearby block reduces score by 15 points
    const penalty = nearbyBlocks * 15

    return Math.max(0, 100 - penalty)
  }

  private calculateTimeVarietyBonus(
    hour: number,
    task: ScheduleTask,
    existingBlocks: StudyBlock[]
  ): number {
    // Bonus for scheduling at different times of day
    // Prevents getting stuck in same time slots
    const taskBlocks = existingBlocks.filter(b => b.taskId === task.id)

    if (taskBlocks.length === 0) return 50 // Neutral for first block

    // Count how many blocks for this task are at this hour
    const blocksAtThisHour = taskBlocks.filter(b =>
      b.startTime.getHours() === hour
    ).length

    // Penalty for duplicate hours: -10 per duplicate
    const penalty = blocksAtThisHour * 10

    return Math.max(0, 50 - penalty)
  }

  private calculateDailySpreadScore(
    task: ScheduleTask,
    proposedTime: Date,
    existingBlocks: StudyBlock[]
  ): number {
    const blocksSameDay = existingBlocks.filter(b =>
      b.taskId === task.id && isSameDay(b.startTime, proposedTime)
    ).length

    if (blocksSameDay === 0) return 100

    // If we're very close to the due date, allow stacking but still soften it
    const daysUntilDue = Math.max(0, differenceInDays(task.dueDate, proposedTime))
    if (daysUntilDue <= 1) {
      return 60 // mild penalty when time is almost out
    }

    // When there's time, strongly prefer spreading across days
    const penalty = blocksSameDay * 60 // heavy penalty for same-day repeats
    return Math.max(10, 100 - penalty)
  }

  private isDayAllowed(date: Date): boolean {
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const studyDays = this.config.studyDays

    // If no study days configured, allow all days
    if (!studyDays) return true

    // Check if weekend study is disabled
    if (!this.config.allowWeekendStudy && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false
    }

    // Map day of week to study days preference
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    const dayName = dayMap[dayOfWeek]

    return studyDays[dayName] !== false // Allow by default if not explicitly set to false
  }

  private generateBreaks(studyBlocks: StudyBlock[]): StudyBlock[] {
    // Don't create explicit break blocks - just leave natural gaps between sessions
    return []
  }

  public generateSchedule(
    tasks: ScheduleTask[],
    startDate: Date,
    endDate: Date,
    existingEvents: { start: Date; end: Date }[] = []
  ): StudyBlock[] {
    console.log(`\n📅 === STARTING SCHEDULE GENERATION ===`)
    console.log(`📊 Tasks to schedule: ${tasks.filter(t => !t.completed).length}`)
    console.log(`📆 Date range: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`)
    console.log(`⚙️ User preferences:`, {
      preferredTimes: this.config.preferredStudyTimes,
      studyDays: this.config.studyDays,
      allowWeekends: this.config.allowWeekendStudy
    })

    // Sort tasks by calculated priority
    const sortedTasks = [...tasks]
      .filter(t => !t.completed)
      .sort((a, b) => {
        const priorityA = this.calculateTaskPriority(a, startDate)
        const priorityB = this.calculateTaskPriority(b, startDate)
        return priorityB - priorityA
      })

    console.log(`\n🎯 Task priorities (top 5):`)
    sortedTasks.slice(0, 5).forEach((task, i) => {
      const priority = this.calculateTaskPriority(task, startDate)
      console.log(`  ${i+1}. "${task.title}" - Priority: ${priority.toFixed(1)}, Duration: ${task.estimatedDuration}min`)
    })

    const studyBlocks: StudyBlock[] = []
    const scheduledTaskIds = new Set<string>()
    let daysProcessed = 0
    let daysSkipped = 0

    // Generate available time slots for each day
    let currentDate = startOfDay(startDate)
    while (isBefore(currentDate, endDate)) {
      // Skip days that aren't in user's study schedule
      if (!this.isDayAllowed(currentDate)) {
        daysSkipped++
        console.log(`⏭️  Skipping ${format(currentDate, 'EEE MMM d')} (not in study schedule)`)
        currentDate = addDays(currentDate, 1)
        continue
      }

      daysProcessed++
      const dayStart = addHours(currentDate, this.config.sleepSchedule.wakeTime)
      const dayEnd = addHours(currentDate, this.config.sleepSchedule.bedtime)

      console.log(`\n📅 Processing ${format(currentDate, 'EEE MMM d')} (${format(dayStart, 'ha')}-${format(dayEnd, 'ha')})`)

      // Calculate capacity limit for this day
      const totalDayHours = this.config.sleepSchedule.bedtime - this.config.sleepSchedule.wakeTime
      const capacityPercent = this.config.capacityLimitPercent ?? 1
      const capacityHours = totalDayHours * capacityPercent
      const capacityMinutes = capacityHours * 60

      console.log(`  ⚡ Capacity: ${capacityMinutes}min (${Math.round(capacityPercent * 100)}% of ${totalDayHours}h day)`)

      // Keep scheduling blocks until capacity is reached or no more tasks fit
      let blocksScheduledToday = 0
      let minutesScheduledToday = 0
      const maxBlocksPerDay = 8 // Reasonable limit to prevent infinite loops

      while (blocksScheduledToday < maxBlocksPerDay && minutesScheduledToday < capacityMinutes) {
        // Find available slots (excluding existing events and already scheduled blocks)
        const availableSlots = this.findAvailableSlots(
          dayStart,
          dayEnd,
          [
            ...existingEvents,
            ...studyBlocks.map(b => ({ start: b.startTime, end: b.endTime }))
          ]
        )

        console.log(`  🕒 Available slots: ${availableSlots.length}`)

        // If no available slots, move to next day
        if (availableSlots.length === 0) {
          console.log(`  ⚠️  No available time slots on this day`)
          break
        }

        let scheduledBlockThisRound = false

        // Try to schedule one block for each task (in priority order)
        for (const task of sortedTasks) {
          if (scheduledTaskIds.has(task.id)) continue
          if (isAfter(task.dueDate, endDate)) continue
          if (task.estimatedDuration <= 0) {
            scheduledTaskIds.add(task.id)
            continue
          }

          const block = this.findOptimalTimeSlot(task, availableSlots, studyBlocks)
          if (block) {
            const blockDuration = (block.endTime.getTime() - block.startTime.getTime()) / 60000

            // Check if adding this block would exceed capacity
            if (minutesScheduledToday + blockDuration > capacityMinutes) {
              console.log(`  ⚠️  Skipping "${task.title}" - would exceed capacity (${Math.round(minutesScheduledToday + blockDuration)}/${Math.round(capacityMinutes)}min)`)
              continue // Skip this task, try next one
            }

            console.log(`  ✅ Scheduled: "${task.title}" - ${format(block.startTime, 'h:mma')}-${format(block.endTime, 'h:mma')} (${Math.round(blockDuration)}min)`)

            studyBlocks.push(block)
            scheduledBlockThisRound = true
            blocksScheduledToday++
            minutesScheduledToday += blockDuration

            // Update remaining duration if task can be split
            if (task.canSplit) {
              const scheduledDuration = (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60)
              task.estimatedDuration -= scheduledDuration

              if (task.estimatedDuration <= 0) {
                console.log(`  🎯 Task "${task.title}" fully scheduled`)
                scheduledTaskIds.add(task.id)
              } else {
                console.log(`  ⏳ Task "${task.title}" still needs ${Math.round(task.estimatedDuration)}min`)
              }
            } else {
              scheduledTaskIds.add(task.id)
            }

            // Break after scheduling one block to update available slots
            break
          }
        }

        // If no blocks were scheduled this round, no point trying again
        if (!scheduledBlockThisRound) {
          console.log(`  ⏹️  No more tasks fit in remaining slots`)
          break
        }
      }

      const capacityUsedPercent = (minutesScheduledToday / capacityMinutes * 100).toFixed(1)
      console.log(`  📊 Day summary: ${blocksScheduledToday} blocks, ${Math.round(minutesScheduledToday)}/${Math.round(capacityMinutes)}min (${capacityUsedPercent}% capacity)`)

      if (minutesScheduledToday >= capacityMinutes) {
        console.log(`  🛑 Capacity limit reached for this day`)
      }
      currentDate = addDays(currentDate, 1)
    }

    console.log(`\n✅ === SCHEDULE GENERATION COMPLETE ===`)
    console.log(`📊 Summary:`)
    console.log(`  • Days processed: ${daysProcessed}`)
    console.log(`  • Days skipped: ${daysSkipped}`)
    console.log(`  • Total blocks created: ${studyBlocks.length}`)
    console.log(`  • Tasks fully scheduled: ${scheduledTaskIds.size}/${sortedTasks.length}`)
    console.log(`  • Tasks partially/not scheduled: ${sortedTasks.length - scheduledTaskIds.size}`)

    // Add breaks between study sessions
    const breaksToAdd = this.generateBreaks(studyBlocks)

    // Sort all blocks by start time
    const allBlocks = [...studyBlocks, ...breaksToAdd].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    )

    return allBlocks
  }

  /**
   * Incremental reschedule - only adjust affected blocks
   * Used when a task is completed to redistribute freed time
   */
  public incrementalReschedule(
    completedTaskIds: string[],
    remainingTasks: ScheduleTask[],
    existingBlocks: StudyBlock[],
    existingEvents: { start: Date; end: Date }[] = []
  ): StudyBlock[] {
    console.log(`\n♻️ === INCREMENTAL RESCHEDULE ===`)
    console.log(`📋 Completed tasks: ${completedTaskIds.length}`)
    console.log(`📊 Remaining tasks: ${remainingTasks.length}`)
    console.log(`📅 Existing blocks: ${existingBlocks.length}`)

    // Step 1: Remove blocks for completed tasks
    const validBlocks = existingBlocks.filter(
      block => !completedTaskIds.includes(block.taskId)
    )

    console.log(`✅ Kept ${validBlocks.length} valid blocks`)
    console.log(`🗑️  Removed ${existingBlocks.length - validBlocks.length} blocks for completed tasks`)

    // Step 2: Identify tasks that need rescheduling
    // - Tasks with partial blocks (not fully scheduled yet)
    // - Tasks with no blocks
    const tasksNeedingScheduling = remainingTasks.filter(task => {
      const taskBlocks = validBlocks.filter(b => b.taskId === task.id)
      if (taskBlocks.length === 0) return true

      // Calculate total scheduled time for this task
      const scheduledMinutes = taskBlocks.reduce((sum, block) => {
        return sum + (block.endTime.getTime() - block.startTime.getTime()) / 60000
      }, 0)

      return scheduledMinutes < task.estimatedDuration
    })

    console.log(`📝 Tasks needing scheduling: ${tasksNeedingScheduling.length}`)

    if (tasksNeedingScheduling.length === 0) {
      console.log(`✨ No tasks need rescheduling - returning existing blocks`)
      return validBlocks
    }

    // Step 3: Find freed time slots
    // These are gaps between valid blocks and existing events
    const now = new Date()
    const futureDate = addDays(now, 60) // Look ahead 60 days

    // Get all occupied time (valid blocks + events)
    const occupiedSlots = [
      ...validBlocks.map(b => ({ start: b.startTime, end: b.endTime })),
      ...existingEvents
    ]

    console.log(`🔍 Finding freed time slots...`)

    // Step 4: Schedule only the tasks that need it into freed slots
    const newBlocks: StudyBlock[] = []
    let currentDate = startOfDay(now)

    while (isBefore(currentDate, futureDate) && tasksNeedingScheduling.length > 0) {
      if (!this.isDayAllowed(currentDate)) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      const dayStart = addHours(currentDate, this.config.sleepSchedule.wakeTime)
      const dayEnd = addHours(currentDate, this.config.sleepSchedule.bedtime)

      // Find available slots for this day
      const availableSlots = this.findAvailableSlots(
        dayStart,
        dayEnd,
        [
          ...occupiedSlots,
          ...newBlocks.map(b => ({ start: b.startTime, end: b.endTime }))
        ]
      )

      if (availableSlots.length > 0) {
        // Try to schedule one block from the highest priority task
        for (const task of tasksNeedingScheduling) {
          if (isAfter(task.dueDate, futureDate)) continue

          // Calculate how much time this task still needs
          const existingTaskBlocks = [
            ...validBlocks.filter(b => b.taskId === task.id),
            ...newBlocks.filter(b => b.taskId === task.id)
          ]
          const scheduledMinutes = existingTaskBlocks.reduce((sum, block) => {
            return sum + (block.endTime.getTime() - block.startTime.getTime()) / 60000
          }, 0)
          const remainingMinutes = task.estimatedDuration - scheduledMinutes

          if (remainingMinutes <= 0) continue

          const block = this.findOptimalTimeSlot(task, availableSlots, [...validBlocks, ...newBlocks])
          if (block) {
            newBlocks.push(block)
            console.log(`  ✅ Scheduled: "${task.title}" - ${format(block.startTime, 'h:mma')}-${format(block.endTime, 'h:mma')}`)
            break // Move to next day
          }
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    console.log(`📊 Incremental reschedule summary:`)
    console.log(`  • Existing blocks kept: ${validBlocks.length}`)
    console.log(`  • New blocks added: ${newBlocks.length}`)
    console.log(`  • Total blocks: ${validBlocks.length + newBlocks.length}`)

    // Combine valid blocks and new blocks, then sort by time
    const allBlocks = [...validBlocks, ...newBlocks].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    )

    return allBlocks
  }

  private findAvailableSlots(
    dayStart: Date,
    dayEnd: Date,
    busySlots: { start: Date; end: Date }[]
  ): { start: Date; end: Date }[] {
    const available: { start: Date; end: Date }[] = []
    const fmt = (d: Date) => (d instanceof Date && !isNaN(d.getTime()) ? format(d, 'h:mma') : 'invalid')

    // Filter out any slots with invalid dates or non-positive durations
    const validSlots = busySlots
      .filter(slot =>
        slot.start && slot.end &&
        slot.start instanceof Date && slot.end instanceof Date &&
        !isNaN(slot.start.getTime()) && !isNaN(slot.end.getTime()) &&
        isAfter(slot.end, slot.start)
      )
      // Keep only slots that intersect this day; drop slots entirely outside the window
      .filter(slot => isAfter(slot.end, dayStart) && isAfter(dayEnd, slot.start))
      // Clamp overlapping slots to the current day window
      .map(slot => ({
        start: isBefore(slot.start, dayStart) ? dayStart : slot.start,
        end: isAfter(slot.end, dayEnd) ? dayEnd : slot.end
      }))
      .filter(slot => isAfter(slot.end, slot.start))

    console.log(`  🔍 findAvailableSlots for ${format(dayStart, 'MMM d')}:`, {
      dayStart: format(dayStart, 'h:mma'),
      dayEnd: format(dayEnd, 'h:mma'),
      busyCount: busySlots.length,
      validBusy: validSlots.slice(0, 3).map(slot => ({
        start: fmt(slot.start),
        end: fmt(slot.end),
        duration: Math.round((slot.end.getTime() - slot.start.getTime()) / 60000)
      }))
    })

    // Sort busy slots by start time
    const sorted = [...validSlots].sort((a, b) => a.start.getTime() - b.start.getTime())

    let currentTime = dayStart

    for (const busy of sorted) {
      // If there's a gap before this busy slot
      if (isBefore(currentTime, busy.start)) {
        const gap = (busy.start.getTime() - currentTime.getTime()) / (1000 * 60)
        if (gap >= this.config.sessionDuration.min + this.config.bufferTime) {
          available.push({
            start: currentTime,
            end: busy.start
          })
        }
      }

      // Move current time to end of busy slot
      if (isAfter(busy.end, currentTime)) {
        currentTime = busy.end
      }
    }

    // Check for remaining time at end of day
    if (isBefore(currentTime, dayEnd)) {
      const gap = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60)
      if (gap >= this.config.sessionDuration.min) {
        available.push({
          start: currentTime,
          end: dayEnd
        })
      }
    }

    console.log(`  ✅ Available slots (${available.length}):`, available.slice(0, 5).map(slot => ({
      start: fmt(slot.start),
      end: fmt(slot.end),
      duration: Math.round((slot.end.getTime() - slot.start.getTime()) / 60000)
    })))

    return available
  }

  public optimizeSchedule(blocks: StudyBlock[], feedback: {
    blockId: string
    completed: boolean
    actualDuration?: number
    energyLevel?: number
    productivity?: number
  }[]): StudyBlock[] {
    // Use feedback to adjust future scheduling
    // This would update energy patterns and time estimates based on actual performance

    // For now, return the original blocks
    // This will be enhanced with machine learning in future iterations
    return blocks
  }
}

// Helper function to convert tasks from store to scheduler format
export function convertToSchedulerTask(task: any): ScheduleTask {
  const typeMap: Record<string, ScheduleTask['type']> = {
    exam: 'exam',
    quiz: 'quiz',
    assignment: 'assignment',
    project: 'project',
    reading: 'reading',
    study: 'study'
  }

  // Convert estimatedHours to estimatedDuration (minutes)
  const rawHours =
    task.estimatedHours ??
    (typeof task.estimatedDuration === 'number' ? task.estimatedDuration / 60 : undefined)

  const estimatedHours = Number.isFinite(Number(rawHours)) ? Number(rawHours) : 1
  const estimatedDuration = Math.max(1, estimatedHours * 60) // Convert hours to minutes, guard against zero

  const priority = Number.isFinite(Number(task.priority)) ? Number(task.priority) : 50
  const difficulty = Number.isFinite(Number(task.difficulty)) ? Number(task.difficulty) : 50

  return {
    id: task.id,
    title: task.title,
    courseId: task.courseId,
    type: typeMap[task.type] || 'assignment',
    dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
    estimatedDuration,
    priority,
    difficulty,
    completed: task.status === 'completed',
    canSplit: task.canSplit !== false,
    minimumBlockSize: task.minimumBlockSize || 25
  }
}
