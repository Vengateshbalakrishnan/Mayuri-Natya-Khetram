/* Mayuri Natya Khetram Application Script */

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

// --- Website Content Management System (CMS) ---

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
    branch2Phone: "📞 99447 23209"
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

// --- One-time local storage dummy data cleanup to prevent re-migration ---
(function() {
    try {
        if (localStorage.getItem('mnk_supabase_cleaned_v2') !== 'true') {
            localStorage.removeItem('mnk_students_db');
            localStorage.removeItem('mnk_enquiries_db');
            localStorage.removeItem('mnk_fees_db');
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

// --- Supabase Client Initialization ---
const SUPABASE_URL = "https://gzvbadsveordhbqzatjs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dmJhZHN2ZW9yZGhicXphdGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzQxMjYsImV4cCI6MjA5ODY1MDEyNn0.p9WIVgXBJWx1waSaFO4pMRzJRHrpmFwxNsaHuhLu7Dc";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Background sync function for public site
async function syncFromSupabasePublic() {
    if (!supabaseClient) return;

    try {
        console.log("Syncing public website data from Supabase...");

        // 1. Sync CMS Content
        const { data: cmsData } = await supabaseClient.from('cms_content').select('*').eq('id', 'main_cms').maybeSingle();
        if (cmsData && cmsData.content) {
            localStorage.setItem('mnk_website_content', JSON.stringify(cmsData.content));
            // Trigger website content re-render
            if (typeof renderWebsiteContent === 'function') {
                renderWebsiteContent();
            }
        }

        // 2. Fetch databases to local localStorage for consistency
        const { data: sData } = await supabaseClient.from('students').select('*');
        if (sData && sData.length > 0) {
            localStorage.setItem('mnk_students_db', JSON.stringify(sData));
        }

        const { data: eData } = await supabaseClient.from('enquiries').select('*');
        if (eData && eData.length > 0) {
            localStorage.setItem('mnk_enquiries_db', JSON.stringify(eData));
        }

        const { data: fData } = await supabaseClient.from('fees').select('*');
        if (fData && fData.length > 0) {
            localStorage.setItem('mnk_fees_db', JSON.stringify(fData));
        }
        
        console.log("Public site sync completed!");
    } catch (e) {
        console.warn("Could not sync public site with Supabase:", e);
    }
}

// --- Default Data Initialization (If LocalStorage is Empty) ---
const defaultStudents = [];
const defaultEnquiries = [];
const defaultFees = [];

// Load collections
// --- Safe LocalStorage Access Wrapper ---
function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`LocalStorage blocked for key: ${key}. Using memory fallback.`, e);
        return null;
    }
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`LocalStorage write blocked for key: ${key}. using memory fallback.`, e);
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

function saveData() {
    safeSetItem(STORAGE_KEY_STUDENTS, JSON.stringify(studentsDB));
    safeSetItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(enquiriesDB));
    safeSetItem(STORAGE_KEY_COURSES, JSON.stringify(customCourses));
    safeSetItem(STORAGE_KEY_FEES, JSON.stringify(feesDB));
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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon mapping
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('toast-active'), 50);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast-active');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Navigation & Hash Routing System ---
function handleRouting() {
    const hash = window.location.hash || '#home';
    
    // Disable any leftover admin-mode body class
    document.body.classList.remove('admin-mode');

    const sections = document.querySelectorAll('.view-section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let matched = false;
    
    sections.forEach(sec => {
        if ('#' + sec.id === hash) {
            sec.classList.add('active-view');
            matched = true;
        } else {
            sec.classList.remove('active-view');
        }
    });

    // Handle fallback if hash not matched
    if (!matched) {
        document.getElementById('home').classList.add('active-view');
    }

    // Update active nav state
    navLinks.forEach(link => {
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Scroll to top
    window.scrollTo(0, 0);

    if (hash === '#home') {
        initCountersAnimation();
    }
}

// Mobile Navbar Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('nav-active');
});

// Close mobile navbar on nav link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('nav-active');
    });
});

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
    renderWebsiteContent();
    handleRouting();
    renderCustomCourses();
});

// --- Dynamic Counter Stats Animation ---
let countersAnimated = false;
function initCountersAnimation() {
    const counterNumbers = document.querySelectorAll('.counter-number');
    if (!counterNumbers.length || countersAnimated) return;

    counterNumbers.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const speed = 100; // Speed divider
        const increment = target / speed;
        
        let count = 0;
        const updateCount = () => {
            count += increment;
            if (count < target) {
                counter.innerText = Math.ceil(count) + (target > 10 ? '+' : '');
                setTimeout(updateCount, 15);
            } else {
                counter.innerText = target + (target > 10 ? '+' : '');
            }
        };
        updateCount();
    });
    countersAnimated = true; // Trigger once per load
}

