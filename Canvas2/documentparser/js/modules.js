AppStorage.getCurrentWeek();
    },

    // Initialize course selector
    initCourseSelector() {
        const selector = document.getElementById('course-selector');
        const courses = AppStorage.getUniqueCourses();
        
        // Keep "All Courses" option
        selector.innerHTML = '<option value="all">All Courses</option>';
        
        // Add dynamic course options
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = this.getCourseDisplayName(course);
            selector.appendChild(option);
        });
    },

    getCourseDisplayName(course) {
        const names = {
            'obgyn': 'OB/GYN',
            'adulthealth': 'Adult Health',
            'nclex': 'NCLEX',
            'geronto': 'Gerontology',
            'general': 'General'
        };
        return names[course] || course.charAt(0).toUpperCase() + course.slice(1);
    }
};

// Attach event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Event delegation for checkboxes
    document.getElementById('module-cards').addEventListener('change', (e) => {
        if (e.target.classList.contains('assignment-checkbox')) {
            ModuleManager.updateProgress(e.target);
        }
    });
});