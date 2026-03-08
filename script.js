// Rates of Reaction Simulator - Main JavaScript
// CAPE Chemistry Unit 1 Module 2
// Version: 1.0

// ============================================================================
// GLOBAL VARIABLES AND STATE
// ============================================================================

let canvas, ctx;
let currentMode = 'boltzmann';
let animationFrame = null;

// Settings
let settings = {
    showGrid: true,
    showLegend: true,
    showLabels: true,
    showValues: true,
    lineColor: '#ff6b2c',
    eaColor: '#e63946',
    transitionColor: '#ffba08',
    autoGenerate: false,
    showHints: true,
    showExplanations: true,
    showWorkings: true,
    difficultyLevel: 'medium',
    animSpeed: 1,
    dataPoints: 50,
    lineThickness: 3
};

// Statistics
let stats = {
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    orderDetermination: { correct: 0, total: 0 },
    graphInterpretation: { correct: 0, total: 0 },
    halfLifeCalc: { correct: 0, total: 0 },
    rateCalc: { correct: 0, total: 0 }
};

// Current question state
let currentQuestion = null;
let selectedAnswer = null;

// Boltzmann distribution parameters
let temperature = 300; // Kelvin
let activationEnergy = 50; // arbitrary units
let showCatalyst = false;

// Energy profile parameters
let reactionType = 'exothermic'; // or 'endothermic'
let deltaH = -50; // energy change
let Ea_forward = 80;
let Ea_reverse = 130;

// Concentration-time graph parameters
let reactionOrder = 1; // 0, 1, or 2
let rateConstant = 0.1;
let initialConcentration = 1.0;
let timeRange = 50;

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load saved settings and stats
    loadSettings();
    loadStats();
    
    // Initialize with Boltzmann mode
    changeMode('boltzmann');
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 50;
    canvas.height = 500;
    if (currentMode) {
        drawCurrentMode();
    }
}

// ============================================================================
// TAB SWITCHING
// ============================================================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Special handling for simulation tab
    if (tabName === 'simulation') {
        setTimeout(() => {
            resizeCanvas();
            drawCurrentMode();
        }, 100);
    }
}

// ============================================================================
// MODE SWITCHING
// ============================================================================

function changeMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Stop any ongoing animations
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    // Load appropriate controls
    loadControls(mode);
    
    // Draw the mode
    drawCurrentMode();
}

function loadControls(mode) {
    const controlPanel = document.getElementById('controlPanel');
    
    switch(mode) {
        case 'boltzmann':
            controlPanel.innerHTML = getBoltzmannControls();
            break;
        case 'energy':
            controlPanel.innerHTML = getEnergyProfileControls();
            break;
        case 'concentration':
            controlPanel.innerHTML = getConcentrationControls();
            break;
        case 'rate':
            controlPanel.innerHTML = getRateControls();
            break;
        case 'order':
            controlPanel.innerHTML = getOrderDeterminationControls();
            break;
        case 'halflife':
            controlPanel.innerHTML = getHalfLifeControls();
            break;
    }
}

function drawCurrentMode() {
    switch(currentMode) {
        case 'boltzmann':
            drawBoltzmannDistribution();
            break;
        case 'energy':
            drawEnergyProfile();
            break;
        case 'concentration':
            drawConcentrationTimeGraph();
            break;
        case 'rate':
            drawRateConcentrationGraph();
            break;
        case 'order':
            drawOrderDeterminationMode();
            break;
        case 'halflife':
            drawHalfLifeMode();
            break;
    }
}

// ============================================================================
// BOLTZMANN DISTRIBUTION MODE
// ============================================================================

function getBoltzmannControls() {
    return `
        <div class="control-section">
            <h3>Temperature Control</h3>
            <div class="slider-group">
                <label>
                    Temperature (K): <span class="value-display" id="tempValue">${temperature}</span>
                </label>
                <input type="range" min="200" max="600" value="${temperature}" 
                       oninput="updateTemperature(this.value)">
            </div>
        </div>

        <div class="control-section">
            <h3>Activation Energy</h3>
            <div class="slider-group">
                <label>
                    Ea (arbitrary units): <span class="value-display" id="eaValue">${activationEnergy}</span>
                </label>
                <input type="range" min="10" max="100" value="${activationEnergy}" 
                       oninput="updateActivationEnergy(this.value)">
            </div>
        </div>

        <div class="control-section">
            <h3>Catalyst Effect</h3>
            <label class="checkbox-label">
                <input type="checkbox" ${showCatalyst ? 'checked' : ''} 
                       onchange="toggleCatalyst(this.checked)">
                <span>Show Catalyzed Pathway</span>
            </label>
        </div>

        <div class="info-box">
            <h4>Information</h4>
            <p>The Boltzmann distribution shows how particle energies are distributed at a given temperature.</p>
            <p><strong>Key Points:</strong></p>
            <ul style="margin-left: 20px; color: var(--text-secondary);">
                <li>Area under curve = total number of particles</li>
                <li>Shaded area (right of Ea) = particles that can react</li>
                <li>Higher T = more particles exceed Ea</li>
                <li>Lower Ea = more successful collisions</li>
            </ul>
        </div>
    `;
}

function updateTemperature(value) {
    temperature = parseFloat(value);
    document.getElementById('tempValue').textContent = temperature;
    drawBoltzmannDistribution();
}

function updateActivationEnergy(value) {
    activationEnergy = parseFloat(value);
    document.getElementById('eaValue').textContent = activationEnergy;
    drawBoltzmannDistribution();
}

function toggleCatalyst(checked) {
    showCatalyst = checked;
    drawBoltzmannDistribution();
}

