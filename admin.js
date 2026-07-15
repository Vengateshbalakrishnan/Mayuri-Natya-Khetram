/* Mayuri Natya Khetram Admin Portal Script */

// --- Global Error Diagnostic Catcher ---
(function() {
    function showBanner(title, msg, details) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.backgroundColor = '#dc2626';
        div.style.color = 'white';
        div.style.padding = '20px';
        div.style.zIndex = '999999';
        div.style.fontSize = '14px';
        div.style.fontFamily = 'monospace';
        div.style.whiteSpace = 'pre-wrap';
        div.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        div.style.boxSizing = 'border-box';
        div.innerHTML = `<h3 style="margin:0 0 10px 0; font-size: 16px;">${title}</h3><p style="margin:0 0 10px 0;">${msg}</p><pre style="margin:0; background: rgba(0,0,0,0.2); padding:10px; border-radius:4px; overflow-x:auto;">${details}</pre>`;
        document.body.appendChild(div);
    }
    window.onerror = function(message, source, lineno, colno, error) {
        // Ignore cross-origin third party script errors (which have no details)
        if (message === 'Script error.' || !lineno) {
            return false;
        }
        const file = (source || '').split('/').pop();
        showBanner('⚠️ JavaScript Error Encountered', message, `File: ${file}\nLine: ${lineno} | Col: ${colno}\n\nStack Trace:\n${error ? error.stack : 'N/A'}`);
        return false;
    };
    window.addEventListener('unhandledrejection', function(event) {
        showBanner('⚠️ Unhandled Promise Rejection', event.reason, `Reason: ${event.reason}`);
    });
})();

// --- One-time local storage dummy data cleanup to prevent re-migration ---
(function() {
    try {
        if (localStorage.getItem('mnk_supabase_cleaned_v2') !== 'true') {
            localStorage.removeItem('mnk_students_db');
            localStorage.removeItem('mnk_enquiries_db');
            localStorage.removeItem('mnk_fees_db');
            localStorage.removeItem('mnk_attendance_db');
            localStorage.setItem('mnk_supabase_cleaned_v2', 'true');
        }
    } catch (e) {
        console.warn("Could not clear local storage dummy keys:", e);
    }
})();

// --- Global State & LocalStorage Keys ---
const STORAGE_KEY_STUDENTS = 'mnk_students_db';
const STORAGE_KEY_ENQUIRIES = 'mnk_enquiries_db';
const STORAGE_KEY_COURSES = 'mnk_custom_courses';
const STORAGE_KEY_FEES = 'mnk_fees_db';
const STORAGE_KEY_ATTENDANCE = 'mnk_attendance_db';

// --- Default Data ---
const defaultStudents = [];
const defaultEnquiries = [];
const defaultFees = [];

// --- Safe LocalStorage access ---
function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`LocalStorage access blocked for key: ${key}`, e);
        return null;
    }
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`LocalStorage write blocked for key: ${key}`, e);
        return false;
    }
}

function getStoredArray(key, defaultVal) {
    const data = safeGetItem(key);
    if (!data) return defaultVal;
    try {
        return JSON.parse(data) || defaultVal;
    } catch (e) {
        return defaultVal;
    }
}

let studentsDB = getStoredArray(STORAGE_KEY_STUDENTS, defaultStudents);
let enquiriesDB = getStoredArray(STORAGE_KEY_ENQUIRIES, defaultEnquiries);
let customCourses = getStoredArray(STORAGE_KEY_COURSES, []);
let feesDB = getStoredArray(STORAGE_KEY_FEES, defaultFees);
let attendanceDB = getStoredArray(STORAGE_KEY_ATTENDANCE, []);

// --- Supabase Client Initialization ---
const SUPABASE_URL = "https://gzvbadsveordhbqzatjs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dmJhZHN2ZW9yZGhicXphdGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzQxMjYsImV4cCI6MjA5ODY1MDEyNn0.p9WIVgXBJWx1waSaFO4pMRzJRHrpmFwxNsaHuhLu7Dc";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Background sync function
async function syncFromSupabase() {
    if (!supabaseClient) return;

    try {
        console.log("Starting background synchronization with Supabase...");

        // 1. Sync CMS Content
        const { data: cmsData } = await supabaseClient.from('cms_content').select('*').eq('id', 'main_cms').maybeSingle();
        if (cmsData && cmsData.content) {
            safeSetItem('mnk_website_content', JSON.stringify(cmsData.content));
        } else {
            // Upload local CMS content if empty
            const currentCms = getWebContent();
            await supabaseClient.from('cms_content').upsert({ id: 'main_cms', content: currentCms });
        }

        // 2. Sync Custom Courses
        const { data: ccData } = await supabaseClient.from('cms_content').select('*').eq('id', 'custom_courses').maybeSingle();
        if (ccData && ccData.content) {
            customCourses = ccData.content;
            safeSetItem(STORAGE_KEY_COURSES, JSON.stringify(customCourses));
        } else if (customCourses.length > 0) {
            await supabaseClient.from('cms_content').upsert({ id: 'custom_courses', content: customCourses });
        }

        // 3. Sync Students
        const { data: sData } = await supabaseClient.from('students').select('*');
        if (sData && sData.length > 0) {
            studentsDB = sData;
            safeSetItem(STORAGE_KEY_STUDENTS, JSON.stringify(studentsDB));
        } else if (studentsDB.length > 0) {
            // First time migration: Upload local students
            await supabaseClient.from('students').insert(studentsDB);
        }

        // 4. Sync Enquiries
        const { data: eData } = await supabaseClient.from('enquiries').select('*');
        if (eData && eData.length > 0) {
            enquiriesDB = eData;
            safeSetItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(enquiriesDB));
        } else if (enquiriesDB.length > 0) {
            // Migration
            await supabaseClient.from('enquiries').insert(enquiriesDB);
        }

        // 5. Sync Fees
        const { data: fData } = await supabaseClient.from('fees').select('*');
        if (fData && fData.length > 0) {
            feesDB = fData;
            safeSetItem(STORAGE_KEY_FEES, JSON.stringify(feesDB));
        } else if (feesDB.length > 0) {
            // Migration
            await supabaseClient.from('fees').insert(feesDB);
        }

        // 6. Sync Attendance
        const { data: attData } = await supabaseClient.from('attendance').select('*');
        if (attData && attData.length > 0) {
            attendanceDB = attData;
            safeSetItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendanceDB));
        } else if (attendanceDB.length > 0) {
            // Migration
            await supabaseClient.from('attendance').insert(attendanceDB);
        }

        console.log("Supabase synchronization successfully completed!");
        refreshAdminConsoles();
    } catch (e) {
        console.warn("Could not sync with Supabase (running in offline/local fallback mode):", e);
    }
}

function saveWebContentToSupabase(content) {
    if (supabaseClient) {
        supabaseClient.from('cms_content').upsert({ id: 'main_cms', content: content }).then(({error}) => {
            if (error) console.error("Error upserting CMS settings to Supabase:", error);
        });
    }
}

function saveData() {
    safeSetItem(STORAGE_KEY_STUDENTS, JSON.stringify(studentsDB));
    safeSetItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(enquiriesDB));
    safeSetItem(STORAGE_KEY_COURSES, JSON.stringify(customCourses));
    safeSetItem(STORAGE_KEY_FEES, JSON.stringify(feesDB));
    safeSetItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendanceDB));

    // Asynchronously push updates to Supabase database
    if (supabaseClient) {
        supabaseClient.from('students').upsert(studentsDB).then(({error}) => { if (error) console.error("Students sync error:", error); });
        supabaseClient.from('fees').upsert(feesDB).then(({error}) => { if (error) console.error("Fees sync error:", error); });
        supabaseClient.from('enquiries').upsert(enquiriesDB).then(({error}) => { if (error) console.error("Enquiries sync error:", error); });
        
        supabaseClient.from('attendance').upsert(attendanceDB.map(r => ({
            date: r.date,
            roll: r.roll,
            name: r.name || '',
            status: r.status
        }))).then(({error}) => { if (error) console.error("Attendance sync error:", error); });
    }
}

// --- Browser Sandboxing Safe Auth State ---
let adminAuthenticated = false;

function isAdminAuthenticated() {
    try {
        return sessionStorage.getItem('mnk_admin_auth') === 'true' || adminAuthenticated;
    } catch (e) {
        return adminAuthenticated;
    }
}

function setAdminAuthenticated(val) {
    try {
        if (val) {
            sessionStorage.setItem('mnk_admin_auth', 'true');
        } else {
            sessionStorage.removeItem('mnk_admin_auth');
        }
    } catch (e) {
        // Fallback
    }
    adminAuthenticated = !!val;
}

