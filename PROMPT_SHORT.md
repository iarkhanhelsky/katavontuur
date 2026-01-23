# Concise Prompt (Copy-Paste Ready)

Create a casual HTML5 platformer game prototype using Phaser.js with the following requirements:

**Technical Stack:**
- HTML5 and Phaser.js (latest version)
- Single HTML file or simple project structure

**Core Features:**

1. **Cat Character & Animations:**
   - Load cat sprite sheets from `assets/animations/cat/`:
     - `Idle-Stand-01-Sheet.png` (8 frames) - idle animation
     - `Walk-01-HeadHigh-Sheet.png` - walking animation  
     - `Jump-01-Sheet.png` - jumping animation
   - Configure each sprite sheet with proper frame dimensions
   - Create looping animations for idle and walk, single/loop for jump

2. **Movement Controls:**
   - Left/Right arrows (or A/D keys): Move cat horizontally
   - Space/Up arrow: Jump
   - Implement basic physics (gravity, ground collision)

3. **Animation State Management:**
   - **Idle**: Play idle animation when no input detected (after ~0.1-0.2s of no input)
   - **Walk**: Play walk animation when moving horizontally
   - **Jump**: Play jump animation when jumping/in air
   - Cat sprite should face movement direction (flip horizontally when moving left)
   - Smooth transitions between animation states

4. **Game Scene:**
   - Basic Phaser scene with Arcade Physics
   - Ground/platform for cat to stand on
   - Cat positioned on ground, visible and properly scaled

**Deliverables:** Working HTML file with embedded JavaScript, proper asset loading, and all animations functional.