function drawBoltzmannDistribution() {
    // Clear canvas
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const graphWidth = canvas.width - 2 * margin;
    const graphHeight = canvas.height - 2 * margin;
    
    // Draw grid if enabled
    if (settings.showGrid) {
        drawGrid(margin, graphWidth, graphHeight);
    }
    
    // Draw axes
    drawAxes(margin, graphWidth, graphHeight, 'Energy', 'Number of Molecules');
    
    // Generate Boltzmann distribution curve
    const points = [];
    const numPoints = 200;
    const maxEnergy = 150;
    
    // Boltzmann factor calculation
    const k = 0.1; // Boltzmann constant (scaled)
    const T = temperature;
    
    let maxY = 0;
    for (let i = 0; i < numPoints; i++) {
        const energy = (i / numPoints) * maxEnergy;
        // Maxwell-Boltzmann distribution approximation
        const y = Math.sqrt(energy) * Math.exp(-energy / (k * T));
        maxY = Math.max(maxY, y);
        points.push({ x: energy, y: y });
    }
    
    // Normalize
    points.forEach(p => {
        p.y = (p.y / maxY) * graphHeight * 0.8;
    });
    
    // Draw filled area under curve (particles that CAN react - beyond Ea)
    ctx.fillStyle = 'rgba(255, 107, 44, 0.2)';
    ctx.beginPath();
    const eaX = margin + (activationEnergy / maxEnergy) * graphWidth;
    const eaIndex = Math.floor((activationEnergy / maxEnergy) * numPoints);
    
    ctx.moveTo(eaX, margin + graphHeight);
    for (let i = eaIndex; i < points.length; i++) {
        const x = margin + (points[i].x / maxEnergy) * graphWidth;
        const y = margin + graphHeight - points[i].y;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(margin + graphWidth, margin + graphHeight);
    ctx.closePath();
    ctx.fill();
    
    // Draw the distribution curve
    ctx.strokeStyle = settings.lineColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.beginPath();
    points.forEach((p, i) => {
        const x = margin + (p.x / maxEnergy) * graphWidth;
        const y = margin + graphHeight - p.y;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw activation energy line
    ctx.strokeStyle = settings.eaColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(eaX, margin);
    ctx.lineTo(eaX, margin + graphHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw catalyst Ea if enabled
    if (showCatalyst) {
        const catalystEa = activationEnergy * 0.6; // Catalyst lowers Ea
        const catEaX = margin + (catalystEa / maxEnergy) * graphWidth;
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(catEaX, margin);
        ctx.lineTo(catEaX, margin + graphHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = '#06d6a0';
        ctx.font = 'bold 14px Fira Code';
        ctx.textAlign = 'center';
        ctx.fillText('Ea (catalyzed)', catEaX, margin - 10);
    }
    
    // Label Ea
    ctx.fillStyle = settings.eaColor;
    ctx.font = 'bold 14px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText('Ea', eaX, margin - 10);
    
    // Draw legend
    updateLegend([
        { color: settings.lineColor, label: 'Boltzmann Distribution' },
        { color: 'rgba(255, 107, 44, 0.4)', label: 'Particles with E ≥ Ea', filled: true },
        { color: settings.eaColor, label: 'Activation Energy (Ea)', dashed: true }
    ]);
}

// ============================================================================
// ENERGY PROFILE MODE
// ============================================================================

function getEnergyProfileControls() {
    return `
        <div class="control-section">
            <h3>Reaction Type</h3>
            <div class="answer-grid">
                <button class="answer-btn ${reactionType === 'exothermic' ? 'selected' : ''}" 
                        onclick="setReactionType('exothermic')">Exothermic</button>
                <button class="answer-btn ${reactionType === 'endothermic' ? 'selected' : ''}" 
                        onclick="setReactionType('endothermic')">Endothermic</button>
            </div>
        </div>

        <div class="control-section">
            <h3>Energy Parameters</h3>
            <div class="slider-group">
                <label>
                    Forward Ea: <span class="value-display" id="eaForwardValue">${Ea_forward}</span>
                </label>
                <input type="range" min="20" max="150" value="${Ea_forward}" 
                       oninput="updateEaForward(this.value)">
            </div>
            
            <div class="slider-group">
                <label>
                    ΔH (Enthalpy Change): <span class="value-display" id="deltaHValue">${deltaH}</span>
                </label>
                <input type="range" min="-100" max="100" value="${deltaH}" 
                       oninput="updateDeltaH(this.value)">
            </div>
        </div>

        <div class="control-section">
            <h3>Catalyst Effect</h3>
            <label class="checkbox-label">
                <input type="checkbox" ${showCatalyst ? 'checked' : ''} 
                       onchange="toggleCatalyst(this.checked)">
                <span>Show Catalyzed Pathway</span>
            </label>
        </div>

        <div class="info-box">
            <h4>Energy Profile</h4>
            <p><strong>Exothermic:</strong> Products lower energy than reactants (ΔH < 0)</p>
            <p><strong>Endothermic:</strong> Products higher energy than reactants (ΔH > 0)</p>
            <p><strong>Catalyst:</strong> Lowers Ea but doesn't change ΔH</p>
        </div>
    `;
}

function setReactionType(type) {
    reactionType = type;
    if (type === 'exothermic') {
        deltaH = -Math.abs(deltaH);
    } else {
        deltaH = Math.abs(deltaH);
    }
    loadControls('energy');
    drawEnergyProfile();
}

function updateEaForward(value) {
    Ea_forward = parseFloat(value);
    document.getElementById('eaForwardValue').textContent = Ea_forward;
    drawEnergyProfile();
}

function updateDeltaH(value) {
    deltaH = parseFloat(value);
    document.getElementById('deltaHValue').textContent = deltaH;
    drawEnergyProfile();
}

function drawEnergyProfile() {
    // Clear canvas
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const graphWidth = canvas.width - 2 * margin;
    const graphHeight = canvas.height - 2 * margin;
    
    // Draw grid if enabled
    if (settings.showGrid) {
        drawGrid(margin, graphWidth, graphHeight);
    }
    
    // Draw axes
    drawAxes(margin, graphWidth, graphHeight, 'Reaction Coordinate', 'Potential Energy');
    
    // Calculate energy levels
    const reactantE = graphHeight * 0.7; // Start at 70% from top
    const productE = reactantE + deltaH;
    const transitionE = reactantE - Ea_forward;
    
    // Draw uncatalyzed pathway
    ctx.strokeStyle = settings.lineColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.beginPath();
    
    // Smooth curve using bezier
    const x1 = margin + graphWidth * 0.15;
    const x2 = margin + graphWidth * 0.5;
    const x3 = margin + graphWidth * 0.85;
    
    const y1 = margin + reactantE;
    const y2 = margin + transitionE;
    const y3 = margin + productE;
    
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x2 - 80, y2, x2, y2);
    ctx.quadraticCurveTo(x2 + 80, y2, x3, y3);
    ctx.stroke();
    
    // Draw catalyzed pathway if enabled
    if (showCatalyst) {
        const catalyzedTransitionE = reactantE - (Ea_forward * 0.6);
        
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = settings.lineThickness;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(x2 - 80, margin + catalyzedTransitionE, x2, margin + catalyzedTransitionE);
        ctx.quadraticCurveTo(x2 + 80, margin + catalyzedTransitionE, x3, y3);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw horizontal lines for reactants and products
    ctx.strokeStyle = 'rgba(255, 186, 8, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Reactants line
    ctx.beginPath();
    ctx.moveTo(margin, y1);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    
    // Products line
    ctx.beginPath();
    ctx.moveTo(x3, y3);
    ctx.lineTo(margin + graphWidth, y3);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw arrows for Ea and ΔH
    drawArrow(ctx, x1 + 30, y1, x1 + 30, y2, settings.eaColor, 'Ea');
    drawArrow(ctx, margin + graphWidth - 40, y1, margin + graphWidth - 40, y3, 
              deltaH < 0 ? '#06d6a0' : settings.eaColor, 'ΔH');
    
    // Labels
    ctx.fillStyle = '#fef4e8';
    ctx.font = 'bold 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Reactants', x1, y1 + 30);
    ctx.fillText('Products', x3, y3 + 30);
    ctx.fillText('Transition State', x2, y2 - 15);
    
    // Update legend
    const legendItems = [
        { color: settings.lineColor, label: 'Uncatalyzed Pathway' }
    ];
    if (showCatalyst) {
        legendItems.push({ color: '#06d6a0', label: 'Catalyzed Pathway', dashed: true });
    }
    updateLegend(legendItems);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function drawGrid(margin, width, height) {
    ctx.strokeStyle = 'rgba(255, 107, 44, 0.08)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
        const x = margin + (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
        const y = margin + (i / 10) * height;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + width, y);
        ctx.stroke();
    }
}

function drawAxes(margin, width, height, xLabel, yLabel) {
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin, margin + height);
    ctx.lineTo(margin + width, margin + height);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, margin + height);
    ctx.stroke();
    
    if (settings.showLabels) {
        ctx.fillStyle = '#fef4e8';
        ctx.font = '14px Outfit';
        ctx.textAlign = 'center';
        
        // X-axis label
        ctx.fillText(xLabel, margin + width / 2, margin + height + 40);
        
        // Y-axis label
        ctx.save();
        ctx.translate(margin - 40, margin + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }
}

function drawArrow(ctx, x1, y1, x2, y2, color, label) {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrowhead at end
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), 
               y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), 
               y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    // Draw label
    if (label) {
        ctx.font = 'bold 14px Fira Code';
        ctx.textAlign = 'right';
        ctx.fillText(label, x1 - 10, (y1 + y2) / 2);
    }
}

function updateLegend(items) {
    const legendDiv = document.getElementById('graphLegend');
    const legendContent = document.getElementById('legendContent');
    
    if (!settings.showLegend || items.length === 0) {
        legendDiv.style.display = 'none';
        return;
    }
    
    legendDiv.style.display = 'block';
    legendContent.innerHTML = '';
    
    items.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        if (item.filled) {
            colorBox.style.background = item.color;
        } else {
            colorBox.style.border = `3px ${item.dashed ? 'dashed' : 'solid'} ${item.color}`;
            colorBox.style.background = 'transparent';
        }
        
        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.color = 'var(--text-secondary)';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContent.appendChild(legendItem);
    });
}

