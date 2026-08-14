# 🚤 3D Lake Portfolio — Kartikaye Chaturvedi

An interactive, 3D WebGPU lake portfolio built with **Three.js (WebGPU / TSL)**, **Rapier3D Physics**, **GSAP**, and **Vite**. Navigate a motorboat across an open lake, explore interactive islands, and view software engineering projects, socials, and biography in full 3D.

---

## 🌟 Overview

The portfolio drops the visitor into a peaceful 3D lake surrounded by mountain shorelines and three distinct interactive island destinations:

1. **🔬 Lab Island (`36, 0, -20`)**:
   - Raised timber stage platform featuring a 3D Workstation Showcase.
   - Interactive project billboard with architecture breakdown, live tech stack tags, repository links, and an interactive 3D project carousel rack.
   - Wide cinematic camera zoom on **`[ENTER]`** or billboard click, cycling projects with **`[A]` / `[D]`** or arrows, and smooth return with **`[ESC]`**.

2. **🏝️ Socials Island (`-36, 0, -22`)**:
   - Sculpted lush island featuring interactive floating diamonds linking directly to **GitHub**, **LinkedIn**, **LeetCode**, and **GeeksforGeeks**.

3. **👤 About Island (`-30, 0, 24`)**:
   - Personal biography island detailing software engineering background, systems architecture experience, and skillsets.

4. **🏖️ Spawn Beach Pier (`0, 0, 66.5`)**:
   - Boardwalk pier anchored directly to the southern boundary beach path, providing an open boat harbor and launch dock facing north into the lake.

---

## 🎮 Controls & Navigation

| Control | Action |
| :--- | :--- |
| **`W` / `↑`** | Propel motorboat forward |
| **`S` / `↓`** | Reverse boat |
| **`A` / `←`** | Steer rudder left |
| **`D` / `→`** | Steer rudder right |
| **`Shift`** | **Nitro Boost** (Engages dual electric cyan jet flames & speed sparks) |
| **`Enter` / `Space`** | Interact with nearest diamond / Zoom into Lab Workstation |
| **`Esc`** | Exit cinematic showcase & return camera to boat |
| **`R`** | Reset boat position to Spawn Beach Pier |
| **Mouse / Raycast** | Click directly on islands, projects, and UI buttons |

---

## 🛠️ Technology Stack

- **Rendering Engine**: [Three.js](https://threejs.org/) (WebGPU Renderer & Three Shading Language / TSL)
- **Physics Engine**: [@dimforge/rapier3d](https://rapier.rs/) (Fast, deterministic WebAssembly physics)
- **Animation & Transitions**: [GSAP](https://greensock.com/gsap/) (Smooth cinematic camera transitions)
- **Build Tool**: [Vite](https://vitejs.dev/) (Instant HMR & optimized production bundle)
- **Styling**: Modern CSS with backdrop-filter glassmorphism, responsive typography, and HUD overlays.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Modern Web browser with WebGPU / WebGL2 support (Chrome, Edge, Safari 18+, Firefox Nightly)

### Installation

```bash
# Navigate to the project directory
cd lake-portfolio

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

### Building for Production

```bash
npm run build
```

The optimized production output will be generated in the `dist/` directory.

---

## 📁 Architecture & File Structure

```
lake-portfolio/
├── sources/
│   ├── index.html                 # Main HTML entry & HUD overlays
│   ├── index.js                   # Application bootstrap
│   ├── style.css                  # Modern glassmorphism UI & HUD styling
│   └── Game/
│       ├── Game.js                # Core game orchestrator & singleton
│       ├── View.js                # Dynamic camera system (Overview, Follow, Cinematic)
│       ├── InteractivePoints.js   # 3D floating markers & proximity HUD toasts
│       ├── Map.js                 # Radar HUD minimap & fullscreen destination map
│       ├── RayCursor.js           # 3D mouse raycasting & interactive click targets
│       ├── Inputs/
│       │   ├── Inputs.js          # Unified input manager
│       │   └── Keyboard.js        # WASD, Arrow, Shift, Enter, Esc key handlers
│       ├── Physics/
│       │   ├── Physics.js         # Rapier3D world & 96-segment coastline colliders
│       │   └── Boat.js            # Hydrodynamic boat propulsion & rudder physics
│       ├── World/
│       │   ├── World.js           # World systems orchestrator
│       │   ├── Lake.js            # High-fidelity Gerstner wave shader & normal maps
│       │   ├── Wake.js            # Unified continuous V-wake ribbon foam wash
│       │   ├── BoostEffect.js     # Nitro jet exhaust flames, glow light & sparks
│       │   ├── Shoreline.js       # High-resolution boundary mountain terrain
│       │   ├── Islands.js         # 100% radial disc sculpted organic islands
│       │   ├── Trees.js           # Low-poly pine and deciduous tree clusters
│       │   ├── Props.js           # Beach pier boardwalk & island docks
│       │   ├── Sky.js             # Atmosphere gradient sky dome
│       │   ├── Lighting.js        # Directional sun, ambient light & soft shadows
│       │   ├── Fog.js             # Atmospheric depth fog
│       │   └── Wind.js            # Procedural wind turbulence simulation
│       └── Zones/
│           ├── Zones.js           # Island zone trigger detector
│           └── LabIsland.js       # 3D Lab Workstation, stage platform & showcase
├── static/                        # Static 3D models, textures, icons, and audio
├── FUTURE_STEPS.md                # Roadmap for visual & fidelity upgrades
├── package.json
└── vite.config.js
```

---

## 👤 Author

**Kartikaye Chaturvedi**
- **GitHub**: [github.com/Karrtik12](https://github.com/Karrtik12?tab=repositories)
- **LinkedIn**: [linkedin.com/in/kartikaye-chaturvedi](https://www.linkedin.com/in/kartikaye-chaturvedi/)
- **LeetCode**: [leetcode.com/u/KartikkChaturvedi](https://leetcode.com/u/KartikkChaturvedi/)
- **GeeksforGeeks**: [geeksforgeeks.org/profile/noobcoder5](https://www.geeksforgeeks.org/profile/noobcoder5?tab=activity)