// --- Dynamic Toast Notifications ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('toast-active'), 50);
    setTimeout(() => {
        toast.classList.remove('toast-active');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Reset entire database
function clearAllDatabaseData() {
    if (confirm("Are you sure you want to permanently clear all Student records, Enquiry logs, and Fees sheets? This action cannot be undone.")) {
        studentsDB = [];
        enquiriesDB = [];
        feesDB = [];
        attendanceDB = [];
        saveData();
        
        if (supabaseClient) {
            supabaseClient.from('students').delete().neq('roll', '').then();
            supabaseClient.from('enquiries').delete().neq('id', 0).then();
            supabaseClient.from('fees').delete().neq('roll', '').then();
            supabaseClient.from('attendance').delete().neq('id', 0).then();
        }
        
        refreshAdminConsoles();
        showToast('All database records cleared successfully!', 'success');
    }
}

// --- Lockscreen Access Authentication ---
function handleAdminLogin() {
    const pwdInput = document.getElementById('adminPassword');
    if (!pwdInput) return;
    
    const pwd = pwdInput.value;
    const content = getWebContent();
    const correctPassword = String(content.adminPassword || '').trim() || 'admin123';
    
    if (pwd === correctPassword) {
        setAdminAuthenticated(true);
        pwdInput.value = '';
        
        // Hide lockscreen, show dashboard
        document.getElementById('adminLockscreen').style.display = 'none';
        document.getElementById('adminDashboard').classList.add('unlocked');
        
        showToast('Login successful! Welcome to the Admin Console.', 'success');
        refreshAdminConsoles();
        syncFromSupabase();
    } else {
        showToast('Invalid password! Access denied.', 'error');
        pwdInput.value = '';
        pwdInput.focus();
    }
}

function handleAdminLogout() {
    setAdminAuthenticated(false);
    showToast('Successfully logged out of Admin Console.', 'info');
    
    // Hide dashboard, show lockscreen
    document.getElementById('adminDashboard').classList.remove('unlocked');
    document.getElementById('adminLockscreen').style.display = 'flex';
    document.getElementById('adminPassword').focus();
}

// --- Tab Switching System ---
function switchAdminTab(tabName) {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
        if (item.id === `tab-${tabName}`) item.classList.add('active-tab');
        else item.classList.remove('active-tab');
    });

    const panels = document.querySelectorAll('.admin-tab-panel');
    panels.forEach(panel => {
        if (panel.id === `panel-${tabName}`) panel.classList.add('active-panel');
        else panel.classList.remove('active-panel');
    });

    if (tabName === 'website-manager') {
        loadWebsiteManagerForm();
    }
    if (tabName === 'add-course') {
        renderCustomCoursesTable();
    }
    if (tabName === 'attendance') {
        loadAttendanceSheet();
    }

    refreshAdminConsoles();
}

