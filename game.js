/**
 * Main Game Logic for the Switch Game
 */

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    const game = new SwitchGame();
    game.init();
});

class SwitchGame {
    constructor() {
        this.scm = null;
        this.originalScm = null; // Store original SCM for Play Again
        this.numSwitches = 3;
        this.maxSteps = 5;
        this.gameOver = false;
        this.inTestPhase = false;
    }

    init() {
        // Initialize SCM
        this.scm = new SCM(this.numSwitches, this.maxSteps);
        // Store a copy of the original SCM for Play Again
        this.storeOriginalScm();
        
        // Add event listeners
        document.getElementById('observe-btn').addEventListener('click', () => this.observe());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('test-strategy-btn').addEventListener('click', () => this.testStrategy());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('close-hint-btn').addEventListener('click', () => this.closeHint());
        
        // Render the initial game state
        this.createSwitches();
        this.createTestSwitches();
        this.updateUI();
        
        // Log initial state
        this.logObservation('Game started! Try to turn on the light bulb.');
    }

    storeOriginalScm() {
        // Deep copy the SCM structure to use for Play Again
        this.originalScm = {
            nodes: JSON.parse(JSON.stringify(this.scm.nodes)),
            maxSteps: this.scm.maxSteps,
            numSwitches: this.scm.numSwitches
        };
    }

    createSwitches() {
        const switchesContainer = document.getElementById('switches-container');
        switchesContainer.innerHTML = '';
        
        // Create switch UI elements
        for (let i = 1; i <= this.numSwitches; i++) {
            const switchName = `Switch${i}`;
            const switchDiv = document.createElement('div');
            switchDiv.className = 'switch-container';
            
            // Create HTML for switch
            switchDiv.innerHTML = `
                <label class="switch">
                    <input type="checkbox" id="${switchName}-checkbox">
                    <span class="slider"></span>
                </label>
                <span class="switch-label">${switchName}: <span id="${switchName}-state">OFF</span></span>
            `;
            
            switchesContainer.appendChild(switchDiv);
            
            // Add event listener to switch
            const checkbox = document.getElementById(`${switchName}-checkbox`);
            checkbox.addEventListener('change', () => {
                if (this.gameOver || this.inTestPhase) {
                    checkbox.checked = !checkbox.checked; // Revert change if game is over or in test phase
                    return;
                }
                
                const action = {};
                action[switchName] = checkbox.checked ? 1 : 0;
                this.intervene(action);
            });
        }
    }

    createTestSwitches() {
        const testSwitchesContainer = document.getElementById('test-switches-container');
        testSwitchesContainer.innerHTML = '';
        
        // Create test switch UI elements
        for (let i = 1; i <= this.numSwitches; i++) {
            const switchName = `Switch${i}`;
            const switchDiv = document.createElement('div');
            switchDiv.className = 'switch-container';
            
            // Create HTML for test switch
            switchDiv.innerHTML = `
                <label class="switch">
                    <input type="checkbox" id="test-${switchName}-checkbox">
                    <span class="slider"></span>
                </label>
                <span class="switch-label">${switchName}</span>
            `;
            
            testSwitchesContainer.appendChild(switchDiv);
        }
    }

    updateUI() {
        // Get current state
        const observables = this.scm.getObservables();
        
        // Update switches
        for (let i = 1; i <= this.numSwitches; i++) {
            const switchName = `Switch${i}`;
            const switchState = observables[switchName];
            
            // Update checkbox
            const checkbox = document.getElementById(`${switchName}-checkbox`);
            checkbox.checked = switchState === 1;
            
            // Update state text
            const stateElement = document.getElementById(`${switchName}-state`);
            stateElement.textContent = switchState === 1 ? 'ON' : 'OFF';
        }
        
        // Update light bulb
        const lightBulbState = observables['LightBulb'];
        const lightBulb = document.getElementById('lightbulb');
        const lightBulbStateElement = document.getElementById('lightbulb-state');
        
        if (lightBulbState === 1) {
            lightBulb.classList.add('on');
            lightBulbStateElement.textContent = 'ON';
        } else {
            lightBulb.classList.remove('on');
            lightBulbStateElement.textContent = 'OFF';
        }
        
        // Update steps remaining
        document.getElementById('steps-remaining').textContent = this.scm.getStepsRemaining();
        
        // Update phase display
        document.getElementById('game-phase').textContent = this.inTestPhase ? 'Test' : 'Exploration';
        
        // Check if exploration phase is over and we need to transition to test phase
        if (this.scm.isDone() && !this.gameOver && !this.inTestPhase) {
            this.startTestPhase();
        }
    }

