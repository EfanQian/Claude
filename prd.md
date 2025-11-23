# Product Requirements Document (PRD)

**Product:** 2D Street Fighter-style Fighting Game  
**Platform:** PC (Single computer, two players local)  
**Date:** October 2025  

---

## Game Overview

A 2D fighting game inspired by Street Fighter. Two players play simultaneously on the same computer, each controlling a unique character. The game includes multiple characters, a lives system, diverse moves, menus, and instructional screens.

---

## Features

- **Two-Player Local Play**
  - Both players share one computer.
  - Each player has separate controls (e.g., keyboard keys or gamepads)[web:1].
- **Character Selection**
  - Roster of unique fighters, each with distinct moves, sprites, and animations.
  - Different strengths, weaknesses, and special abilities[web:2].
- **Lives System**
  - Players start with a fixed number of lives (e.g., 3).
  - Losing all health results in loss of one life.
  - First to reduce opponent’s lives to zero wins the match.
- **Diverse Moves & Combos**
  - Punches, kicks, blocks, special moves, and combo attacks.
  - Combos reward skilled, timed inputs.
  - Special moves may use an energy bar or cooldown.
- **Menus & Instructions**
  - Main menu with options: Start Game, Instructions, Character Select, Exit.
  - Dedicated instructions screen for controls and rules.
  - Pause menu during gameplay: Resume, Restart, Exit.
- **Visual & Audio**
  - 2D pixel-art or hand-drawn styles.
  - Background music and SFX (hits, blocks, special moves).
  - Visual effects for action feedback.

---

## Gameplay Mechanics

- **Controls**
  - Player 1: W/A/S/D (move), J/K/L (attack).
  - Player 2: Arrow keys (move), Numpad (attack)[web:2].
- **Health & Lives**
  - Health bars shown for both players.
  - Health depletion costs a life; round resets upon a lost life.
- **Rounds & Match Structure**
  - Multiple rounds until one player has no lives left.
  - Animated round transitions and match scores.

---

## CI/CD Success Checklist

### Continuous Integration

- [ ] All code commits pass automated unit tests for gameplay logic.
- [ ] All character assets (sprites, moves, sounds) load without errors.
- [ ] Build process compiles without critical errors or warnings.
- [ ] UI automation verifies functional navigation (menus, instructions).
- [ ] Performance check maintains smooth framerate under load.

### Continuous Deployment

- [ ] Testing builds include all new/updated assets.
- [ ] Game launches cleanly on intended target platform.
- [ ] Two-player input confirmed working from single machine.
- [ ] All audio/visual effects operational in deployment build.
- [ ] Bug tracking and resolution for critical/blocker issues prior to each release.

---

**References:**  
- [Classic Street Fighter mechanics][web:1]  
- [Best practices in 2D fighting game design][web:2]  
