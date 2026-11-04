# ⚡ Pokémon Battle Simulator - Guided CSS Animation Lab

An interactive, retro Pokémon battle simulator built with **vanilla HTML, CSS, and JavaScript**, integrated with [PokeAPI](https://pokeapi.co/).

Designed specifically for **students to actively code CSS Animations and `@keyframes` step-by-step**.

---

## 📁 Project Architecture & Student Workflow

```text
├── index.html               # Battle arena, HUD cards, action buttons, & interactive Lab Drawer
├── animations.css           # ✏️ STUDENT WORKBOOK: Guided exercises with "/* 👉 YOUR CODE HERE */"
├── animations.solution.css  # 🔑 INSTRUCTOR REFERENCE: Complete working solutions
├── style.css                # Battle layout & retro Game Boy styling (Students don't need to touch this)
├── app.js                   # PokeAPI fetch, turn logic, and dynamic CSS class triggers
└── README.md                # Guide & curriculum instructions
```

---

## 🎯 How the Guided Lab Works for Students

1. Open [`animations.css`](animations.css) in your code editor.
2. In each Level (1 through 9), read the guided instructions and look for:
   ```css
   /* 👉 YOUR CODE HERE */
   ```
3. Complete the missing CSS properties:
   - **Step 1:** Define the timeline states inside `@keyframes` (`0%`, `50%`, `100%`) using `transform`, `opacity`, and `filter`.
   - **Step 2:** Attach the animation to the class using the `animation:` shorthand property.
4. Save the file and refresh your browser.
5. Click the **"🧪 Animation Lab"** button in the top-right corner to test each animation immediately. When you click any animation button, the in-drawer **Mission Guide** automatically reveals the syntax hints for that level!

---

## 📋 Guided Student Curriculum

| Level | Exercise Name | Target Selector & Keyframe | Guided Concepts |
|---|---|---|---|
| **Level 1** | **Idle Breathing Hover** | `.animate-idle`<br>`@keyframes idle-player` | `translateY(-10px)`, `scale(0.98, 1.02)`, `infinite alternate` |
| **Level 2** | **Pokéball Entrance Slide** | `.animate-entrance`<br>`@keyframes entrance-player` | `opacity: 0 -> 1`, `translateX(-120px -> 0)`, `filter: brightness(3)`, `forwards` |
| **Level 3** | **Physical Attack (Tackle)** | `.animate-tackle`<br>`@keyframes tackle-player` | 3-phase motion: backward wind-up $\rightarrow$ forward lunge $\rightarrow$ impact recoil |
| **Level 4** | **Special Attack Charge** | `.animate-special`<br>`@keyframes special-charge-player` | `filter: drop-shadow(...)`, `filter: brightness(...)`, rapid tremor scale |
| **Level 5** | **Taking Damage (Hurt)** | `.animate-damage`<br>`@keyframes damage-hit` | Rapid opacity flicker (`0.2 <-> 1`), red hit tint (`sepia`, `saturate`, `hue-rotate`) |
| **Level 6** | **Faint / Knockout Fall** | `.animate-faint`<br>`@keyframes faint-collapse` | Dizziness tilt $\rightarrow$ sink through platform $\rightarrow$ `animation-fill-mode: forwards` |
| **Level 7** | **Victory Celebration Jump** | `.animate-victory`<br>`@keyframes victory-jump` | Disney squash & stretch: landing squash (`scale(1.15, 0.85)`) $\leftrightarrow$ peak stretch (`scale(0.88, 1.12)`) |
| **Level 8** | **Screen Shake Shockwave** | `.arena-shake`<br>`@keyframes screen-shake` | Rapid `translate` offsets in multi-directional rumble on `#battle-stage` |
| **Level 9** | **Special VFX Blast** | `.projectile-shoot`<br>`@keyframes projectile-travel` | Coordinate traversal across arena (`top`, `left`, `rotate`, `scale`) |

---

## 💡 Quick Syntax Reference

### 1. The `animation` Shorthand
```css
.my-element {
  /* animation: [name] [duration] [timing-function] [iteration-count] [direction] [fill-mode]; */
  animation: idle-player 2s ease-in-out infinite alternate;
}
```

### 2. `@keyframes` Structure
```css
@keyframes tackle-player {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-25px, 8px) rotate(-6deg); /* Wind up backward */
  }
  50% {
    transform: translate(90px, -40px) rotate(10deg); /* Lunge forward */
  }
  100% {
    transform: translate(0, 0);                     /* Return home */
  }
}
```

---

## 🔍 Searching & Typing Custom Pokémon

Students can battle with **ANY of the 1,025+ official Pokémon** from the PokéAPI database:
- **Type any Pokémon name**: e.g., `sylveon`, `greninja`, `gengar`, `rayquaza`, `mew`, `ditto`, `iron-valiant`.
- **Type multi-word names**: Spaced names like `mr. mime`, `tapu koko`, and `ho-oh` are automatically formatted.
- **Type any Pokédex number**: e.g. `25` (Pikachu), `150` (Mewtwo), `448` (Lucario), `1` (Bulbasaur).
- **Interactive Autocomplete**: Built-in HTML5 `<datalist>` shows suggestions across all 9 generations as you type.
- **Keyboard Shortcut**: Press `Enter` in either search input to immediately launch the matchup!
- **🎲 Random Matchups**: Click the `🎲 Random` button to discover new pairings across generations.

---

## 🔑 Instructor Notes

- If a student gets stuck or wants to compare their work, [`animations.solution.css`](animations.solution.css) contains the complete reference implementation.
- You can swap the active stylesheet in [`index.html`](index.html#L21) anytime:
  ```html
  <!-- Switch between student workbook and solution: -->
  <link rel="stylesheet" href="animations.css">
  <!-- <link rel="stylesheet" href="animations.solution.css"> -->
  ```