// --- Data Renderers ---
function refreshAdminConsoles() {
    // 1. Overview counts
    const activeStudentsCount = studentsDB.length;
    const pendingEnquiriesCount = enquiriesDB.filter(e => e.status === 'Pending').length;
    const pendingFeesCount = feesDB.filter(f => f.status === 'Pending' || f.status === 'Partially Paid').length;

    const totalCollected = feesDB
        .reduce((sum, f) => sum + (f.paidAmount !== undefined ? f.paidAmount : (f.status === 'Paid' ? f.amount : 0)), 0);

    document.getElementById('statStudents').innerText = activeStudentsCount;
    document.getElementById('statEnquiries').innerText = pendingEnquiriesCount;
    document.getElementById('statCollected').innerText = `₹${totalCollected.toLocaleString('en-IN')}`;
    document.getElementById('statPending').innerText = pendingFeesCount;

    // 2. Render Enquiries Table
    const enqBody = document.getElementById('enquiriesTableBody');
    if (enqBody) {
        enqBody.innerHTML = '';
        enquiriesDB.forEach(enq => {
            const statusBadge = enq.status === 'Converted' ? 
                `<span class="badge badge-primary" style="background-color:#28a745;">Converted</span>` : 
                `<span class="badge badge-accent">Pending Call</span>`;
            
            const row = `
                <tr>
                    <td>${enq.date}</td>
                    <td style="font-weight:600;">${enq.name}</td>
                    <td>${enq.course}</td>
                    <td>${enq.phone}</td>
                    <td><span class="badge badge-primary" style="background-color: var(--text-muted);">${enq.source}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" style="color:var(--primary); border-color:var(--primary); padding: 4px 8px; font-size: 0.75rem;" onclick="deleteEnquiry('${enq.phone}')">Delete</button>
                    </td>
                </tr>
            `;
            enqBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // 3. Render Students Roster Table
    renderStudentsTable('all');

    // 4. Render Fees Roster Table
    const feesBody = document.getElementById('feesTableBody');
    if (feesBody) {
        feesBody.innerHTML = '';
        feesDB.forEach((fee, index) => {
            const isPaid = fee.status === 'Paid';
            const isPartial = fee.status === 'Partially Paid';
            
            let statusBadge = '';
            if (isPaid) {
                statusBadge = `<span class="badge badge-primary" style="background-color:#28a745;">Paid</span>`;
            } else if (isPartial) {
                const paid = fee.paidAmount || 0;
                const pending = fee.amount - paid;
                statusBadge = `<span class="badge" style="background-color:#ffc107; color:#212529; font-size:0.75rem; padding:4px 8px; display:inline-block; line-height:1.2;">Partially Paid<br><small style="font-size:0.65rem; font-weight:600;">Paid: ₹${paid} | Pend: ₹${pending}</small></span>`;
            } else {
                statusBadge = `<span class="badge badge-accent" style="background-color:#fd7e14; color:white;">Pending</span>`;
            }
            
            let actions = '<div style="display:flex; gap:5px; align-items:center;">';
            if (isPaid) {
                actions += `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="viewReceiptFromConsole('${fee.roll}')">Receipt</button>`;
            } else {
                actions += `<button class="btn btn-primary btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="openRecordPaymentModal('${fee.roll}')">Pay</button>`;
                if ((fee.paidAmount || 0) > 0) {
                    actions += `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="viewReceiptFromConsole('${fee.roll}')">Receipt</button>`;
                }
                actions += `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="sendSingleReminder('${fee.roll}')">Notify</button>`;
            }
            actions += '</div>';
            
            const row = `
                <tr>
                    <td><strong>${fee.roll}</strong></td>
                    <td style="font-weight:600;">${fee.name}</td>
                    <td>${fee.course}</td>
                    <td>₹${fee.amount.toLocaleString('en-IN')}</td>
                    <td>${statusBadge}</td>
                    <td>${actions}</td>
                </tr>
            `;
            feesBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // 5. Update Branding Title dynamically in admin panel header
    const content = getWebContent();
    const sidebarTitle = document.getElementById('sidebarAcademyName');
    if (sidebarTitle) sidebarTitle.innerText = content.academyName || 'Mayuri Academy';

    // 6. Reload Attendance Sheets
    loadAttendanceSheet();
    loadMonthlyAttendanceReport();
}

// Student Filtering & Render
function renderStudentsTable(levelFilter = 'all') {
    const studBody = document.getElementById('studentsTableBody');
    if (!studBody) return;
    studBody.innerHTML = '';

    const filtered = levelFilter === 'all' ? 
        studentsDB : 
        studentsDB.filter(s => s.level === levelFilter);

    filtered.forEach(s => {
        const levelLabel = (s.level || '').replace('-', ' ').toUpperCase();
        
        let courseText = s.course;
        if (s.course === 'bharatanatyam') courseText = 'Bharatanatyam';
        else if (s.course === 'carnatic') courseText = 'Carnatic Music';
        else if (s.course === 'litemusic') courseText = 'Lite Music';

        let programText = '';
        if (s.program === 'diploma') programText = 'Diploma';
        else if (s.program === 'arangetram') programText = 'Arangetram';
        else if (s.program === 'ba-bharatanatyam') programText = 'B.A. Bharathanatiyam';

        const batchText = s.batch === 'saturday-sunday' ? 'Sat & Sun' : (s.batch === 'tuesday-saturday' ? 'Tue & Sat' : (s.batch || ''));

        const detailsCell = `
            <div>
                <strong style="color: var(--primary-dark); font-size: 0.95rem;">${s.name}</strong>
                ${s.age ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Age: ${s.age}</div>` : ''}
                ${s.school ? `<div style="font-size: 0.8rem; color: var(--text-muted);">School: ${s.school} (Class: ${s.schoolClass || 'N/A'})</div>` : ''}
            </div>
        `;

        const academicCell = `
            <div>
                <span class="badge badge-primary" style="font-size: 0.75rem; padding: 3px 6px;">${courseText}</span>
                ${programText ? `<span class="badge badge-accent" style="font-size: 0.75rem; padding: 3px 6px; margin-left: 5px;">${programText}</span>` : ''}
                ${s.location ? `<div style="font-size: 0.8rem; font-weight: 600; color: var(--primary-dark); margin-top: 4px;">📍 ${s.location}</div>` : ''}
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">Grade: <span class="badge badge-outline" style="font-size: 0.7rem; padding: 2px 5px; border: 1px solid var(--border-light);">${levelLabel}</span></div>
                ${batchText ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Batch: ${batchText}</div>` : ''}
            </div>
        `;

        const contactsCell = `
            <div>
                <div style="font-weight: 600; font-size: 0.85rem;">📞 ${s.phone}</div>
                ${s.secondaryPhone ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Sec: ${s.secondaryPhone}</div>` : ''}
            </div>
        `;

        const row = `
            <tr>
                <td><strong>${s.roll}</strong></td>
                <td>${detailsCell}</td>
                <td>${academicCell}</td>
                <td>${contactsCell}</td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color: var(--primary); border-color: var(--primary); padding: 4px 8px; font-size: 0.75rem;" onclick="deleteStudent('${s.roll}')">Delete</button>
                </td>
            </tr>
        `;
        studBody.insertAdjacentHTML('beforeend', row);
    });
}

function filterStudentsTable() {
    const val = document.getElementById('gradeFilterSelect').value;
    renderStudentsTable(val);
}

// --- Student Daily Attendance System ---
let tempAttendanceSheet = {};

function loadAttendanceSheet() {
    const dateInput = document.getElementById('attDate');
    if (!dateInput) return;
    
    // Set to today's date if empty
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const date = dateInput.value;
    const batchFilter = document.getElementById('attBatchFilter').value;
    const gradeFilter = document.getElementById('attGradeFilter').value;
    const locationFilter = document.getElementById('attLocationFilter').value;
    
    // Filter active students by batch, grade AND location
    let filteredStudents = studentsDB;
    if (batchFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.batch === batchFilter);
    }
    if (gradeFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.level === gradeFilter);
    }
    if (locationFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.location === locationFilter);
    }

    // Initialize temp attendance sheet for this date (for ALL students to avoid data loss)
    tempAttendanceSheet = {};
    
    // Find already saved attendance records for this date
    const savedRecords = attendanceDB.filter(r => r.date === date);
    
    studentsDB.forEach(s => {
        const saved = savedRecords.find(r => r.roll === s.roll);
        // Default to 'Present' if not already marked
        tempAttendanceSheet[s.roll] = saved ? saved.status : 'Present';
    });

    renderAttendanceRows(filteredStudents);
}

function renderAttendanceRows(students) {
    const body = document.getElementById('attendanceTableBody');
    if (!body) return;
    body.innerHTML = '';
    
    if (students.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 25px;">No students registered matching these filter criteria.</td></tr>`;
        return;
    }

    // Group students by batch
    const studentsByBatch = {};
    students.forEach(s => {
        const batchVal = s.batch || 'unassigned';
        if (!studentsByBatch[batchVal]) {
            studentsByBatch[batchVal] = [];
        }
        studentsByBatch[batchVal].push(s);
    });

    const batchOrder = ['thursday-saturday', 'saturday-sunday', 'tuesday-friday', 'tuesday-saturday'];
    const allBatchKeys = Object.keys(studentsByBatch);
    allBatchKeys.forEach(k => {
        if (!batchOrder.includes(k)) {
            batchOrder.push(k);
        }
    });

    batchOrder.forEach(batchKey => {
        const batchStudents = studentsByBatch[batchKey];
        if (!batchStudents || batchStudents.length === 0) return;

        let batchLabel = batchKey;
        if (batchKey === 'thursday-saturday') batchLabel = 'Thursday & Saturday Batch';
        else if (batchKey === 'saturday-sunday') batchLabel = 'Saturday & Sunday Batch';
        else if (batchKey === 'tuesday-friday') batchLabel = 'Tuesday & Friday Batch';
        else if (batchKey === 'tuesday-saturday') batchLabel = 'Tuesday & Saturday Batch';
        else {
            batchLabel = batchKey.replace('-', ' ').toUpperCase() + ' Batch';
        }

        // Header row for this Batch group
        const groupHeaderRow = `
            <tr style="background-color: var(--bg-cream); font-weight: bold;">
                <td colspan="4" style="padding: 15px; font-size: 1.05rem; color: var(--primary-dark); border-top: 1.5px solid var(--border-light); border-bottom: 1.5px solid var(--border-light); text-align: left;">
                    📅 ${batchLabel} (${batchStudents.length} Students)
                </td>
            </tr>
        `;
        body.insertAdjacentHTML('beforeend', groupHeaderRow);

        // Render students in this group
        batchStudents.forEach(s => {
            const currentStatus = tempAttendanceSheet[s.roll] || 'Present';
            
            let courseText = s.course;
            if (s.course === 'bharatanatyam') courseText = 'Bharatanatyam';
            else if (s.course === 'carnatic') courseText = 'Carnatic Music';
            else if (s.course === 'litemusic') courseText = 'Lite Music';

            let programText = '';
            if (s.program === 'diploma') programText = 'Diploma';
            else if (s.program === 'arangetram') programText = 'Arangetram';
            else if (s.program === 'ba-bharatanatyam') programText = 'B.A. Bharathanatiyam';

            const levelLabel = (s.level || '').replace('-', ' ').toUpperCase();

            const detailsCell = `
                <div style="text-align: left;">
                    <strong style="color: var(--primary-dark); font-size: 0.95rem;">${s.name}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                        Grade: <span class="badge badge-outline" style="font-size: 0.65rem; padding: 1px 4px; border: 1px solid var(--border-light);">${levelLabel}</span> | Course: ${courseText} ${programText ? `(${programText})` : ''}
                    </div>
                </div>
            `;

            const batchBadgeText = batchKey === 'thursday-saturday' ? 'Thu & Sat' : 
                                   (batchKey === 'saturday-sunday' ? 'Sat & Sun' : 
                                   (batchKey === 'tuesday-friday' ? 'Tue & Fri' : 
                                   (batchKey === 'tuesday-saturday' ? 'Tue & Sat' : batchKey)));

            // Style the toggle buttons dynamically
            const presentStyle = currentStatus === 'Present' ? 
                'background-color: #28a745; color: white; border: 1px solid #28a745;' : 
                'background-color: transparent; color: #28a745; border: 1px solid #28a745;';
                
            const absentStyle = currentStatus === 'Absent' ? 
                'background-color: #dc3545; color: white; border: 1px solid #dc3545;' : 
                'background-color: transparent; color: #dc3545; border: 1px solid #dc3545;';

            const statusToggleHTML = `
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button type="button" onclick="toggleStudentAttendance('${s.roll}', 'Present')" style="padding: 6px 16px; font-size: 0.85rem; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; ${presentStyle}">Present</button>
                    <button type="button" onclick="toggleStudentAttendance('${s.roll}', 'Absent')" style="padding: 6px 16px; font-size: 0.85rem; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; ${absentStyle}">Absent</button>
                </div>
            `;

            const row = `
                <tr>
                    <td style="text-align: left;"><strong>${s.roll}</strong></td>
                    <td>${detailsCell}</td>
                    <td style="text-align: left;"><span class="badge badge-primary">${batchBadgeText}</span></td>
                    <td>${statusToggleHTML}</td>
                </tr>
            `;
            body.insertAdjacentHTML('beforeend', row);
        });
    });
}

function toggleStudentAttendance(roll, status) {
    tempAttendanceSheet[roll] = status;
    const batchFilter = document.getElementById('attBatchFilter').value;
    const gradeFilter = document.getElementById('attGradeFilter').value;
    const locationFilter = document.getElementById('attLocationFilter').value;
    
    let filteredStudents = studentsDB;
    if (batchFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.batch === batchFilter);
    }
    if (gradeFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.level === gradeFilter);
    }
    if (locationFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.location === locationFilter);
    }
    renderAttendanceRows(filteredStudents);
}

function markAllAttendance(status) {
    const batchFilter = document.getElementById('attBatchFilter').value;
    const gradeFilter = document.getElementById('attGradeFilter').value;
    const locationFilter = document.getElementById('attLocationFilter').value;
    
    let filteredStudents = studentsDB;
    if (batchFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.batch === batchFilter);
    }
    if (gradeFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.level === gradeFilter);
    }
    if (locationFilter !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.location === locationFilter);
    }

    // Set only the filtered/visible students to the selected status
    filteredStudents.forEach(s => {
        tempAttendanceSheet[s.roll] = status;
    });

    renderAttendanceRows(filteredStudents);
}

