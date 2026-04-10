import './style.css'

// --- UI Logic ---
document.getElementById('menu-toggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));

// --- REALISTIC BREATHING DATA GENERATOR (Non-Sinusoidal) ---
let timeTick = 0;
let isCancer = false; // Flag to determine breathing pattern
const baseline = 3000; // Functional Residual Capacity (FRC) average (~3L)

// Function to smooth the curve (easing)
const ease = (t) => (1 - Math.cos(t * Math.PI)) / 2;

function getBreathingVolume() {
    timeTick++;
    let vol = baseline;
    
    // Adding subtle natural noise (sensor/breathing vibration)
    const noise = (Math.random() - 0.5) * 40; 

    if (isCancer) {
        // CANCER PATTERN: Fast, shallow, no deep breath (Restrictive Pattern)
        // 1 Cycle takes 90 ticks (Faster breathing rate)
        const cycle = timeTick % 90; 
        
        if (cycle < 30) {
            // Shallow inspiration
            vol = baseline + 300 * ease(cycle / 30);
        } else if (cycle < 70) {
            // Slow expiration
            vol = baseline + 300 * ease(1 - ((cycle - 30) / 40));
        } else {
            // Short resting pause
            vol = baseline;
        }
    } else {
        // NORMAL PATTERN: 2 Normal -> 1 Deep Breath (IRV) -> Long Expiration (ERV)
        // 1 Cycle takes 350 ticks (Long and rhythmic)
        const cycle = timeTick % 350; 
        
        if (cycle < 40) {
            // Normal Breath 1 (Inhale)
            vol = baseline + 500 * ease(cycle / 40);
        } else if (cycle < 100) {
            // Normal Breath 1 (Exhale)
            vol = baseline + 500 * ease(1 - ((cycle - 40) / 60));
        } else if (cycle < 140) {
            // Normal Breath 2 (Inhale)
            vol = baseline + 500 * ease((cycle - 100) / 40);
        } else if (cycle < 200) {
            // Normal Breath 2 (Exhale)
            vol = baseline + 500 * ease(1 - ((cycle - 140) / 60));
        } else if (cycle < 260) {
            // DEEP INSPIRATION (Inspiratory Reserve Volume)
            vol = baseline + 2500 * ease((cycle - 200) / 60);
        } else {
            // LONG EXPIRATION (Expiratory Reserve Volume + Return to normal)
            const phase = (cycle - 260) / 90; // 0 to 1
            if (phase < 0.6) {
                // Drop below normal baseline (Full exhale)
                vol = (baseline - 800) + (3300) * ease(1 - (phase / 0.6));
            } else {
                // Slowly return to baseline
                vol = (baseline - 800) + 800 * ease((phase - 0.6) / 0.4);
            }
        }
    }
    return vol + noise;
}

// --- CHART.JS INITIALIZATION ---
const ctx = document.getElementById('tidalChart').getContext('2d');
const numPoints = 150; // Widen X-axis view to show full cycles

const tidalChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(numPoints).fill(''), 
        datasets: [{
            label: 'Volume (mL)',
            borderColor: '#0f9d58', 
            backgroundColor: 'rgba(15, 157, 88, 0.1)',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.4, // Make curve flow smoothly
            fill: true,
            data: Array(numPoints).fill(baseline) 
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            // Y-Axis: Volume
            y: { 
                min: 1500, max: 6000, 
                title: { display: true, text: 'Lung Volume (mL)', color: '#5f6368', font: { weight: 'bold' } },
                grid: { color: '#e0e0e0' }
            },
            // X-Axis: Time
            x: { 
                display: true, 
                title: { display: true, text: 'Time (Continuous Monitoring)', color: '#5f6368', font: { style: 'italic' } },
                grid: { display: false },
                ticks: { display: false } // Hide numbers to mimic real-time oscilloscope
            }
        },
        plugins: { legend: { display: false } }
    }
});

// Animation loop (20x per second)
setInterval(() => {
    tidalChart.data.datasets[0].data.push(getBreathingVolume());
    tidalChart.data.datasets[0].data.shift();
    tidalChart.update();
}, 50);