    intervene(action) {
        // Step the SCM with an intervention
        const observables = this.scm.step(action);
        
        // Log the intervention
        const actionStr = Object.entries(action)
            .map(([key, value]) => `${key} = ${value === 1 ? 'ON' : 'OFF'}`)
            .join(', ');
        this.logObservation(`Intervention: ${actionStr}`);
        
        // Update UI
        this.updateUI();
        
        // Log the result
        this.logCurrentState(observables);
    }

    observe() {
        // Step the SCM with no intervention (just observe)
        const observables = this.scm.step(null);
        
        // Log the observation
        this.logObservation('Observation (no intervention)');
        
        // Update UI
        this.updateUI();
        
        // Log the result
        this.logCurrentState(observables);
    }

    newGame() {
        // Reset game state
        this.gameOver = false;
        this.inTestPhase = false;
        
        // Hide test phase UI
        document.getElementById('test-phase-ui').style.display = 'none';
        
        // Show control buttons
        document.getElementById('observe-btn').style.display = 'inline-block';
        
        // Clear result message
        document.getElementById('result-message').textContent = '';
        
        // Create new SCM
        this.scm = new SCM(this.numSwitches, this.maxSteps);
        
        // Store a copy of the original SCM
        this.storeOriginalScm();
        
        // Recreate switches
        this.createSwitches();
        this.createTestSwitches();
        
        // Update UI
        this.updateUI();
        
        // Log new game
        this.logObservation('New game started! Try to turn on the light bulb.');
    }

    playAgain() {
        // Reset game state but keep the same SCM structure
        this.gameOver = false;
        this.inTestPhase = false;
        
        // Hide test phase UI
        document.getElementById('test-phase-ui').style.display = 'none';
        
        // Show control buttons
        document.getElementById('observe-btn').style.display = 'inline-block';
        
        // Clear result message
        document.getElementById('result-message').textContent = '';
        
        // Create new SCM with the same structure as the original
        this.scm = new SCM(this.numSwitches, this.maxSteps);
        this.scm.nodes = JSON.parse(JSON.stringify(this.originalScm.nodes));
        this.scm.stepsTaken = 0;
        
        // Initialize state and propagate
        this.scm.initializeState();
        this.scm.propagate();
        
        // Recreate switches
        this.createSwitches();
        this.createTestSwitches();
        
        // Update UI
        this.updateUI();
        
        // Log play again
        this.logObservation('Playing again with the same causal structure. Try to turn on the light bulb.');
    }

    startTestPhase() {
        this.inTestPhase = true;
        
        // Hide observe button (no more observations in test phase)
        document.getElementById('observe-btn').style.display = 'none';
        
        // Show test phase UI
        document.getElementById('test-phase-ui').style.display = 'block';
        
        // Log start of test phase
        this.logObservation('Exploration phase complete! Now enter your strategy to turn on the light.');
        
        // Update phase in UI
        this.updateUI();
    }