// --- Parent Testimonials Slider ---
const slider = document.getElementById('testimonialSlider');
const dots = document.querySelectorAll('#sliderDots .dot');
let currentSlide = 0;

function showSlide(index) {
    if (!slider || dots.length === 0) return;
    if (index >= dots.length) currentSlide = 0;
    else if (index < 0) currentSlide = dots.length - 1;
    else currentSlide = index;

    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, idx) => {
        if (idx === currentSlide) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

// Dots navigation
dots.forEach(dot => {
    dot.addEventListener('click', () => {
        const index = +dot.getAttribute('data-index');
        showSlide(index);
    });
});

// Auto rotation
setInterval(() => {
    showSlide(currentSlide + 1);
}, 6000);

// --- Live Fee Estimator ---
function calculateAdmissionFees() {
    const level = document.getElementById('admLevel').value;
    const content = getWebContent();
    
    let baseRate = Number(content.feePreGrade) || 1000;
    if (level === 'grade-1' || level === 'grade-2' || level === 'grade-3') {
        baseRate = Number(content.feeGrade1_3) || 1300;
    } else if (level === 'grade-4' || level === 'grade-5') {
        baseRate = Number(content.feeGrade4_5) || 1600;
    } else if (level === 'grade-6' || level === 'grade-7' || level === 'grade-8') {
        baseRate = Number(content.feeGrade6_8) || 2000;
    }

    // Since batch classes (Saturday & Sunday / Tuesday & Saturday) are twice-weekly,
    // we include the weekly classes addon in the estimate by default.
    let finalFee = baseRate + (Number(content.feeWeeklyAddon) || 500);

    const feeInput = document.getElementById('admFee');
    if (feeInput) feeInput.value = finalFee;
    return finalFee;
}

function updateAdmBatchOptions() {
    const locationSelect = document.getElementById('admLocation');
    const batchSelect = document.getElementById('admBatch');
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
        // Fallback for other courses where location is hidden
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

function handleCourseChange() {
    const course = document.getElementById('admCourse').value;
    const locationGroup = document.getElementById('locationGroup');
    const locationSelect = document.getElementById('admLocation');
    
    if (course === 'bharatanatyam') {
        if (locationGroup) locationGroup.style.display = 'block';
        if (locationSelect) locationSelect.required = true;
    } else {
        if (locationGroup) locationGroup.style.display = 'none';
        if (locationSelect) {
            locationSelect.required = false;
            locationSelect.value = ''; // Reset selection
        }
    }
    
    updateAdmBatchOptions();
    calculateAdmissionFees();
}

// Call on startup to match default selections
if (document.getElementById('admLevel')) {
    handleCourseChange();
    updateAdmBatchOptions();
}

// --- Mock Checkout & Receipt Generator ---
let currentAdmissionData = null;

function handleAdmissionSubmit(event) {
    event.preventDefault();

    currentAdmissionData = {
        name: document.getElementById('admName').value.trim(),
        age: document.getElementById('admAge').value,
        school: document.getElementById('admSchool').value.trim(),
        schoolClass: document.getElementById('admClass').value.trim(),
        phone: document.getElementById('admPhone').value.trim(),
        secondaryPhone: document.getElementById('admSecondaryPhone').value.trim(),
        batch: document.getElementById('admBatch').value,
        level: document.getElementById('admLevel').value,
        course: document.getElementById('admCourse').value,
        location: document.getElementById('admLocation').value,
        program: document.getElementById('admProgram').value
    };

    const amount = Number(document.getElementById('admFee').value) || 0;

    if (!amount || amount <= 0) {
        showToast('Please check the fee amount before paying.', 'error');
        return;
    }

    // Sync the hidden checkout amount field (used by processCheckoutPayment)
    const customAmountInput = document.getElementById('checkoutCustomAmount');
    if (customAmountInput) customAmountInput.value = amount;

    // Directly trigger payment — Razorpay opens on top if key is set
    processCheckoutPayment();
}


// --- Shared helper: builds receipt, saves to DB after successful payment ---
function _completeAdmission(amount, razorpayPaymentId) {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        document.getElementById('checkoutInputState').style.display = 'none';
        document.getElementById('checkoutLoadingState').style.display = 'none';
        document.getElementById('checkoutReceiptState').style.display = 'block';
        checkoutModal.classList.add('active-modal');
    }
    const titleEl = document.getElementById('checkoutModalTitle');
    if (titleEl) titleEl.innerText = razorpayPaymentId ? '✅ Payment Successful' : '🧾 Admission Receipt';

    const randomRoll = 'MNK-26-' + Math.floor(100 + Math.random() * 900);
    const txnId = razorpayPaymentId || ('MNK/2026/' + Math.floor(1000 + Math.random() * 9000));
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    let courseText = 'Bharatanatyam';
    if (currentAdmissionData.course === 'carnatic') courseText = 'Carnatic Music';
    else if (currentAdmissionData.course === 'litemusic') courseText = 'Lite Music';

    let programText = 'Diploma';
    if (currentAdmissionData.program === 'arangetram') programText = 'Arangetram';
    else if (currentAdmissionData.program === 'ba-bharatanatyam') programText = 'B.A. Bharathanatiyam';

    let batchText = 'Saturday & Sunday';
    if (currentAdmissionData.batch === 'thursday-saturday') batchText = 'Thursday & Saturday';
    else if (currentAdmissionData.batch === 'tuesday-friday') batchText = 'Tuesday & Friday';
    const levelLabel = currentAdmissionData.level.replace('-', ' ').toUpperCase();

    document.getElementById('recNo').innerText = txnId;
    document.getElementById('recDate').innerText = dateStr;
    document.getElementById('recRoll').innerText = randomRoll;
    document.getElementById('recName').innerText = currentAdmissionData.name;
    document.getElementById('recPhone').innerText = currentAdmissionData.phone;
    document.getElementById('recCourse').innerText = courseText;
    document.getElementById('recProgram').innerText = programText;
    document.getElementById('recLevel').innerText = levelLabel;
    document.getElementById('recClasses').innerText = batchText;
    document.getElementById('recAmount').innerText = `Rs.${amount.toLocaleString('en-IN')}.00`;

    const recLocationRow = document.getElementById('recLocationRow');
    const recLocation = document.getElementById('recLocation');
    if (currentAdmissionData.course === 'bharatanatyam') {
        if (recLocationRow) recLocationRow.style.display = 'flex';
        if (recLocation) recLocation.innerText = currentAdmissionData.location || '';
    } else {
        if (recLocationRow) recLocationRow.style.display = 'none';
    }

    studentsDB.push({
        roll: randomRoll,
        name: currentAdmissionData.name,
        age: Number(currentAdmissionData.age),
        school: currentAdmissionData.school,
        schoolClass: currentAdmissionData.schoolClass,
        phone: currentAdmissionData.phone,
        secondaryPhone: currentAdmissionData.secondaryPhone,
        batch: currentAdmissionData.batch,
        level: currentAdmissionData.level,
        course: currentAdmissionData.course,
        location: currentAdmissionData.course === 'bharatanatyam' ? currentAdmissionData.location : '',
        program: currentAdmissionData.program,
        feeAmount: amount,
        status: 'Paid'
    });

    feesDB.push({
        roll: randomRoll,
        name: currentAdmissionData.name,
        course: courseText,
        amount,
        paidAmount: amount,
        paymentMethod: razorpayPaymentId ? 'Razorpay Gateway' : 'Online Transfer (Demo)',
        status: 'Paid'
    });
    enquiriesDB.push({ date: now.toISOString().split('T')[0], name: currentAdmissionData.name, course: courseText, phone: currentAdmissionData.phone, source: 'Website Admission Form', status: 'Converted' });

    saveData();

    if (supabaseClient) {
        supabaseClient.from('students').insert({
            roll: randomRoll,
            name: currentAdmissionData.name,
            age: Number(currentAdmissionData.age),
            school: currentAdmissionData.school,
            schoolClass: currentAdmissionData.schoolClass,
            phone: currentAdmissionData.phone,
            secondaryPhone: currentAdmissionData.secondaryPhone,
            batch: currentAdmissionData.batch,
            level: currentAdmissionData.level,
            course: currentAdmissionData.course,
            location: currentAdmissionData.course === 'bharatanatyam' ? currentAdmissionData.location : '',
            program: currentAdmissionData.program,
            feeAmount: amount,
            status: 'Paid'
        }).then(({error}) => { if (error) console.error("Error saving student to Supabase:", error); });

        supabaseClient.from('fees').insert({
            roll: randomRoll,
            name: currentAdmissionData.name,
            course: courseText,
            amount: amount,
            paidAmount: amount,
            paymentMethod: razorpayPaymentId ? 'Razorpay Gateway' : 'Online Transfer (Demo)',
            status: 'Paid'
        }).then(({error}) => { if (error) console.error("Error saving fee to Supabase:", error); });

        supabaseClient.from('enquiries').insert({
            date: now.toISOString().split('T')[0],
            name: currentAdmissionData.name,
            course: courseText,
            phone: currentAdmissionData.phone,
            source: 'Website Admission Form',
            status: 'Converted'
        }).then(({error}) => { if (error) console.error("Error saving enquiry to Supabase:", error); });
    }
    showToast('Payment successful! Admission record generated.', 'success');
    document.getElementById('admissionForm').reset();
    calculateAdmissionFees();
    currentAdmissionData = null;
}

function processCheckoutPayment() {
    const amountVal = document.getElementById('checkoutCustomAmount').value.trim();
    const amount = Number(amountVal);

    if (!amountVal || isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid payment amount!', 'error');
        return;
    }

    if (!currentAdmissionData) {
        showToast('No active registration details found!', 'error');
        closeCheckoutModal();
        return;
    }

    const content = getWebContent();
    const razorpayKey = String(content.razorpayKey || '').trim();

    // ---- Razorpay live/test path ----
    if (razorpayKey && (razorpayKey.startsWith('rzp_live_') || razorpayKey.startsWith('rzp_test_')) && typeof Razorpay !== 'undefined') {
        document.getElementById('checkoutInputState').style.display = 'none';

        const rzpOptions = {
            key: razorpayKey,
            amount: amount * 100,          // paise
            currency: 'INR',
            name: content.academyName || 'Mayuri Natya Khetram',
            description: 'Admission Fee – ' + currentAdmissionData.name,
            image: content.logoPath || 'assets/logo_peacock.png',
            prefill: {
                name: currentAdmissionData.name,
                contact: currentAdmissionData.phone
            },
            notes: {
                course: currentAdmissionData.course,
                batch: currentAdmissionData.batch,
                level: currentAdmissionData.level
            },
            theme: { color: '#b5179e' },
            handler: function(response) {
                // Payment succeeded – Razorpay calls handler with payment ID
                document.getElementById('checkoutLoadingState').style.display = 'flex';
                _completeAdmission(amount, response.razorpay_payment_id);
            },
            modal: {
                ondismiss: function() {
                    document.getElementById('checkoutInputState').style.display = 'block';
                    showToast('Payment cancelled. You can try again.', 'info');
                }
            }
        };

        try {
            const rzp = new Razorpay(rzpOptions);
            rzp.on('payment.failed', function(response) {
                document.getElementById('checkoutInputState').style.display = 'block';
                showToast('Payment failed: ' + (response.error.description || 'Please try again.'), 'error');
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay open error:', err);
            document.getElementById('checkoutInputState').style.display = 'block';
            showToast('Could not open Razorpay. Please check the Key ID in Admin settings.', 'error');
        }
        return;
    }

    // ---- Demo / fallback mode (no valid key or SDK not loaded) ----
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        document.getElementById('checkoutInputState').style.display = 'none';
        document.getElementById('checkoutLoadingState').style.display = 'flex';
        document.getElementById('checkoutReceiptState').style.display = 'none';
        checkoutModal.classList.add('active-modal');
    }

    if (!razorpayKey) {
        showToast('Demo Mode: Set a Razorpay Key in Admin > Website Manager to enable live payments.', 'info');
    }

    setTimeout(() => { _completeAdmission(amount, null); }, 1500);
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active-modal');
}

// --- Direct Contact / Lead Form ---
function handleContactSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('cName').value;
    const phone = document.getElementById('cPhone').value;
    const message = document.getElementById('cMessage').value;
    const now = new Date().toISOString().split('T')[0];
    
    const courseText = message.toLowerCase().includes('sing') || message.toLowerCase().includes('music') ? 'Carnatic Vocal' : 'Bharatanatyam';

    enquiriesDB.push({
        date: now,
        name: name,
        course: courseText,
        phone: phone,
        source: 'Website Contact Form',
        status: 'Pending'
    });

    saveData();

    if (supabaseClient) {
        supabaseClient.from('enquiries').insert({
            date: now,
            name: name,
            course: courseText,
            phone: phone,
            source: 'Website Contact Form',
            status: 'Pending'
        }).then(({error}) => { if (error) console.error("Error saving contact lead to Supabase:", error); });
    }

    showToast('Your message has been sent successfully. We will call you soon!', 'success');
    document.getElementById('contactForm').reset();
}

// --- Dynamic Course Manager Console (LocalStorage -> DOM) ---
function handleAddNewCourse(event) {
    event.preventDefault();
    
    const name = document.getElementById('newCourseName').value;
    const affiliation = document.getElementById('newCourseAffiliation').value;
    const baseFee = document.getElementById('newCourseBaseFee').value;
    const desc = document.getElementById('newCourseDesc').value;
    const detail = document.getElementById('newCourseDetail').value;

    const newCourseObj = {
        name,
        affiliation,
        baseFee,
        desc,
        detail,
        id: name.toLowerCase().replace(/\s+/g, '-')
    };

    customCourses.push(newCourseObj);
    saveData();
    renderCustomCourses();
    
    showToast(`Course '${name}' has been published successfully!`, 'success');
    document.getElementById('addCourseForm').reset();
    
    // Automatically redirect admin to overview
    switchAdminTab('overview');
}

function renderCustomCourses() {
    const publicGrid = document.getElementById('publicCoursesGrid');
    const dynamicDetailContainer = document.getElementById('dynamicCoursesList');
    
    // Clear previously added courses (keep default ones)
    // Keep first 2 cards in public grid (Bharatanatyam and Carnatic)
    const cards = publicGrid.querySelectorAll('.course-card');
    cards.forEach((card, idx) => {
        if (idx >= 2) card.remove();
    });

    // Keep first 2 detail panels in courses view
    const panels = dynamicDetailContainer.querySelectorAll('.course-detail-panel');
    panels.forEach((panel, idx) => {
        if (idx >= 2) panel.remove();
    });

    // Populate custom ones
    customCourses.forEach(course => {
        // 1. Home card
        const cardHTML = `
            <div class="course-card">
                <div class="course-img-wrapper">
                    <!-- Dynamic Peacock placeholder background -->
                    <div style="width:100%; height:100%; background: linear-gradient(135deg, var(--primary-dark), var(--primary-light)); display:flex; align-items:center; justify-content:center; color: var(--accent); font-size:3.5rem;">🦚</div>
                    <div class="course-overlay">
                        <span class="badge badge-accent">New Course</span>
                    </div>
                </div>
                <div class="course-body">
                    <h3>${course.name}</h3>
                    <p>${course.desc}</p>
                    <div class="course-meta">
                        <span class="course-affiliation">${course.affiliation}</span>
                        <a href="#courses" class="course-link">Syllabus Details →</a>
                    </div>
                </div>
            </div>
        `;
        publicGrid.insertAdjacentHTML('beforeend', cardHTML);

        // 2. Syllabus page detail block
        const detailHTML = `
            <div class="course-detail-panel" id="detail-${course.id}">
                <div class="course-detail-header">
                    <h3>${course.name} Syllabus</h3>
                    <span class="badge badge-accent">${course.affiliation}</span>
                </div>
                <p><strong>Monthly Tuition Fee:</strong> ₹${course.baseFee}/month</p>
                <div style="margin-top:20px; white-space: pre-line; line-height:1.7;">
                    ${course.detail}
                </div>
            </div>
        `;
        dynamicDetailContainer.insertAdjacentHTML('beforeend', detailHTML);
    });
}

// --- Admin Portal Navigation & Data Renderers ---
function switchAdminTab(tabName) {
    // Menu items
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
        if (item.id === `tab-${tabName}`) item.classList.add('active-tab');
        else item.classList.remove('active-tab');
    });

    // Panels
    const panels = document.querySelectorAll('.admin-tab-panel');
    panels.forEach(panel => {
        if (panel.id === `panel-${tabName}`) panel.classList.add('active-panel');
        else panel.classList.remove('active-panel');
    });

    if (tabName === 'website-manager') {
        loadWebsiteManagerForm();
    }

    refreshAdminConsoles();
}