function saveAttendanceSheet() {
    const dateInput = document.getElementById('attDate');
    if (!dateInput || !dateInput.value) return;
    const date = dateInput.value;

    // Clear previous marks for this date
    attendanceDB = attendanceDB.filter(r => r.date !== date);

    const absentStudentsAlerts = [];

    // Save current marks
    for (const [roll, status] of Object.entries(tempAttendanceSheet)) {
        const student = studentsDB.find(s => s.roll === roll);
        attendanceDB.push({
            date: date,
            roll: roll,
            name: student ? student.name : '',
            status: status
        });

        if (status === 'Absent' && student) {
            absentStudentsAlerts.push(student);
        }
    }

    saveData();
    showToast(`Attendance sheet for date ${date} successfully saved!`, 'success');

    // Trigger WhatsApp notifications modal if any students are absent
    if (absentStudentsAlerts.length > 0) {
        triggerWhatsappAbsentNotifications(absentStudentsAlerts, date);
    }
}

function triggerWhatsappAbsentNotifications(studentsList, date) {
    const container = document.getElementById('whatsappAlertsContainer');
    if (!container) return;

    container.innerHTML = '';

    studentsList.forEach(s => {
        const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const messageText = `Dear Parent, your ward *${s.name}* (Roll: ${s.roll}) was marked *ABSENT* for today's class on ${formattedDate}. - Mayuri Academy`;
        
        // Console logging simulation
        console.log(`[WhatsApp API Simulated] Sending message to Primary: ${s.phone} & Secondary: ${s.secondaryPhone || 'N/A'}`);
        console.log(`[WhatsApp API Simulated] Message: "${messageText}"`);

        // Format direct click links
        const cleanPrimary = s.phone.replace(/\D/g, '');
        const cleanSecondary = s.secondaryPhone ? s.secondaryPhone.replace(/\D/g, '') : '';
        
        const fullPrimary = cleanPrimary.length === 10 ? '91' + cleanPrimary : cleanPrimary;
        const fullSecondary = cleanSecondary.length === 10 ? '91' + cleanSecondary : cleanSecondary;

        const primaryLink = `https://api.whatsapp.com/send?phone=${fullPrimary}&text=${encodeURIComponent(messageText)}`;
        const secondaryLink = fullSecondary ? `https://api.whatsapp.com/send?phone=${fullSecondary}&text=${encodeURIComponent(messageText)}` : '#';

        const alertItemHTML = `
            <div style="background-color: var(--bg-cream); border-left: 4px solid #25d366; padding: 12px 15px; border-radius: 4px; border-top: 1px solid var(--border-light); border-right: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong style="color: var(--primary-dark); font-size: 0.95rem;">${s.name}</strong>
                    <span class="badge" style="background-color: #e5ffed; color: #075e54; font-size: 0.7rem; font-weight: bold; border: 1px solid #128c7e; padding: 1px 6px; border-radius: 3px;">DISPATCHED</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
                    📞 Primary: <strong>${s.phone}</strong> | 📞 Secondary: <strong>${s.secondaryPhone || 'N/A'}</strong>
                </div>
                <div style="background-color: white; border: 1px dashed var(--border-light); padding: 8px 10px; border-radius: 4px; font-size: 0.85rem; color: #075e54; font-family: monospace; white-space: pre-wrap; line-height: 1.4; text-align: left; margin-bottom: 10px;">${messageText}</div>
                <div style="display: flex; gap: 10px;">
                    <a href="${primaryLink}" target="_blank" class="btn" style="background-color: #25d366; color: white; text-decoration: none; padding: 5px 12px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid #25d366; cursor: pointer;">
                        💬 Send Primary
                    </a>
                    ${fullSecondary ? `
                    <a href="${secondaryLink}" target="_blank" class="btn btn-outline" style="color: #128c7e; border-color: #25d366; text-decoration: none; padding: 5px 12px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; background: transparent; cursor: pointer;">
                        💬 Send Secondary
                    </a>` : ''}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', alertItemHTML);
    });

    const modal = document.getElementById('whatsappAlertModal');
    if (modal) {
        modal.classList.add('active-modal');
    }
}

function closeWhatsappModal() {
    const modal = document.getElementById('whatsappAlertModal');
    if (modal) {
        modal.classList.remove('active-modal');
    }
}

function switchAttendanceView(viewName) {
    const btnMark = document.getElementById('btn-att-mark');
    const btnReport = document.getElementById('btn-att-report');
    const markContainer = document.getElementById('attendance-mark-container');
    const reportContainer = document.getElementById('attendance-report-container');
    
    if (viewName === 'mark') {
        if (btnMark) { btnMark.classList.add('btn-primary'); btnMark.classList.remove('btn-outline'); }
        if (btnReport) { btnReport.classList.add('btn-outline'); btnReport.classList.remove('btn-primary'); }
        if (markContainer) markContainer.style.display = 'block';
        if (reportContainer) reportContainer.style.display = 'none';
        loadAttendanceSheet();
    } else {
        if (btnMark) { btnMark.classList.add('btn-outline'); btnMark.classList.remove('btn-primary'); }
        if (btnReport) { btnReport.classList.add('btn-primary'); btnReport.classList.remove('btn-outline'); }
        if (markContainer) markContainer.style.display = 'none';
        if (reportContainer) reportContainer.style.display = 'block';
        
        // Initialize selected month if not set
        const monthInput = document.getElementById('attReportMonth');
        if (monthInput && !monthInput.value) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            monthInput.value = `${year}-${month}`;
        }
        loadMonthlyAttendanceReport();
    }
}

function loadMonthlyAttendanceReport() {
    const monthInput = document.getElementById('attReportMonth');
    const body = document.getElementById('attReportTableBody');
    if (!monthInput || !body) return;
    
    if (!monthInput.value) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${year}-${month}`;
    }
    
    const selectedMonth = monthInput.value;
    const searchQuery = (document.getElementById('attReportSearch').value || '').trim().toLowerCase();
    const locationFilter = document.getElementById('attReportLocationFilter').value;
    
    body.innerHTML = '';
    
    // Filter students by name AND branch location
    let matchingStudents = studentsDB.filter(s => 
        s.name.toLowerCase().includes(searchQuery)
    );
    if (locationFilter !== 'all') {
        matchingStudents = matchingStudents.filter(s => s.location === locationFilter);
    }
    
    if (matchingStudents.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 25px;">No matching student records found.</td></tr>`;
        return;
    }
    
    matchingStudents.forEach(s => {
        // Find records for this student in the selected month
        const monthlyRecords = attendanceDB.filter(r => 
            r.roll === s.roll && 
            r.date && r.date.startsWith(selectedMonth)
        );
        
        const totalClasses = monthlyRecords.length;
        const presentCount = monthlyRecords.filter(r => r.status === 'Present').length;
        const absentCount = monthlyRecords.filter(r => r.status === 'Absent').length;
        
        const percent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : null;
        
        let percentHTML = '';
        if (percent === null) {
            percentHTML = `<span style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">No classes marked</span>`;
        } else {
            let progressColor = '#28a745';
            if (percent < 75) progressColor = '#dc3545';
            else if (percent < 90) progressColor = '#fd7e14';

            percentHTML = `
                <div style="display: flex; align-items: center; gap: 10px; min-width: 160px; max-width: 200px;">
                    <div style="flex-grow: 1; background-color: var(--border-light); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background-color: ${progressColor}; width: ${percent}%; height: 100%; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 700; color: var(--primary-dark); font-size: 0.9rem; min-width: 40px; text-align: right;">${percent}%</span>
                </div>
            `;
        }
        
        let courseText = s.course;
        if (s.course === 'bharatanatyam') courseText = 'Bharatanatyam';
        else if (s.course === 'carnatic') courseText = 'Carnatic Music';
        else if (s.course === 'litemusic') courseText = 'Lite Music';

        let programText = '';
        if (s.program === 'diploma') programText = 'Diploma';
        else if (s.program === 'arangetram') programText = 'Arangetram';
        else if (s.program === 'ba-bharatanatyam') programText = 'B.A. Bharathanatiyam';

        const levelLabel = (s.level || '').replace('-', ' ').toUpperCase();

        const detailsCell = `
            <div style="text-align: left;">
                <strong style="color: var(--primary-dark); font-size: 0.95rem;">${s.name}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    Grade: <span class="badge badge-outline" style="font-size: 0.65rem; padding: 1px 4px; border: 1px solid var(--border-light);">${levelLabel}</span> | Course: ${courseText} ${programText ? `(${programText})` : ''}
                </div>
            </div>
        `;
        
        const summaryText = totalClasses > 0 ? 
            `<strong style="color: #28a745;">${presentCount}</strong> Present / <strong style="color: #dc3545;">${absentCount}</strong> Absent<div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">Total: ${totalClasses} Classes Marked</div>` : 
            `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No records</span>`;

        const row = `
            <tr>
                <td style="text-align: left;"><strong>${s.roll}</strong></td>
                <td>${detailsCell}</td>
                <td style="text-align: center;">${summaryText}</td>
                <td>${percentHTML}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="viewDetailedStudentAttendance('${s.roll}')" style="padding: 4px 10px; font-size: 0.8rem;">View Log</button>
                </td>
            </tr>
        `;
        body.insertAdjacentHTML('beforeend', row);
    });
}

function viewDetailedStudentAttendance(roll) {
    const student = studentsDB.find(s => s.roll === roll);
    if (!student) {
        showToast("Student record not found!", "error");
        return;
    }
    
    const monthInput = document.getElementById('attReportMonth');
    const selectedMonth = monthInput ? monthInput.value : new Date().toISOString().split('T')[0].substring(0, 7);
    
    // Format month for title (e.g. "2026-07" -> "July 2026")
    const dateObj = new Date(selectedMonth + '-02');
    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    document.getElementById('attModalStudentName').innerText = student.name;
    document.getElementById('attModalRoll').innerText = student.roll;
    document.getElementById('attModalMonth').innerText = monthStr;
    
    const body = document.getElementById('attModalTableBody');
    if (body) {
        body.innerHTML = '';
        
        // Filter attendance records for this student and this month
        const records = attendanceDB.filter(r => 
            r.roll === roll && 
            r.date && r.date.startsWith(selectedMonth)
        );
        
        // Sort by date ascending
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (records.length === 0) {
            body.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 15px;">No attendance entries found for this month.</td></tr>`;
        } else {
            records.forEach(r => {
                const formattedDate = new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const isPresent = r.status === 'Present';
                const badgeStyle = isPresent ? 
                    'background-color: #28a745; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;' : 
                    'background-color: #dc3545; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;';
                
                const row = `
                    <tr>
                        <td style="text-align: left; padding: 10px 15px; font-weight: 500;">${formattedDate}</td>
                        <td style="text-align: center; padding: 10px 15px;">
                            <span style="${badgeStyle}">${r.status}</span>
                        </td>
                    </tr>
                `;
                body.insertAdjacentHTML('beforeend', row);
            });
        }
    }
    
    document.getElementById('studentAttendanceDetailModal').classList.add('active-modal');
}

function closeStudentAttendanceModal() {
    document.getElementById('studentAttendanceDetailModal').classList.remove('active-modal');
}

// Deletion Actions
function deleteStudent(roll) {
    if (confirm("Are you sure you want to permanently delete this student record and their associated invoice?")) {
        studentsDB = studentsDB.filter(s => s.roll !== roll);
        feesDB = feesDB.filter(f => f.roll !== roll);
        saveData();
        if (supabaseClient) {
            supabaseClient.from('students').delete().eq('roll', roll).then();
            supabaseClient.from('fees').delete().eq('roll', roll).then();
        }
        refreshAdminConsoles();
        showToast("Student record and invoices deleted successfully.", "success");
    }
}

function deleteEnquiry(phone) {
    if (confirm("Are you sure you want to delete this enquiry lead?")) {
        enquiriesDB = enquiriesDB.filter(e => e.phone !== phone);
        saveData();
        if (supabaseClient) {
            supabaseClient.from('enquiries').delete().eq('phone', phone).then();
        }
        refreshAdminConsoles();
        showToast("Enquiry record deleted.", "success");
    }
}

// Action: Record Fee Payment Modal Controls
function openRecordPaymentModal(roll) {
    const feeItem = feesDB.find(f => f.roll === roll);
    if (!feeItem) return;

    document.getElementById('payStudentRoll').value = roll;
    document.getElementById('payStudentName').innerText = `Student Name: ${feeItem.name}`;
    document.getElementById('payStudentCourse').innerText = `Course: ${feeItem.course}`;
    
    const totalDue = feeItem.amount;
    const alreadyPaid = feeItem.paidAmount || 0;
    const remainingToPay = totalDue - alreadyPaid;

    document.getElementById('payTotalDue').innerText = `Total Fee Due: ₹${totalDue}`;
    document.getElementById('payAlreadyPaid').innerText = `Already Paid: ₹${alreadyPaid}`;

    const payAmountInput = document.getElementById('payAmount');
    payAmountInput.value = remainingToPay;
    payAmountInput.max = remainingToPay;

    document.getElementById('payMethod').value = 'Hand Cash';
    document.getElementById('recordPaymentModal').classList.add('active-modal');

    calculateRemainingBalance();
}

function closeRecordPaymentModal() {
    document.getElementById('recordPaymentModal').classList.remove('active-modal');
}

function calculateRemainingBalance() {
    const roll = document.getElementById('payStudentRoll').value;
    const feeItem = feesDB.find(f => f.roll === roll);
    if (!feeItem) return;

    const inputVal = Number(document.getElementById('payAmount').value) || 0;
    const totalDue = feeItem.amount;
    const alreadyPaid = feeItem.paidAmount || 0;
    const remainingToPay = totalDue - alreadyPaid;

    const balanceIndicator = document.getElementById('payBalanceIndicator');
    if (inputVal > 0 && inputVal < remainingToPay) {
        const balance = remainingToPay - inputVal;
        balanceIndicator.innerText = `Remaining Pending Balance: ₹${balance}`;
        balanceIndicator.style.display = 'block';
        balanceIndicator.style.backgroundColor = '#fef3c7'; // amber-100
        balanceIndicator.style.color = '#b45309'; // amber-700
    } else if (inputVal === remainingToPay) {
        balanceIndicator.innerText = `Invoice fully paid!`;
        balanceIndicator.style.display = 'block';
        balanceIndicator.style.backgroundColor = '#d1fae5'; // green-100
        balanceIndicator.style.color = '#065f46'; // green-700
    } else if (inputVal > remainingToPay) {
        balanceIndicator.innerText = `Warning: Amount exceeds remaining due (₹${remainingToPay})`;
        balanceIndicator.style.display = 'block';
        balanceIndicator.style.backgroundColor = '#fee2e2'; // red-100
        balanceIndicator.style.color = '#991b1b'; // red-700
    } else {
        balanceIndicator.style.display = 'none';
    }
}

function saveFeePayment(event) {
    event.preventDefault();

    const roll = document.getElementById('payStudentRoll').value;
    const feeItem = feesDB.find(f => f.roll === roll);
    if (!feeItem) return;

    const inputVal = Number(document.getElementById('payAmount').value) || 0;
    const method = document.getElementById('payMethod').value;
    const totalDue = feeItem.amount;
    const alreadyPaid = feeItem.paidAmount || 0;
    const remainingToPay = totalDue - alreadyPaid;

    if (inputVal <= 0) {
        showToast('Please enter a valid paid amount.', 'error');
        return;
    }
    if (inputVal > remainingToPay) {
        showToast(`Paid amount cannot exceed the remaining due of ₹${remainingToPay}.`, 'error');
        return;
    }

    // Update paid amount and status
    feeItem.paidAmount = alreadyPaid + inputVal;
    feeItem.paymentMethod = method;

    if (feeItem.paidAmount >= totalDue) {
        feeItem.status = 'Paid';
    } else {
        feeItem.status = 'Partially Paid';
    }

    saveData();
    refreshAdminConsoles();
    closeRecordPaymentModal();
    showToast(`Payment of ₹${inputVal} via ${method} recorded successfully.`, 'success');
}

// Action: Generate simulated receipt view for paid student in console
function viewReceiptFromConsole(roll) {
    const student = studentsDB.find(s => s.roll === roll);
    const fee = feesDB.find(f => f.roll === roll);
    if (!student || !fee) return;

    const checkoutModal = document.getElementById('checkoutModal');
    const loadingState = document.getElementById('checkoutLoadingState');
    const receiptState = document.getElementById('checkoutReceiptState');
    
    checkoutModal.classList.add('active-modal');
    loadingState.style.display = 'none';
    receiptState.style.display = 'block';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    let courseText = student.course;
    if (student.course === 'bharatanatyam') courseText = 'Bharatanatyam';
    else if (student.course === 'carnatic') courseText = 'Carnatic Music';
    else if (student.course === 'litemusic') courseText = 'Lite Music';

    let programText = student.program;
    if (student.program === 'diploma') programText = 'Diploma';
    else if (student.program === 'arangetram') programText = 'Arangetram';
    else if (student.program === 'ba-bharatanatyam') programText = 'B.A. Bharathanatiyam';

    let batchText = 'Saturday & Sunday';
    if (student.batch === 'thursday-saturday') batchText = 'Thursday & Saturday';
    else if (student.batch === 'tuesday-friday') batchText = 'Tuesday & Friday';

    document.getElementById('recNo').innerText = 'MNK/REC/' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('recDate').innerText = dateStr;
    document.getElementById('recRoll').innerText = student.roll;
    document.getElementById('recName').innerText = student.name;
    document.getElementById('recPhone').innerText = student.phone;
    document.getElementById('recCourse').innerText = courseText;
    document.getElementById('recProgram').innerText = programText || '';
    document.getElementById('recLevel').innerText = (student.level || '').replace('-', ' ').toUpperCase();
    document.getElementById('recClasses').innerText = batchText;
    
    const paidAmount = fee.paidAmount !== undefined ? fee.paidAmount : (fee.status === 'Paid' ? fee.amount : 0);
    document.getElementById('recAmount').innerText = `₹${paidAmount.toLocaleString('en-IN')}.00`;

    const recStatusEl = document.getElementById('recStatus');
    if (recStatusEl) {
        const method = fee.paymentMethod || 'Direct Cash Clearance';
        if (fee.status === 'Paid') {
            recStatusEl.innerText = `SUCCESSFUL (${method})`;
            recStatusEl.style.color = '#28a745';
        } else if (fee.status === 'Partially Paid') {
            const pending = fee.amount - paidAmount;
            recStatusEl.innerText = `PARTIAL PAYMENT (${method}) - Pending: ₹${pending}`;
            recStatusEl.style.color = '#d97706';
        } else {
            recStatusEl.innerText = `PENDING / UNPAID`;
            recStatusEl.style.color = '#dc2626';
        }
    }
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active-modal');
}

// Action: Send alerts
function sendSingleReminder(roll) {
    const fee = feesDB.find(f => f.roll === roll);
    const student = studentsDB.find(s => s.roll === roll);
    if (fee && student) {
        showToast(`Reminder sent to Parent (${student.phone}) via Coffee App links!`, 'success');
    }
}

function simulateSendParentReminders() {
    const pendings = feesDB.filter(f => f.status === 'Pending');
    if (pendings.length === 0) {
        showToast('All fees are clear! No pending reminders to send.', 'info');
        return;
    }
    pendings.forEach(p => {
        const student = studentsDB.find(s => s.roll === p.roll);
        if (student) {
            console.log(`Alert sent to ${student.phone} for amount ₹${p.amount}`);
        }
    });
    showToast(`Dispatched ${pendings.length} Coffee App reminder links to parents!`, 'success');
}

// Modals triggers
function showAddEnquiryModal() {
    document.getElementById('addEnquiryModal').classList.add('active-modal');
}
function closeAddEnquiryModal() {
    document.getElementById('addEnquiryModal').classList.remove('active-modal');
}
function handleAddEnquirySubmit(event) {
    event.preventDefault();
    const name = document.getElementById('enqName').value;
    const course = document.getElementById('enqCourse').value;
    const phone = document.getElementById('enqPhone').value;
    const source = document.getElementById('enqSource').value;
    const now = new Date().toISOString().split('T')[0];

    enquiriesDB.push({
        date: now,
        name,
        course,
        phone,
        source,
        status: 'Pending'
    });
    saveData();
    refreshAdminConsoles();
    closeAddEnquiryModal();
    document.getElementById('addEnquiryForm').reset();
    showToast('Enquiry saved to console database.', 'success');
}

function updateAdminBatchOptions() {
    const locationSelect = document.getElementById('studLocation');
    const batchSelect = document.getElementById('studBatch');
    if (!locationSelect || !batchSelect) return;

    const location = locationSelect.value;
    const currentBatch = batchSelect.value;

    batchSelect.innerHTML = '';

    if (location === 'Velandipalayam') {
        batchSelect.innerHTML = `
            <option value="thursday-saturday">Thursday & Saturday</option>
            <option value="saturday-sunday">Saturday & Sunday</option>
        `;
    } else if (location === 'Saravanampatty') {
        batchSelect.innerHTML = `
            <option value="tuesday-friday">Tuesday & Friday</option>
        `;
    } else {
        // Fallback for non-bharatanatyam courses where location is hidden
        batchSelect.innerHTML = `
            <option value="thursday-saturday">Thursday & Saturday</option>
            <option value="saturday-sunday">Saturday & Sunday</option>
            <option value="tuesday-friday">Tuesday & Friday</option>
        `;
    }

    if (Array.from(batchSelect.options).some(opt => opt.value === currentBatch)) {
        batchSelect.value = currentBatch;
    }
}

function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('active-modal');
    handleAdminCourseChange();
    updateAdminBatchOptions();
}
function closeAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('active-modal');
}
function handleAdminCourseChange() {
    const course = document.getElementById('studCourse').value;
    const locationGroup = document.getElementById('studLocationGroup');
    const locationSelect = document.getElementById('studLocation');
    
    if (course === 'bharatanatyam') {
        if (locationGroup) locationGroup.style.display = 'block';
        if (locationSelect) locationSelect.required = true;
    } else {
        if (locationGroup) locationGroup.style.display = 'none';
        if (locationSelect) {
            locationSelect.required = false;
            locationSelect.value = '';
        }
    }
    updateAdminBatchOptions();
}
function handleAddStudentSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('studName').value.trim();
    const age = Number(document.getElementById('studAge').value);
    const school = document.getElementById('studSchool').value.trim();
    const schoolClass = document.getElementById('studClass').value.trim();
    const phone = document.getElementById('studPhone').value.trim();
    const secondaryPhone = document.getElementById('studSecondaryPhone').value.trim();
    const batch = document.getElementById('studBatch').value;
    const level = document.getElementById('studLevel').value;
    const course = document.getElementById('studCourse').value;
    const program = document.getElementById('studProgram').value;
    const feeAmount = Number(document.getElementById('studFeeAmount').value) || 0;
    const paidAmount = Number(document.getElementById('studPaidAmount').value) || 0;
    const location = course === 'bharatanatyam' ? document.getElementById('studLocation').value : '';

    const roll = 'MNK-26-' + Math.floor(100 + Math.random() * 900);
    
    const initialStatus = paidAmount >= feeAmount ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending');

    studentsDB.push({
        roll,
        name,
        age,
        school,
        schoolClass,
        phone,
        secondaryPhone,
        batch,
        level,
        course,
        location,
        program,
        feeAmount,
        status: initialStatus
    });
    
    // Map course display labels for invoice
    let courseText = 'Bharatanatyam';
    if (course === 'carnatic') courseText = 'Carnatic Music';
    else if (course === 'litemusic') courseText = 'Lite Music';

    feesDB.push({
        roll,
        name,
        course: courseText,
        amount: feeAmount,
        paidAmount: paidAmount,
        paymentMethod: paidAmount > 0 ? 'Hand Cash' : '',
        status: initialStatus
    });

    saveData();
    refreshAdminConsoles();
    closeAddStudentModal();
    document.getElementById('addStudentForm').reset();
    showToast(`Added student ${name} with Roll No ${roll}`, 'success');
}

