# Game Development Prompt: Cat Platformer Prototype

## Project Overview
Create a casual HTML5 platformer game prototype using Phaser.js. The game should feature a controllable cat character with sprite-based animations.

## Technical Requirements
- **Framework**: Phaser.js (latest stable version)
- **Platform**: HTML5 (single HTML file or simple project structure)
- **Game Type**: Platformer prototype

## Core Features

### 1. Cat Character Setup
- Load and display the cat character using sprite sheets from `assets/animations/cat/`
- Available sprite sheets:
  - `Idle-Stand-01-Sheet.png` - 8 frames for idle animation
  - `Walk-01-HeadHigh-Sheet.png` - walking animation frames
  - `Jump-01-Sheet.png` - jumping animation frames

### 2. Animation System
- Create animations for each sprite sheet:
  - **Idle**: Loop the idle animation when no input is detected
  - **Walk**: Play walking animation when moving horizontally
  - **Jump**: Play jump animation when jumping/falling
- Animations should automatically switch based on character state
- Default to idle animation when no input is active

### 3. Movement Controls
- **Left Arrow / A Key**: Move cat left
- **Right Arrow / D Key**: Move cat right
- **Space / Up Arrow**: Jump
- Implement basic physics (gravity, ground collision)
- Smooth horizontal movement with proper animation transitions

### 4. Animation State Management
- When no input is detected for a brief moment (e.g., 0.1-0.2 seconds), switch to idle animation
- When moving horizontally, play walk animation
- When jumping or in air, play jump animation
- Ensure smooth transitions between animation states

## Implementation Details

### Sprite Sheet Configuration
- Each sprite sheet needs proper frame dimensions specified
- Idle sprite sheet: 8 frames horizontally
- Configure frame width and height for proper sprite extraction
- Set appropriate frame rate for each animation (suggested: 8-12 fps for smooth but casual feel)

### Game Scene Structure
- Create a basic Phaser scene with:
  - Physics system (Arcade Physics recommended for simplicity)
  - Ground/platform for the cat to stand on
  - Cat sprite positioned on the ground
  - Input handlers for keyboard controls

### Visual Requirements
- Cat should face the direction of movement (flip sprite horizontally when moving left)
- Animations should loop appropriately (idle loops, walk loops, jump plays once or loops if held)
- Maintain sprite scale appropriate for a platformer (visible but not too large)

## Deliverables
1. HTML file with Phaser.js setup
2. JavaScript code implementing the game logic
3. Proper asset loading and animation configuration
4. Working movement controls
5. Automatic idle animation when no input

## Notes
- This is a prototype, so focus on core functionality over polish
- Keep code clean and well-commented for easy iteration
- Use Phaser 3.x API conventions
- Ensure the cat character is visible and animations are clearly distinguishable