function refreshAdminConsoles() {
    // 1. Overview counts
    const activeStudentsCount = studentsDB.length;
    const pendingEnquiriesCount = enquiriesDB.filter(e => e.status === 'Pending').length;
    const pendingFeesCount = feesDB.filter(f => f.status === 'Pending').length;

    // Sum of paid amounts
    const totalCollected = feesDB
        .filter(f => f.status === 'Paid')
        .reduce((sum, f) => sum + f.amount, 0);

    document.getElementById('statStudents').innerText = activeStudentsCount;
    document.getElementById('statEnquiries').innerText = pendingEnquiriesCount;
    document.getElementById('statCollected').innerText = `₹${totalCollected.toLocaleString('en-IN')}`;
    document.getElementById('statPending').innerText = pendingFeesCount;

    // 2. Render Enquiries Table
    const enqBody = document.getElementById('enquiriesTableBody');
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

    // 3. Render Students Roster Table
    renderStudentsTable('all');

    // 4. Render Fees Roster Table
    const feesBody = document.getElementById('feesTableBody');
    feesBody.innerHTML = '';
    feesDB.forEach((fee, index) => {
        const isPaid = fee.status === 'Paid';
        const statusBadge = isPaid ? 
            `<span class="badge badge-primary" style="background-color:#28a745;">Paid</span>` : 
            `<span class="badge badge-accent" style="background-color:#fd7e14; color:white;">Pending</span>`;
        
        const actions = isPaid ? 
            `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="viewReceiptFromConsole('${fee.roll}')">Receipt</button>` :
            `<div style="display:flex; gap:5px;">
                <button class="btn btn-primary btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="recordDirectPayment('${fee.roll}')">Pay</button>
                <button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="sendSingleReminder('${fee.roll}')">Notify</button>
            </div>`;
        
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

// Student Filtering & Render
function renderStudentsTable(levelFilter = 'all') {
    const studBody = document.getElementById('studentsTableBody');
    studBody.innerHTML = '';

    const filtered = levelFilter === 'all' ? 
        studentsDB : 
        studentsDB.filter(s => s.level === levelFilter);

    filtered.forEach(s => {
        const levelLabel = (s.level || '').replace('-', ' ').toUpperCase();
        const row = `
            <tr>
                <td><strong>${s.roll}</strong></td>
                <td style="font-weight:600;">${s.name}</td>
                <td>${s.course}</td>
                <td><span class="badge badge-accent">${levelLabel}</span></td>
                <td>${s.phone}</td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color:var(--primary); border-color:var(--primary); padding: 4px 8px; font-size: 0.75rem;" onclick="deleteStudent('${s.roll}')">Delete</button>
                </td>
            </tr>
        `;
        studBody.insertAdjacentHTML('beforeend', row);
    });
}

// Deletion Actions
function deleteStudent(roll) {
    if (confirm("Are you sure you want to permanently delete this student record and their associated invoice?")) {
        studentsDB = studentsDB.filter(s => s.roll !== roll);
        feesDB = feesDB.filter(f => f.roll !== roll);
        saveData();
        refreshAdminConsoles();
        showToast("Student record and invoices deleted successfully.", "success");
    }
}

function deleteEnquiry(phone) {
    if (confirm("Are you sure you want to delete this enquiry lead?")) {
        enquiriesDB = enquiriesDB.filter(e => e.phone !== phone);
        saveData();
        refreshAdminConsoles();
        showToast("Enquiry record deleted.", "success");
    }
}

function filterStudents(val) {
    renderStudentsTable(val);
}

function filterStudentsTable() {
    const val = document.getElementById('gradeFilterSelect').value;
    renderStudentsTable(val);
}

// Action: Direct Manual Fee Entry
function recordDirectPayment(roll) {
    const feeItem = feesDB.find(f => f.roll === roll);
    if (feeItem) {
        feeItem.status = 'Paid';
        saveData();
        refreshAdminConsoles();
        showToast(`Payment recorded for ${feeItem.name}. Invoice cleared!`, 'success');
    }
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

    document.getElementById('recNo').innerText = 'MNK/REC/' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('recDate').innerText = dateStr;
    document.getElementById('recRoll').innerText = student.roll;
    document.getElementById('recName').innerText = student.name;
    document.getElementById('recPhone').innerText = student.phone;
    document.getElementById('recCourse').innerText = student.course;
    document.getElementById('recLevel').innerText = (student.level || '').replace('-', ' ').toUpperCase();
    document.getElementById('recClasses').innerText = `2 Classes / week`;
    document.getElementById('recAmount').innerText = `₹${fee.amount.toLocaleString('en-IN')}.00`;
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

// Admin Form Modals triggers
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

function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('active-modal');
}
function closeAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('active-modal');
}
function handleAddStudentSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('studName').value;
    const course = document.getElementById('studCourse').value;
    const level = document.getElementById('studLevel').value;
    const phone = document.getElementById('studPhone').value;

    const roll = 'MNK-26-' + Math.floor(100 + Math.random() * 900);
    studentsDB.push({ roll, name, course, level, phone });
    
    // Also add to fee tracking
    let amount = 1500; // default average
    if (level === 'grade-6-8') amount = 2500;
    feesDB.push({ roll, name, course, amount, status: 'Pending' });

    saveData();
    refreshAdminConsoles();
    closeAddStudentModal();
    document.getElementById('addStudentForm').reset();
    showToast(`Added student ${name} with Roll No ${roll}`, 'success');
}

// --- Map Modals & View Modals ---
function openMapModal(title, address) {
    document.getElementById('mapModalTitle').innerText = title;
    document.getElementById('mapModalAddress').innerText = address;
    document.getElementById('mapModal').classList.add('active-modal');
}
function closeMapModal() {
    document.getElementById('mapModal').classList.remove('active-modal');
}

// Image Lightbox
function openImageModal(src, desc) {
    document.getElementById('imageModalSrc').src = src;
    document.getElementById('imageModalDesc').innerText = desc;
    document.getElementById('imageModal').classList.add('active-modal');
}
function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active-modal');
}

