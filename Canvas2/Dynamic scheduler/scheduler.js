// scheduler.js
import { allModules } from './module-structure.js';

export class AdaptiveScheduler {
    constructor() {
        this.preferences = {
            dailyMaxHours: 6,
            weekendMaxHours: 4,
            blockDuration: 1.5,
            breakDuration: 0.25,
            energyLevels: {
                morning: 0.9,
                afternoon: 0.7,
                evening: 0.8,
                night: 0.5
            }
        };
        this.scheduledBlocks = [];
    }
    
    updatePreferences() {
        this.preferences.dailyMaxHours = parseInt(document.getElementById('daily-max').value);
        this.preferences.weekendMaxHours = parseInt(document.getElementById('weekend-max').value);
        this.preferences.blockDuration = parseFloat(document.getElementById('block-duration').value);
    }
    
    generateSchedule() {
        this.updatePreferences();
        this.scheduledBlocks = [];
        
        // Get all incomplete assignments from modules
        const assignments = this.getIncompleteAssignments();
        
        // Sort by priority and due date
        assignments.sort((a, b) => {
            const priorityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
            if (a.priority !== b.priority) {
                return priorityWeight[a.priority] - priorityWeight[b.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Schedule each assignment
        assignments.forEach(assignment => {
            this.scheduleAssignment(assignment);
        });
        
        return this.scheduledBlocks;
    }
    
    getIncompleteAssignments() {
        const assignments = [];
        const currentWeek = parseInt(document.getElementById('week-selector').value);
        
        for (let week = currentWeek; week <= 14; week++) {
            const weekModules = allModules[week];
            if (!weekModules) continue;
            
            Object.entries(weekModules).forEach(([course, module]) => {
                if (module.assignments) {
                    module.assignments.forEach(assignment => {
                        // Check if assignment is not completed
                        if (!this.isCompleted(course, assignment.id)) {
                            assignments.push({
                                ...assignment,
                                course: course,
                                week: week,
                                moduleTitle: module.title
                            });
                        }
                    });
                }
            });
        }
        
        return assignments;
    }
    
    isCompleted(course, assignmentId) {
        return localStorage.getItem(`${course}-${assignmentId}`) === 'true';
    }
    
    scheduleAssignment(assignment) {
        const remainingHours = assignment.estimatedHours;
        const dueDate = new Date(assignment.dueDate);
        const leadTime = assignment.leadTime || 3; // days before due date to start
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - leadTime);
        
        let currentDate = new Date(Math.max(startDate, new Date()));
        let hoursScheduled = 0;
        
        while (hoursScheduled < remainingHours && currentDate < dueDate) {
            const availableSlots = this.findAvailableSlots(currentDate);
            
            for (const slot of availableSlots) {
                if (hoursScheduled >= remainingHours) break;
                
                const blockDuration = Math.min(
                    this.preferences.blockDuration,
                    remainingHours - hoursScheduled,
                    slot.duration
                );
                
                if (blockDuration >= 0.5) { // Minimum 30 minutes
                    this.scheduledBlocks.push({
                        id: `study_${assignment.id}_${this.scheduledBlocks.length}`,
                        title: `${assignment.course.toUpperCase()}: ${assignment.title}`,
                        start: slot.start.toISOString(),
                        end: new Date(slot.start.getTime() + blockDuration * 60 * 60 * 1000).toISOString(),
                        color: '#000000',
                        classNames: ['study'],
                        extendedProps: {
                            type: 'study',
                            assignmentId: assignment.id,
                            course: assignment.course,
                            priority: assignment.priority
                        }
                    });
                    
                    hoursScheduled += blockDuration;
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    findAvailableSlots(date) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const maxHours = isWeekend ? this.preferences.weekendMaxHours : this.preferences.dailyMaxHours;
        
        const slots = [];
        const existingEvents = this.getEventsForDay(date);
        
        // Define potential study times
        const studyWindows = [
            { start: 6, end: 9, energy: 'morning' },
            { start: 9, end: 12, energy: 'morning' },
            { start: 13, end: 17, energy: 'afternoon' },
            { start: 17, end: 20, energy: 'evening' },
            { start: 20, end: 22, energy: 'night' }
        ];
        
        // Track total hours scheduled for this day
        let hoursScheduledToday = this.scheduledBlocks.filter(block => {
            const blockDate = new Date(block.start);
            return blockDate.toDateString() === date.toDateString();
        }).reduce((total, block) => {
            const duration = (new Date(block.end) - new Date(block.start)) / (1000 * 60 * 60);
            return total + duration;
        }, 0);
        
        if (hoursScheduledToday >= maxHours) {
            return slots; // No more slots available today
        }
        
        studyWindows.forEach(window => {
            const windowStart = new Date(date);
            windowStart.setHours(window.start, 0, 0, 0);
            const windowEnd = new Date(date);
            windowEnd.setHours(window.end, 0, 0, 0);
            
            // Check for conflicts with existing events
            let isAvailable = true;
            existingEvents.forEach(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                if (eventStart < windowEnd && eventEnd > windowStart) {
                    isAvailable = false;
                }
            });
            
            if (isAvailable) {
                const remainingHoursToday = maxHours - hoursScheduledToday;
                const slotDuration = Math.min(window.end - window.start, remainingHoursToday);
                
                if (slotDuration > 0) {
                    slots.push({
                        start: windowStart,
                        end: windowEnd,
                        duration: slotDuration,
                        energy: this.preferences.energyLevels[window.energy]
                    });
                }
            }
        });
        
        // Sort by energy level
        slots.sort((a, b) => b.energy - a.energy);
        
        return slots;
    }
    
    getEventsForDay(date) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Get essential events from calendar-events.js
        const { essentialEvents } = window;
        
        return [...(essentialEvents || []), ...this.scheduledBlocks].filter(event => {
            const eventStart = new Date(event.start);
            return eventStart >= dayStart && eventStart <= dayEnd;
        });
    }
}
Improve
Explain