// debug.js - Debugging utilities for the application

const DEBUG_MODE = true;
let logCount = 0;
let errorCount = 0;
let warnCount = 0;

// Simple logger function for all debug messages
function simpleLog(message, type = 'log') {
    // Always mirror to browser console
    if (type === 'error') {
        console.error(message);
        errorCount++;
    } else if (type === 'warn') {
        console.warn(message);
        warnCount++;
    } else if (type === 'info') {
        console.info(message);
    } else {
        console.log(message);
    }
    
    logCount++;
    
    // Update the counters in the UI
    updateDebugCounters();
    
    // Append to UI
    try {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const entry = document.createElement('div');
            entry.className = 'debug-entry debug-' + type;
            const time = new Date().toLocaleTimeString();
            entry.innerHTML = `<span class="debug-timestamp">[${time}]</span>${message}`;
            debugContent.appendChild(entry);
            debugContent.scrollTop = debugContent.scrollHeight;
        }
    } catch (e) {
        console.error('Debug UI error:', e);
    }
}

// Update the debug counters in the UI
function updateDebugCounters() {
    try {
        document.getElementById('log-count').textContent = logCount;
        document.getElementById('error-count').textContent = errorCount;
        document.getElementById('warn-count').textContent = warnCount;
    } catch (e) {
        console.error('Error updating debug counters:', e);
    }
}

// Catch uncaught errors
window.addEventListener('error', function(event) {
    simpleLog(
        `ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
        'error'
    );
    return false;
});

// Function to track and log function calls
function trackFunction(name, fn) {
    return function(...args) {
        try {
            simpleLog(`Function ${name} called`, 'function');
            return fn.apply(this, args);
        } catch (e) {
            simpleLog(`Error in ${name}: ${e.message}`, 'error');
            simpleLog(`Stack: ${e.stack}`, 'error');
            throw e; // re-throw to not swallow the error
        }
    };
}

// Function to mark checkpoints in code execution
function debugCheckpoint(message, isError = false, data = null) {
    let logMessage = message;
    
    if (data) {
        try {
            const dataStr = JSON.stringify(data);
            logMessage += ` - Data: ${dataStr}`;
        } catch (e) {
            logMessage += ` - Data: [Cannot stringify]`;
        }
    }
    
    simpleLog(logMessage, isError ? 'error' : 'success');
}

// Debug console controls
window.toggleDebugConsole = function() {
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) {
        debugConsole.classList.toggle('minimized');
        simpleLog('Debug console toggled', 'info');
    }
};

window.clearDebugConsole = function() {
    const content = document.getElementById('debug-content');
    if (content) {
        const time = new Date().toLocaleTimeString();
        content.innerHTML = `<div class="debug-entry debug-info">
            <span class="debug-timestamp">[${time}]</span>Console cleared
        </div>`;
        simpleLog('Debug console cleared', 'info');
    }
};

// Initial banner
simpleLog('Debug system initialized', 'info');