// ==========================================
// 1. INITIALIZATION & GLOBAL VARIABLES
// ==========================================
let taggedData = {}; 
let markerList = []; 
let graphData = {}; 
let currentChart = null; 
// --- NEW: Fixed the issue of information modal not closing ---
let currentlySelectedRow = null;
let currentlySelectedTitle = "";


// 1a. Define Map Styles
var standardMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_479m_1_94b6ec220ff7583ce7c9d4f7', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

var grayMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

// 1b. Initialize Map (Set standardMap as default map)
var map = L.map('map', {
    center: [1.3521, 103.8198],
    zoom: 12,
    layers: [standardMap] 
});

// 1c. Add the Switcher Control to the top right of the map
var baseMaps = {
    "Standard View": standardMap,
    "Grayscale (Best for Heatmaps)": grayMap,
};
L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

const typeMap = {
    'B&L': { text: 'Boring and Lifeless', cssClass: 'pin-bl' },
    'C&T': { text: 'Calm and Tranquil', cssClass: 'pin-ct' },
    'F&E': { text: 'Full of Life and Exciting', cssClass: 'pin-fe' },
    'C&R': { text: 'Chaotic and Restless', cssClass: 'pin-cr' },
    '-':   { text: 'Unspecified', cssClass: 'pin-dash' }
};

// ==========================================
// 1.5 COLOR HELPERS FOR HEATMAPS
// ==========================================
function getSPLColor(spl) {
    if (isNaN(spl)) return null;
    if (spl >= 71) return 'rgba(255, 0, 0, 0.6)';      // #FF0000 (Red)
    if (spl >= 61) return 'rgba(255, 140, 0, 0.6)';    // #FF8C00 (Orange)
    if (spl >= 51) return 'rgba(255, 234, 0, 0.5)';    // #FFEA00 (Yellow)
    return 'rgba(50, 205, 50, 0.5)';                   // #32CD32 (Green)
}

function getPleasantnessColor(val) {
    if (isNaN(val)) return null;
    if (val >= 0.31) return 'rgba(160, 32, 240, 0.6)'; // #A020F0 (Purple)
    if (val >= 0.11) return 'rgba(51, 0, 255, 0.6)';   // #3300ff (Dark Blue)
    if (val >= 0.01) return 'rgba(0, 116, 255, 0.6)';  // #0074ff (Blue)
    if (val >= -0.1) return 'rgba(0, 156, 251, 0.6)';  // #009cfb (Light Blue)
    return 'rgba(37, 243, 150, 0.6)';                  // #25f396 (Greenish)
}

function getEventfulnessColor(val) {
    if (isNaN(val)) return null;
    if (val >= 0.31) return 'rgba(251, 221, 73, 0.6)'; // #FBDD49 (Yellow)
    if (val >= 0.11) return 'rgba(255, 129, 3, 0.6)';  // #FF8103 (Orange)
    if (val >= 0.01) return 'rgba(255, 28, 106, 0.6)'; // #FF1C6A (Pink/Red)
    if (val >= -0.1) return 'rgba(226, 0, 163, 0.6)';  // #E200A3 (Magenta)
    if (val >= -0.29) return 'rgba(155, 4, 219, 0.6)'; // #9B04DB (Purple)
    return 'rgba(109, 29, 198, 0.6)';                  // #6D1DC6 (Deep Purple)
}
function getLoudnessColor(val) {
    if (isNaN(val)) return null;
    if (val >= 50) return 'rgba(255, 0, 0, 0.6)';      // #FF0000 (Red)
    if (val >= 35) return 'rgba(255, 140, 0, 0.6)';    // #FF8C00 (Orange)
    if (val >= 20) return 'rgba(255, 234, 0, 0.5)';    // #FFEA00 (Yellow)
    if (val >= 10) return 'rgba(50, 205, 50, 0.5)';    // #32CD32 (Green)
    return 'rgba(0, 116, 255, 0.6)'                    // #0074ff (Blue)
}

