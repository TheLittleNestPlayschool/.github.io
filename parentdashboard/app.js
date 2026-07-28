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
        fetch('profile.html?v=2')
            .then(response => response.text())
            .then(data => {
                document.getElementById('profile-content').innerHTML = data;
                if (window.latestDashboardData) {
                    populateUI(window.latestDashboardData);
                }
            })
            .catch(error => console.error('Error loading profile.html:', error));
    } else if (id === 'gallery-modal') {
        fetch('gallery.html?v=2')
            .then(response => response.text())
            .then(data => {
                document.getElementById('gallery-content').innerHTML = data;
            })
            .catch(error => console.error('Error loading gallery.html:', error));
    } else if (id === 'message-modal') {
        fetch('message_us.html?v=2')
            .then(response => response.text())
            .then(data => {
                document.getElementById('message-content').innerHTML = data;
            })
            .catch(error => console.error('Error loading message_us.html:', error));
    } else if (id === 'badges-modal') {
        fetch('badges.html?v=2')
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
        console.log("Fetching dashboard data for user ID:", userId);

        const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/parents?user_id=' + userId);
        const data = await response.json();
        
        console.log("Dashboard API Response:", data);

        const studentObj = Array.isArray(data.student_data) ? data.student_data[0] : data.student_data;
        const studentId = studentObj?.id || studentObj?.student_id;

        if (studentId) {
            localStorage.setItem('student_id', studentId);
            try {
                const studentRes = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/get_students?student_id=${studentId}`);
                const studentData = await studentRes.json();
                
                if (studentData) {
                    const actualStudent = Array.isArray(studentData) ? studentData[0] : studentData;
                    if (actualStudent) {
                        data.student_data = [actualStudent];
                    }
                }
            } catch (err) {
                console.error("Failed to fetch explicit get_students details:", err);
            }
        }

        window.latestDashboardData = data; 

        if (data.franchise_data) {
            localStorage.setItem('franchise_id', data.franchise_data.id);
            localStorage.setItem('franchise_name', data.franchise_data.name);
        }

        const files = [
            { id: 'gauges-container', url: './gauges.html?v=2' },
            { id: 'current-container', url: './recap.html?v=2' },
            { id: 'upcoming-container', url: './upcoming.html?v=2' },
            { id: 'gallery-container', url: './gallery_main.html?v=2' }
        ];

        await Promise.all(files.map(async (file) => {
            try {
                const res = await fetch(file.url);
                if (res.ok) {
                    const htmlText = await res.text();
                    const container = document.getElementById(file.id);
                    if (container) container.innerHTML = htmlText;
                } else {
                    console.error(`Failed to load ${file.url}, status:`, res.status);
                }
            } catch (e) {
                console.error(`Failed to load partial ${file.url}:`, e);
            }
        }));

        populateUI(data);

        if (data.franchise_data && data.franchise_data.current_session) {
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
        const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/get_session_details?session_number=${sessionId}&v=2`);
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
        const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:wtEDiEuV/get_up_session_details?session_number=${upcomingSessionId}&v=2`);
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
    console.log("Populating UI with data object:", data);

    if (data.franchise_data) {
        const locHeaderEl = document.getElementById('franchise-name-display');
        if (locHeaderEl) locHeaderEl.innerText = data.franchise_data.name || '';
    }

    const p = data.parent_data;
    if (p) {
        const nameEl = document.getElementById('parent-name');
        if (nameEl) nameEl.innerText = `${p.first_name || ''} ${p.last_name || ''}`;
    }

    const student = Array.isArray(data.student_data) ? data.student_data[0] : data.student_data;
    if (student) {
        console.log("Matched student record for gauges:", student);
        const studentEl = document.getElementById('student-name');
        if (studentEl) studentEl.innerText = student.name || 'N/A';

        const gaugeFields = {
            'literacy-value': student.literacy,
            'fine_motor-value': student.fine_motor,
            'numeracy-value': student.numeracy,
            'oral_lang-value': student.oral_lang,
            'gross_motor-value': student.gross_motor,
            'receptive_lang-value': student.receptive_lang,
            'personal-value': student.personal,
            'creative_arts-value': student.creative_arts,
            'my_world-value': student.my_world,
            'my_hours-value': student.my_hours
        };

        for (const [id, value] of Object.entries(gaugeFields)) {
            const el = document.getElementById(id);
            const val = value ?? 0;
        
            if (el) el.textContent = val;

            if (id !== 'my_hours-value') {
                const percentage = (val / 20) * 100;
                const baseId = id.replace('-value', '');
                const container = document.getElementById(`gauge-${baseId}`);
                if (container) {
                    container.style.setProperty('--progress', `${percentage}%`);
                }
            }
        }
    } else {
        console.warn("No student record found to populate gauges.");
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