// --- Gallery category filtering ---
function filterGallery(category) {
    const items = document.querySelectorAll('#galleryGrid .gallery-item');
    const buttons = document.querySelectorAll('.gallery-filters button');
    
    buttons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes(category) || (category === 'all' && btn.innerText.includes('All'))) {
            btn.classList.add('active-filter');
        } else {
            btn.classList.remove('active-filter');
        }
    });

    items.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (category === 'all' || itemCat === category || (category === 'dance' && itemCat === 'milestones')) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// --- Syllabus Practice Quiz Implementation ---
const quizData = [
    {
        q: "What is the primary terminology for classical dance steps / footwork units in Bharatanatyam?",
        a: ["Alarippu", "Adavus", "Abhinaya", "Mudras"],
        c: 1
    },
    {
        q: "Which university is Mayuri Natya Khetram affiliated with in Coimbatore?",
        a: ["Bharathiar University", "Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University", "Madras University", "Annamalai University"],
        c: 1
    },
    {
        q: "How many grade tiers make up the Carnatic Music syllabus assessment under Bridge Academy?",
        a: ["3 Grades", "5 Grades", "8 Grades", "10 Grades"],
        c: 2
    },
    {
        q: "What is the graduation milestone called after 8+ years of training and masteries?",
        a: ["Salangai Poojai", "Arangetram", "Natya Samarpanam", "Margam"],
        c: 1
    },
    {
        q: "Who is the Founder and Principal Guru of Mayuri Natya Khetram?",
        a: ["Guru Shri Muralikrishna", "Venkatesh Balakrishnan", "Guru Srimathi Mayuri Venkatesh", "Guru Sheela Unnikrishnan"],
        c: 2
    }
];

