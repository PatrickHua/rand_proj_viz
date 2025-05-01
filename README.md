# Causal Switch Game

A simple web-based game to explore causal relationships between switches and a light bulb in a structural causal model (SCM).

## How to Play

1. Open `index.html` in your web browser to start the game.
2. Your goal is to turn on the light bulb by manipulating the switches.
3. You have 5 steps (moves) to achieve your goal.
4. Each turn, you can either:
   - Flip one of the switches (intervention)
   - Press "Observe" to do nothing and observe the natural state (no intervention)
5. After 5 steps, the game ends and your score is calculated.

## Understanding the Game

This game is based on the concept of a Structural Causal Model (SCM):

- There are visible elements (switches and light bulb) that you can observe.
- There may be hidden variables that influence the behavior of the visible elements.
- The switches have causal relationships with the light bulb, but the exact relationships are unknown to you.
- Some switches might directly affect the light bulb, while others might not.
- There might be a hidden common cause that affects both switches and light bulb.

## Strategy Tips

1. **Systematic Exploration**: Try different combinations of switch positions to understand their effects.
2. **Observe Patterns**: The relationship between switches and the light bulb follows consistent rules within each game.
3. **Use Interventions Wisely**: When you intervene on a switch, you're breaking its normal causal relationships with its causes.
4. **Passive Observation**: Sometimes it's useful to just observe without intervention to see how the system naturally evolves.

## Technical Details

The game uses a randomly generated causal model each time you start a new game. The causal structure includes:
- A hidden variable (similar to "Motivation" in the Python example)
- Multiple switches (3 by default) that are influenced by the hidden variable
- A light bulb that may be influenced by some of the switches and/or the hidden variable

The probabilities are structured so that:
- When all relevant switches are in the correct position, the light bulb has a high probability of being on
- Different combinations of switch positions have different effects on the light bulb

## Scoring

- Success Bonus: +100 points if the light bulb is ON at the end
- Step Penalty: -10 points for each step taken

Enjoy exploring the world of causality through this simple game! 