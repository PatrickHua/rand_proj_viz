/**
 * Structural Causal Model (SCM) implementation for the Switch Game
 */

class SCM {
    constructor(numSwitches = 3, maxSteps = 5) {
        this.numSwitches = numSwitches;
        this.maxSteps = maxSteps;
        this.stepsTaken = 0;
        this.state = {};
        this.nodes = [];
        this.generateModel();
    }

    /**
     * Generate a random structural causal model
     * Creates a Directed Acyclic Graph (DAG) with switches and a light bulb
     */
    generateModel() {
        // Reset state
        this.nodes = [];
        this.state = {};
        this.stepsTaken = 0;

        // Add switches (intervenable, observable)
        for (let i = 1; i <= this.numSwitches; i++) {
            const switchNode = {
                name: `Switch${i}`,
                parents: [], // Will be filled in later
                dist: "Bernoulli",
                params: {}, // Will be filled in later
                observable: true,
                intervenable: true
            };
            this.nodes.push(switchNode);
        }

        // Add light bulb (not intervenable, observable)
        const lightBulb = {
            name: "LightBulb",
            parents: [], // Will be filled in later
            dist: "Bernoulli",
            params: {}, // Will be filled in later
            observable: true,
            intervenable: false
        };
        this.nodes.push(lightBulb);

        // Generate a random DAG structure
        this.generateRandomDAG();
        
        // Initialize state for root nodes
        this.initializeState();
        
        // Do initial propagation
        this.propagate();
        
        console.log("Generated SCM:", this.nodes);
        console.log("Initial state:", this.state);
    }

    /**
     * Generate a random Directed Acyclic Graph (DAG)
     */
    generateRandomDAG() {
        const allNodes = this.nodes;
        
        // Randomly order nodes for topological sorting (ensures acyclicity)
        const nodeOrder = [...Array(allNodes.length).keys()];
        this.shuffleArray(nodeOrder);
        
        // For each node, randomly choose parents from nodes that come before it in the order
        for (let i = 0; i < nodeOrder.length; i++) {
            const currentNodeIndex = nodeOrder[i];
            const currentNode = allNodes[currentNodeIndex];
            
            // Can only have parents from nodes that come before in the topological order
            // This ensures we have a DAG (no cycles)
            const possibleParentIndices = nodeOrder.slice(0, i);
            
            // Randomly decide how many parents this node will have
            // Between 0 and min(2, possibleParentIndices.length) to keep it manageable
            const numParents = Math.min(2, possibleParentIndices.length);
            
            if (numParents > 0 && Math.random() < 0.8) { // 80% chance to have parents if possible
                // Randomly select parents
                this.shuffleArray(possibleParentIndices);
                const selectedParentIndices = possibleParentIndices.slice(0, numParents);
                
                // Add parent references
                currentNode.parents = selectedParentIndices.map(idx => allNodes[idx].name);
                
                // Generate parameters for conditional probabilities
                const paramsObj = {};
                const totalCombinations = Math.pow(2, currentNode.parents.length);
                
                for (let j = 0; j < totalCombinations; j++) {
                    // Convert to binary representation of parent states
                    const binaryStr = j.toString(2).padStart(currentNode.parents.length, '0');
                    
                    // For light bulb, make certain combinations highly likely to turn it on
                    if (currentNode.name === "LightBulb") {
                        // If all parents are 1, high chance of light being on
                        if (binaryStr.indexOf('0') === -1) {
                            paramsObj[`p${binaryStr}`] = 0.9 + Math.random() * 0.1; // 90-100%
                        } else if (binaryStr.split('1').length > binaryStr.length / 2) {
                            paramsObj[`p${binaryStr}`] = 0.4 + Math.random() * 0.5; // 40-90%
                        } else {
                            paramsObj[`p${binaryStr}`] = Math.random() * 0.3; // 0-30%
                        }
                    } else {
                        // For switches, more balanced probabilities
                        paramsObj[`p${binaryStr}`] = 0.3 + Math.random() * 0.4; // 30-70%
                    }
                }
                
                currentNode.params = paramsObj;
            } else {
                // No parents, use a simple probability
                currentNode.parents = [];
                currentNode.params = { p: 0.5 }; // 50% chance for root nodes
            }
        }
        
        // Ensure light bulb has at least one parent (more interesting game)
        const lightBulb = allNodes.find(node => node.name === "LightBulb");
        if (lightBulb.parents.length === 0 && allNodes.length > 1) {
            // Pick a random switch as parent
            const switches = allNodes.filter(node => node.name.startsWith("Switch"));
            const randomSwitch = switches[Math.floor(Math.random() * switches.length)];
            
            lightBulb.parents = [randomSwitch.name];
            lightBulb.params = {
                p0: 0.1 + Math.random() * 0.2, // 10-30% if parent is 0
                p1: 0.7 + Math.random() * 0.3  // 70-100% if parent is 1
            };
        }
    }
    