    testStrategy() {
        // Get the settings from test switches
        const strategy = {};
        for (let i = 1; i <= this.numSwitches; i++) {
            const switchName = `Switch${i}`;
            const checkbox = document.getElementById(`test-${switchName}-checkbox`);
            strategy[switchName] = checkbox.checked ? 1 : 0;
        }
        
        // Log the strategy
        const strategyStr = Object.entries(strategy)
            .map(([key, value]) => `${key} = ${value === 1 ? 'ON' : 'OFF'}`)
            .join(', ');
        this.logObservation(`Testing strategy: ${strategyStr}`);
        
        // Create a fresh instance of the SCM with the same structure
        const testSCM = new SCM(this.numSwitches, this.maxSteps);
        testSCM.nodes = this.scm.nodes; // Use the same structure/parameters
        testSCM.initializeState(); // Reset state (new random values for root nodes)
        testSCM.propagate(); // Initial propagation
        
        // Apply the strategy (intervention)
        testSCM.step(strategy);
        
        // Check if the strategy worked (light is on)
        const testResult = testSCM.getObservables()['LightBulb'] === 1;
        
        // Mark game as over
        this.gameOver = true;
        
        // Display result
        const resultElement = document.getElementById('result-message');
        if (testResult) {
            resultElement.textContent = '🎉 Success! Your strategy turned on the light!';
            resultElement.style.color = '#4CAF50'; // Green
        } else {
            resultElement.textContent = '❌ Your strategy failed to turn on the light. Try again!';
            resultElement.style.color = '#f44336'; // Red
        }
        
        // Log the result
        this.logObservation(testResult 
            ? 'Success! Your strategy turned on the light!'
            : 'Your strategy failed to turn on the light.');
    }

    endGame() {
        // Now we move to test phase instead of ending game
        this.startTestPhase();
    }

    showHint() {
        // Show the SCM visualization
        const vizElement = document.getElementById('scm-visualization');
        vizElement.style.display = 'block';
        
        // Generate text-based representation instead of graphical
        this.showStructuralFunctions();
        
        // Log hint shown
        this.logObservation('Hint: Ground truth causal model shown.');
    }
    