let currentQuestionIndex = 0;
let quizScore = 0;
let userHasSelected = false;

function startQuiz() {
    document.getElementById('quizWelcome').classList.remove('active-quiz-state');
    document.getElementById('quizQuestionView').classList.add('active-quiz-state');
    document.getElementById('quizResultView').classList.remove('active-quiz-state');
    
    currentQuestionIndex = 0;
    quizScore = 0;
    loadQuestion();
}

function loadQuestion() {
    userHasSelected = false;
    document.getElementById('quizNextBtn').disabled = true;
    document.getElementById('quizStatusText').innerText = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    
    const data = quizData[currentQuestionIndex];
    document.getElementById('quizQuestionText').innerText = data.q;
    
    // Progress fill
    const progressPercent = ((currentQuestionIndex) / quizData.length) * 100;
    document.getElementById('quizProgressFill').style.width = `${progressPercent}%`;

    const answersContainer = document.getElementById('quizAnswersContainer');
    answersContainer.innerHTML = '';

    data.a.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.innerText = opt;
        div.onclick = () => selectOption(div, idx);
        answersContainer.appendChild(div);
    });
}

function selectOption(element, index) {
    if (userHasSelected) return; // Allow only single selection
    userHasSelected = true;
    
    const correctIndex = quizData[currentQuestionIndex].c;
    const options = document.querySelectorAll('.quiz-option');
    
    if (index === correctIndex) {
        element.classList.add('correct');
        quizScore++;
        showToast('Correct Answer!', 'success');
    } else {
        element.classList.add('incorrect');
        options[correctIndex].classList.add('correct'); // Highlight correct option
        showToast('Incorrect answer.', 'error');
    }
    
    document.getElementById('quizNextBtn').disabled = false;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    document.getElementById('quizQuestionView').classList.remove('active-quiz-state');
    document.getElementById('quizResultView').classList.add('active-quiz-state');
    
    document.getElementById('quizScoreText').innerText = `${quizScore} out of ${quizData.length}`;
    
    const badge = document.getElementById('quizGradeBadge');
    if (quizScore === 5) {
        badge.innerText = "OUTSTANDING (Grade A+)";
        badge.style.backgroundColor = "#28a745";
    } else if (quizScore >= 3) {
        badge.innerText = "PASS WITH MERIT (Grade B)";
        badge.style.backgroundColor = "var(--accent)";
        badge.style.color = "var(--primary-dark)";
    } else {
        badge.innerText = "PRACTICE REQUIRED";
        badge.style.backgroundColor = "var(--primary)";
        badge.style.color = "white";
    }
}