// --- PATIENT SWITCHING LOGIC ---
const patientData = {
    "patient1": {
        ctImage: "Normal case.png", 
        eitImage: "vereit_live_monitoring.gif", 
        statusHtml: '<span style="color: #0f9d58; font-weight: bold;">Normal Ventilation</span>',
        indication: "Healthy Lungs",
        location: "N/A",
        conductivity: "1.2 S/m",
        welcomeMsg: "Hello Dr. Valerie Josephine Dirjayanto. Bed 01 shows normal spatiotemporal distribution. No anomalies detected.",
        color: '#0f9d58', // Normal Green
        bgColor: 'rgba(15, 157, 88, 0.1)',
        cancerFlag: false
    },
    "patient2": {
        ctImage: "Malignant case.jpg", 
        eitImage: "vereit_live_monitoring.gif", 
        statusHtml: '<span style="color: #d93025; font-weight: bold;">Malignancy Detected</span>',
        indication: "Suspected Lung Carcinoma",
        location: "Left Lung",
        conductivity: "3.8 S/m",
        welcomeMsg: "Hello Dr. Valerie Josephine Dirjayanto. I have detected a highly conductive anomaly in the left lung for Bed 02, indicative of a malignant mass.",
        color: '#d93025', // Danger Red
        bgColor: 'rgba(217, 48, 37, 0.1)',
        cancerFlag: true
    }
};

const patientDropdown = document.getElementById('patient-dropdown');
const analysisList = document.getElementById('analysis-list');
const welcomeMessage = document.getElementById('welcome-message');

patientDropdown.addEventListener('change', function() {
    const selected = patientData[this.value];
    
    document.getElementById('ct-img').src = selected.ctImage;
    document.getElementById('eit-img').src = selected.eitImage;
    
    analysisList.innerHTML = `
        <li><strong>Status:</strong> ${selected.statusHtml}</li>
        <li><strong>Indication:</strong> ${selected.indication}</li>
        <li><strong>Location:</strong> ${selected.location}</li>
        <li><strong>Max Conductivity:</strong> ${selected.conductivity}</li>
    `;
    welcomeMessage.innerText = selected.welcomeMsg;
    
    // Update Graph Color & Breathing Pattern
    isCancer = selected.cancerFlag;
    tidalChart.data.datasets[0].borderColor = selected.color;
    tidalChart.data.datasets[0].backgroundColor = selected.bgColor;
    
    const chatHistory = document.getElementById('chat-history');
    chatHistory.innerHTML = ''; 
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'ai-message');
    msgDiv.innerText = selected.welcomeMsg;
    chatHistory.appendChild(msgDiv);
});

// --- Gemini Chatbot Logic ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, isUser) {
    const chatHistory = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isUser ? 'user-message' : 'ai-message');
    msgDiv.innerText = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function fetchGeminiResponse(userPrompt) {
    if (!GEMINI_API_KEY) return "API Key has not been entered.";
    const currentPatientName = patientDropdown.options[patientDropdown.selectedIndex].text;
    const systemContext = `You are VerEIT AI, a smart medical assistant in the ICU. Your task is to help doctors analyze EIT results. You are currently discussing ${currentPatientName}.`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemContext + "\n\nDoctor's Question: " + userPrompt }] }]
            })
        });
        const data = await response.json();
        if (!response.ok) return `Error: ${data.error.message}`;
        return data.candidates && data.candidates[0].content.parts[0].text ? data.candidates[0].content.parts[0].text : "Sorry, the response format is empty.";
    } catch (error) { return "Failed to contact the server."; }
}

sendBtn.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage(text, true);
    chatInput.value = '';

    const chatHistory = document.getElementById('chat-history');
    const loadingId = "loading-" + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = loadingId;
    msgDiv.classList.add('message', 'ai-message');
    msgDiv.innerText = "Analyzing data...";
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const aiResponse = await fetchGeminiResponse(text);
    document.getElementById(loadingId).remove();
    appendMessage(aiResponse, false);
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});