// --- Custom Course Catalog Manager ---
function renderCustomCoursesTable() {
    const body = document.getElementById('customCoursesTableBody');
    if (!body) return;
    body.innerHTML = '';
    
    if (customCourses.length === 0) {
        body.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No custom courses published yet.</td></tr>`;
        return;
    }

    customCourses.forEach(c => {
        const row = `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:2rem;">${c.icon}</span>
                        <div>
                            <strong style="color:var(--primary-dark); font-size:1rem;">${c.name}</strong>
                            <p style="margin:5px 0 0; font-size:0.85rem; color:var(--text-muted);">${c.desc}</p>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-primary">${c.category.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color:#dc3545; border-color:#dc3545;" onclick="deleteCustomCourse('${c.id}')">Delete</button>
                </td>
            </tr>
        `;
        body.insertAdjacentHTML('beforeend', row);
    });
}

function handleAddCourse(event) {
    event.preventDefault();
    const name = document.getElementById('courseName').value.trim();
    const desc = document.getElementById('courseDesc').value.trim();
    const category = document.getElementById('courseCategory').value;
    const icon = document.getElementById('courseIcon').value.trim();

    if (!name || !desc || !icon) {
        showToast('Please fill all course fields.', 'error');
        return;
    }

    const newCourse = {
        id: 'c_' + Date.now(),
        name,
        desc,
        category,
        icon
    };

    customCourses.push(newCourse);
    saveData();
    renderCustomCoursesTable();
    document.getElementById('addCourseForm').reset();
    showToast('Custom course added successfully!', 'success');
}

function deleteCustomCourse(id) {
    if (confirm("Are you sure you want to delete this custom course?")) {
        customCourses = customCourses.filter(c => c.id !== id);
        saveData();
        renderCustomCoursesTable();
        showToast('Custom course removed.', 'success');
    }
}


// --- CMS Section Configurations ---

const DEFAULT_CMS_CONTENT = {
    academyName: "Mayuri Natya Khetram",
    logoPath: "assets/logo_peacock.png",
    tagline: "கலையின் வழியே இறைவனை உணரலாம்",
    heroTitle: "Nurturing Art.<br>Inspiring Lives.",
    heroTagline: "Providing government-recognized classical dance & music education under qualified Gurus. Affiliated with Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University.",
    heroBg: "assets/hero_dancer.jpg",
    aboutSubtitle: "Nurturing Art and Inspiring Value-Based Lives",
    aboutDesc1: "Established with the vision of promoting classical Indian art forms, Mayuri Natya Khetram stands as a lighthouse of traditional art in Coimbatore. We guide students from their first steps to advanced university level examinations.",
    aboutDesc2: "Through our affiliations, our students earn certificates that are recognized by the Government of Tamil Nadu, creating opportunities for academic credit, career growth in art education, and cultural portfolios.",
    founderImg: "assets/guru_avatar.jpg",
    cofounderImg: "assets/guru_cofounder.jpg",
    aboutHeroImg: "assets/guru_pose4.jpg",
    examTitle: "Coimbatore's Accredited Art Education",
    examDesc: "We take pride in providing structured, academically sound, and government-recognized art courses. As the only academy in Coimbatore affiliated with the Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University, we strictly align our practical classes with university guidelines.",
    adminPassword: "admin123",
    galleryItems: [
        { id: "g1", category: "dance", src: "assets/guru_pose4.jpg", caption: "Shivaratri Performance", description: "Guru Srimathi Mayuri Venkatesh performing at Perur Temple", sub: "Perur Patteswarar Temple" },
        { id: "g2", category: "music", src: "assets/course_carnatic.jpg", caption: "Carnatic Music Kutcheri", description: "Traditional classical vocal music concert", sub: "Troupe recital led by Guru Shri Muralikrishna" },
        { id: "g3", category: "milestones", src: "assets/guru_pose3.jpg", caption: "Salangai Poojai Ceremony", description: "Traditional Salangai Poojai milestone celebrations", sub: "Blessings from Guru Srimathi Mayuri Venkatesh" },
        { id: "g4", category: "dance", src: "assets/guru_pose1.jpg", caption: "Classical Stage Dance", description: "Stage performance in traditional green costume by Guru Srimathi Mayuri Venkatesh", sub: "Traditional green costume recital" },
        { id: "g5", category: "dance", src: "assets/guru_pose2.jpg", caption: "Auspicious Mudra Recital", description: "Close-up composition of Guru Srimathi Mayuri Venkatesh with standard mudras", sub: "Traditional temple lamp lighting theme" },
        { id: "g6", category: "music", src: "assets/music_pose1.jpg", caption: "Lite Music Concert", description: "Lite Music stage concert performance by Co-Founder Venkatesh Balakrishnan", sub: "Venkatesh Balakrishnan stage recital" },
        { id: "g7", category: "music", src: "assets/music_pose2.jpg", caption: "Vocal Recital", description: "Classical concert recital performance by Venkatesh Balakrishnan", sub: "Venkatesh Balakrishnan stage performance" }
    ],
    offerTitle: "What We Offer",
    offerDesc: "We provide comprehensive and structured training in traditional art forms with certified gradings.",
    admissionTitle: "Admission Form & Fee Estimator",
    admissionGuidelineTitle: "Registration Guidelines",
    admissionDesc1: "We welcome students of all age groups. Beginners are placed in the Pre-Grade foundational batches, while transfer students with prior dance/music experience will undergo a brief placement session to assess their corresponding grade level (Grades 1 to 8).",
    admissionDesc2: "Note on fee deadlines: Fees are collected before the 10th of every month. Payments can be tracked directly from the parent dashboard, and receipts are generated instantly.",
    admissionHelplineText: "86755 39678 | 99447 23209",
    feePreGrade: 1000,
    feeGrade1_3: 1300,
    feeGrade4_5: 1600,
    feeGrade6_8: 2000,
    feeWeeklyAddon: 500,
    contactPhone1: "86755 39678",
    contactPhone2: "99447 23209",
    branch1Title: "Velandipalayam Branch",
    branch1Address: "No. 42, Karpagam Complex, Velandipalayam, Coimbatore – 641025.",
    branch1Phone: "📞 86755 39678",
    branch2Title: "Saravanampatty Branch",
    branch2Address: "No. 5/21, KRS Nagar, Saravanampatty, Coimbatore – 641035.",
    branch2Phone: "📞 99447 23209",
    razorpayKey: ""
};

function getWebContent() {
    const stored = safeGetItem('mnk_website_content');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            const merged = Object.assign({}, DEFAULT_CMS_CONTENT, parsed);
            const strPass = String(merged.adminPassword || '');
            if (strPass.trim() === '') {
                merged.adminPassword = 'admin123';
            } else {
                merged.adminPassword = strPass;
            }
            return merged;
        } catch (e) {
            console.error("Error parsing stored web content, resetting to default.", e);
            return DEFAULT_CMS_CONTENT;
        }
    }
    return DEFAULT_CMS_CONTENT;
}

let cmsUploadedImages = {};
let galleryTempImage = '';

function handleCmsImageUpload(input, previewId, key) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 1024 * 1024) {
            showToast("Selected image is too large! Please compress it to under 1MB.", "error");
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const preview = document.getElementById(previewId);
            if (preview) preview.src = dataUrl;
            cmsUploadedImages[key] = dataUrl;
        };
        reader.readAsDataURL(file);
    }
}

function handleGalleryImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 1024 * 1024) {
            showToast("Selected gallery image is too large! Limit is 1MB.", "error");
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            galleryTempImage = e.target.result;
            const preview = document.getElementById('cmsGalleryPreview');
            if (preview) {
                preview.src = galleryTempImage;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

function addNewGalleryItem() {
    if (!galleryTempImage) {
        showToast("Please upload a gallery image first!", "error");
        return;
    }
    const caption = document.getElementById('cmsGalleryCaption').value.trim();
    const sub = document.getElementById('cmsGallerySub').value.trim();
    const description = document.getElementById('cmsGalleryDescription').value.trim();
    const category = document.getElementById('cmsGalleryCategory').value;
    
    if (!caption || !sub || !description) {
        showToast("Please fill in all details for the new gallery image!", "error");
        return;
    }
    
    const content = getWebContent();
    const items = content.galleryItems || DEFAULT_CMS_CONTENT.galleryItems;
    
    const newItem = {
        id: 'g_' + Date.now(),
        category,
        src: galleryTempImage,
        caption,
        description,
        sub
    };
    
    items.push(newItem);
    content.galleryItems = items;
    safeSetItem('mnk_website_content', JSON.stringify(content));
    
    document.getElementById('cmsGalleryFile').value = '';
    document.getElementById('cmsGalleryCaption').value = '';
    document.getElementById('cmsGallerySub').value = '';
    document.getElementById('cmsGalleryDescription').value = '';
    
    const preview = document.getElementById('cmsGalleryPreview');
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    galleryTempImage = '';
    
    loadWebsiteManagerForm();
    showToast("Image added to gallery successfully!", "success");
}

function deleteGalleryItem(id) {
    if (confirm("Are you sure you want to delete this image from the gallery?")) {
        const content = getWebContent();
        const items = content.galleryItems || DEFAULT_CMS_CONTENT.galleryItems;
        const newItems = items.filter(item => item.id !== id);
        content.galleryItems = newItems;
        safeSetItem('mnk_website_content', JSON.stringify(content));
        
        loadWebsiteManagerForm();
        showToast("Image removed from gallery.", "success");
    }
}

function loadWebsiteManagerForm() {
    const content = getWebContent();
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    const setPreviewSrc = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.src = val || '';
    };

    setVal('cmsAcademyName', content.academyName);
    setVal('cmsTagline', content.tagline);
    setVal('cmsHeroTitle', content.heroTitle);
    setVal('cmsHeroTagline', content.heroTagline);
    
    setVal('cmsAboutSubtitle', content.aboutSubtitle);
    setVal('cmsAboutDesc1', content.aboutDesc1);
    setVal('cmsAboutDesc2', content.aboutDesc2);
    
    setVal('cmsExamTitle', content.examTitle);
    setVal('cmsExamDesc', content.examDesc);
    setVal('cmsAdminPassword', content.adminPassword);

    // Razorpay key
    setVal('cmsRazorpayKey', content.razorpayKey);
    const keyStatusEl = document.getElementById('razorpayKeyStatus');
    if (keyStatusEl) {
        const k = String(content.razorpayKey || '').trim();
        if (!k) {
            keyStatusEl.innerHTML = '<span style="color:#b45309;">⚠️ No Razorpay Key set — payment gateway will run in demo mode.</span>';
        } else if (k.startsWith('rzp_live_')) {
            keyStatusEl.innerHTML = '<span style="color:#15803d;">✅ Live Key detected — real payments will be processed.</span>';
        } else if (k.startsWith('rzp_test_')) {
            keyStatusEl.innerHTML = '<span style="color:#1d4ed8;">🔵 Test Key detected — use Razorpay test card details.</span>';
        } else {
            keyStatusEl.innerHTML = '<span style="color:#dc2626;">❌ Invalid format — must start with rzp_live_ or rzp_test_</span>';
        }
    }

    // Reset file pickers
    const filePickers = ['cmsLogoFile', 'cmsHeroBgFile', 'cmsAboutHeroImgFile', 'cmsFounderImgFile', 'cmsCofounderImgFile'];
    filePickers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    setPreviewSrc('cmsLogoPreview', content.logoPath);
    setPreviewSrc('cmsHeroBgPreview', content.heroBg);
    setPreviewSrc('cmsAboutHeroImgPreview', content.aboutHeroImg);
    setPreviewSrc('cmsFounderImgPreview', content.founderImg);
    setPreviewSrc('cmsCofounderImgPreview', content.cofounderImg);

    cmsUploadedImages = {
        logoPath: content.logoPath,
        heroBg: content.heroBg,
        aboutHeroImg: content.aboutHeroImg,
        founderImg: content.founderImg,
        cofounderImg: content.cofounderImg
    };

    setVal('cmsOfferTitle', content.offerTitle);
    setVal('cmsOfferDesc', content.offerDesc);
    
    setVal('cmsAdmissionTitle', content.admissionTitle);
    setVal('cmsAdmissionGuidelineTitle', content.admissionGuidelineTitle);
    setVal('cmsAdmissionDesc1', content.admissionDesc1);
    setVal('cmsAdmissionDesc2', content.admissionDesc2);
    setVal('cmsAdmissionHelplineText', content.admissionHelplineText);
    
    setVal('cmsFeePreGrade', content.feePreGrade);
    setVal('cmsFeeGrade1_3', content.feeGrade1_3);
    setVal('cmsFeeGrade4_5', content.feeGrade4_5);
    setVal('cmsFeeGrade6_8', content.feeGrade6_8);
    setVal('cmsFeeWeeklyAddon', content.feeWeeklyAddon);
    
    setVal('cmsContactPhone1', content.contactPhone1);
    setVal('cmsContactPhone2', content.contactPhone2);
    setVal('cmsBranch1Title', content.branch1Title);
    setVal('cmsBranch1Address', content.branch1Address);
    setVal('cmsBranch1Phone', content.branch1Phone);
    setVal('cmsBranch2Title', content.branch2Title);
    setVal('cmsBranch2Address', content.branch2Address);
    setVal('cmsBranch2Phone', content.branch2Phone);

    const tableBody = document.getElementById('cmsGalleryTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        let storedItems = content.galleryItems;
        if (Array.isArray(storedItems)) {
            storedItems = storedItems.filter(item => item && typeof item === 'object' && item.src && item.caption);
        }
        const items = (Array.isArray(storedItems) && storedItems.length > 0)
            ? storedItems
            : DEFAULT_CMS_CONTENT.galleryItems;

        items.forEach(item => {
            if (!item || !item.src) return;
            const categoryLabel = (item.category || 'dance').toUpperCase();
            const row = `
                <tr>
                    <td>
                        <img src="${item.src}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px;">
                    </td>
                    <td style="font-weight:600;">${item.caption || ''}</td>
                    <td><span class="badge badge-accent">${categoryLabel}</span></td>
                    <td>
                        <button type="button" class="btn btn-outline btn-sm" style="color:var(--primary); border-color:var(--primary); padding: 4px 8px; font-size: 0.8rem;" onclick="deleteGalleryItem('${item.id}')">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }
}

