import './style.css'

// --- 1. STATE & GLOBAL VARIABLES ---
let timeTick = 0;
let isCancer = false; 
const baseline = 3000; 
const numPoints = 150;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

// --- 2. DATA PASIEN ---
const patientData = {
    "patient1": {
        name: "Putri Pratama",
        ctImage: "Normal case.png", 
        eitImage: "vereit_live_monitoring.gif", 
        statusHtml: '<span style="color: #0f9d58; font-weight: bold;">Normal Ventilation</span>',
        indication: "Healthy Lungs",
        location: "N/A",
        conductivity: "1.2 S/m",
        color: '#0f9d58',
        bgColor: 'rgba(15, 157, 88, 0.1)',
        cancerFlag: false
    },
    "patient2": {
        name: "Maya Ramadhan",
        ctImage: "Malignant case.jpg", 
        eitImage: "vereit_cancer.gif", 
        statusHtml: '<span style="color: #d93025; font-weight: bold;">Abnormality Detected</span>',
        indication: "Asthmatic / Malignant mass",
        location: "Left Inferior Lobe",
        conductivity: "3.8 S/m",
        color: '#d93025',
        bgColor: 'rgba(217, 48, 37, 0.1)',
        cancerFlag: true
    }
};

// --- 3. UI HELPER: APPEND CHAT ---
function appendChatMessage(text, isUser) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `p-4 rounded-2xl mb-3 text-sm leading-relaxed transition-all shadow-sm ${
        isUser 
        ? 'bg-violet-600 text-white ml-12 self-end' 
        : 'bg-white/30 border border-white/20 text-zinc-700 mr-12'
    }`;

    if (isUser) {
        msgDiv.innerText = text;
    } else {
        msgDiv.innerHTML = `<span class="text-violet-600 font-bold uppercase text-[10px] block mb-1">VerEIT AI Analysis:</span>${text}`;
    }

    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// --- 4. BREATHING DATA GENERATOR ---
const ease = (t) => (1 - Math.cos(t * Math.PI)) / 2;

function getBreathingVolume() {
    timeTick++;
    let vol = baseline;
    const noise = (Math.random() - 0.5) * 40; 

    if (isCancer) {
        // Pola Pernapasan Pasien Sakit (Cepat & Dangkal)
        const cycle = timeTick % 90; 
        if (cycle < 30) vol = baseline + 300 * ease(cycle / 30);
        else if (cycle < 70) vol = baseline + 300 * ease(1 - ((cycle - 30) / 40));
    } else {
        // Pola Pernapasan Normal (Dalam & Ritmis)
        const cycle = timeTick % 350; 
        if (cycle < 40) vol = baseline + 500 * ease(cycle / 40);
        else if (cycle < 100) vol = baseline + 500 * ease(1 - ((cycle - 40) / 60));
        else if (cycle < 140) vol = baseline + 500 * ease((cycle - 100) / 40);
        else if (cycle < 200) vol = baseline + 500 * ease(1 - ((cycle - 140) / 60));
        else if (cycle < 260) vol = baseline + 2500 * ease((cycle - 200) / 60);
        else {
            const phase = (cycle - 260) / 90;
            vol = phase < 0.6 ? (baseline - 800) + (3300) * ease(1 - (phase / 0.6)) : (baseline - 800) + 800 * ease((phase - 0.6) / 0.4);
        }
    }
    return vol + noise;
}

// --- 5. AI LOGIC (GEMINI API) ---
async function fetchGeminiResponse(userPrompt) {
    if (!GEMINI_API_KEY) {
        console.error("API Key is missing!");
        return "Error: API Key tidak ditemukan di file .env.";
    }

    const dropdown = document.getElementById('patient-dropdown');
    const patientName = dropdown ? dropdown.options[dropdown.selectedIndex].text : "Unknown";

    const modelName = "gemini-2.5-flash"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `You are VerEIT AI, a medical assistant. Current patient: ${patientName}. Answer briefly: ${userPrompt}` 
                    }] 
                }]
            })
        });

        const data = await response.json();

        // Jika model 1.5-flash gagal, berikan info spesifik
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            if (data.error.status === "NOT_FOUND") {
                return "AI Error: Model tidak ditemukan. Coba ganti model ke 'gemini-pro' di kode JavaScript.";
            }
            return `AI Error: ${data.error.message}`;
        }

        return data.candidates[0].content.parts[0].text;
    } catch (e) { 
        console.error("Network Error:", e);
        return "Gagal terhubung ke AI. Periksa koneksi internet."; 
    }
}