function resetGraph() {
    // Reset current mode to defaults
    switch(currentMode) {
        case 'boltzmann':
            temperature = 300;
            activationEnergy = 50;
            showCatalyst = false;
            break;
        case 'energy':
            Ea_forward = 80;
            deltaH = -50;
            reactionType = 'exothermic';
            showCatalyst = false;
            break;
        case 'concentration':
            reactionOrder = 1;
            rateConstant = 0.1;
            initialConcentration = 1.0;
            break;
    }
    
    loadControls(currentMode);
    drawCurrentMode();
}

// ============================================================================
// CONCENTRATION-TIME GRAPH MODE
// ============================================================================

function getConcentrationControls() {
    return `
        <div class="control-section">
            <h3>Reaction Order</h3>
            <div class="answer-grid">
                <button class="answer-btn ${reactionOrder === 0 ? 'selected' : ''}" 
                        onclick="setReactionOrder(0)">Zero Order</button>
                <button class="answer-btn ${reactionOrder === 1 ? 'selected' : ''}" 
                        onclick="setReactionOrder(1)">First Order</button>
                <button class="answer-btn ${reactionOrder === 2 ? 'selected' : ''}" 
                        onclick="setReactionOrder(2)">Second Order</button>
            </div>
        </div>

        <div class="control-section">
            <h3>Parameters</h3>
            <div class="slider-group">
                <label>
                    Initial [A] (mol dm⁻³): <span class="value-display" id="concValue">${initialConcentration.toFixed(2)}</span>
                </label>
                <input type="range" min="0.1" max="2" step="0.1" value="${initialConcentration}" 
                       oninput="updateConcentration(this.value)">
            </div>
            
            <div class="slider-group">
                <label>
                    Rate Constant k: <span class="value-display" id="kValue">${rateConstant.toFixed(3)}</span>
                </label>
                <input type="range" min="0.01" max="0.5" step="0.01" value="${rateConstant}" 
                       oninput="updateRateConstant(this.value)">
            </div>
            
            <div class="slider-group">
                <label>
                    Time Range (s): <span class="value-display" id="timeValue">${timeRange}</span>
                </label>
                <input type="range" min="10" max="100" step="10" value="${timeRange}" 
                       oninput="updateTimeRange(this.value)">
            </div>
        </div>

        <div class="info-box">
            <h4>Rate Equations</h4>
            <p><strong>Zero Order:</strong> [A] = [A]₀ - kt</p>
            <p><strong>First Order:</strong> [A] = [A]₀ e⁻ᵏᵗ</p>
            <p><strong>Second Order:</strong> 1/[A] = 1/[A]₀ + kt</p>
        </div>

        <button class="btn" style="width: 100%; margin-top: 15px;" onclick="calculateHalfLife()">
            Calculate Half-Life
        </button>
    `;
}

