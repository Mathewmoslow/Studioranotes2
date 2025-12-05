// storage.js - Data persistence and management

const AppStorage = {
    // Storage keys
    KEYS: {
        MODULES: 'semesterModules',
        EVENTS: 'calendarEvents',
        COMPLETED: 'completedAssignments',
        STUDY_BLOCKS: 'studyBlocks',
        CURRENT_WEEK: 'currentWeek',
        PARSED_DATA: 'parsedData'
    },

    // Initialize default empty state
    init() {
        // Check if we have any stored data
        if (!this.getData(this.KEYS.MODULES)) {
            // Initialize with empty structures
            this.setData(this.KEYS.MODULES, {});
            this.setData(this.KEYS.EVENTS, []);
            this.setData(this.KEYS.COMPLETED, []);
            this.setData(this.KEYS.STUDY_BLOCKS, []);
            this.setData(this.KEYS.CURRENT_WEEK, 1);
        }
    },

    // Get data from localStorage
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error getting data from storage:', e);
            return null;
        }
    },

    // Set data in localStorage
    setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error setting data in storage:', e);
            return false;
        }
    },

    // Get all modules
    getModules() {
        return this.getData(this.KEYS.MODULES) || {};
    },

    // Get modules for a specific week
    getWeekModules(weekNumber) {
        const modules = this.getModules();
        return modules[weekNumber] || {};
    },

    // Save modules
    saveModules(modules) {
        return this.setData(this.KEYS.MODULES, modules);
    },

    // Get all calendar events
    getEvents() {
        return this.getData(this.KEYS.EVENTS) || [];
    },

    // Save calendar events
    saveEvents(events) {
        return this.setData(this.KEYS.EVENTS, events);
    },

    // Get completed assignments
    getCompletedAssignments() {
        return new Set(this.getData(this.KEYS.COMPLETED) || []);
    },

    // Save completed assignments
    saveCompletedAssignments(completed) {
        const array = Array.from(completed);
        return this.setData(this.KEYS.COMPLETED, array);
    },

    // Get study blocks
    getStudyBlocks() {
        return this.getData(this.KEYS.STUDY_BLOCKS) || [];
    },

    // Save study blocks
    saveStudyBlocks(blocks) {
        return this.setData(this.KEYS.STUDY_BLOCKS, blocks);
    },

    // Get current week
    getCurrentWeek() {
        return this.getData(this.KEYS.CURRENT_WEEK) || 1;
    },

    // Save current week
    saveCurrentWeek(week) {
        return this.setData(this.KEYS.CURRENT_WEEK, week);
    },

    // Check if assignment is completed
    isAssignmentCompleted(courseId, assignmentText) {
        const key = `${courseId}-${assignmentText}`;
        return localStorage.getItem(key) === 'true';
    },

    // Set assignment completion status
    setAssignmentStatus(courseId, assignmentText, isCompleted) {
        const key = `${courseId}-${assignmentText}`;
        localStorage.setItem(key, isCompleted.toString());
    },

    // Clear all data
    clearAll() {
        localStorage.removeItem(this.KEYS.MODULES);
        localStorage.removeItem(this.KEYS.EVENTS);
        localStorage.removeItem(this.KEYS.COMPLETED);
        localStorage.removeItem(this.KEYS.STUDY_BLOCKS);
        localStorage.removeItem(this.KEYS.CURRENT_WEEK);
    },

    // Export all data
    exportData() {
        return {
            semesterModules: this.getModules(),
            calendarEvents: this.getEvents(),
            completedAssignments: Array.from(this.getCompletedAssignments()),
            studyBlocks: this.getStudyBlocks(),
            currentWeek: this.getCurrentWeek(),
            exportDate: new Date().toISOString(),
            version: '3.0'
        };
    },

    // Import data
    importData(data) {
        if (data.semesterModules) {
            this.saveModules(data.semesterModules);
        }
        if (data.calendarEvents) {
            this.saveEvents(data.calendarEvents);
        }
        if (data.completedAssignments) {
            this.saveCompletedAssignments(new Set(data.completedAssignments));
        }
        if (data.studyBlocks) {
            this.saveStudyBlocks(data.studyBlocks);
        }
        if (data.currentWeek) {
            this.saveCurrentWeek(data.currentWeek);
        }
    },

    // Get unique courses from all modules
    getUniqueCourses() {
        const modules = this.getModules();
        const courses = new Set();
        
        Object.values(modules).forEach(weekModules => {
            Object.keys(weekModules).forEach(course => {
                courses.add(course);
            });
        });
        
        return Array.from(courses);
    },

    // Check if we have any data
    hasData() {
        const modules = this.getModules();
        const events = this.getEvents();
        return Object.keys(modules).length > 0 || events.length > 0;
    }
};

// Initialize on load
AppStorage.init();