// --- 6. DASHBOARD SWITCHING LOGIC ---
function updatePatientDashboard(key) {
    const selected = patientData[key];
    if (!selected) return;

    // Update Analysis List
    const analysisList = document.getElementById('analysis-list');
    if (analysisList) {
        analysisList.innerHTML = `
            <li class="p-4 rounded-2xl bg-white/40 border border-white/40 flex justify-between items-center">
                <span class="text-[10px] font-bold text-zinc-400 uppercase">Status</span>
                <span class="text-xs">${selected.statusHtml}</span>
            </li>
            <li class="p-4 rounded-2xl border border-white/20 flex justify-between items-center">
                <span class="text-[10px] font-bold text-zinc-400 uppercase">Indication</span>
                <span class="text-xs font-bold">${selected.indication}</span>
            </li>
            <li class="p-4 rounded-2xl border border-white/20 flex justify-between items-center">
                <span class="text-[10px] font-bold text-zinc-400 uppercase">Location</span>
                <span class="text-xs font-bold">${selected.location}</span>
            </li>
            <li class="p-4 rounded-2xl border border-white/20 flex justify-between items-center">
                <span class="text-[10px] font-bold text-zinc-400 uppercase">Max Conductivity</span>
                <span class="text-xs font-bold text-violet-600">${selected.conductivity}</span>
            </li>
        `;
    }

    document.getElementById('ct-img').src = `../src/assets/${selected.ctImage}`;
    document.getElementById('eit-img').src = `../src/assets/${selected.eitImage}`;

    // Update Chart Pattern & Style
    isCancer = selected.cancerFlag;
    if (window.tidalChart) { 
        window.tidalChart.data.datasets[0].borderColor = selected.color;
        window.tidalChart.data.datasets[0].backgroundColor = selected.bgColor;
        window.tidalChart.update('none');
    }
}

// --- 7. INITIALIZATION (DOM CONTENT LOADED) ---
window.addEventListener('DOMContentLoaded', () => {
    // 7.1. Initialize Chart
    const canvas = document.getElementById('tidalChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        window.tidalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(numPoints).fill(''), 
                datasets: [{
                    data: Array(numPoints).fill(baseline),
                    borderColor: '#0f9d58', 
                    backgroundColor: 'rgba(15, 157, 88, 0.1)',
                    borderWidth: 2.5, pointRadius: 0, tension: 0.4, fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { 
                    y: { min: 1500, max: 6500, display: false }, 
                    x: { display: false } 
                },
                plugins: { legend: { display: false } }
            }
        });

        // Loop Animasi Chart
        setInterval(() => {
            window.tidalChart.data.datasets[0].data.push(getBreathingVolume());
            window.tidalChart.data.datasets[0].data.shift();
            window.tidalChart.update('none');
        }, 50);
    }

    // 7.2. Initialize Chat Listeners
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');

    if (sendBtn && chatInput) {
        const handleSendMessage = async () => {
            const text = chatInput.value.trim();
            if (!text) return;

            // User Message
            appendChatMessage(text, true);
            chatInput.value = '';

            // AI Loading State
            const chatHistory = document.getElementById('chat-history');
            const loadingMsg = document.createElement('div');
            loadingMsg.className = "text-[10px] text-zinc-400 italic ml-4 mb-2 animate-pulse";
            loadingMsg.innerText = "VerEIT sedang menganalisis...";
            chatHistory.appendChild(loadingMsg);

            // Fetch AI Response
            const aiRes = await fetchGeminiResponse(text);
            loadingMsg.remove();
            
            // AI Message
            appendChatMessage(aiRes, false);
        };

        sendBtn.onclick = handleSendMessage;
        chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };
    }

    // 7.3. Initialize Dropdown Listener
    const dropdown = document.getElementById('patient-dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', (e) => updatePatientDashboard(e.target.value));
    }

    // 7.4. Initial Load
    updatePatientDashboard('patient1');
});