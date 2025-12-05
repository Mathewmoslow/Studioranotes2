// main.js - Main application initialization and coordination

let currentWeek = 1;
let parsedData = null;

// Application initialization
function initializeApp() {
    debugCheckpoint('Starting application initialization');
    
    try {
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
        
        debugCheckpoint('Application initialization complete', false, {
            currentWeek: currentWeek,
            hasData: AppStorage.hasData()
        });
    } catch (error) {
        debugCheckpoint(`Error initializing application: ${error.message}`, true, {
            error: error.stack
        });
    }
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

// ICS file handling
function handleICSFileSelect(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    
    document.getElementById('selected-file-name').textContent = file.name;
    document.getElementById('parse-ics-btn').style.display = 'inline-block';
}

function parseICSFile() {
    const fileInput = document.getElementById('ics-file-input');
    const messagesDiv = document.getElementById('ics-parser-messages');
    const resultsDiv = document.getElementById('ics-parser-results');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        messagesDiv.innerHTML = '<div class="error-message">Please select an ICS file first.</div>';
        return;
    }
    
    const file = fileInput.files[0];
    messagesDiv.innerHTML = '<div class="success-message">Reading calendar file...</div>';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const icsContent = e.target.result;
            messagesDiv.innerHTML = '<div class="success-message">Parsing calendar data...</div>';
            
            // Parse the ICS content
            parsedData = parser.parseICS(icsContent);
            
            // Display results
            resultsDiv.innerHTML = '';
            
            if (parsedData.errors.length > 0) {
                parsedData.errors.forEach(error => {
                    messagesDiv.innerHTML += `<div class="error-message">${error}</div>`;
                });
            }
            
            // Show event summary
            if (parsedData.events.length > 0) {
                messagesDiv.innerHTML += `
                    <div class="success-message">
                        Found ${parsedData.events.length} calendar events
                    </div>
                `;
                
                // Group events by type
                const eventsByType = {};
                parsedData.events.forEach(event => {
                    const type = event.extendedProps.type;
                    if (!eventsByType[type]) eventsByType[type] = [];
                    eventsByType[type].push(event);
                });
                
                // Create summary of events by type
                const eventsSummary = document.createElement('div');
                eventsSummary.className = 'parsed-item';
                eventsSummary.innerHTML = `
                    <h4>Calendar Events Summary</h4>
                    <ul>
                        ${Object.entries(eventsByType).map(([type, events]) => 
                            `<li><strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${events.length} events</li>`
                        ).join('')}
                    </ul>
                `;
                resultsDiv.appendChild(eventsSummary);
                
                // Show a sample of events
                const sampleEvents = parsedData.events.slice(0, 5);
                const eventsPreview = document.createElement('div');
                eventsPreview.className = 'parsed-item';
                eventsPreview.innerHTML = `
                    <h4>Sample Events</h4>
                    <ul>
                        ${sampleEvents.map(event => `
                            <li>
                                <strong>${event.title}</strong><br>
                                <span style="color: #666;">
                                    ${formatDateTime(new Date(event.start))} - 
                                    ${formatDateTime(new Date(event.end))}
                                </span>
                            </li>
                        `).join('')}
                        ${parsedData.events.length > 5 ? 
                            `<li>... and ${parsedData.events.length - 5} more events</li>` : ''}
                    </ul>
                `;
                resultsDiv.appendChild(eventsPreview);
            }
            
            // Show extracted assignments
            if (parsedData.modules.length > 0) {
                messagesDiv.innerHTML += `
                    <div class="success-message">
                        Extracted assignment information from ${parsedData.modules.length} modules
                    </div>
                `;
                
                parsedData.modules.forEach(module => {
                    const moduleDiv = document.createElement('div');
                    moduleDiv.className = 'parsed-item';
                    moduleDiv.innerHTML = `
                        <h4>Week ${module.week}: ${module.title}</h4>
                        <p>Course: ${module.course}</p>
                        <p>Assignments: ${module.assignments.length}</p>
                        <ul>
                            ${module.assignments.slice(0, 5).map(a => `
                                <li>${a.text} - ${formatDate(a.date)}</li>
                            `).join('')}
                            ${module.assignments.length > 5 ? 
                                `<li>... and ${module.assignments.length - 5} more</li>` : ''}
                        </ul>
                    `;
                    resultsDiv.appendChild(moduleDiv);
                });
            }
            
        } catch (error) {
            messagesDiv.innerHTML = `<div class="error-message">Error parsing ICS file: ${error.message}</div>`;
            console.error("ICS parse error:", error);
        }
    };
    
    reader.onerror = function() {
        messagesDiv.innerHTML = `<div class="error-message">Error reading file: ${reader.error}</div>`;
    };
    
    reader.readAsText(file);
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Document parser modal functions
function showParser() {
    document.getElementById('parser-modal').style.display = 'block';
    setupParserTabs();
}