function setReactionOrder(order) {
    reactionOrder = order;
    loadControls('concentration');
    drawConcentrationTimeGraph();
}

function updateConcentration(value) {
    initialConcentration = parseFloat(value);
    document.getElementById('concValue').textContent = initialConcentration.toFixed(2);
    drawConcentrationTimeGraph();
}

function updateRateConstant(value) {
    rateConstant = parseFloat(value);
    document.getElementById('kValue').textContent = rateConstant.toFixed(3);
    drawConcentrationTimeGraph();
}

function updateTimeRange(value) {
    timeRange = parseFloat(value);
    document.getElementById('timeValue').textContent = timeRange;
    drawConcentrationTimeGraph();
}

function drawConcentrationTimeGraph() {
    // Clear canvas
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const graphWidth = canvas.width - 2 * margin;
    const graphHeight = canvas.height - 2 * margin;
    
    // Draw grid
    if (settings.showGrid) {
        drawGrid(margin, graphWidth, graphHeight);
    }
    
    // Draw axes
    drawAxes(margin, graphWidth, graphHeight, 'Time (s)', '[A] (mol dm⁻³)');
    
    // Generate data points
    const points = [];
    const numPoints = settings.dataPoints;
    
    for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * timeRange;
        let concentration;
        
        switch(reactionOrder) {
            case 0:
                // Zero order: [A] = [A]0 - kt
                concentration = Math.max(0, initialConcentration - rateConstant * t);
                break;
            case 1:
                // First order: [A] = [A]0 * e^(-kt)
                concentration = initialConcentration * Math.exp(-rateConstant * t);
                break;
            case 2:
                // Second order: 1/[A] = 1/[A]0 + kt
                concentration = 1 / (1/initialConcentration + rateConstant * t);
                break;
        }
        
        points.push({ t, concentration });
    }
    
    // Draw curve
    ctx.strokeStyle = settings.lineColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.beginPath();
    
    points.forEach((p, i) => {
        const x = margin + (p.t / timeRange) * graphWidth;
        const y = margin + graphHeight - (p.concentration / initialConcentration) * graphHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw tangent line at t = timeRange/4 (for demonstration)
    if (reactionOrder > 0) {
        const tangentT = timeRange / 4;
        const tangentIndex = Math.floor(numPoints / 4);
        
        if (tangentIndex > 0 && tangentIndex < points.length - 1) {
            // Calculate slope at this point
            const dt = points[tangentIndex + 1].t - points[tangentIndex - 1].t;
            const dc = points[tangentIndex + 1].concentration - points[tangentIndex - 1].concentration;
            const slope = dc / dt;
            
            // Draw tangent line
            ctx.strokeStyle = '#ffba08';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            const x0 = margin;
            const xPoint = margin + (tangentT / timeRange) * graphWidth;
            const yPoint = margin + graphHeight - (points[tangentIndex].concentration / initialConcentration) * graphHeight;
            
            // Extend tangent line
            const y0 = yPoint - slope * tangentT * (graphWidth / timeRange) * (graphHeight / initialConcentration);
            const x1 = margin + graphWidth;
            const y1 = yPoint + slope * (timeRange - tangentT) * (graphWidth / timeRange) * (graphHeight / initialConcentration);
            
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Mark the point
            ctx.fillStyle = '#ffba08';
            ctx.beginPath();
            ctx.arc(xPoint, yPoint, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label rate
            ctx.font = 'bold 12px Fira Code';
            ctx.textAlign = 'left';
            ctx.fillText(`rate = ${Math.abs(slope).toFixed(4)} mol dm⁻³ s⁻¹`, xPoint + 10, yPoint - 10);
        }
    }
    
    // Add tick labels
    drawTickLabels(margin, graphWidth, graphHeight, timeRange, initialConcentration);
    
    // Update legend
    const legendItems = [
        { color: settings.lineColor, label: `${getOrderName(reactionOrder)} Reaction` },
        { color: '#ffba08', label: 'Tangent (Instantaneous Rate)', dashed: true }
    ];
    updateLegend(legendItems);
}

function getOrderName(order) {
    switch(order) {
        case 0: return 'Zero-Order';
        case 1: return 'First-Order';
        case 2: return 'Second-Order';
        default: return 'Unknown Order';
    }
}

function drawTickLabels(margin, width, height, maxX, maxY) {
    ctx.fillStyle = '#d4a574';
    ctx.font = '11px Fira Code';
    
    // X-axis ticks
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
        const x = margin + (i / 5) * width;
        const value = (i / 5) * maxX;
        ctx.fillText(value.toFixed(0), x, margin + height + 20);
    }
    
    // Y-axis ticks
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = margin + height - (i / 5) * height;
        const value = (i / 5) * maxY;
        ctx.fillText(value.toFixed(2), margin - 10, y + 4);
    }
}

function calculateHalfLife() {
    let halfLife;
    let message;
    
    switch(reactionOrder) {
        case 0:
            halfLife = initialConcentration / (2 * rateConstant);
            message = `Zero-order half-life: ${halfLife.toFixed(2)} s\nNote: Half-life depends on initial concentration`;
            break;
        case 1:
            halfLife = 0.693 / rateConstant;
            message = `First-order half-life: ${halfLife.toFixed(2)} s\nNote: Half-life is constant (independent of concentration)`;
            break;
        case 2:
            halfLife = 1 / (rateConstant * initialConcentration);
            message = `Second-order half-life: ${halfLife.toFixed(2)} s\nNote: Half-life depends on initial concentration`;
            break;
    }
    
    alert(message);
}

// ============================================================================
// RATE VS CONCENTRATION MODE
// ============================================================================