function getSharpnessColor(val) {
    if (isNaN(val)) return null;
    if (val >= 1.9) return 'rgba(222, 51, 36, 0.6)';   // #de3324 (Red)
    if (val >= 1.6) return 'rgba(141, 30, 91, 0.6)';   // #8d1e5b (Purple Red)
    if (val >= 1.3) return 'rgba(89, 21, 151, 0.6)';   // #591597 (Purple)
    if (val >= 1.0) return 'rgba(52, 21, 204, 0.6)';   // #3415cc (Purple Blue) 
    return 'rgba(0, 156, 251, 0.6)';                   // #009cfb (Light Blue)
}

function getRoughnessColor(val) {
    if (isNaN(val)) return null;
    if (val >= 0.04) return 'rgb(255, 140, 0)';        // #ff8c00 Mustard 
    if (val >= 0.03) return 'rgb(151, 166, 7)';        // #97a607 Lime Green
    if (val >= 0.02) return 'rgb(44, 148, 142)';       // #2c948e Blue Green
    return 'rgb(96, 125, 139)';                        // #607d8b Blue Grey
}

// ==========================================
// 2. MODAL & DATA LOADING
// ==========================================
function closeModal() {
    const modal = document.getElementById('video-modal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.getElementById('video-player-container').innerHTML = '';
    
    // Reset the UI text to default
    document.getElementById('type-display').innerHTML = `
        <div style="font-size: 1.1em; color: #555; text-align: center; padding: 20px;">
            Select a location on the map to view its soundscape details.
        </div>   
        `;
    
    // --- NEW: Wipe the memory so checkboxes don't re-trigger it ---
    currentlySelectedRow = null;
    currentlySelectedTitle = "";
    
    // Destroy the chart if it exists to prevent ghost charts
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

document.getElementById('close-modal').onclick = closeModal;

Papa.parse("Databases/Tagged_30s.csv", {
    download: true, header: true, skipEmptyLines: true,
    complete: function(results) {
        results.data.forEach(row => {
            const id = row.Title ? row.Title.trim() : null;
            if (id) {
                if (!taggedData[id]) taggedData[id] = [];
                taggedData[id].push(row);
            }
        });
        
        Papa.parse("Databases/graphs.csv", {
            download: true, header: false, skipEmptyLines: true,
            complete: function(graphResults) {
                let currentLoc = null;
                let currentFreqs = null;
                for (let i = 0; i < graphResults.data.length; i++) {
                    const row = graphResults.data[i];
                    if (!row || row.length < 4) continue;
                    if (row[2] && row[2].trim() === 'Frequency (Hz)') {
                        currentLoc = (row[0] && row[0].trim() !== '') ? row[0].trim() : currentLoc;
                        currentFreqs = row.slice(3).map(val => val.trim()); 
                    } else if (row[2] && row[2].trim().startsWith('SPL')) {
                        const splType = row[2].trim();
                        const splValues = row.slice(3).map(Number);
                        if (currentLoc && currentFreqs) {
                            if (!graphData[currentLoc]) graphData[currentLoc] = {};
                            graphData[currentLoc][splType] = { x: currentFreqs, y: splValues };
                        }
                    }
                }
                loadLocations();
            }
        });
    }
});

// ==========================================
// 3. BUILD MARKERS & GRADIENT AURAS
// ==========================================
function loadLocations() {
    Papa.parse("Databases/locations.csv", {
        download: true, header: true, skipEmptyLines: true,
        complete: function(results) {
            results.data.forEach(function(row) {
                if (row.Latitude && row.Longitude) {
                    const title = row.Title ? row.Title.trim() : ""; 
                    const typeKey = row.Type ? row.Type.trim() : "-";
                    
                    // Parse values into strict naming
                    const spl = parseFloat(row['Sound Pressure Level (dB)']);
                    const isoPL = parseFloat(row['ISOPleasantness']);
                    const isoEV = parseFloat(row['ISOEventfulness']);
                    const loudness = parseFloat(row['Loudness (sone)']);
                    const sharpness = parseFloat(row['Sharpness (acum)']);
                    const roughness = parseFloat(row['Roughness (asper)']);

                    // Create Gradient Aura Container
                    let heatmapGlow = L.marker([parseFloat(row.Latitude), parseFloat(row.Longitude)], {
                        icon: L.divIcon({
                            className: 'blurred-heatmap',
                            iconSize: [120, 120],
                            iconAnchor: [60, 60]
                        }),
                        interactive: false,
                        pane: 'shadowPane' 
                    });

                    // Store raw data on the marker object with new naming
                    heatmapGlow.spl = spl;
                    heatmapGlow.isoPL = isoPL;
                    heatmapGlow.isoEV = isoEV;
                    heatmapGlow.loudness = loudness;
                    heatmapGlow.sharpness = sharpness;
                    heatmapGlow.roughness = roughness;
                    
                    // Standard Map Pin
                    var marker = L.marker([parseFloat(row.Latitude), parseFloat(row.Longitude)], {
                        icon: L.divIcon({
                            className: 'custom-pin ' + (typeMap[typeKey]?.cssClass || 'pin-dash'),
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        }),
                        zIndexOffset: 1000 
                    }).addTo(map);
                    
                    marker.category = typeKey; 
                    marker.title = title;
                    marker.heatmapCircle = heatmapGlow; 
                    markerList.push(marker);

                    marker.on('click', function() {
                        updateDisplay(row, title);
                        openVideoModal(row);
                    });
                }
            });
            
            initFilters();
            initSearch();
            initHeatmapToggle();
            initDynamicHeatmapScale();
        }
    });
}

// ==========================================
// 4. INTERACTIVE CONTROLS
// ==========================================
function applyHeatmaps() {
    const activeCategories = Array.from(document.querySelectorAll('.type-filter')).filter(c => c.checked).map(c => c.value);
    const activeToggle = Array.from(document.querySelectorAll('.heatmap-toggle')).find(t => t.checked);
    const activeMode = activeToggle ? activeToggle.value : null;

    // Apply colors to map
    markerList.forEach(marker => {
        const glow = marker.heatmapCircle;
        if (glow) {
            if (activeMode && activeCategories.includes(marker.category)) {
                let color = null;
                /// Check against all 6 modes
                if (activeMode === 'spl') color = getSPLColor(glow.spl);
                else if (activeMode === 'ISOPL') color = getPleasantnessColor(glow.isoPL);
                else if (activeMode === 'ISOEV') color = getEventfulnessColor(glow.isoEV);
                // --- NEW METRICS ---
                else if (activeMode === 'loudness') color = getLoudnessColor(glow.loudness);
                else if (activeMode === 'sharpness') color = getSharpnessColor(glow.sharpness);
                else if (activeMode === 'roughness') color = getRoughnessColor(glow.roughness);

                if (color) {
                    if (!map.hasLayer(glow)) map.addLayer(glow);
                    
                    if (glow.getElement()) {
                        glow.getElement().style.setProperty('--glow-color', color);
                    } else {
                        glow.once('add', function() {
                            this.getElement().style.setProperty('--glow-color', color);
                        });
                    }
                } else {
                    if (map.hasLayer(glow)) map.removeLayer(glow);
                }
            } else {
                if (map.hasLayer(glow)) map.removeLayer(glow);
            }
        }
    });
}

function initFilters() {
    const checkboxes = document.querySelectorAll('.type-filter');
    checkboxes.forEach(box => {
        box.addEventListener('change', function() {
            const active = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
            markerList.forEach(marker => {
                if (active.includes(marker.category)) {
                    if (!map.hasLayer(marker)) map.addLayer(marker);
                } else {
                    if (map.hasLayer(marker)) map.removeLayer(marker);
                }
            });
            applyHeatmaps();
        });
    });
}

function initHeatmapToggle() {
    const toggles = document.querySelectorAll('.heatmap-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            
            // 1. Force "One at a time" (Uncheck all others)
            if (this.checked) {
                toggles.forEach(t => {
                    if (t !== this) t.checked = false;
                });
            }
            
            // 2. Change the map glow colors
            applyHeatmaps();
            
            // 3. Instantly repaint the modal with the new highlight
            if (currentlySelectedRow !== null) {
                updateDisplay(currentlySelectedRow, currentlySelectedTitle);
            }
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('location-search');
    const suggestionsBox = document.getElementById('search-suggestions');
    if(!searchInput || !suggestionsBox) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        suggestionsBox.innerHTML = ''; 
        if (!query) { suggestionsBox.style.display = 'none'; return; }
        const matches = markerList.filter(marker => marker.title.toLowerCase().includes(query));
        if (matches.length > 0) {
            suggestionsBox.style.display = 'block';
            matches.forEach(match => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                const regex = new RegExp(`(${query})`, "gi");
                div.innerHTML = match.title.replace(regex, "<strong>$1</strong>");
                div.onclick = () => {
                    searchInput.value = match.title;
                    suggestionsBox.style.display = 'none';
                    map.flyTo(match.getLatLng(), 15, { animate: true, duration: 1.5 });
                    match.fire('click'); 
                };
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.style.display = 'block';
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999; cursor:default;">No locations found</div>';
        }
    });
}

// ==========================================
// 5. DYNAMIC SCALING 
// ==========================================
function initDynamicHeatmapScale() {
    function updateHeatmapSizes() {
        const zoom = map.getZoom();
        let newSize = Math.max(40, 120 - (zoom - 12) * 10);
        
        markerList.forEach(marker => {
            if (marker.heatmapCircle) {
                const el = marker.heatmapCircle.getElement();
                if (el) {
                    el.style.width = newSize + 'px';
                    el.style.height = newSize + 'px';
                    el.style.marginLeft = -(newSize / 2) + 'px';
                    el.style.marginTop = -(newSize / 2) + 'px';
                    el.style.opacity = zoom >= 15 ? "0.8" : "0.6";
                }
            }
        });
    }
    updateHeatmapSizes();
    map.on('zoom', updateHeatmapSizes);
}

// ==========================================
// 6. UI UPDATE
// ==========================================
function updateDisplay(row, title) {
    // --- NEW: Save to memory ---
    currentlySelectedRow = row;
    currentlySelectedTitle = title;
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    const displayEl = document.getElementById('type-display');
    const timeEntries = taggedData[title] || [];
    let html = `<div>Location: <strong>${title}</strong> | `;
    // --- NEW: Find out which heatmap is currently active ---
    const activeToggle = Array.from(document.querySelectorAll('.heatmap-toggle')).find(t => t.checked);
    const activeMode = activeToggle ? activeToggle.value : null;
    
    
    if (timeEntries.length === 0) {
        html += `<span style="color:#888; font-size:0.9em;">No tagged data available</span>`;
    } else {
        html += `<label style="margin-right: 5px;">Select Time: </label>`;
        html += `<select id="time-selector">`;
        timeEntries.forEach((entry, index) => {
            html += `<option value="${index}">${entry.time_lapsed_min || entry.Time_lapsed} mins</option>`;
        });
        html += `</select><span id="dynamic-badge"></span>`;
    }
    html += `</div>`;
    
    let detailsHTML = '';
    const fields = [
        { key: 'Sound Pressure Level (dB)', label: 'SPL (dBA)', mode: 'spl', colorFn: getSPLColor },
        { key: 'ISOPleasantness', label: 'ISO Pleasantness', mode: 'ISOPL', colorFn: getPleasantnessColor },
        { key: 'ISOEventfulness', label: 'ISO Eventfulness', mode: 'ISOEV', colorFn: getEventfulnessColor },
        { key: 'Loudness (sone)', label: 'Loudness (sone)', mode: 'loudness', colorFn: getLoudnessColor },
        { key: 'Sharpness (acum)', label: 'Sharpness (acum)', mode: 'sharpness', colorFn: getSharpnessColor },
        { key: 'Roughness (asper)', label: 'Roughness (asper)', mode: 'roughness', colorFn: getRoughnessColor },
        // These fields do not have heatmaps, so they don't need a mode or colorFn
        { key: 'Sound Pressure Level (dBC)', label: 'SPL (dBC)' },
        { key: 'Sound Pressure Level (dBZ)', label: 'SPL (dBZ)' },
        { key: 'Tonality (tu)', label: 'Tonality (tu)' },
        { key: 'Fluctuation Strength (vasil)', label: 'Fluctuation Strength (vasil)' }
    ];

    const cleanRow = {};
    for (let k in row) { if (row.hasOwnProperty(k)) cleanRow[k.trim()] = row[k]; }

    fields.forEach(field => {
        const val = cleanRow[field.key];
        if (val && val.toString().trim() !== '') {
            let bgColor = 'transparent';
            
            // If the current field matches the actively selected heatmap...
            if (activeMode && field.mode === activeMode && field.colorFn) {
                // Calculate what color the map pin is using right now
                const color = field.colorFn(parseFloat(val));
                if (color) bgColor = color;
            }

            // Apply the background color highlight to the ENTIRE row
            if (bgColor !== 'transparent') {
                detailsHTML += `<p style="background-color: ${bgColor}; padding: 8px 12px; border-radius: 8px; color: #111; margin: 6px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);"><strong>${field.label}:</strong> <span style="font-weight: 700;">${val.trim()}</span></p>`;
            } else {
                // Standard un-highlighted row
                detailsHTML += `<p style="padding: 4px 12px; margin: 4px 0;"><strong>${field.label}:</strong> ${val.trim()}</p>`;
            }
        }
    });
    
    html += `<div id="details-container" style="display: ${detailsHTML ? 'flex' : 'none'};">${detailsHTML}</div>`;

    const locId = cleanRow['lcs_id'];
    if (locId && locId >= 'S0063' && locId <= 'S0075') {
        html += `
        <div id="graph-section" style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; width: 100%;">
            <label style="font-weight: bold; font-size: 0.9em; margin-right: 10px;">Select 1/3 Octave Spectrum: </label>
            <select id="graph-selector" style="padding: 6px; border-radius: 6px; border: 1px solid #C5A059; margin-bottom: 20px;"></select>
            
            <div id="chart-container" style="width: 100%; max-width: 650px; margin: 0 auto; background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #eee;">
                <canvas id="spl-chart"></canvas>
            </div>
        </div>`;
    }

    displayEl.innerHTML = html;

    if (timeEntries.length > 0) {
        const selector = document.getElementById('time-selector');
        const badge = document.getElementById('dynamic-badge');
        const refreshBadge = () => {
            const entry = timeEntries[selector.value];
            if (entry && entry.Type) {
                const cat = typeMap[entry.Type.trim()] || typeMap['-'];
                badge.className = 'type-badge ' + cat.cssClass;
                badge.innerText = cat.text;
            }
        };
        selector.addEventListener('change', refreshBadge);
        refreshBadge();
    }

    if (locId && locId >= 'S0063' && locId <= 'S0075') {
        const graphSelect = document.getElementById('graph-selector');
        const locGraphs = graphData[locId];
        if (locGraphs) {
            Object.keys(locGraphs).forEach(type => {
                const opt = document.createElement('option');
                opt.value = type; opt.innerText = type;
                graphSelect.appendChild(opt);
            });
            renderGraph(locId, Object.keys(locGraphs)[0]);
            graphSelect.addEventListener('change', function(e) { renderGraph(locId, e.target.value); });
        }
    }
}

// ==========================================
// 7. CHART RENDERING
// ==========================================
function renderGraph(locationId, graphType) {
    const canvas = document.getElementById('spl-chart');
    if (!canvas) return; 

    const dataObj = graphData[locationId][graphType];
    if (!dataObj) return;

    if (currentChart) {
        currentChart.data.labels = dataObj.x;
        currentChart.data.datasets[0].label = graphType;
        currentChart.data.datasets[0].data = dataObj.y;
        currentChart.reset();
        currentChart.update();
    } else {
        const ctx = canvas.getContext('2d');
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataObj.x,
                datasets: [{
                    label: graphType, data: dataObj.y,
                    borderColor: '#8C3826', backgroundColor: 'rgba(140, 56, 38, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 900, easing: 'easeOutQuart' },
                interaction: { mode: 'point', intersect: true },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) { return `Frequency: ${context[0].label} Hz`; },
                            label: function(context) { return `SPL: ${context.parsed.y} dB`; }
                        }
                    }
                }
            }
        });
    }
}

// ==========================================
// 8. VIDEO MODAL
// ==========================================
function openVideoModal(row) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-player-container');
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    container.innerHTML = `
        <h3 style="margin-top: 0; color: #4A2C2A; font-family: 'Segoe UI', sans-serif;">${row.Title}</h3>
        <iframe width="100%" height="315" src="${row.vidEmbed}" title="YouTube video player" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
