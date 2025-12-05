class AdaptiveScheduler {
    constructor() {
        this.completedAssignments = new Set();
        this.preferences = {
            weekendStudyMax: 4,
            dailyStudyMax: 6,
            preferredBreakDuration: 15,
            protectedTimes: [
                { day: 'Saturday', startTime: '18:00', endTime: '23:59' },
                { day: 'Sunday', startTime: '10:00', endTime: '14:00' }
            ],
            energyLevels: {
                morning: 0.9,
                afternoon: 0.7,
                evening: 0.8,
                night: 0.5
            }
        };
        this.loadFromStorage();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('nursingSchedulerData');
        if (saved) {
            const data = JSON.parse(saved);
            this.completedAssignments = new Set(data.completedAssignments || []);
            this.preferences = { ...this.preferences, ...data.preferences };
        }
    }

    saveToStorage() {
        const data = {
            completedAssignments: Array.from(this.completedAssignments),
            preferences: this.preferences
        };
        localStorage.setItem('nursingSchedulerData', JSON.stringify(data));
    }

    completeAssignment(course, assignmentText) {
        const id = `${course}-${assignmentText}`;
        this.completedAssignments.add(id);
        this.saveToStorage();
        return this.rescheduleRemaining();
    }

    getIncompleteAssignments() {
        const allAssignments = [];
        const currentWeek = parseInt(document.getElementById('week-selector').value);
        
        // Get assignments from current week forward
        for (let week = currentWeek; week <= 14; week++) {
            const weekModules = semesterModules[week];
            if (!weekModules) continue;
            
            Object.entries(weekModules).forEach(([course, module]) => {
                if (module.assignments) {
                    module.assignments.forEach(assignment => {
                        const id = `${course}-${assignment.text}`;
                        if (!this.completedAssignments.has(id) && 
                            localStorage.getItem(id) !== 'true') {
                            allAssignments.push({
                                ...assignment,
                                id: id,
                                course: course,
                                week: week,
                                dueDate: this.parseDate(assignment.date),
                                estimatedHours: this.estimateHours(assignment.type),
                                difficulty: this.estimateDifficulty(assignment.type)
                            });
                        }
                    });
                }
            });
        }
        
        return allAssignments;
    }

    parseDate(dateStr) {
        // Parse dates like "May 11" into 2025 dates
        const currentYear = 2025;
        const date = new Date(`${dateStr}, ${currentYear}`);
        return date;
    }

    estimateHours(type) {
        const estimates = {
            'reading': 2,
            'video': 0.5,
            'quiz': 1.5,
            'exam': 3,
            'assignment': 2.5,
            'vsim': 2,
            'activity': 1,
            'prep': 1,
            'remediation': 2
        };
        return estimates[type] || 1.5;
    }

    estimateDifficulty(type) {
        const difficulty = {
            'exam': 'hard',
            'quiz': 'medium',
            'assignment': 'medium',
            'reading': 'easy',
            'video': 'easy'
        };
        return difficulty[type] || 'medium';
    }

    rescheduleRemaining() {
        const now = new Date();
        const remainingAssignments = this.getIncompleteAssignments();
        const existingEvents = calendarEvents.filter(event => 
            new Date(event.start) > now
        );
        
        const prioritized = this.prioritizeAssignments(remainingAssignments);
        const newSchedule = this.generateAdaptiveSchedule(prioritized, existingEvents, now);
        
        return this.mergeWithExistingCalendar(newSchedule);
    }

    prioritizeAssignments(assignments) {
        return assignments.sort((a, b) => {
            const dueDateA = a.dueDate;
            const dueDateB = b.dueDate;
            const dateDiff = dueDateA - dueDateB;
            
            const typeWeight = {
                exam: 3,
                quiz: 2,
                reading: 1,
                assignment: 2,
                remediation: 1
            };
            
            const typeA = typeWeight[a.type] || 1;
            const typeB = typeWeight[b.type] || 1;
            
            if (dateDiff !== 0) return dateDiff;
            return typeB - typeA;
        });
    }

    generateAdaptiveSchedule(assignments, fixedEvents, startDate) {
        const schedule = [];
        
        assignments.forEach((assignment, index) => {
            const hoursNeeded = assignment.estimatedHours;
            const dueDate = assignment.dueDate;
            const urgency = this.calculateUrgency(dueDate, startDate);
            
            // Find best time slot
            const slot = this.findOptimalSlot(
                fixedEvents, 
                hoursNeeded, 
                urgency,
                assignment.difficulty,
                schedule
            );
            
            if (slot) {
                schedule.push({
                    id: `adaptive_${assignment.id}_${index}`,
                    title: `${assignment.course.toUpperCase()}: ${assignment.text}`,
                    start: slot.start,
                    end: slot.end,
                    color: '#000000',
                    extendedProps: { 
                        type: 'study',
                        course: assignment.course,
                        canReschedule: true,
                        originalAssignment: assignment.id
                    }
                });
            }
        });
        
        return schedule;
    }

    findOptimalSlot(existingEvents, hoursNeeded, urgency, difficulty, newSchedule) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 14);
        
        let currentDate = new Date(now);
        currentDate.setHours(currentDate.getHours() + 2); // Start 2 hours from now
        
        while (currentDate < endDate) {
            const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = currentDate.getHours();
            
            // Skip protected times
            if (this.isProtectedTime(currentDate)) {
                currentDate.setHours(currentDate.getHours() + 1);
                continue;
            }
            
            // Check for conflicts
            const endTime = new Date(currentDate);
            endTime.setTime(endTime.getTime() + hoursNeeded * 60 * 60 * 1000);
            
            if (!this.hasConflict(currentDate, endTime, existingEvents, newSchedule)) {
                // Score this slot based on preferences
                const score = this.scoreTimeSlot(currentDate, difficulty, urgency);
                
                if (score > 0.5) {
                    return {
                        start: currentDate.toISOString(),
                        end: endTime.toISOString()
                    };
                }
            }
            
            currentDate.setMinutes(currentDate.getMinutes() + 30);
        }
        
        return null;
    }

    isProtectedTime(date) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const time = date.toTimeString().slice(0, 5);
        
        return this.preferences.protectedTimes.some(protected => {
            return protected.day === dayOfWeek &&
                   time >= protected.startTime &&
                   time <= protected.endTime;
        });
    }

    hasConflict(start, end, existingEvents, newSchedule) {
        const allEvents = [...existingEvents, ...newSchedule];
        
        return allEvents.some(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            return (start < eventEnd && end > eventStart);
        });
    }

    scoreTimeSlot(date, difficulty, urgency) {
        const hour = date.getHours();
        let energyScore = 0.5;
        
        if (hour >= 6 && hour < 12) energyScore = this.preferences.energyLevels.morning;
        else if (hour >= 12 && hour < 18) energyScore = this.preferences.energyLevels.afternoon;
        else if (hour >= 18 && hour < 22) energyScore = this.preferences.energyLevels.evening;
        else if (hour >= 22 || hour < 6) energyScore = this.preferences.energyLevels.night;
        
        // Adjust for difficulty
        if (difficulty === 'hard' && energyScore < 0.7) {
            energyScore *= 0.8;
        }
        
        // Adjust for urgency
        if (urgency > 0.8) {
            energyScore *= 1.2;
        }
        
        return Math.min(1, energyScore);
    }

    calculateUrgency(dueDate, currentDate) {
        const daysUntilDue = (dueDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (daysUntilDue <= 1) return 1.0;
        if (daysUntilDue <= 3) return 0.8;
        if (daysUntilDue <= 7) return 0.6;
        return 0.4;
    }

    mergeWithExistingCalendar(newEvents) {
        // Remove old adaptive events
        calendarEvents = calendarEvents.filter(event => 
            !event.id || !event.id.startsWith('adaptive_')
        );
        
        // Add new events
        calendarEvents.push(...newEvents);
        
        // Update calendars
        if (calendarMonth) {
            calendarMonth.removeAllEvents();
            calendarMonth.addEventSource(calendarEvents);
        }
        if (calendarWeek) {
            calendarWeek.removeAllEvents();
            calendarWeek.addEventSource(calendarEvents);
        }
        
        return calendarEvents;
    }
}

// Initialize the scheduler
const adaptiveScheduler = new AdaptiveScheduler();