function getRateControls() {
    return `
        <div class="control-section">
            <h3>Select Order to Visualize</h3>
            <div class="answer-grid">
                <button class="answer-btn ${reactionOrder === 0 ? 'selected' : ''}" 
                        onclick="setReactionOrder(0); drawRateConcentrationGraph();">Zero Order</button>
                <button class="answer-btn ${reactionOrder === 1 ? 'selected' : ''}" 
                        onclick="setReactionOrder(1); drawRateConcentrationGraph();">First Order</button>
                <button class="answer-btn ${reactionOrder === 2 ? 'selected' : ''}" 
                        onclick="setReactionOrder(2); drawRateConcentrationGraph();">Second Order</button>
            </div>
        </div>

        <div class="control-section">
            <h3>Rate Constant</h3>
            <div class="slider-group">
                <label>
                    k value: <span class="value-display" id="kValue">${rateConstant.toFixed(3)}</span>
                </label>
                <input type="range" min="0.01" max="0.5" step="0.01" value="${rateConstant}" 
                       oninput="rateConstant = parseFloat(this.value); document.getElementById('kValue').textContent = rateConstant.toFixed(3); drawRateConcentrationGraph();">
            </div>
        </div>

        <div class="info-box">
            <h4>Rate Relationships</h4>
            <p><strong>Zero Order:</strong> rate = k (horizontal line)</p>
            <p><strong>First Order:</strong> rate = k[A] (straight line through origin)</p>
            <p><strong>Second Order:</strong> rate = k[A]² (parabola)</p>
        </div>
    `;
}