function saveWebsiteContent(event) {
    event.preventDefault();
    
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const content = getWebContent();
    const newContent = {
        academyName: getVal('cmsAcademyName'),
        logoPath: cmsUploadedImages.logoPath || DEFAULT_CMS_CONTENT.logoPath,
        tagline: getVal('cmsTagline'),
        heroTitle: getVal('cmsHeroTitle'),
        heroTagline: getVal('cmsHeroTagline'),
        heroBg: cmsUploadedImages.heroBg || DEFAULT_CMS_CONTENT.heroBg,
        aboutSubtitle: getVal('cmsAboutSubtitle'),
        aboutDesc1: getVal('cmsAboutDesc1'),
        aboutDesc2: getVal('cmsAboutDesc2'),
        founderImg: cmsUploadedImages.founderImg || DEFAULT_CMS_CONTENT.founderImg,
        cofounderImg: cmsUploadedImages.cofounderImg || DEFAULT_CMS_CONTENT.cofounderImg,
        aboutHeroImg: cmsUploadedImages.aboutHeroImg || DEFAULT_CMS_CONTENT.aboutHeroImg,
        examTitle: getVal('cmsExamTitle'),
        examDesc: getVal('cmsExamDesc'),
        adminPassword: getVal('cmsAdminPassword') || 'admin123',
        galleryItems: content.galleryItems || DEFAULT_CMS_CONTENT.galleryItems,
        
        offerTitle: getVal('cmsOfferTitle'),
        offerDesc: getVal('cmsOfferDesc'),
        
        admissionTitle: getVal('cmsAdmissionTitle'),
        admissionGuidelineTitle: getVal('cmsAdmissionGuidelineTitle'),
        admissionDesc1: getVal('cmsAdmissionDesc1'),
        admissionDesc2: getVal('cmsAdmissionDesc2'),
        admissionHelplineText: getVal('cmsAdmissionHelplineText'),
        
        feePreGrade: Number(getVal('cmsFeePreGrade')),
        feeGrade1_3: Number(getVal('cmsFeeGrade1_3')),
        feeGrade4_5: Number(getVal('cmsFeeGrade4_5')),
        feeGrade6_8: Number(getVal('cmsFeeGrade6_8')),
        feeWeeklyAddon: Number(getVal('cmsFeeWeeklyAddon')),
        
        contactPhone1: getVal('cmsContactPhone1'),
        contactPhone2: getVal('cmsContactPhone2'),
        branch1Title: getVal('cmsBranch1Title'),
        branch1Address: getVal('cmsBranch1Address'),
        branch1Phone: getVal('cmsBranch1Phone'),
        branch2Title: getVal('cmsBranch2Title'),
        branch2Address: getVal('cmsBranch2Address'),
        branch2Phone: getVal('cmsBranch2Phone'),
        razorpayKey: getVal('cmsRazorpayKey')
    };

    safeSetItem('mnk_website_content', JSON.stringify(newContent));
    saveWebContentToSupabase(newContent);
    loadWebsiteManagerForm();
    showToast("Website content settings successfully updated and published!", "success");
}

// --- Window Startup Verification ---
window.onload = function() {
    // Start background sync from Supabase
    syncFromSupabase();

    const content = getWebContent();
    const loginLogo = document.getElementById('loginLogo');
    if (loginLogo) loginLogo.src = content.logoPath || 'assets/logo_peacock.png';
    
    // Clean up empty passwords on startup
    const activePass = String(content.adminPassword || '');
    if (activePass.trim() === '') {
        content.adminPassword = 'admin123';
        safeSetItem('mnk_website_content', JSON.stringify(content));
        saveWebContentToSupabase(content);
    }
    
    // Authenticate routing
    if (isAdminAuthenticated()) {
        document.getElementById('adminLockscreen').style.display = 'none';
        document.getElementById('adminDashboard').classList.add('unlocked');
        refreshAdminConsoles();
    } else {
        document.getElementById('adminLockscreen').style.display = 'flex';
        document.getElementById('adminDashboard').classList.remove('unlocked');
        document.getElementById('adminPassword').focus();
    }
};
