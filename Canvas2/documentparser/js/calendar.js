// calendar.js - Calendar view management

const CalendarManager = {
    monthCalendar: null,
    weekCalendar: null,

    initCalendars() {
        const calendarElMonth = document.getElementById('calendar-month');
        const calendarElWeek = document.getElementById('calendar-week');
        
        if (!calendarElMonth || !calendarElWeek) {
            console.error('Calendar elements not found');
            return;
        }

        // Get events from storage
        const events = AppStorage.getEvents();
        
        // Add FullCalendar class styling
        const calendarConfig = {
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            editable: false,
            droppable: false,
            events: events,
            eventClassNames: function(arg) {
                return [arg.event.extendedProps.type || 'lecture'];
            }
        };

        // Create month calendar
        this.monthCalendar = new FullCalendar.Calendar(calendarElMonth, {
            ...calendarConfig,
            initialView: 'dayGridMonth',
            initialDate: '2025-05-05'
        });

        // Create week calendar
        this.weekCalendar = new FullCalendar.Calendar(calendarElWeek, {
            ...calendarConfig,
            initialView: 'timeGridWeek',
            initialDate: '2025-05-05',
            slotMinTime: '06:00:00',
            slotMaxTime: '22:00:00',
            height: 'auto'
        });

        this.monthCalendar.render();
        this.weekCalendar.render();
    },

    refreshCalendars() {
        if (!this.monthCalendar || !this.weekCalendar) {
            this.initCalendars();
            return;
        }

        // Remove all events
        this.monthCalendar.removeAllEvents();
        this.weekCalendar.removeAllEvents();

        // Add events from storage
        const events = AppStorage.getEvents();
        events.forEach(event => {
            this.monthCalendar.addEvent(event);
            this.weekCalendar.addEvent(event);
        });

        // Add study blocks
        const studyBlocks = AppStorage.getStudyBlocks();
        studyBlocks.forEach(block => {
            const eventData = {
                id: block.id,
                title: block.title,
                start: block.start,
                end: block.end,
                backgroundColor: '#000000',
                textColor: '#ffffff',
                extendedProps: { type: 'study' }
            };
            
            this.monthCalendar.addEvent(eventData);
            this.weekCalendar.addEvent(eventData);
        });
    },

    generateWeekSchedule(week) {
        const container = document.getElementById('week-schedule');
        const weekStart = this.getWeekStartDate(week);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        const events = AppStorage.getEvents();
        const studyBlocks = AppStorage.getStudyBlocks();
        const allEvents = [...events, ...studyBlocks];

        let html = '';
        
        days.forEach((day, index) => {
            const currentDate = new Date(weekStart);
            currentDate.setDate(currentDate.getDate() + index);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Filter events for this day
            const dayEvents = allEvents.filter(event => {
                const eventDate = new Date(event.start);
                return eventDate.toISOString().split('T')[0] === dateStr;
            }).sort((a, b) => new Date(a.start) - new Date(b.start));
            
            html += `
                <div class="day-section">
                    <div class="day-header">
                        ${day} - ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
            `;
            
            if (dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const startTime = new Date(event.start).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    });
                    const endTime = new Date(event.end).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    });
                    
                    const eventType = event.extendedProps?.type || event.type || 'lecture';
                    
                    html += `
                        <div class="time-slot">
                            <span class="time">${startTime} - ${endTime}</span>
                            <div class="event ${eventType}">${event.title}</div>
                        </div>
                    `;
                });
            } else {
                html += `
                    <div class="time-slot">
                        <span class="time">No scheduled events</span>
                    </div>
                `;
            }
            
            html += '</div>';
        });
        
        container.innerHTML = html || `
            <div class="empty-state">
                <p>No events scheduled for Week ${week}.</p>
            </div>
        `;
    },

    updateWeekView(week) {
        const weekStart = this.getWeekStartDate(week);
        
        if (this.monthCalendar) {
            this.monthCalendar.gotoDate(weekStart);
        }
        if (this.weekCalendar) {
            this.weekCalendar.gotoDate(weekStart);
        }
        
        this.generateWeekSchedule(week);
    },

    getWeekStartDate(weekNum) {
        // Semester starts May 5, 2025 (Monday)
        const firstMonday = new Date('2025-05-05');
        const result = new Date(firstMonday);
        result.setDate(result.getDate() + (weekNum - 1) * 7);
        return result;
    },

    setupTabSwitching() {
        const tabs = document.querySelectorAll('.calendar-tabs .tab');
        const views = document.querySelectorAll('.calendar-view');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and views
                tabs.forEach(t => t.classList.remove('active'));
                views.forEach(v => v.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding view
                tab.classList.add('active');
                const viewName = tab.dataset.view;
                document.getElementById(`${viewName}-view`).classList.add('active');
            });
        });
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    CalendarManager.setupTabSwitching();
});