function drawRateConcentrationGraph() {
    // Clear canvas
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const graphWidth = canvas.width - 2 * margin;
    const graphHeight = canvas.height - 2 * margin;
    
    // Draw grid
    if (settings.showGrid) {
        drawGrid(margin, graphWidth, graphHeight);
    }
    
    // Draw axes
    drawAxes(margin, graphWidth, graphHeight, '[A] (mol dm⁻³)', 'Rate (mol dm⁻³ s⁻¹)');
    
    // Generate data points
    const points = [];
    const numPoints = settings.dataPoints;
    const maxConc = 2.0;
    let maxRate = 0;
    
    for (let i = 0; i <= numPoints; i++) {
        const conc = (i / numPoints) * maxConc;
        let rate;
        
        switch(reactionOrder) {
            case 0:
                rate = rateConstant;
                break;
            case 1:
                rate = rateConstant * conc;
                break;
            case 2:
                rate = rateConstant * conc * conc;
                break;
        }
        
        maxRate = Math.max(maxRate, rate);
        points.push({ conc, rate });
    }
    
    // Draw curve
    ctx.strokeStyle = settings.lineColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.beginPath();
    
    points.forEach((p, i) => {
        const x = margin + (p.conc / maxConc) * graphWidth;
        const y = margin + graphHeight - (p.rate / maxRate) * graphHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Add tick labels
    drawTickLabels(margin, graphWidth, graphHeight, maxConc, maxRate);
    
    // Update legend
    updateLegend([
        { color: settings.lineColor, label: `${getOrderName(reactionOrder)} Rate Curve` }
    ]);
}

// ============================================================================
// ORDER DETERMINATION MODE
// ============================================================================

function getOrderDeterminationControls() {
    return `
        <div class="control-section">
            <h3>Practice Problem</h3>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">
                Analyze the experimental data to determine the order of reaction.
            </p>
            <button class="btn" style="width: 100%;" onclick="generateOrderQuestion()">
                Generate New Question
            </button>
        </div>

        <div id="questionArea" style="display: none;">
            <div class="control-section">
                <h3>Experimental Data</h3>
                <div id="dataTableContainer"></div>
            </div>

            <div class="control-section">
                <h3>What is the order with respect to A?</h3>
                <div class="answer-grid" id="orderAAnswers"></div>
            </div>

            <div class="control-section" id="orderBSection" style="display: none;">
                <h3>What is the order with respect to B?</h3>
                <div class="answer-grid" id="orderBAnswers"></div>
            </div>

            <div class="control-section" id="overallOrderSection" style="display: none;">
                <h3>What is the overall order?</h3>
                <div class="answer-grid" id="overallOrderAnswers"></div>
            </div>

            <button class="btn" style="width: 100%; margin-top: 15px;" onclick="checkOrderAnswer()">
                Check Answer
            </button>

            <div id="orderFeedback" class="feedback"></div>
        </div>

        <div class="info-box">
            <h4>How to Determine Order</h4>
            <p><strong>Method:</strong> Compare experiments where only one reactant concentration changes</p>
            <p>• If doubling [A] doubles rate → 1st order in A</p>
            <p>• If doubling [A] quadruples rate → 2nd order in A</p>
            <p>• If doubling [A] has no effect → 0 order in A</p>
        </div>
    `;
}

function generateOrderQuestion() {
    // Generate random question
    const hasB = Math.random() > 0.5; // Sometimes include second reactant
    const orderA = Math.floor(Math.random() * 3); // 0, 1, or 2
    const orderB = hasB ? Math.floor(Math.random() * 3) : 0;
    const k = 0.01 + Math.random() * 0.1;
    
    // Generate 4-5 experiments
    const experiments = [];
    const baseConcs = [0.1, 0.2, 0.4];
    
    for (let i = 0; i < (hasB ? 4 : 3); i++) {
        const concA = baseConcs[i % 3];
        const concB = hasB ? baseConcs[Math.floor(i / 1.5) % 3] : 1.0;
        const rate = k * Math.pow(concA, orderA) * Math.pow(concB, orderB);
        
        // Add small random noise
        const noise = 1 + (Math.random() - 0.5) * 0.1;
        experiments.push({
            concA: concA.toFixed(2),
            concB: hasB ? concB.toFixed(2) : null,
            rate: (rate * noise).toExponential(2)
        });
    }
    
    // Store correct answer
    currentQuestion = {
        type: 'order',
        orderA: orderA,
        orderB: orderB,
        overall: orderA + orderB,
        hasB: hasB,
        experiments: experiments
    };
    
    // Display question
    displayOrderQuestion();
}

function displayOrderQuestion() {
    document.getElementById('questionArea').style.display = 'block';
    
    // Create data table
    let tableHTML = '<table class="data-table"><thead><tr><th>Exp</th><th>[A] / mol dm⁻³</th>';
    if (currentQuestion.hasB) {
        tableHTML += '<th>[B] / mol dm⁻³</th>';
    }
    tableHTML += '<th>Rate / mol dm⁻³ s⁻¹</th></tr></thead><tbody>';
    
    currentQuestion.experiments.forEach((exp, i) => {
        tableHTML += `<tr><td>${i + 1}</td><td>${exp.concA}</td>`;
        if (currentQuestion.hasB) {
            tableHTML += `<td>${exp.concB}</td>`;
        }
        tableHTML += `<td>${exp.rate}</td></tr>`;
    });
    
    tableHTML += '</tbody></table>';
    document.getElementById('dataTableContainer').innerHTML = tableHTML;
    
    // Create answer buttons for A
    const orderAHTML = `
        <button class="answer-btn" onclick="selectAnswer('orderA', 0)">0 (Zero order)</button>
        <button class="answer-btn" onclick="selectAnswer('orderA', 1)">1 (First order)</button>
        <button class="answer-btn" onclick="selectAnswer('orderA', 2)">2 (Second order)</button>
    `;
    document.getElementById('orderAAnswers').innerHTML = orderAHTML;
    
    // Show/hide B section
    if (currentQuestion.hasB) {
        document.getElementById('orderBSection').style.display = 'block';
        const orderBHTML = `
            <button class="answer-btn" onclick="selectAnswer('orderB', 0)">0 (Zero order)</button>
            <button class="answer-btn" onclick="selectAnswer('orderB', 1)">1 (First order)</button>
            <button class="answer-btn" onclick="selectAnswer('orderB', 2)">2 (Second order)</button>
        `;
        document.getElementById('orderBAnswers').innerHTML = orderBHTML;
        
        document.getElementById('overallOrderSection').style.display = 'block';
        const overallHTML = `
            <button class="answer-btn" onclick="selectAnswer('overall', 0)">0</button>
            <button class="answer-btn" onclick="selectAnswer('overall', 1)">1</button>
            <button class="answer-btn" onclick="selectAnswer('overall', 2)">2</button>
            <button class="answer-btn" onclick="selectAnswer('overall', 3)">3</button>
            <button class="answer-btn" onclick="selectAnswer('overall', 4)">4</button>
        `;
        document.getElementById('overallOrderAnswers').innerHTML = overallHTML;
    } else {
        document.getElementById('orderBSection').style.display = 'none';
        document.getElementById('overallOrderSection').style.display = 'none';
    }
    
    selectedAnswer = { orderA: null, orderB: null, overall: null };
    document.getElementById('orderFeedback').style.display = 'none';
}

function selectAnswer(type, value) {
    selectedAnswer[type] = value;
    
    // Update button states
    const container = type === 'orderA' ? 'orderAAnswers' : 
                     type === 'orderB' ? 'orderBAnswers' : 'overallOrderAnswers';
    
    document.querySelectorAll(`#${container} .answer-btn`).forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function checkOrderAnswer() {
    if (selectedAnswer.orderA === null) {
        showFeedback('Please select an order for reactant A first.', 'error', 'orderFeedback');
        return;
    }
    
    if (currentQuestion.hasB && selectedAnswer.orderB === null) {
        showFeedback('Please select an order for reactant B first.', 'error', 'orderFeedback');
        return;
    }
    
    if (currentQuestion.hasB && selectedAnswer.overall === null) {
        showFeedback('Please select the overall order.', 'error', 'orderFeedback');
        return;
    }
    
    // Check answers
    const correctA = selectedAnswer.orderA === currentQuestion.orderA;
    const correctB = !currentQuestion.hasB || selectedAnswer.orderB === currentQuestion.orderB;
    const correctOverall = !currentQuestion.hasB || selectedAnswer.overall === currentQuestion.overall;
    
    const allCorrect = correctA && correctB && correctOverall;
    
    // Update statistics
    stats.totalQuestions++;
    stats.orderDetermination.total++;
    if (allCorrect) {
        stats.correctAnswers++;
        stats.orderDetermination.correct++;
    } else {
        stats.incorrectAnswers++;
    }
    saveStats();
    updateStatsDisplay();
    
    // Show feedback
    let message = '';
    if (allCorrect) {
        message = '✓ Correct! ';
        if (settings.showExplanations) {
            message += `The reaction is ${getOrderName(currentQuestion.orderA)} in A`;
            if (currentQuestion.hasB) {
                message += `, ${getOrderName(currentQuestion.orderB)} in B, with overall order ${currentQuestion.overall}`;
            }
            message += '.';
        }
        showFeedback(message, 'success', 'orderFeedback');
        
        if (settings.autoGenerate) {
            setTimeout(generateOrderQuestion, 2000);
        }
    } else {
        message = '✗ Incorrect. ';
        if (settings.showExplanations) {
            message += `The correct answer is: ${getOrderName(currentQuestion.orderA)} in A`;
            if (currentQuestion.hasB) {
                message += `, ${getOrderName(currentQuestion.orderB)} in B, overall order ${currentQuestion.overall}`;
            }
            message += '.';
        }
        showFeedback(message, 'error', 'orderFeedback');
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

// ============================================================================
// HALF-LIFE ANALYSIS MODE
// ============================================================================

function getHalfLifeControls() {
    return `
        <div class="control-section">
            <h3>Practice Problem</h3>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">
                Analyze concentration-time data to determine if the reaction is first-order and calculate the half-life.
            </p>
            <button class="btn" style="width: 100%;" onclick="generateHalfLifeQuestion()">
                Generate New Question
            </button>
        </div>

        <div id="halflifeQuestionArea" style="display: none;">
            <div class="control-section">
                <h3>Concentration Data</h3>
                <div id="halflifeTableContainer"></div>
            </div>

            <div class="control-section">
                <h3>Is this reaction first-order?</h3>
                <div class="answer-grid">
                    <button class="answer-btn" onclick="selectHalflifeAnswer('isFirstOrder', true)">Yes</button>
                    <button class="answer-btn" onclick="selectHalflifeAnswer('isFirstOrder', false)">No</button>
                </div>
            </div>

            <div class="control-section">
                <h3>Calculate the half-life (s)</h3>
                <div class="input-group">
                    <input type="number" id="halflifeInput" placeholder="Enter half-life" step="0.01">
                </div>
            </div>

            <button class="btn" style="width: 100%; margin-top: 15px;" onclick="checkHalflifeAnswer()">
                Check Answer
            </button>

            <div id="halflifeFeedback" class="feedback"></div>
        </div>

        <div class="info-box">
            <h4>First-Order Half-Life</h4>
            <p><strong>Key Property:</strong> For first-order reactions, the half-life is constant</p>
            <p><strong>Formula:</strong> t½ = 0.693 / k</p>
            <p>Check if successive half-lives are approximately equal</p>
        </div>
    `;
}

function generateHalfLifeQuestion() {
    const k = 0.05 + Math.random() * 0.15;
    const t_half = 0.693 / k;
    const initial = 0.5 + Math.random() * 1.5;
    
    const times = [0, 5, 10, 15, 20, 30, 40];
    const data = times.map(t => ({
        time: t,
        concentration: (initial * Math.exp(-k * t)).toFixed(3)
    }));
    
    currentQuestion = {
        type: 'halflife',
        isFirstOrder: true,
        halfLife: t_half,
        k: k,
        data: data
    };
    
    displayHalfLifeQuestion();
}

function displayHalfLifeQuestion() {
    document.getElementById('halflifeQuestionArea').style.display = 'block';
    
    let tableHTML = '<table class="data-table"><thead><tr><th>Time (s)</th><th>[A] (mol dm⁻³)</th></tr></thead><tbody>';
    currentQuestion.data.forEach(d => {
        tableHTML += `<tr><td>${d.time}</td><td>${d.concentration}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    
    document.getElementById('halflifeTableContainer').innerHTML = tableHTML;
    
    selectedAnswer = { isFirstOrder: null };
    document.getElementById('halflifeInput').value = '';
    document.getElementById('halflifeFeedback').style.display = 'none';
    
    document.querySelectorAll('#halflifeQuestionArea .answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function selectHalflifeAnswer(type, value) {
    selectedAnswer[type] = value;
    document.querySelectorAll('#halflifeQuestionArea .answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function checkHalflifeAnswer() {
    if (selectedAnswer.isFirstOrder === null) {
        showFeedback('Please indicate if this is a first-order reaction.', 'error', 'halflifeFeedback');
        return;
    }
    
    const userHalfLife = parseFloat(document.getElementById('halflifeInput').value);
    if (isNaN(userHalfLife) || userHalfLife <= 0) {
        showFeedback('Please enter a valid half-life value.', 'error', 'halflifeFeedback');
        return;
    }
    
    const correctOrder = selectedAnswer.isFirstOrder === currentQuestion.isFirstOrder;
    const halfLifeError = Math.abs(userHalfLife - currentQuestion.halfLife) / currentQuestion.halfLife;
    const correctHalfLife = halfLifeError < 0.1;
    
    const allCorrect = correctOrder && correctHalfLife;
    
    stats.totalQuestions++;
    stats.halfLifeCalc.total++;
    if (allCorrect) {
        stats.correctAnswers++;
        stats.halfLifeCalc.correct++;
    } else {
        stats.incorrectAnswers++;
    }
    saveStats();
    updateStatsDisplay();
    
    let message = '';
    if (allCorrect) {
        message = `✓ Correct! This is a first-order reaction with t½ = ${currentQuestion.halfLife.toFixed(2)} s.`;
        if (settings.showWorkings) {
            message += `\n\nUsing t½ = 0.693 / k, we get k = ${currentQuestion.k.toFixed(4)} s⁻¹.`;
        }
        showFeedback(message, 'success', 'halflifeFeedback');
        
        if (settings.autoGenerate) {
            setTimeout(generateHalfLifeQuestion, 2500);
        }
    } else {
        message = '✗ ';
        if (!correctOrder) {
            message += 'Incorrect. This is a first-order reaction. ';
        }
        if (!correctHalfLife) {
            message += `The half-life is ${currentQuestion.halfLife.toFixed(2)} s (your answer: ${userHalfLife.toFixed(2)} s). `;
        }
        if (settings.showWorkings) {
            message += `\n\nHint: Check if successive half-lives are constant by finding when concentration halves.`;
        }
        showFeedback(message, 'error', 'halflifeFeedback');
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showFeedback(message, type, elementId) {
    const feedbackEl = document.getElementById(elementId);
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback ${type}`;
    feedbackEl.style.display = 'block';
}

function exportImage() {
    const link = document.createElement('a');
    link.download = `reaction-graph-${currentMode}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function exportData() {
    let data = {
        mode: currentMode,
        timestamp: new Date().toISOString(),
        parameters: {}
    };
    
    switch(currentMode) {
        case 'boltzmann':
            data.parameters = { temperature, activationEnergy, showCatalyst };
            break;
        case 'energy':
            data.parameters = { reactionType, Ea_forward, deltaH, showCatalyst };
            break;
        case 'concentration':
            data.parameters = { reactionOrder, rateConstant, initialConcentration, timeRange };
            break;
        case 'rate':
            data.parameters = { reactionOrder, rateConstant };
            break;
    }
    
    if (currentQuestion) {
        data.currentQuestion = currentQuestion;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rates-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

function updateSettings() {
    settings.showGrid = document.getElementById('showGrid').checked;
    settings.showLegend = document.getElementById('showLegend').checked;
    settings.showLabels = document.getElementById('showLabels').checked;
    settings.showValues = document.getElementById('showValues').checked;
    settings.lineColor = document.getElementById('lineColor').value;
    settings.eaColor = document.getElementById('eaColor').value;
    settings.transitionColor = document.getElementById('transitionColor').value;
    settings.autoGenerate = document.getElementById('autoGenerate').checked;
    settings.showHints = document.getElementById('showHints').checked;
    settings.showExplanations = document.getElementById('showExplanations').checked;
    settings.showWorkings = document.getElementById('showWorkings').checked;
    settings.difficultyLevel = document.getElementById('difficultyLevel').value;
    settings.animSpeed = parseFloat(document.getElementById('animSpeed').value);
    settings.dataPoints = parseInt(document.getElementById('dataPoints').value);
    settings.lineThickness = parseInt(document.getElementById('lineThickness').value);
    
    drawCurrentMode();
}

function saveSettings() {
    localStorage.setItem('rates_settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

function loadSettings() {
    const saved = localStorage.getItem('rates_settings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        
        document.getElementById('showGrid').checked = settings.showGrid;
        document.getElementById('showLegend').checked = settings.showLegend;
        document.getElementById('showLabels').checked = settings.showLabels;
        document.getElementById('showValues').checked = settings.showValues;
        document.getElementById('lineColor').value = settings.lineColor;
        document.getElementById('eaColor').value = settings.eaColor;
        document.getElementById('transitionColor').value = settings.transitionColor;
        document.getElementById('autoGenerate').checked = settings.autoGenerate;
        document.getElementById('showHints').checked = settings.showHints;
        document.getElementById('showExplanations').checked = settings.showExplanations;
        document.getElementById('showWorkings').checked = settings.showWorkings;
        document.getElementById('difficultyLevel').value = settings.difficultyLevel;
        document.getElementById('animSpeed').value = settings.animSpeed;
        document.getElementById('dataPoints').value = settings.dataPoints;
        document.getElementById('lineThickness').value = settings.lineThickness;
    }
}

function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
        settings = {
            showGrid: true,
            showLegend: true,
            showLabels: true,
            showValues: true,
            lineColor: '#ff6b2c',
            eaColor: '#e63946',
            transitionColor: '#ffba08',
            autoGenerate: false,
            showHints: true,
            showExplanations: true,
            showWorkings: true,
            difficultyLevel: 'medium',
            animSpeed: 1,
            dataPoints: 50,
            lineThickness: 3
        };
        
        loadSettings();
        drawCurrentMode();
        alert('Settings reset to defaults.');
    }
}

// ============================================================================
// STATISTICS MANAGEMENT
// ============================================================================

function updateStatsDisplay() {
    document.getElementById('totalQuestions').textContent = stats.totalQuestions;
    document.getElementById('correctAnswers').textContent = stats.correctAnswers;
    document.getElementById('incorrectAnswers').textContent = stats.incorrectAnswers;
    
    const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;
    document.getElementById('accuracyPercent').textContent = accuracy + '%';
    
    document.getElementById('orderCorrect').textContent = stats.orderDetermination.correct;
    document.getElementById('orderTotal').textContent = stats.orderDetermination.total;
    const orderPercent = stats.orderDetermination.total > 0
        ? Math.round((stats.orderDetermination.correct / stats.orderDetermination.total) * 100)
        : 0;
    document.getElementById('orderProgress').style.width = orderPercent + '%';
    document.getElementById('orderProgress').textContent = orderPercent + '%';
    
    document.getElementById('graphCorrect').textContent = stats.graphInterpretation.correct;
    document.getElementById('graphTotal').textContent = stats.graphInterpretation.total;
    const graphPercent = stats.graphInterpretation.total > 0
        ? Math.round((stats.graphInterpretation.correct / stats.graphInterpretation.total) * 100)
        : 0;
    document.getElementById('graphProgress').style.width = graphPercent + '%';
    document.getElementById('graphProgress').textContent = graphPercent + '%';
    
    document.getElementById('halflifeCorrect').textContent = stats.halfLifeCalc.correct;
    document.getElementById('halflifeTotal').textContent = stats.halfLifeCalc.total;
    const halflifePercent = stats.halfLifeCalc.total > 0
        ? Math.round((stats.halfLifeCalc.correct / stats.halfLifeCalc.total) * 100)
        : 0;
    document.getElementById('halflifeProgress').style.width = halflifePercent + '%';
    document.getElementById('halflifeProgress').textContent = halflifePercent + '%';
    
    document.getElementById('rateCorrect').textContent = stats.rateCalc.correct;
    document.getElementById('rateTotal').textContent = stats.rateCalc.total;
    const ratePercent = stats.rateCalc.total > 0
        ? Math.round((stats.rateCalc.correct / stats.rateCalc.total) * 100)
        : 0;
    document.getElementById('rateProgress').style.width = ratePercent + '%';
    document.getElementById('rateProgress').textContent = ratePercent + '%';
}

function saveStats() {
    localStorage.setItem('rates_stats', JSON.stringify(stats));
}

function loadStats() {
    const saved = localStorage.getItem('rates_stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

function resetAllStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        stats = {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            orderDetermination: { correct: 0, total: 0 },
            graphInterpretation: { correct: 0, total: 0 },
            halfLifeCalc: { correct: 0, total: 0 },
            rateCalc: { correct: 0, total: 0 }
        };
        saveStats();
        updateStatsDisplay();
        alert('All statistics have been reset.');
    }
}

function exportStats() {
    const exportData = {
        statistics: stats,
        timestamp: new Date().toISOString(),
        accuracy: stats.totalQuestions > 0 
            ? ((stats.correctAnswers / stats.totalQuestions) * 100).toFixed(1) + '%'
            : '0%'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rates-statistics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function drawOrderDeterminationMode() {
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#d4a574';
    ctx.font = '20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Order Determination Practice', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '16px Source Sans Pro';
    ctx.fillText('Click "Generate New Question" to start', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '14px Source Sans Pro';
    ctx.fillStyle = '#9c7853';
    ctx.fillText('Analyze experimental data tables to determine reaction order', canvas.width / 2, canvas.height / 2 + 40);
}

function drawHalfLifeMode() {
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#d4a574';
    ctx.font = '20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Half-Life Analysis Practice', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '16px Source Sans Pro';
    ctx.fillText('Click "Generate New Question" to start', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '14px Source Sans Pro';
    ctx.fillStyle = '#9c7853';
    ctx.fillText('Analyze concentration-time data to determine half-life', canvas.width / 2, canvas.height / 2 + 40);
}
