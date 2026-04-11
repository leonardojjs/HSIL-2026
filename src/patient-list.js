import Papa from 'papaparse';

const CSV_PATH = '../src/assets/subject-info (1).csv';

async function initPatientList() {
    try {
        const response = await fetch(CSV_PATH);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                renderTable(results.data);
                setupSearch(results.data);
                document.getElementById('subject-count').innerText = results.data.length;
            }
        });
    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('patient-table-body');
    tableBody.innerHTML = '';

    data.forEach(p => {
        const isNormal = p['Trial Classification']?.toLowerCase().includes('normal');
        
        const row = document.createElement('tr');
        row.className = "hover:bg-white/40 transition-all group cursor-pointer";
        row.innerHTML = `
            <td class="p-6 text-zinc-400 font-bold text-xs">#${p['Subject Number']}</td>
            <td class="p-6 font-bold text-zinc-900">${p['name']}</td>
            <td class="p-6 text-xs text-zinc-500">
                ${p['Sex (M/F)']} • ${p['Age [years]']}Y • ${p['Height [cm]']}cm
            </td>
            <td class="p-6">
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full ${isNormal ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                    <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Analyzed</span>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function setupSearch(data) {
    const searchInput = document.getElementById('patient-search');
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = data.filter(p => 
            p['name']?.toLowerCase().includes(val) || 
            p['Subject Number']?.toString().includes(val)
        );
        renderTable(filtered);
    });
}

window.addEventListener('DOMContentLoaded', initPatientList);