function setupParserTabs() {
    // Set up parser tab switching
    const tabs = document.querySelectorAll('.parser-tabs .tab');
    const tabContents = document.querySelectorAll('.parser-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab and content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
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

// Review and import functions
function reviewBeforeImport() {
    if (!parsedData || !parsedData.modules || parsedData.modules.length === 0) {
        alert('No data to import. Please parse a document first.');
        return;
    }
    
    // Show review modal
    document.getElementById('review-modal').style.display = 'block';
    document.getElementById('parser-modal').style.display = 'none';
    
    // Generate review interface
    const reviewContent = document.getElementById('review-content');
    reviewContent.innerHTML = '';
    
    parsedData.modules.forEach((module, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        // Get available courses for dropdown
        const courseOptions = [
            { value: 'obgyn', label: 'OB/GYN' },
            { value: 'adulthealth', label: 'Adult Health' },
            { value: 'nclex', label: 'NCLEX/HESI' },
            { value: 'geronto', label: 'Gerontology' },
            { value: 'general', label: 'General' }
        ];
        
        reviewItem.innerHTML = `
            <h4>Week ${module.week || module.number}: ${module.title}</h4>
            <div class="review-fields">
                <div class="field-group">
                    <label>Course:</label>
                    <select id="course-${index}" data-module-index="${index}">
                        ${courseOptions.map(opt => 
                            `<option value="${opt.value}" ${module.course === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="field-group">
                    <label>Class Meeting (e.g., "Monday 9:00-12:00"):</label>
                    <input type="text" id="meeting-${index}" 
                           placeholder="Day Time-Time" 
                           value="${module.classMeeting || ''}">
                </div>
                <div class="field-group">
                    <label>Chapter/Topic Info:</label>
                    <input type="text" id="chapters-${index}" 
                           placeholder="Chapters 1-3" 
                           value="${module.chapters || ''}">
                </div>
                <div class="field-group">
                    <label>Location:</label>
                    <input type="text" id="location-${index}" 
                           placeholder="Room 101" 
                           value="${module.location || ''}">
                </div>
            </div>
            <div class="assignments-preview">
                <strong>Assignments (${module.assignments.length}):</strong>
                <ul>
                    ${module.assignments.slice(0, 5).map(a => 
                        `<li>${a.text} - ${formatDate(a.date)}</li>`
                    ).join('')}
                    ${module.assignments.length > 5 ? 
                        `<li>... and ${module.assignments.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
        
        reviewContent.appendChild(reviewItem);
    });
}

function hideReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    document.getElementById('parser-modal').style.display = 'block';
}

function backToParser() {
    hideReviewModal();
}

function confirmImport() {
    // Update parsed data with user inputs
    parsedData.modules.forEach((module, index) => {
        const courseSelect = document.getElementById(`course-${index}`);
        const meetingInput = document.getElementById(`meeting-${index}`);
        const chaptersInput = document.getElementById(`chapters-${index}`);
        const locationInput = document.getElementById(`location-${index}`);
        
        if (courseSelect) module.course = courseSelect.value;
        if (meetingInput) module.classMeeting = meetingInput.value.trim();
        if (chaptersInput) module.chapters = chaptersInput.value.trim();
        if (locationInput) module.location = locationInput.value.trim();
        
        // Try to parse meeting time to create calendar events
        if (module.classMeeting) {
            const event = parseMeetingTime(module);
            if (event) {
                if (!parsedData.events) parsedData.events = [];
                parsedData.events.push(event);
            }
        }
    });
    
    // Now import the data
    importParsedData();
    document.getElementById('review-modal').style.display = 'none';
}

function parseMeetingTime(module) {
    const meeting = module.classMeeting;
    if (!meeting) return null;
    
    // Parse patterns like "Monday 9:00-12:00" or "Wed 1:00 PM - 4:00 PM"
    const dayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i;
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;
    
    const dayMatch = meeting.match(dayPattern);
    const timeMatches = Array.from(meeting.matchAll(timePattern));
    
    if (!dayMatch || timeMatches.length < 1) return null;
    
    // Map day names to day numbers
    const dayMap = {
        'monday': 1, 'mon': 1,
        'tuesday': 2, 'tue': 2,
        'wednesday': 3, 'wed': 3,
        'thursday': 4, 'thu': 4,
        'friday': 5, 'fri': 5,
        'saturday': 6, 'sat': 6,
        'sunday': 0, 'sun': 0
    };
    
    const dayNum = dayMap[dayMatch[1].toLowerCase()];
    
    // Calculate date for this day in the current week
    const weekStart = CalendarManager.getWeekStartDate(module.week || 1);
    const eventDate = new Date(weekStart);
    eventDate.setDate(eventDate.getDate() + dayNum);
    
    // Parse start time
    const startMatch = timeMatches[0];
    let startHour = parseInt(startMatch[1]);
    const startMinute = startMatch[2] ? parseInt(startMatch[2]) : 0;
    const startAmPm = startMatch[3];
    
    if (startAmPm) {
        if (startAmPm.toLowerCase() === 'pm' && startHour !== 12) {
            startHour += 12;
        } else if (startAmPm.toLowerCase() === 'am' && startHour === 12) {
            startHour = 0;
        }
    }
    
    // Parse end time if available
    let endHour = startHour + 3; // Default 3-hour class
    let endMinute = startMinute;
    
    if (timeMatches.length > 1) {
        const endMatch = timeMatches[1];
        endHour = parseInt(endMatch[1]);
        endMinute = endMatch[2] ? parseInt(endMatch[2]) : 0;
        const endAmPm = endMatch[3];
        
        if (endAmPm) {
            if (endAmPm.toLowerCase() === 'pm' && endHour !== 12) {
                endHour += 12;
            } else if (endAmPm.toLowerCase() === 'am' && endHour === 12) {
                endHour = 0;
            }
        }
    }
    
    // Create event
    const startDate = new Date(eventDate);
    startDate.setHours(startHour, startMinute);
    
    const endDate = new Date(eventDate);
    endDate.setHours(endHour, endMinute);
    
    return {
        title: `${module.course.toUpperCase()}: ${module.title}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        extendedProps: {
            type: 'lecture',
            course: module.course,
            location: module.location || ''
        },
        color: getColorForCourse(module.course)
    };
}

function getColorForCourse(course) {
    const colors = {
        'obgyn': '#2196F3',
        'adulthealth': '#4CAF50',
        'nclex': '#9C27B0',
        'geronto': '#FF9800',
        'general': '#607D8B'
    };
    return colors[course] || '#757575';
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
        
        // Format assignments properly
        const formattedAssignments = (module.assignments || []).map(assignment => ({
            text: assignment.text,
            date: formatDate(new Date(assignment.date)),
            type: assignment.type || 'assignment',
            hours: assignment.hours || 1
        }));
        
        existingModules[week][course] = {
            title: module.title,
            chapters: module.chapters || '',
            keyTopics: module.keyTopics || '',
            assignments: formattedAssignments,
            classMeeting: module.classMeeting || ''
        };
    });
    
    // Process events
    if (parsedData.events && parsedData.events.length > 0) {
        // Convert dates to ISO strings if they aren't already
        const newEvents = parsedData.events.map(event => ({
            ...event,
            start: typeof event.start === 'string' ? event.start : event.start.toISOString(),
            end: typeof event.end === 'string' ? event.end : event.end.toISOString()
        }));
        
        // Add new events to existing ones
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