    showStructuralFunctions() {
        const vizContent = document.getElementById('viz-content');
        vizContent.innerHTML = ''; // Clear any previous content
        vizContent.style.padding = '20px';
        vizContent.style.overflowY = 'auto';
        vizContent.style.color = 'white';
        vizContent.style.fontFamily = 'monospace';
        vizContent.style.fontSize = '16px';
        
        // Get nodes
        const nodes = this.scm.nodes;
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Structural Causal Model (SCM)';
        title.style.color = 'white';
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        vizContent.appendChild(title);
        
        // Create container for the model description
        const modelContainer = document.createElement('div');
        modelContainer.style.backgroundColor = '#222';
        modelContainer.style.padding = '15px';
        modelContainer.style.borderRadius = '8px';
        modelContainer.style.marginBottom = '20px';
        vizContent.appendChild(modelContainer);
        
        // Add explanation
        const explanation = document.createElement('p');
        explanation.innerHTML = 'This diagram shows how each variable is caused by other variables:';
        explanation.style.marginBottom = '15px';
        modelContainer.appendChild(explanation);
        
        // Create a table to display the causal relationships
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        modelContainer.appendChild(table);
        
        // Create table header
        const thead = document.createElement('thead');
        table.appendChild(thead);
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="border: 1px solid #444; padding: 8px; text-align: left; background-color: #333;">Variable</th>
            <th style="border: 1px solid #444; padding: 8px; text-align: left; background-color: #333;">Depends On</th>
            <th style="border: 1px solid #444; padding: 8px; text-align: left; background-color: #333;">Probabilities</th>
        `;
        thead.appendChild(headerRow);
        
        // Create table body
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        
        // Sort nodes: first root nodes, then others
        const sortedNodes = [...nodes].sort((a, b) => {
            if (a.parents.length === 0 && b.parents.length > 0) return -1;
            if (a.parents.length > 0 && b.parents.length === 0) return 1;
            return 0;
        });
        
        // Add rows for each node
        for (const node of sortedNodes) {
            const row = document.createElement('tr');
            
            // Variable name cell
            const nameCell = document.createElement('td');
            nameCell.style.border = '1px solid #444';
            nameCell.style.padding = '8px';
            
            const nodeLabel = document.createElement('div');
            
            // Style based on node type
            if (node.name === 'LightBulb') {
                nodeLabel.style.backgroundColor = '#ffd700';
                nodeLabel.style.color = 'black';
            } else {
                nodeLabel.style.backgroundColor = '#2196F3';
                nodeLabel.style.color = 'white';
            }
            
            nodeLabel.style.padding = '5px';
            nodeLabel.style.borderRadius = '4px';
            nodeLabel.style.display = 'inline-block';
            nodeLabel.style.width = '100%';
            nodeLabel.style.textAlign = 'center';
            nodeLabel.textContent = node.name;
            
            nameCell.appendChild(nodeLabel);
            row.appendChild(nameCell);
            
            // Parents cell
            const parentsCell = document.createElement('td');
            parentsCell.style.border = '1px solid #444';
            parentsCell.style.padding = '8px';
            
            if (node.parents.length === 0) {
                parentsCell.textContent = 'None (root node)';
                parentsCell.style.fontStyle = 'italic';
                parentsCell.style.color = '#aaa';
            } else {
                node.parents.forEach((parent, idx) => {
                    const parentSpan = document.createElement('span');
                    parentSpan.style.backgroundColor = parent === 'LightBulb' ? '#ffd700' : '#2196F3';
                    parentSpan.style.color = parent === 'LightBulb' ? 'black' : 'white';
                    parentSpan.style.padding = '3px 5px';
                    parentSpan.style.borderRadius = '4px';
                    parentSpan.style.marginRight = '5px';
                    parentSpan.style.display = 'inline-block';
                    parentSpan.textContent = parent;
                    parentsCell.appendChild(parentSpan);
                    
                    if (idx < node.parents.length - 1) {
                        parentsCell.appendChild(document.createTextNode(', '));
                    }
                });
            }
            
            row.appendChild(parentsCell);
            
            // Probabilities cell
            const probsCell = document.createElement('td');
            probsCell.style.border = '1px solid #444';
            probsCell.style.padding = '8px';
            
            if (node.parents.length === 0) {
                probsCell.innerHTML = `P(${node.name}=1) = ${node.params.p.toFixed(2)}`;
            } else if (node.parents.length === 1) {
                const parent = node.parents[0];
                probsCell.innerHTML = `
                    P(${node.name}=1 | ${parent}=0) = ${node.params.p0.toFixed(2)}<br>
                    P(${node.name}=1 | ${parent}=1) = ${node.params.p1.toFixed(2)}
                `;
            } else {
                // For multiple parents, display all combinations
                const paramsKeys = Object.keys(node.params);
                paramsKeys.sort(); // Sort for consistent display
                
                probsCell.innerHTML = paramsKeys.map(key => {
                    const conditions = [];
                    for (let i = 0; i < node.parents.length; i++) {
                        conditions.push(`${node.parents[i]}=${key.substring(1)[i]}`);
                    }
                    return `P(${node.name}=1 | ${conditions.join(', ')}) = ${node.params[key].toFixed(2)}`;
                }).join('<br>');
            }
            
            row.appendChild(probsCell);
            tbody.appendChild(row);
        }
        
        // Add additional explanation
        const strategy = document.createElement('div');
        strategy.style.backgroundColor = '#2c3e50';
        strategy.style.padding = '15px';
        strategy.style.borderRadius = '8px';
        strategy.style.marginTop = '20px';
        
        strategy.innerHTML = `
            <h3 style="margin-top: 0; color: #3498db;">How to Use This Information:</h3>
            <ul style="margin-left: 20px; line-height: 1.5;">
                <li>Each row shows a variable and what affects it</li>
                <li>The probabilities show how likely the variable equals 1 (ON) given its parents' values</li>
                <li>To turn on the light bulb, set its parent switches to values that maximize P(LightBulb=1)</li>
                <li>Remember: when you intervene on a switch, you break its dependency on its parents</li>
            </ul>
        `;
        
        modelContainer.appendChild(strategy);
    }
    
    closeHint() {
        // Hide the SCM visualization
        document.getElementById('scm-visualization').style.display = 'none';
    }

    logObservation(message) {
        const log = document.getElementById('observations-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        // Add timestamp
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;
        
        // Add to log at the top
        log.insertBefore(entry, log.firstChild);
    }

    logCurrentState(observables) {
        let stateMessage = 'Current state: ';
        
        for (const [key, value] of Object.entries(observables)) {
            stateMessage += `${key} = ${value === 1 ? 'ON' : 'OFF'}, `;
        }
        
        // Remove trailing comma and space
        stateMessage = stateMessage.slice(0, -2);
        
        // Log the message
        this.logObservation(stateMessage);
    }
} 