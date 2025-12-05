// scheduler.js - Adaptive study scheduler

const StudyScheduler = {
    generateStudySchedule() {
        const status = document.getElementById('scheduler-status');
        status.textContent = 'Generating study schedule...';
        
        const dailyMax = parseInt(document.getElementById('daily-max').value);
        const weekendMax = parseInt(document.getElementById('weekend-max').value);
        const blockDuration = parseFloat(document.getElementById('block-duration').value);
        
        const studyBlocks = [];
        const assignments = this.collectIncompleteAssignments();
        
        // Sort assignments by due date
        assignments.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Schedule each assignment
        assignments.forEach(assignment => {
            const scheduledBlocks = this.scheduleAssignment(
                assignment, 
                studyBlocks, 
                dailyMax, 
                weekendMax, 
                blockDuration
            );
            studyBlocks.push(...scheduledBlocks);
        });
        
        // Save study blocks
        AppStorage.saveStudyBlocks(studyBlocks);
        
        status.textContent = `Generated ${studyBlocks.length} study blocks`;
        
        // Update calendars
        CalendarManager.refreshCalendars();
    },

    collectIncompleteAssignments() {
        const assignments = [];
        const currentWeek = AppStorage.getCurrentWeek();
        const modules = AppStorage.getModules();
        
        // Collect assignments from current and future weeks
        for (let week = currentWeek; week <= 14; week++) {
            const weekModules = modules[week];
            if (!weekModules) continue;
            
            Object.entries(weekModules).forEach(([course, module]) => {
                if (!module.assignments) return;
                
                module.assignments.forEach(assignment => {
                    // Check if assignment is incomplete
                    if (!AppStorage.isAssignmentCompleted(course, assignment.text)) {
                        assignments.push({
                            ...assignment,
                            course,
                            week,
                            id: `${course}-${assignment.text}`,
                            hours: assignment.hours || this.estimateHours(assignment.type)
                        });
                    }
                });
            });
        }
        
        return assignments;
    },

    scheduleAssignment(assignment, existingBlocks, dailyMax, weekendMax, blockDuration) {
        const blocks = [];
        const daysBeforeDue = 3;
        const dueDate = new Date(assignment.date);
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - daysBeforeDue);
        
        let hoursScheduled = 0;
        let currentDate = new Date(startDate);
        
        while (hoursScheduled < assignment.hours && currentDate <= dueDate) {
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const maxToday = isWeekend ? weekendMax : dailyMax;
            
            // Check existing hours for this day
            const existingHours = this.getScheduledHours(currentDate, [...existingBlocks, ...blocks]);
            
            if (existingHours < maxToday) {
                const hoursToSchedule = Math.min(
                    blockDuration,
                    assignment.hours - hoursScheduled,
                    maxToday - existingHours
                );
                
                // Find an available time slot
                const timeSlot = this.findTimeSlot(currentDate, hoursToSchedule, [...existingBlocks, ...blocks]);
                
                if (timeSlot) {
                    blocks.push({
                        date: new Date(currentDate),
                        start: timeSlot.start.toISOString(),
                        end: timeSlot.end.toISOString(),
                        title: `${assignment.course.toUpperCase()}: ${assignment.text}`,
                        type: 'study',
                        hours: hoursToSchedule,
                        id: `study_${Date.now()}_${Math.random()}`
                    });
                    
                    hoursScheduled += hoursToSchedule;
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return blocks;
    },

    getScheduledHours(date, blocks) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        return blocks
            .filter(block => {
                const blockDate = new Date(block.start);
                return blockDate >= dayStart && blockDate <= dayEnd;
            })
            .reduce((sum, block) => sum + block.hours, 0);
    },

    findTimeSlot(date, hours, existingBlocks) {
        const events = [...AppStorage.getEvents(), ...existingBlocks];
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Get all events for this day
        const dayEvents = events
            .filter(event => {
                const eventStart = new Date(event.start);
                return eventStart >= dayStart && eventStart <= dayEnd;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // Find gaps in schedule
        let currentTime = new Date(date);
        currentTime.setHours(8, 0, 0, 0); // Start at 8 AM
        
        // Check gaps between events
        for (const event of dayEvents) {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Check if there's enough gap before this event
            const gapHours = (eventStart - currentTime) / (1000 * 60 * 60);
            if (gapHours >= hours) {
                const start = new Date(currentTime);
                const end = new Date(start);
                end.setHours(end.getHours() + hours);
                return { start, end };
            }
            
            currentTime = eventEnd;
        }
        
        // Check after all events
        const endOfDay = new Date(date);
        endOfDay.setHours(22, 0, 0, 0); // End at 10 PM
        
        const remainingHours = (endOfDay - currentTime) / (1000 * 60 * 60);
        if (remainingHours >= hours) {
            const start = new Date(currentTime);
            const end = new Date(start);
            end.setHours(end.getHours() + hours);
            return { start, end };
        }
        
        // Default to evening slot if nothing else works
        const start = new Date(date);
        start.setHours(19, 0, 0, 0); // 7 PM
        const end = new Date(start);
        end.setHours(end.getHours() + hours);
        return { start, end };
    },

    clearStudyBlocks() {
        AppStorage.saveStudyBlocks([]);
        CalendarManager.refreshCalendars();
        document.getElementById('scheduler-status').textContent = 'Study blocks cleared';
    },

    estimateHours(type) {
        const estimates = {
            'reading': 2,
            'video': 0.5,
            'quiz': 1.5,
            'exam': 3,
            'assignment': 2.5,
            'project': 3,
            'vsim': 2,
            'simulation': 2,
            'activity': 1,
            'prep': 1,
            'remediation': 2,
            'presentation': 2,
            'clinical': 8,
            'lab': 3
        };
        return estimates[type] || 1.5;
    }
};