    /**
     * Shuffle array in place (Fisher-Yates algorithm)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Initialize state for root nodes (nodes with no parents)
     */
    initializeState() {
        this.state = {};
        for (const node of this.nodes) {
            if (node.parents.length === 0) {
                this.state[node.name] = this.sampleNode(node);
            }
        }
    }

    /**
     * Sample a value for a node based on its distribution and parent values
     */
    sampleNode(node) {
        if (node.dist === "Bernoulli") {
            if (node.parents.length === 0) {
                // For nodes without parents
                const p = node.params.p;
                return Math.random() < p ? 1 : 0;
            } else {
                // For nodes with parents, construct a key based on parent values
                let parentKey = "";
                for (const parent of node.parents) {
                    parentKey += this.state[parent];
                }
                
                const p = node.params[`p${parentKey}`];
                return Math.random() < p ? 1 : 0;
            }
        }
        throw new Error(`Distribution ${node.dist} not supported.`);
    }

    /**
     * Propagate the SCM forward after an intervention or observation
     */
    propagate(interventionVars = new Set()) {
        // Collect all nodes with parents
        const pending = new Set(
            this.nodes
                .filter(node => node.parents.length > 0)
                .map(node => node.name)
        );
        
        // Remove nodes that were just intervened upon
        for (const varName of interventionVars) {
            pending.delete(varName);
        }
        
        // Process nodes until none are pending
        while (pending.size > 0) {
            let updated = false;
            
            for (const nodeName of [...pending]) {
                const node = this.nodes.find(n => n.name === nodeName);
                
                // Check if all parents of this node have values
                const parentsHaveValues = node.parents.every(parent => this.state[parent] !== undefined);
                
                if (parentsHaveValues) {
                    this.state[nodeName] = this.sampleNode(node);
                    pending.delete(nodeName);
                    updated = true;
                }
            }
            
            if (!updated && pending.size > 0) {
                console.error("Failed to propagate: possible cyclic dependency or missing values");
                return;
            }
        }
    }

    /**
     * Take a step in the environment:
     * - If action is provided: intervene on variables.
     * - If no action: observe natural evolution by resampling exogenous noise.
     */
    step(action = null) {
        this.stepsTaken++;
        
        const interventionVars = new Set();
        
        if (action) {
            // Apply interventions
            for (const [varName, value] of Object.entries(action)) {
                const node = this.nodes.find(n => n.name === varName);
                if (node && node.intervenable) {
                    this.state[varName] = value;
                    interventionVars.add(varName);
                }
            }
        } else {
            // Resample root nodes (no intervention)
            for (const node of this.nodes) {
                if (node.parents.length === 0) {
                    this.state[node.name] = this.sampleNode(node);
                }
            }
        }
        
        // Propagate changes
        this.propagate(interventionVars);
        
        // Return observable variables
        return this.getObservables();
    }

    /**
     * Get all observable variables
     */
    getObservables() {
        const observables = {};
        for (const node of this.nodes) {
            if (node.observable) {
                observables[node.name] = this.state[node.name];
            }
        }
        return observables;
    }

    /**
     * Get all intervenable variables
     */
    getIntervenables() {
        return this.nodes
            .filter(node => node.intervenable)
            .map(node => node.name);
    }

    /**
     * Check if game is over (max steps reached)
     */
    isDone() {
        return this.stepsTaken >= this.maxSteps;
    }

    /**
     * Get steps remaining
     */
    getStepsRemaining() {
        return this.maxSteps - this.stepsTaken;
    }

    /**
     * Get goal values for winning the game
     */
    getGoal() {
        return {
            target: "LightBulb",
            goal_value: 1
        };
    }

    /**
     * Compute reward based on goal achievement
     */
    computeReward() {
        const { target, goal_value } = this.getGoal();
        let reward = 0;
        
        // Success bonus if light is on
        if (this.state[target] === goal_value) {
            reward += 100;
        }
        
        // Step penalty
        reward += -10 * this.stepsTaken;
        
        return reward;
    }
} 