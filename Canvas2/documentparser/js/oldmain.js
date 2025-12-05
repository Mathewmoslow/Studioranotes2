// main.js - Main application initialization and coordination

let currentWeek = 1;
let parsedData = null;

// Application initialization
function initializeApp() {
    // Initialize storage
    AppStorage.init();
    
    // Get current week from storage or calculate
    currentWeek = AppStorage.getCurrentWeek();
    if (!currentWeek) {
        currentWeek = getCurrentWeek();
        AppStorage.saveCurrentWeek(currentWeek);
    }
    
    // Update UI elements
    updateWeekDisplay();
    
    // Initialize selectors
    ModuleManager.initWeekSelector();
    ModuleManager.initCourseSelector();
    
    // Generate content for current week
    ModuleManager.generateModuleCards(currentWeek);
    CalendarManager.generateWeekSchedule(currentWeek);
    
    // Initialize calendars
    CalendarManager.initCalendars();
    
    // Update calendars to current week
    CalendarManager.updateWeekView(currentWeek);
}

// Get current week based on actual date
function getCurrentWeek() {
    const today = new Date();
    const startDate = new Date(2025, 4, 5); // May 5, 2025
    const endDate = new Date(2025, 7, 10); // August 10, 2025
    
    if (today < startDate) return 1;
    if (today > endDate) return 14;
    
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    
    return Math.max(1, Math.min(14, weekNumber));
}

// Update week display in UI
function updateWeekDisplay() {
    document.getElementById('week-number').textContent = currentWeek;
    document.getElementById('current-week').textContent = `Week ${currentWeek}`;
    
    const selector = document.getElementById('week-selector');
    if (selector) {
        selector.value = currentWeek;
    }
}

// Change week handler
function changeWeek(week) {
    currentWeek = parseInt(week);
    AppStorage.saveCurrentWeek(currentWeek);
    
    updateWeekDisplay();
    ModuleManager.generateModuleCards(currentWeek);
    CalendarManager.updateWeekView(currentWeek);
}

// Filter by course handler
function filterByCourse(course) {
    ModuleManager.filterByCourse(course);
}

// Document parser modal functions
function showParser() {
    document.getElementById('parser-modal').style.display = 'block';
}

function hideParser() {
    document.getElementById('parser-modal').style.display = 'none';
}

function loadTemplate() {
    const template = document.getElementById('template-select').value;
    const input = document.getElementById('document-input');
    
    const templates = {
        canvas: `Module 1: Introduction to Course
Due: May 11th
• Chapter 1-3 Reading
• Intro Video Assignment
• Module 1 Quiz

Module 2: Core Concepts
Week 2 - May 12-18
Monday Lecture: 9:00 AM - 12:00 PM
Clinical: Tuesday 6:00 AM - 5:00 PM
Assignments:
- Read Chapters 4-6
- Complete online quiz by May 18
- Watch video lectures`,

        syllabus: `NURS 301 - Adult Health I
Credits: 3

Week 1 (May 5-11)
Module 1: Cardiovascular System
- Read Chapters 1-3
- Complete dosage calculation quiz by May 7
- Watch cardiac cycle animation video

Week 2 (May 12-18)
Module 2: Respiratory System
- Read Chapters 4-5
- Clinical rotation: Tuesday 6:00 AM
- Module quiz due May 18`,

        outline: `Summer 2025 Nursing Program

Week 1 (May 5-11)
Monday: OB Lecture 9:00 AM
Tuesday: Clinical 1:00 PM
Assignments:
- Read Ch. 1-3 by Sunday
- Complete dosage quiz

Week 2 (May 12-18)
Monday: OB Lecture 9:00 AM
Tuesday: Clinical 6:00 AM
Wednesday: Adult Health 9:00 AM
Thursday: Lab Skills 1:00 PM`,

        custom: ''
    };
    
    input.value = templates[template] || '';
}