function resetQuiz() {
    document.getElementById('quizResultView').classList.remove('active-quiz-state');
    document.getElementById('quizWelcome').classList.add('active-quiz-state');
}



function renderWebsiteContent() {
    const content = getWebContent();
    
    // Set text contents
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || '';
    };
    
    const setHTML = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = val || '';
    };

    const setImg = (id, src) => {
        const el = document.getElementById(id);
        if (el) el.src = src || '';
    };

    // Paint Text Elements
    setText('headerAcademyName', content.academyName);
    setText('footerAcademyName', content.academyName);
    setText('headerTagline', content.tagline);
    setText('footerTagline', `"${content.tagline}"`);
    
    setHTML('heroTitle', content.heroTitle);
    setText('heroTagline', content.heroTagline);
    
    setText('aboutSubtitle', content.aboutSubtitle);
    setText('aboutDesc1', content.aboutDesc1);
    setText('aboutDesc2', content.aboutDesc2);
    
    setText('examTitle', content.examTitle);
    setText('examDesc', content.examDesc);

    // Paint Images
    setImg('headerLogo', content.logoPath);
    setImg('footerLogo', content.logoPath);
    setImg('aboutHeroImg', content.aboutHeroImg);
    setImg('founderImg', content.founderImg);
    setImg('cofounderImg', content.cofounderImg);

    // Paint Hero Background Image
    const hero = document.getElementById('heroSection');
    if (hero) {
        hero.style.background = `linear-gradient(135deg, rgba(74, 8, 20, 0.9), rgba(107, 14, 32, 0.7)), url('${content.heroBg}')`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center 20%';
    }

    // Paint Gallery items dynamically
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        galleryGrid.innerHTML = '';
        // Use stored items; filter and fall back to defaults if empty, missing, or invalid
        let storedItems = content.galleryItems;
        if (Array.isArray(storedItems)) {
            storedItems = storedItems.filter(item => item && typeof item === 'object' && item.src && item.caption);
        }
        const items = (Array.isArray(storedItems) && storedItems.length > 0)
            ? storedItems
            : DEFAULT_CMS_CONTENT.galleryItems;


        items.forEach(item => {
            if (!item || !item.src) return;
            const el = document.createElement('div');
            el.className = 'gallery-item';
            el.setAttribute('data-category', item.category || 'dance');
            el.onclick = () => openImageModal(item.src, item.description || item.caption);
            
            el.innerHTML = `
                <img src="${item.src}" alt="${item.caption || ''}" loading="lazy" onerror="this.style.display='none'">
                <div class="gallery-item-info">
                    <h4>${item.caption || ''}</h4>
                    <p>${item.sub || ''}</p>
                </div>
            `;
            galleryGrid.appendChild(el);
        });
    }

    // --- Paint Course page texts ---
    setText('offerTitle', content.offerTitle);
    setText('offerDesc', content.offerDesc);

    // --- Paint Admissions guidelines & helpline ---
    setText('admissionTitle', content.admissionTitle);
    setText('admissionGuidelineTitle', content.admissionGuidelineTitle);
    setText('admissionDesc1', content.admissionDesc1);
    setText('admissionDesc2', content.admissionDesc2);
    setText('admissionHelplineText', content.admissionHelplineText);

    // --- Paint Contact & Branch details ---
    setText('branch1Title', content.branch1Title);
    setText('branch1Address', content.branch1Address);
    setText('branch1Phone', `📞 ${content.contactPhone1}`);
    
    setText('branch2Title', content.branch2Title);
    setText('branch2Address', content.branch2Address);
    setText('branch2Phone', `📞 ${content.contactPhone2}`);

    // --- Paint Footer Branch cards ---
    setText('footerBranch1Title', content.branch1Title);
    setText('footerBranch1Address', content.branch1Address);
    setText('footerBranch1Phone', `📞 ${content.contactPhone1}`);
    
    setText('footerBranch2Title', content.branch2Title);
    setText('footerBranch2Address', content.branch2Address);
    setText('footerBranch2Phone', `📞 ${content.contactPhone2}`);

    // --- Paint Floating WhatsApp button link ---
    const wa = document.getElementById('whatsappFloatLink');
    if (wa) {
        const cleanPhone = (content.contactPhone1 || '8675539678').replace(/\s+/g, '');
        wa.href = `https://wa.me/91${cleanPhone}?text=I%20am%20interested%20in%20admissions%20at%20Mayuri%20Natya%20Khetram`;
    }

    // Refresh live fee display if admissions calculator is visible
    if (document.getElementById('admLevel')) {
        calculateAdmissionFees();
    }
}

// Trigger initial rendering on startup
renderWebsiteContent();
syncFromSupabasePublic();
