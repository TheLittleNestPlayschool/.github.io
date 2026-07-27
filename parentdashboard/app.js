// --- Accordion Toggle Logic ---
function toggleAccordion(element) {
    const content = element.nextElementSibling;
    content.style.display = (content.style.display === "block") ? "none" : "block";
}

// --- Modal Logic ---
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('show');

    if (id === 'my-data-modal') {
        fetch('profile.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('profile-content').innerHTML = data;
                if (window.latestDashboardData) {
                    populateUI(window.latestDashboardData);
                }
            })
            .catch(error => console.error('Error loading profile.html:', error));
    } else if (id === 'gallery-modal') {
        fetch('gallery.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('gallery-content').innerHTML = data;
            })
            .catch(error => console.error('Error loading gallery.html:', error));
    } else if (id === 'message-modal') {
        fetch('message_us.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('message-content').innerHTML = data;
            })
            .catch(error => console.error('Error loading message_us.html:', error));
    } else if (id === 'badges-modal') {
        fetch('badges.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('badges-content').innerHTML = data;
            })
            .catch(error => console.error('Error loading badges.html:', error));
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

// --- Main Dashboard Loading Logic ---
window.latestDashboardData = null;

async function loadDashboard() {
    const userId = localStorage.getItem('userId');
    if (!userId) { window.location.href = './login.html'; return; }

    try {
        const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/parents?user_id=' + userId);
        const data = await response.json();
        window.latestDashboardData = data; 

        // Mapping files to the grid containers in dashboard.html
        const files = [
            { id: 'gauges-container', url: './gauges.html' },
            { id: 'current-container', url: './recap.html' },
            { id: 'upcoming-container', url: './upcoming.html' },
            { id: 'gallery-container', url: './gallery_main.html' }
        ];

        // Ensure all component HTML files are loaded into DOM completely first
        await Promise.all(files.map(async (file) => {
            try {
                const res = await fetch(file.url);
                if (res.ok) {
                    const htmlText = await res.text();
                    const container = document.getElementById(file.id);
                    if (container) container.innerHTML = htmlText;
                }
            } catch (e) {
                console.error(`Failed to load partial ${file.url}:`, e);
            }
        }));

        // Now populate user & banner details and gauges
        populateUI(data);

        // Fetch session data and update target IDs
        if (data.franchise_data?.current_session) {
            await loadSession(data.franchise_data.current_session);
            const nextSessionId = parseInt(data.franchise_data.current_session) + 1;
            await loadUpcoming(nextSessionId);
        }
    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
}

async function loadSession(sessionId) {
    try {
        const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/get_session_details?session_number=${sessionId}`);
        const data = await res.json();
        if (data) {
            const descEl = document.getElementById('session-short-description');
            if (descEl) descEl.innerText = data.todays_description || 'No summary available for today.';
            
            const fields = {
                'session-num': data.session_num, 
                'session-plan-name': data.session_plan_name,
                'session-description': data.session_description, 
                'lesson-1-title': data.lesson_1_title,
                'lesson-1-cat': data.lesson_1_cat, 
                'lesson-2-title': data.lesson_2_title,
                'lesson-2-cat': data.lesson_2_cat, 
                'manner-topic': data.manner_topic
            };
            for (const [id, value] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value || 'N/A';
            }
        }
    } catch (err) { console.error("Session load error:", err); }
}

async function loadUpcoming(upcomingSessionId) {
    try {
        const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/get_up_session_details?session_number=${upcomingSessionId}`);
        const data = await res.json();
        if (data) {
            const descEl = document.getElementById('up-session-short-description');
            if (descEl) descEl.innerText = data.next_description || 'No summary available for next session.';
            
            const fields = {
                'up-session-num': data.session_num, 
                'up-session-plan-name': data.session_plan_name,
                'up-theme-color': data.theme_color, 
                'up-map-icon-url': data.map_icon_url,
                'up-session-description': data.session_description, 
                'up-lesson-1-title': data.lesson_1_title,
                'up-lesson-1-cat': data.lesson_1_cat, 
                'up-lesson-2-title': data.lesson_2_title,
                'up-lesson-2-cat': data.lesson_2_cat, 
                'up-manner-topic': data.manner_topic,
                'up-obj-1': data.obj_text_1, 
                'up-obj-2': data.obj_text_2, 
                'up-obj-3': data.obj_text_3,
                'up-physical-activity': data.physical_activity, 
                'up-home-time-activity': data.home_time_activity,
                'up-worksheet-plan-name': data.worksheet_plan_name, 
                'up-full-lesson-plan': data.full_lesson_plan
            };
            for (const [id, value] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value || 'N/A';
            }
        }
    } catch (err) { console.error("Upcoming session error:", err); }
}

function populateUI(data) {
    if (data.franchise_data) {
        const locHeaderEl = document.getElementById('franchise-name-display');
        if (locHeaderEl) locHeaderEl.innerText = data.franchise_data.name || '';
    }

    const p = data.parent_data;
    if (p) {
        const nameEl = document.getElementById('parent-name');
        if (nameEl) nameEl.innerText = `${p.first_name || ''} ${p.last_name || ''}`;
    }

    const student = data.student_data?.[0];
    if (student) {
        const studentEl = document.getElementById('student-name');
        if (studentEl) studentEl.innerText = student.name || 'N/A';

        // 1. Populate Literacy value directly into the center text node
        const literacyVal = student.literacy ?? 0;
        const litContainer = document.getElementById('gauge-literacy');
        const litTextEl = document.getElementById('literacy-value');
        if (litTextEl) litTextEl.textContent = literacyVal;
        if (litContainer) litContainer.style.setProperty('--progress', `${literacyVal}%`);

        // 2. Populate My Hours value directly into the center text node
        const hoursVal = student.my_hours ?? 0;
        const hoursTextEl = document.getElementById('hours-value');
        if (hoursTextEl) hoursTextEl.textContent = hoursVal;
    }

    const emailEl = document.getElementById('parent-email');
    if (emailEl && p) emailEl.innerText = p.email || 'N/A';
        
    const phoneEl = document.getElementById('parent-phone');
    if (phoneEl && p) phoneEl.innerText = p.phone || 'N/A';
        
    const addressEl = document.getElementById('parent-address');
    if (addressEl && p) addressEl.innerText = p.address || 'N/A';
}

function enableDragScroll(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    let isDown = false;
    let startY;
    let scrollTop;

    el.addEventListener('mousedown', (e) => {
        isDown = true;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
        startY = e.pageY - el.offsetTop;
        scrollTop = el.scrollTop;
    });

    el.addEventListener('mouseleave', () => {
        isDown = false;
        el.style.cursor = 'default';
    });

    el.addEventListener('mouseup', () => {
        isDown = false;
        el.style.cursor = 'default';
    });

    el.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const y = e.pageY - el.offsetTop;
        const walk = (y - startY) * 1.5;
        el.scrollTop = scrollTop - walk;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    enableDragScroll('content-area');
    enableDragScroll('gauges-container');
    
    const modalIds = ['my-data-modal', 'gallery-modal', 'message-modal', 'badges-modal'];
    modalIds.forEach(id => {
        enableDragScroll(id);
    });
});