function parseDocument() {
    const input = document.getElementById('document-input').value;
    const template = document.getElementById('template-select').value || 'auto';
    const messagesDiv = document.getElementById('parser-messages');
    const resultsDiv = document.getElementById('parser-results');
    
    if (!input.trim()) {
        messagesDiv.innerHTML = '<div class="error-message">Please paste content to parse</div>';
        return;
    }
    
    messagesDiv.innerHTML = '<div class="success-message">Parsing document...</div>';
    
    // Parse the document
    parsedData = parser.parse(input, template);
    
    // Display results
    resultsDiv.innerHTML = '';
    
    if (parsedData.errors.length > 0) {
        parsedData.errors.forEach(error => {
            messagesDiv.innerHTML += `<div class="error-message">${error}</div>`;
        });
    }
    
    if (parsedData.modules.length > 0) {
        messagesDiv.innerHTML += `<div class="success-message">Found ${parsedData.modules.length} modules</div>`;
        
        parsedData.modules.forEach(module => {
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'parsed-item';
            moduleDiv.innerHTML = `
                <h4>Week ${module.week || module.number}: ${module.title}</h4>
                <p>Course: ${module.course || 'General'}</p>
                <p>Assignments: ${module.assignments.length}</p>
                <ul>
                    ${module.assignments.map(a => `
                        <li>${a.text} - ${formatDate(a.date)}</li>
                    `).join('')}
                </ul>
            `;
            resultsDiv.appendChild(moduleDiv);
        });
    }
    
    if (parsedData.events.length > 0) {
        messagesDiv.innerHTML += `<div class="success-message">Found ${parsedData.events.length} calendar events</div>`;
    }
}

function importParsedData() {
    if (!parsedData || parsedData.modules.length === 0) {
        alert('No data to import. Please parse a document first.');
        return;
    }
    
    // Get existing data
    const existingModules = AppStorage.getModules();
    const existingEvents = AppStorage.getEvents();
    
    // Process modules
    parsedData.modules.forEach(module => {
        const week = module.week || module.number;
        const course = module.course || 'general';
        
        if (!existingModules[week]) {
            existingModules[week] = {};
        }
        
        existingModules[week][course] = {
            title: module.title,
            chapters: module.chapters || '',
            keyTopics: module.keyTopics || '',
            assignments: module.assignments || [],
            classMeeting: module.classMeeting || ''
        };
    });
    
    // Process events
    if (parsedData.events.length > 0) {
        // Convert dates to ISO strings
        const newEvents = parsedData.events.map(event => ({
            ...event,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString()
        }));
        
        existingEvents.push(...newEvents);
    }
    
    // Save to storage
    AppStorage.saveModules(existingModules);
    AppStorage.saveEvents(existingEvents);
    
    // Update UI
    ModuleManager.generateModuleCards(currentWeek);
    ModuleManager.initCourseSelector();
    CalendarManager.refreshCalendars();
    CalendarManager.updateWeekView(currentWeek);
    
    hideParser();
    alert('Data imported successfully!');
}

function clearParser() {
    document.getElementById('document-input').value = '';
    document.getElementById('parser-results').innerHTML = '';
    document.getElementById('parser-messages').innerHTML = '';
    parsedData = null;
}

// Data export/import functions
function exportData() {
    const data = AppStorage.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nursing-schedule-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert('Data exported successfully!');
}

function showImportDialog() {
    document.getElementById('import-modal').style.display = 'block';
}

function hideImportDialog() {
    document.getElementById('import-modal').style.display = 'none';
    clearImportDialog();
}

function clearImportDialog() {
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-messages').innerHTML = '';
}

function importDataFile() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to import');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                AppStorage.importData(importedData);
                
                // Update UI
                currentWeek = AppStorage.getCurrentWeek();
                updateWeekDisplay();
                ModuleManager.generateModuleCards(currentWeek);
                ModuleManager.initCourseSelector();
                CalendarManager.refreshCalendars();
                CalendarManager.updateWeekView(currentWeek);
                
                hideImportDialog();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Scheduler functions
function generateStudySchedule() {
    StudyScheduler.generateStudySchedule();
}

function clearStudyBlocks() {
    StudyScheduler.clearStudyBlocks();
}

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

// File input handler
document.addEventListener('DOMContentLoaded', () => {
    const importFileInput = document.getElementById('import-file');
    if (importFileInput) {
        importFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    displayImportPreview(data);
                } catch (error) {
                    document.getElementById('import-messages').innerHTML = 
                        '<div class="error-message">Invalid file format</div>';
                }
            };
            reader.readAsText(file);
        });
    }
});

function displayImportPreview(data) {
    const previewDiv = document.getElementById('import-preview');
    const contentDiv = document.getElementById('import-preview-content');
    
    previewDiv.style.display = 'block';
    
    let previewHtml = '<div class="parsed-item">';
    previewHtml += `<h4>Export Date: ${new Date(data.exportDate).toLocaleString()}</h4>`;
    previewHtml += `<p>Weeks: ${Object.keys(data.semesterModules || {}).length}</p>`;
    previewHtml += `<p>Events: ${(data.calendarEvents || []).length}</p>`;
    previewHtml += `<p>Completed: ${(data.completedAssignments || []).length}</p>`;
    previewHtml += '</div>';
    
    contentDiv.innerHTML = previewHtml;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);
