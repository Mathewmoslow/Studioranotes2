// parser.js - Document parser module

class DocumentParser {
    constructor() {
        this.patterns = {
            date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+\w+\s+\d{4})/gi,
            time: /(\d{1,2}:\d{2}\s*[AaPp][Mm])|(\d{1,2}[AaPp][Mm])/gi,
            module: /module\s*(\d+):?\s*(.+?)(?=module|\n\n|$)/gis,
            assignment: /(?:assignment|quiz|exam|test|project|paper|discussion|reading|chapter|video|lab|clinical)[\s:]*(.+?)(?=\n|$)/gi,
            course: /(?:NURS|NUR|NSG)\s*\d{3,4}[A-Z]?\s*-?\s*(.+?)(?=\n|$)/gi,
            credits: /(\d+)\s*(?:credit|hour)s?/gi,
            week: /week\s*(\d+)/gi,
        };
    }

    parse(text, template = 'auto') {
        const results = {
            courses: [],
            modules: [],
            assignments: [],
            events: [],
            errors: []
        };

        try {
            // Clean the text
            text = this.cleanText(text);

            // Auto-detect format if needed
            if (template === 'auto') {
                template = this.detectFormat(text);
            }

            // Parse based on template
            switch (template) {
                case 'canvas':
                    this.parseCanvas(text, results);
                    break;
                case 'syllabus':
                    this.parseSyllabus(text, results);
                    break;
                case 'outline':
                    this.parseCourseOutline(text, results);
                    break;
                default:
                    this.parseGeneric(text, results);
            }

            // Post-process results
            this.postProcess(results);

        } catch (error) {
            results.errors.push(`Parsing error: ${error.message}`);
        }

        return results;
    }

    cleanText(text) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\t/g, '    ')
            .replace(/[^\S\n]+/g, ' ')
            .trim();
    }

    detectFormat(text) {
        if (text.includes('Canvas') || text.includes('Modules')) return 'canvas';
        if (text.includes('Syllabus') || text.includes('Course Description')) return 'syllabus';
        if (text.includes('Week') && text.includes('Chapter')) return 'outline';
        return 'generic';
    }

    parseCanvas(text, results) {
        // Parse modules
        const moduleMatches = text.matchAll(this.patterns.module);
        for (const match of moduleMatches) {
            const moduleNum = match[1];
            const moduleTitle = match[2].trim();
            
            const module = {
                number: parseInt(moduleNum),
                title: moduleTitle,
                assignments: [],
                week: this.detectWeek(match[0]) || parseInt(moduleNum)
            };

            // Find assignments within this module section
            const moduleSection = match[0];
            const assignmentMatches = moduleSection.matchAll(this.patterns.assignment);
            
            for (const assignMatch of assignmentMatches) {
                const assignment = this.parseAssignment(assignMatch[0]);
                if (assignment) {
                    module.assignments.push(assignment);
                }
            }

            results.modules.push(module);
        }
    }

    parseSyllabus(text, results) {
        // Find course info
        const courseMatches = text.matchAll(this.patterns.course);
        for (const match of courseMatches) {
            results.courses.push({
                code: match[0],
                name: match[1].trim()
            });
        }

        // Parse weeks or modules
        const sections = text.split(/(?=Week\s+\d+|Module\s+\d+)/gi);
        
        sections.forEach(section => {
            const weekMatch = section.match(/week\s*(\d+)/i);
            const moduleMatch = section.match(/module\s*(\d+)/i);
            
            const weekNum = weekMatch ? parseInt(weekMatch[1]) : 
                          moduleMatch ? parseInt(moduleMatch[1]) : null;
            
            if (weekNum) {
                const module = {
                    number: weekNum,
                    week: weekNum,
                    title: this.extractTitle(section),
                    assignments: []
                };

                // Find assignments in this section
                const assignmentMatches = section.matchAll(this.patterns.assignment);
                for (const match of assignmentMatches) {
                    const assignment = this.parseAssignment(match[0]);
                    if (assignment) {
                        module.assignments.push(assignment);
                    }
                }

                results.modules.push(module);
            }
        });
    }

    parseGeneric(text, results) {
        // Look for week structures
        const weekSections = text.split(/(?=Week\s+\d+)/gi);
        
        weekSections.forEach(section => {
            const weekMatch = section.match(/week\s*(\d+)/i);
            if (weekMatch) {
                const weekNum = parseInt(weekMatch[1]);
                
                const module = {
                    number: weekNum,
                    week: weekNum,
                    title: `Week ${weekNum}`,
                    assignments: []
                };

                // Parse assignments in this week
                const lines = section.split('\n');
                lines.forEach(line => {
                    const assignment = this.parseAssignment(line);
                    if (assignment) {
                        module.assignments.push(assignment);
                    }
                    
                    // Also look for events (classes, clinical, etc.)
                    const event = this.parseEvent(line, weekNum);
                    if (event) {
                        results.events.push(event);
                    }
                });

                if (module.assignments.length > 0) {
                    results.modules.push(module);
                }
            }
        });

        // If no weeks found, try to parse as one big module
        if (results.modules.length === 0) {
            const module = {
                number: 1,
                week: 1,
                title: 'Imported Module',
                assignments: []
            };

            const lines = text.split('\n');
            lines.forEach(line => {
                const assignment = this.parseAssignment(line);
                if (assignment) {
                    module.assignments.push(assignment);
                }
            });

            if (module.assignments.length > 0) {
                results.modules.push(module);
            }
        }
    }

    parseAssignment(text) {
        const assignment = {
            text: '',
            date: null,
            type: 'assignment',
            hours: 1
        };

        // Extract assignment text
        const cleanText = text.replace(/^\s*[-•*]\s*/, '').trim();
        if (!cleanText) return null;

        assignment.text = cleanText;

        // Extract date
        const dateMatch = text.match(this.patterns.date);
        if (dateMatch) {
            assignment.date = this.parseDate(dateMatch[0]);
        }

        // Determine type and estimated hours
        const lowerText = text.toLowerCase();
        if (/quiz|test|exam/i.test(lowerText)) {
            assignment.type = 'quiz';
            assignment.hours = 1.5;
            if (/final|midterm|comprehensive/i.test(lowerText)) {
                assignment.type = 'exam';
                assignment.hours = 3;
            }
        } else if (/reading|chapter/i.test(lowerText)) {
            assignment.type = 'reading';
            assignment.hours = 2;
        } else if (/video|watch/i.test(lowerText)) {
            assignment.type = 'video';
            assignment.hours = 0.5;
        } else if (/project|paper|essay/i.test(lowerText)) {
            assignment.type = 'project';
            assignment.hours = 3;
        } else if (/clinical|lab/i.test(lowerText)) {
            assignment.type = 'clinical';
            assignment.hours = 8;
        } else if (/simulation|vsim/i.test(lowerText)) {
            assignment.type = 'simulation';
            assignment.hours = 2;
        }

        return assignment;
    }

    parseEvent(text, weekNum) {
        const event = {
            title: '',
            start: null,
            end: null,
            type: 'lecture',
            extendedProps: {}
        };

        // Check for time information
        const timeMatches = text.matchAll(this.patterns.time);
        const times = Array.from(timeMatches);
        
        if (times.length === 0) return null;

        // Extract event title (remove time and date)
        let title = text;
        times.forEach(match => {
            title = title.replace(match[0], '');
        });
        
        const dateMatch = text.match(this.patterns.date);
        if (dateMatch) {
            title = title.replace(dateMatch[0], '');
        }
        
        event.title = title.trim();
        if (!event.title) return null;

        // Determine event type
        const lowerTitle = title.toLowerCase();
        if (/clinical/i.test(lowerTitle)) {
            event.type = 'clinical';
            event.color = '#4CAF50';
        } else if (/exam|test/i.test(lowerTitle)) {
            event.type = 'exam';
            event.color = '#f44336';
        } else if (/quiz/i.test(lowerTitle)) {
            event.type = 'quiz';
            event.color = '#FF9800';
        } else if (/lab/i.test(lowerTitle)) {
            event.type = 'lab';
            event.color = '#8BC34A';
        } else if (/simulation|vsim/i.test(lowerTitle)) {
            event.type = 'simulation';
            event.color = '#8BC34A';
        } else {
            event.type = 'lecture';
            event.color = '#2196F3';
        }

        event.extendedProps.type = event.type;

        // Parse date and times
        if (dateMatch) {
            const eventDate = this.parseDate(dateMatch[0]);
            
            if (times.length >= 1) {
                const startTime = this.parseTime(times[0][0]);
                event.start = this.combineDateAndTime(eventDate, startTime);
                
                if (times.length >= 2) {
                    const endTime = this.parseTime(times[1][0]);
                    event.end = this.combineDateAndTime(eventDate, endTime);
                } else {
                    // Default duration based on type
                    const duration = event.type === 'clinical' ? 8 : 3;
                    event.end = new Date(event.start);
                    event.end.setHours(event.end.getHours() + duration);
                }
            }
        } else {
            // Try to infer date from week number
            const weekStart = this.getWeekStartDate(weekNum);
            if (times.length >= 1) {
                event.start = this.combineDateAndTime(weekStart, this.parseTime(times[0][0]));
                if (times.length >= 2) {
                    event.end = this.combineDateAndTime(weekStart, this.parseTime(times[1][0]));
                }
            }
        }

        return event.start ? event : null;
    }

    parseDate(dateStr) {
        const currentYear = new Date().getFullYear();
        
        try {
            // Try parsing the date string directly
            const date = new Date(dateStr);
            
            // If year is missing, add current year
            if (date.getFullYear() < 2000) {
                date.setFullYear(currentYear);
            }
            
            return date;
        } catch (e) {
            // Default to a week from now
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            return futureDate;
        }
    }

    parseTime(timeStr) {
        const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*([AaPp][Mm])?/);
        if (!match) return { hours: 9, minutes: 0 };
        
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3];
        
        if (ampm) {
            if (ampm.toLowerCase() === 'pm' && hours !== 12) {
                hours += 12;
            } else if (ampm.toLowerCase() === 'am' && hours === 12) {
                hours = 0;
            }
        }
        
        return { hours, minutes };
    }

    combineDateAndTime(date, time) {
        const result = new Date(date);
        result.setHours(time.hours, time.minutes, 0, 0);
        return result;
    }

    detectWeek(text) {
        const match = text.match(/week\s*(\d+)/i);
        return match ? parseInt(match[1]) : null;
    }

    extractTitle(text) {
        const lines = text.split('\n');
        for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned && !this.patterns.assignment.test(cleaned)) {
                return cleaned;
            }
        }
        return 'Module';
    }

    getWeekStartDate(weekNum) {
        // Assuming semester starts May 5, 2025
        const firstMonday = new Date('2025-05-05');
        const result = new Date(firstMonday);
        result.setDate(result.getDate() + (weekNum - 1) * 7);
        return result;
    }

    postProcess(results) {
        // Assign courses to modules based on content
        const courseMap = {
            'ob': 'obgyn',
            'women': 'obgyn',
            'maternal': 'obgyn',
            'adult': 'adulthealth',
            'cardiac': 'adulthealth',
            'nclex': 'nclex',
            'hesi': 'nclex',
            'geronto': 'geronto',
            'gero': 'geronto',
            'elderly': 'geronto'
        };

        results.modules.forEach(module => {
            // Try to determine course from module title or assignment content
            const content = module.title + ' ' + 
                          module.assignments.map(a => a.text).join(' ');
            const lowerContent = content.toLowerCase();
            
            for (const [keyword, course] of Object.entries(courseMap)) {
                if (lowerContent.includes(keyword)) {
                    module.course = course;
                    break;
                }
            }
            
            // Default course if none detected
            if (!module.course) {
                module.course = 'general';
            }
        });

        // Validate dates
        const today = new Date();
        results.modules.forEach(module => {
            module.assignments.forEach(assignment => {
                if (!assignment.date || assignment.date < today) {
                    // Set a reasonable future date based on week
                    const weekStart = this.getWeekStartDate(module.week || 1);
                    weekStart.setDate(weekStart.getDate() + 6); // End of week
                    assignment.date = weekStart;
                }
            });
        });

        // Sort modules by week
        results.modules.sort((a, b) => (a.week || a.number) - (b.week || b.number));
    }
}

// Export parser instance
const parser = new DocumentParser();