# 🚀 Future Steps & Visual Enhancements Roadmap

This document outlines the planned aesthetic, visual, and architectural improvements to elevate the **3D Lake Portfolio** from its current low-poly foundation into a state-of-the-art, photorealistic/stylized interactive experience.

---

## 🚤 1. Boat & Watercraft Visuals

- [ ] **High-Fidelity 3D Boat Model**:
  - Replace the geometric boat placeholder with a custom-crafted, high-detail watercraft model (e.g., a classic mahogany runabout, luxury modern speedcraft, or futuristic cyber-skiff).
  - PBR materials: polished varnished wood planks, chrome cleats, windshield with glass reflections, leather seating, and illuminated dashboard gauges.
- [ ] **Propeller & Motor Animations**:
  - Rotating outboard motor propeller with motion blur and RPM scaling linked directly to throttle input.
  - Realistic motor steering pivot reacting dynamically to rudder input.
- [ ] **Hydrodynamic Multi-Point Buoyancy Physics**:
  - Implement 4-point hull raycasting onto the lake wave heightfield to simulate authentic watercraft physics:
    - **Bow Rise**: Hull tilts upward on rapid acceleration.
    - **Corner Lean / Roll**: Boat banks realistically into high-speed turns.
    - **Wave Heave & Pitch**: Boat crests over swells and splashes into troughs.
- [ ] **Boat Customization**:
  - Allow visitors to toggle between different boat models, colorways, or hull decals at the Spawn Beach Pier.

---

## 🌊 2. Water & Ocean Surface Fidelity

- [ ] **Real-Time Planar / Screen-Space Reflections (SSR)**:
  - Add real-time reflections of islands, sky, trees, and boat hull on the lake surface.
- [ ] **Animated Water Caustics**:
  - Project dynamic caustics light patterns onto shallow beach sands, underwater island shelves, and submerged pier pilings.
- [ ] **Translucent Subsurface Scattering (SSS) & Depth Fog**:
  - Integrate volumetric water extinction and Rayleigh scattering so water looks crystal-clear turquoise near beaches and deep indigo in lake depths.
- [ ] **Shoreline Foam & Breaking Waves**:
  - Procedural white shore foam ribbons where lake water meets sandy beaches.
  - Crest spray mist and splashes when navigating at high speeds.

---

## 🏝️ 3. Terrain, Foliage & Environment Aesthetics

- [ ] **Multi-Layer PBR Terrain Texturing**:
  - Splat map shaders combining procedural wet sand, lush mossy grass, exposed granite cliff faces, and mountain snow.
  - Displacement mapping for realistic rock cracks and shoreline pebbles.
- [ ] **Volumetric Foliage & Grass Blades**:
  - Instanced 3D grass blade carpets on island plateaus with wind wave deformation.
  - Stylized birch, willow, and pine trees with swaying branch skeletons and falling leaf particles.
- [ ] **Atmospheric Environment & Weather Cycles**:
  - Dynamic Time-of-Day cycle (Warm Golden Hour $\to$ Dusky Sunset $\to$ Starry Night with Aurora Borealis).
  - Volumetric Rayleigh sky scattering, soft God rays breaking through mountain peaks, and drifting 3D clouds.
  - Optional weather modes (Gentle Rain with ripples on water, Lake Mist/Fog, Night Fireflies).
- [ ] **Rich Island Props & Storytelling**:
  - Cozy campfires with glowing embers and smoke plumes.
  - Warm hanging lanterns on piers and island gazebos.
  - Ancient stone archways and decorative ruins scattered on About Island.

---

## 🔬 4. Lab Island & Project Showcase Experience

- [ ] **Holographic 3D Project Projections**:
  - Floating 3D holographic diagrams and architecture models hovering above the workstation.
- [ ] **Interactive In-World Terminal / CLI**:
  - An interactive terminal screen on the billboard allowing visitors to run commands, inspect architecture pipelines, or trigger demo scripts.
- [ ] **Live Interactive Web Previews**:
  - Embedded iframe / WebGL render target showing live demo previews of featured applications.
- [ ] **Particle Energy Beams**:
  - Sci-fi laboratory effects: glowing conduits, floating data orbs, and neon circuit pulses.

---

## 🎵 5. Audio & Sound Design

- [ ] **Dynamic Spatial Watercraft Audio**:
  - Outboard engine audio with authentic pitch modulation scaling with throttle, reverse, and Nitro boost.
  - Hull water cutting, lap, and wave splash sounds.
- [ ] **Ambient Lake Soundscape**:
  - Gentle wind breezes, distant birds, chirping crickets at dusk, and soft water shore sounds.
- [ ] **Interactive Sound Effects**:
  - High-tech chimes and interface clicks on project inspection and carousel cycling.

---

## 📱 6. Mobile & Performance Optimizations

- [ ] **Virtual On-Screen Touch Controls**:
  - Floating touch joystick for steering and touch pedals for throttle/boost on mobile and tablet devices.
- [ ] **Level of Detail (LOD) & Occlusion Culling**:
  - Seamless LOD reduction for distant trees, islands, and props to maintain locked 60+ FPS on all devices.
- [ ] **Cinematic Post-Processing Pipeline**:
  - Subtle bloom on lights and diamonds.
  - Depth of Field (DoF) focusing on the billboard during showcase mode.
  - Speed streaks and chromatic aberration during Nitro boost.
