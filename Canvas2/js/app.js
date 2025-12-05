// js/app.js

// ——— Imports ———
import { commonEventColors, platformUrls, courseUrls, weekUrls, courseNames } from '../config.js';
import { obgynModuleMap,    obgynEventColors,    obgynEvents,    obgynModuleContent    } from '../courses/obgyn.js';
import { adultHealthModuleMap, adultHealthEventColors, adultHealthEvents, adultHealthModuleContent } from '../courses/adulthealth.js';
import { nclexModuleMap,    nclexEventColors,    nclexEvents,    nclexModuleContent    } from '../courses/nclex.js';
import { gerontoModuleMap,  gerontoEventColors,  gerontoEvents,  gerontoModuleContent  } from '../courses/geronto.js';

document.addEventListener('DOMContentLoaded', function() {
  // ——— Combined Data ———
  const moduleWeekMap = {
    obgyn:    obgynModuleMap,
    adulthealth: adultHealthModuleMap,
    nclex:    nclexModuleMap,
    geronto:  gerontoModuleMap
  };

  const moduleContent = {
    obgyn:    obgynModuleContent,
    adulthealth: adultHealthModuleContent,
    nclex:    nclexModuleContent,
    geronto:  gerontoModuleContent
  };

  const allEvents = [
    ...obgynEvents,
    ...adultHealthEvents,
    ...nclexEvents,
    ...gerontoEvents
  ];

  const eventColors = {
    ...commonEventColors,
    ...obgynEventColors,
    ...adultHealthEventColors,
    ...nclexEventColors,
    ...gerontoEventColors
  };

  // ——— Core Functions ———
  window.toggleModule = moduleCard => {
    moduleCard.classList.toggle('active');
  };

  window.markModuleComplete = button => {
    const card = button.closest('.module-card');
    const moduleId = card.id;
    const isCompleted = localStorage.getItem(`module-${moduleId}`) === 'completed';

    if (isCompleted) {
      localStorage.removeItem(`module-${moduleId}`);
      button.textContent = 'Mark Complete';
      const status = card.querySelector('.module-status');
      status.textContent = 'Current';
      status.classList.replace('status-completed','status-current');
      card.querySelector('.progress-bar').style.width = '0%';
    } else {
      localStorage.setItem(`module-${moduleId}`, 'completed');
      button.textContent = 'Mark Incomplete';
      const status = card.querySelector('.module-status');
      status.textContent = 'Completed';
      status.classList.remove('status-current','status-upcoming');
      status.classList.add('status-completed');
      card.querySelector('.progress-bar').style.width = '100%';
      card.querySelectorAll('.assignment-item').forEach(item => {
        const aid = item.dataset.id;
        localStorage.setItem(`assignment-${aid}`, 'completed');
        item.classList.add('completed');
        const cb = item.querySelector('.assignment-checkbox');
        if (cb) cb.checked = true;
      });
    }
  };

  window.updateAssignmentCompletion = (checkbox, assignmentId) => {
    const item = checkbox.closest('.assignment-item');
    if (checkbox.checked) {
      item.classList.add('completed');
      localStorage.setItem(`assignment-${assignmentId}`, 'completed');
    } else {
      item.classList.remove('completed');
      localStorage.removeItem(`assignment-${assignmentId}`);
    }
    updateModuleProgress();
  };

  function updateModuleProgress() {
    document.querySelectorAll('.module-card').forEach(card => {
      const items = card.querySelectorAll('.assignment-item');
      const done   = [...items].filter(i => i.classList.contains('completed')).length;
      const pct    = items.length ? (done/items.length)*100 : 0;
      card.querySelector('.progress-bar').style.width = `${pct}%`;

      if (items.length && done === items.length) {
        const status = card.querySelector('.module-status');
        status.textContent = 'Completed';
        status.classList.replace('status-current','status-completed');
        const btn = card.querySelector('.module-btn.btn-secondary');
        if (btn) btn.textContent = 'Mark Incomplete';
        localStorage.setItem(`module-${card.id}`, 'completed');
      }
    });
  }

  // ——— Generate Module Cards ———
  function generateModuleCards() {
    const container = document.getElementById('module-container');
    container.innerHTML = '';

    for (const course in moduleContent) {
      for (const moduleNumber in moduleContent[course]) {
        const data = moduleContent[course][moduleNumber];
        const type = data.type || 'content';
        const week = data.week;

        const card = document.createElement('div');
        card.className = `module-card ${course}-card`;
        card.dataset.course       = course;
        card.dataset.moduleType   = type;
        card.dataset.moduleNumber = moduleNumber;
        card.dataset.moduleWeek   = week;
        card.id = `module-${course}-${type}-${moduleNumber}`;

        // determine status
        const curr = getCurrentWeek();
        let statusText = 'Upcoming', statusClass = 'status-upcoming';
        if (week === curr) {
          statusText = 'Current'; statusClass = 'status-current';
        } else if (week < curr) {
          statusText = 'Completed'; statusClass = 'status-completed';
        }
        if (course==='obgyn' && moduleNumber==='3') {
          statusText = 'Self-Directed';
        }

        const topics = data.keyTopics ? data.keyTopics.join(', ') : '';
        const note   = data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : '';
        const cf     = data.clinicalFocus ? `<p><strong>Clinical Focus:</strong> ${data.clinicalFocus}</p>` : '';
        const cm     = data.classMeeting ? `<p><strong>Class Meeting:</strong> ${data.classMeeting}</p>` : '';

        card.innerHTML = `
          <div class="module-header" onclick="toggleModule(this.parentNode)">
            <h4>${getCoursePrefix(course)}: Module ${moduleNumber} - ${data.title}
               <span class="module-status ${statusClass}">${statusText}</span>
            </h4>
            <button class="module-toggle">▼</button>
          </div>
          <div class="module-preview">
            <div class="chapter-list">${data.chapters}</div>
            <div class="due-dates">${generateDueDatesText(data.assignments)}</div>
          </div>
          <div class="module-progress">
            <div class="progress-bar" style="width:0%"></div>
          </div>
          <div class="module-content">
            <div class="module-details">
              <p><strong>Key Topics:</strong> ${topics}</p>
              <ul class="assignment-list">
                ${generateAssignmentsList(data.assignments, course)}
              </ul>
              ${note}${cf}${cm}
              <div class="module-actions">
                <a href="${platformUrls.canvas[course]}/modules/${moduleNumber}"
                   class="module-btn btn-primary" target="_blank">View All Resources</a>
                <button class="module-btn btn-secondary"
                        onclick="markModuleComplete(this)">Mark Complete</button>
              </div>
            </div>
          </div>`;

        container.appendChild(card);
      }
    }
  }

  function getCoursePrefix(course) {
    switch(course) {
      case 'obgyn':       return 'OB/GYN';
      case 'adulthealth': return 'Adult Health';
      case 'nclex':       return 'NCLEX';
      case 'geronto':     return 'NURS315';
      default:            return course;
    }
  }

  // ——— Assignments Helpers ———
  function generateDueDatesText(assignments) {
    if (!assignments || !assignments.length) return '';
    return assignments
      .slice(0,2)
      .map(a => {
        const d = new Date(a.dueDate);
        const fm = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
        return `${a.title.split(':')[0]}: ${fm}`;
      })
      .join(' • ');
  }

  function generateAssignmentsList(assignments, course) {
    if (!assignments || !assignments.length) return '';
    return assignments.map(a => {
      const id  = a.id;
      const url = getAssignmentUrl(a, course);
      const d   = new Date(a.dueDate);
      const fm  = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      return `
        <li class="assignment-item" data-id="${id}">
          <input type="checkbox" class="assignment-checkbox"
                 onchange="updateAssignmentCompletion(this,'${id}')">
          <a href="${url}" target="_blank">${a.title}</a>
          <span class="due-date">${fm}</span>
        </li>`;
    }).join('');
  }

  function getAssignmentUrl(a, course) {
    if (a.platform==='sherpath')     return platformUrls.sherpath;
    if (a.platform==='coursepoint')  return platformUrls.coursepoint[course];
    return platformUrls.canvas[course] + '/assignments/' + a.id;
  }

  // ——— Popup & Accordion ———
  function handleEventClick(info) {
    const e = info.event;
    const d = e.extendedProps;
    let html = `
      <div class="popup-overlay"></div>
      <div class="event-popup">
        <h3>${e.title}</h3>
        <p><strong>Date:</strong> ${e.start.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
        <p><strong>Time:</strong> ${e.start.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
            – ${e.end.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</p>`;

    if (d.course) {
      html += `<p><strong>Course:</strong> ${courseNames[d.course]||d.course}</p>`;
    }
    if (d.week) html += `<p><strong>Week:</strong> ${d.week}</p>`;
    if (d.details) html += `<p><strong>Details:</strong> ${d.details}</p>`;

    html += `<div class="buttons">`;
    if (d.course) {
      html += `<button class="view-details"
                     onclick="window.open('${courseUrls[d.course]||'#'}','_blank')">
                   View Course Details
               </button>`;
    }
    html += `<button class="close" onclick="closePopup()">Close</button>
             </div></div>`;
    document.getElementById('popup-container').innerHTML = html;
  }
  window.closePopup = () => document.getElementById('popup-container').innerHTML = '';
  window.toggleClassInfo = el => {
    el.classList.toggle('active');
    document.querySelectorAll('.class-info-header')
      .forEach(h => { if (h!==el) h.classList.remove('active'); });
  };

  // ——— Calendar / Data Logic ———
  function getCurrentWeek() {
    const today = new Date();
    const start = new Date('2025-05-05');
    if (today < start)     return 1;
    if (today > new Date('2025-08-08')) return 14;
    const diff = Math.floor((today - start) / (1000*60*60*24));
    return Math.min(14, Math.floor(diff/7)+1);
  }

  function colorizeEvents(arr) {
    return arr.map(e => ({
      ...e,
      backgroundColor: eventColors[e.group] || '#3788d8',
      borderColor:     eventColors[e.group] || '#3788d8',
      textColor:       '#fff'
    }));
  }

  window.jumpToWeekAndCourse = week => {
    const course = document.getElementById('course-select').value;
    const mon = new Date('2025-05-05');
    mon.setDate(mon.getDate() + (week-1)*7);
    monthCal.gotoDate(mon);
    weekCal .gotoDate(mon);
    highlightCurrentWeek(week);
    updateAssignments(course, week);
    updateModulesForWeek(week, course);
    if (course!=='all') window.open(weekUrls[course]+week,'_blank');
  };

  function highlightCurrentWeek(week) {
    document.querySelectorAll('.week-button').forEach((btn,i) => {
      if (i+1===week) {
        btn.style.fontWeight='bold';
        btn.style.transform='translateY(-3px)';
        btn.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';
      } else {
        btn.style.fontWeight='normal';
        btn.style.transform='none';
        btn.style.boxShadow='none';
      }
    });
  }

  function filterEventsByCourse(course) {
    monthCal.getEvents().forEach(e => {
      e.setProp('display', course==='all' || e.extendedProps.course===course ? 'auto' : 'none');
    });
    weekCal .getEvents().forEach(e => {
      e.setProp('display', course==='all' || e.extendedProps.course===course ? 'auto' : 'none');
    });
  }

  function updateAssignments(course, week) {
    const section = document.querySelector('.class-info-section');
    section.innerHTML = '<h3>Current/Upcoming Assignments</h3>';
    const courses = course==='all'
       ? ['obgyn','adulthealth','nclex','geronto']
       : [course];

    courses.forEach(c => {
      const moduleEvents = allEvents.filter(ev =>
        ev.course===c &&
        ev.week===week &&
        (ev.group==='lecture' || ev.group==='geronto')
      );

      const assignments = allEvents.filter(ev =>
        ev.course===c &&
        ev.week===week &&
        (ev.group==='exam' || ev.group==='prep' || ev.group==='drill')
      );

      if (moduleEvents.length || assignments.length) {
        const hdr  = document.createElement('div');
        hdr.className = `class-info-header ${c}`;
        hdr.onclick = () => toggleClassInfo(hdr);

        let title = moduleEvents.length
                  ? moduleEvents[0].details
                  : `Week ${week}`;
        if (title.includes(':')) title = title.split(':')[1].trim();

        hdr.innerHTML = `
          <h4>${courseNames[c]||c}: Week ${week} - ${title}
            <span class="indicator">▼</span>
          </h4>`;

        const content = document.createElement('div');
        content.className = 'class-info-content';

        if (assignments.length) {
          const ul = document.createElement('ul');
          ul.className = 'assignment-list';
          assignments.forEach(a => {
            const li = document.createElement('li');
            li.className = 'assignment-item';
            li.dataset.id = `${c}-week${week}-${a.title.replace(/\s+/g,'-').toLowerCase()}`;

            let url;
            const t = a.title.toLowerCase();
            if (t.includes('sherpath'))     url = platformUrls.sherpath;
            else if (t.includes('coursepoint')||t.includes('topic')) url=platformUrls.coursepoint[c];
            else url = `${platformUrls.canvas[c]}/assignments/${Math.floor(Math.random()*100000)}`;

            // random due-date for demo
            const dd = new Date();
            dd.setDate(dd.getDate() + Math.floor(Math.random()*7)+1);
            const fm = dd.toLocaleDateString('en-US',{month:'short',day:'numeric'});

            li.innerHTML = `
              <input type="checkbox" class="assignment-checkbox"
                     onchange="updateAssignmentCompletion(this,'${li.dataset.id}')">
              <a href="${url}" target="_blank">${a.title}</a>
              <span class="due-date">${fm}</span>`;

            if (localStorage.getItem(`assignment-${li.dataset.id}`)==='completed') {
              li.classList.add('completed');
              li.querySelector('.assignment-checkbox').checked = true;
            }
            ul.appendChild(li);
          });
          content.appendChild(ul);
        } else {
          content.innerHTML = '<p>No assignments scheduled for this week.</p>';
        }

        section.appendChild(hdr);
        section.appendChild(content);
      }
    });
  }

  function updateModulesForWeek(weekNum, selectedCourse='all') {
    document.querySelectorAll('.module-card').forEach(c => c.style.display='none');

    let toShow = [];
    if (selectedCourse==='all') {
      for (const crs in moduleWeekMap) {
        if (moduleWeekMap[crs][weekNum]) {
          toShow.push(...moduleWeekMap[crs][weekNum]);
        }
      }
    } else if (moduleWeekMap[selectedCourse][weekNum]) {
      toShow = moduleWeekMap[selectedCourse][weekNum];
    }

    document.querySelectorAll('.module-card').forEach(card => {
      if (toShow.includes(card.id)) {
        card.style.display='block';
        updateModuleStatus(card, weekNum);
      }
    });

    const hdr = document.querySelector('.module-section h3');
    if (hdr) {
      hdr.textContent = selectedCourse==='all'
        ? `Week ${weekNum} Module Assignments`
        : `${courseNames[selectedCourse]||selectedCourse}: Week ${weekNum} Module Assignments`;
    }
  }

  function updateModuleStatus(card, wk) {
    const mw = parseInt(card.dataset.moduleWeek,10);
    const st = card.querySelector('.module-status');
    st.classList.remove('status-current','status-upcoming','status-completed');

    if (mw===wk)      { st.textContent='Current';   st.classList.add('status-current'); }
    else if (mw<wk)  { st.textContent='Completed'; st.classList.add('status-completed'); }
    else             { st.textContent='Upcoming'; st.classList.add('status-upcoming'); }
  }

  function initializeModuleCards() {
    const cw = getCurrentWeek();
    document.querySelectorAll('.module-card').forEach(card => {
      const mid = card.id;
      const doneMod = localStorage.getItem(`module-${mid}`)==='completed';
      const items   = card.querySelectorAll('.assignment-item');
      let doneCnt = 0;

      items.forEach(i => {
        const aid = i.dataset.id;
        if (localStorage.getItem(`assignment-${aid}`)==='completed') {
          i.classList.add('completed');
          const cb = i.querySelector('.assignment-checkbox');
          if (cb) cb.checked = true;
          doneCnt++;
        }
      });

      const pct = items.length ? (doneCnt/items.length)*100 : (doneMod?100:0);
      card.querySelector('.progress-bar').style.width = `${pct}%`;

      if (doneMod) {
        const st  = card.querySelector('.module-status');
        st.textContent='Completed';
        st.classList.remove('status-current','status-upcoming');
        st.classList.add('status-completed');
        const btn = card.querySelector('.module-btn.btn-secondary');
        if (btn) btn.textContent = 'Mark Incomplete';
      }
    });
  }

  function initializePage() {
    generateModuleCards();
    initializeModuleCards();

    const cw = getCurrentWeek();
    updateAssignments('all',cw);
    highlightCurrentWeek(cw);
    updateModulesForWeek(cw,'all');

    // add checkboxes if missing
    document.querySelectorAll('.assignment-item').forEach(item => {
      if (!item.querySelector('.assignment-checkbox')) {
        const aid = item.dataset.id;
        const cb  = document.createElement('input');
        cb.type  = 'checkbox';
        cb.className = 'assignment-checkbox';
        cb.onchange = () => updateAssignmentCompletion(cb,aid);
        if (localStorage.getItem(`assignment-${aid}`)==='completed') {
          cb.checked = true;
          item.classList.add('completed');
        }
        item.insertBefore(cb, item.querySelector('a'));
      }
    });
  }

  // ——— Initialize Calendars + Page ———
  const colored = colorizeEvents(allEvents);

  const monthCal = new FullCalendar.Calendar(document.getElementById('month'), {
    initialView:  'dayGridMonth',
    initialDate:  '2025-05-05',
    headerToolbar:{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek' },
    events:        colored,
    eventClick:    handleEventClick,
    eventTimeFormat:{ hour:'numeric', minute:'2-digit' },
    datesSet(info) {
      const w = Math.floor((info.start - new Date('2025-05-05'))/(1000*60*60*24*7))+1;
      highlightCurrentWeek(w);
      updateAssignments(document.getElementById('course-select').value, w);
      updateModulesForWeek(w, document.getElementById('course-select').value);
    }
  });

  const weekCal = new FullCalendar.Calendar(document.getElementById('week'), {
    initialView:  'listWeek',
    initialDate:  '2025-05-05',
    headerToolbar:{ left:'prev,next today', center:'title', right:'listDay,listWeek' },
    events:        colored,
    eventClick:    handleEventClick,
    eventTimeFormat:{ hour:'numeric', minute:'2-digit' }
  });

  monthCal.render();
  weekCal.render();

  document.getElementById('course-select')
    .addEventListener('change', e => filterEventsByCourse(e.target.value));

  // finally…
  initializePage();
});