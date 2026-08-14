export default [
    {
        id: 'stm32-linux',
        title: 'STM32 Simulated Linux',
        subtitle: 'POSIX Compatibility Layer',
        category: 'Systems & Embedded',
        description: 'Architected a lightweight POSIX compatibility shim on FreeRTOS to simulate a Linux execution environment on MMU-less ARM Cortex-M microcontrollers. Includes thread-safe pthreads, BSD sockets, interrupt-driven Ethernet, and a concurrent HTTP server within 152 KB RAM.',
        highlights: ['65.3 KB Flash / 152 KB RAM', 'pthreads & BSD Sockets', 'QEMU Cortex-M3 Simulation'],
        stack: ['C', 'FreeRTOS', 'LwIP', 'POSIX Threads', 'BSD Sockets', 'QEMU', 'ARM Cortex-M3', 'GNU Toolchain'],
        link: 'https://github.com/Akshat1508/STM32-Simulated-Linux'
    },
    {
        id: 'microservice-benchmark',
        title: 'Microservice Benchmark Generator',
        subtitle: 'Multi-Cloud Evaluation Harness',
        category: 'Cloud & DevOps',
        description: 'Engineered an 11-tier microservice evaluation harness across Azure Public Cloud, Baadal Private Cloud, Multi-Cloud (Azure+GCP), and K3s Edge nodes with a zero-trust Tailscale VPN overlay mesh and automated Locust load benchmarking.',
        highlights: ['11-Tier Benchmark Harness', 'Zero-Trust Tailscale Mesh', '-76% p99 Latency via Auto-Scaling'],
        stack: ['Kubernetes', 'Grafana', 'Prometheus', 'Locust', 'Docker', 'HydraGen', 'µBench', 'K3s', 'Azure'],
        link: 'https://github.com/Karrtik12/MicroService-Monitoring-System'
    },
    {
        id: 'chainsight-ai',
        title: 'ChainSight-AI',
        subtitle: 'Network-Aware Supply Chain Intelligence',
        category: 'AI & Machine Learning',
        description: 'Developed a spatiotemporal Heterogeneous Graph Neural Network modeling supply chain ecosystems across 41 product nodes and 4 multi-relational edge layers over 221 days, fusing GRU sequence encoders with multi-head GAT for risk propagation mapping.',
        highlights: ['0.9049 F1-Score (+4.46%)', '-11.03% RMSE Error', 'Dynamic Risk Propagation Maps'],
        stack: ['PyTorch', 'PyTorch Geometric', 'HeteroData', 'GNN / GAT', 'GRU', 'Python', 'NetworkX', 'Scikit-Learn'],
        link: 'https://github.com/Karrtik12/ChainSight-AI'
    },
    {
        id: 'chaosdr-operator',
        title: 'ChaosDR Operator',
        subtitle: 'Autonomous Multi-Cloud DR Controller',
        category: 'Cloud & Systems',
        description: 'Architected an autonomous Kubernetes Operator executing cross-cloud disaster recovery failover with Velero and MinIO S3 object storage across simulated primary and secondary Kind environments, achieving a 2.03-second RTO.',
        highlights: ['2.03s RTO Recovery', '>90% Failover Latency Cut', 'Declarative DRPolicy CRD'],
        stack: ['Python', 'Kubernetes', 'Kopf', 'Velero', 'Prometheus', 'MinIO', 'Docker', 'Kind', 'CRDs'],
        link: 'https://github.com/Karrtik12/ChaosDR-Operator'
    },
    {
        id: 'carbon-scheduler',
        title: 'Carbon-Aware K8s Scheduler',
        subtitle: 'Temporal & Spatial Grid Optimization',
        category: 'Cloud & Infrastructure',
        description: 'Architected a Kubernetes Scheduler Extender executing temporal deferral and spatial node scoring powered by real-time electricity grid carbon intensity data (gCO2eq/kWh), slashing delay-tolerant batch workload emissions by ~64%.',
        highlights: ['~64% Carbon Footprint Reduction', '24.6ms Extender Latency', 'Zero SLA Impact'],
        stack: ['Python', 'FastAPI', 'Pydantic v2', 'Kubernetes', 'Kind', 'Prometheus', 'Grafana', 'Docker', 'Pytest'],
        link: 'https://github.com/Karrtik12/Carbon-Aware-Kubernetes-Scheduler'
    },
    {
        id: 'polyguard-vlm-plus',
        title: 'PolyGuard-VLM Plus',
        subtitle: 'Multimodal Guardrail & VLM Proxy',
        category: 'AI Security & Systems',
        description: 'Architected security middleware protecting Vision-Language Models against cross-lingual prompt injections across 109+ low-resource languages and visual image meme jailbreaks using OpenCLIP and topological intent graphs.',
        highlights: ['109+ Low-Resource Languages', '512-dim Multimodal Fusion', '15–45ms Inspection Overhead'],
        stack: ['PyTorch', 'OpenCLIP', 'SentenceTransformers', 'NetworkX', 'PyG', 'FastAPI', 'HTTPX', 'Scikit-Learn'],
        link: 'https://github.com/Karrtik12/PolyGuard-VLM_Plus'
    },
    {
        id: 'stm32-speaking-clock',
        title: 'STM32 Speaking Clock',
        subtitle: 'Network-Synchronized RTOS Firmware',
        category: 'Systems & Embedded',
        description: 'Architected a network-synchronized speaking clock firmware on ARM Cortex-M7 emulated in QEMU running FreeRTOS v11.1 and lwIP within a strict 64 KB heap budget, parsing NTP time and streaming serialized speech tokens to a Python TTS bridge.',
        highlights: ['Strict 64 KB Heap Limit', 'LAN9118 Ethernet via MMIO', '90–371ms Voice Latency'],
        stack: ['C', 'FreeRTOS', 'lwIP', 'UDP / NTP', 'QEMU', 'ARM Cortex-M7', 'Python', 'pyttsx3', 'Makefile'],
        link: 'https://github.com/Karrtik12/STM32-Speaking-Clock'
    },
    {
        id: 'polyguard-vlm',
        title: 'PolyGuard-VLM',
        subtitle: 'Multilingual Jailbreak Defense Layer',
        category: 'AI Security & Systems',
        description: 'Engineered a real-time adversarial defense guardrail layer protecting Vision-Language Models against cross-lingual prompt injections across 109+ low-resource languages using LaBSE sentence encoders, topological intent graphs, and KDE risk scoring.',
        highlights: ['100% Test Detection Accuracy', '20–25ms Average Latency', 'Zero Weight Fine-Tuning'],
        stack: ['PyTorch', 'Transformers', 'SentenceTransformers', 'NetworkX', 'PyG', 'FastAPI', 'Scikit-Learn', 'Python'],
        link: 'https://github.com/Karrtik12/PolyGuard-VLM'
    },
    {
        id: 'resume-screening-ml',
        title: 'Resume Screening & ML Fairness',
        subtitle: 'Auditing & Explainable Screening',
        category: 'AI & Data Science',
        description: 'Architected a modular production ML package fusing unstructured TF-IDF text vectors with candidate requirement gap metrics, integrating demographic fairness auditing for Equalized Odds and an adversarial robustness attack suite.',
        highlights: ['70.6% Test Accuracy (+7.5%)', 'Demographic Fairness Auditing', '50% Cut in Attack Vulnerability'],
        stack: ['Python', 'Scikit-Learn', 'NLP (TF-IDF)', 'Pandas', 'NumPy', 'Matplotlib', 'Gender-Guesser'],
        link: 'https://github.com/Karrtik12/AutoResume-Screening'
    },
    {
        id: 'fibonacci-heap',
        title: 'Fibonacci Heap in C++',
        subtitle: 'From-Scratch Data Structure',
        category: 'Algorithms & Data Structures',
        description: 'Engineered a low-level, from-scratch C++ implementation of Fibonacci Heap priority queues following CLRS algorithms, featuring circular doubly-linked node management, cascading cuts, and an ASCII tree visualization engine.',
        highlights: ['O(1) Amortized Insertion', 'O(log n) Amortized Deletion', 'ASCII Forest Tree Visualizer'],
        stack: ['C++', 'Data Structures', 'Algorithms', 'Memory Management', 'Linux'],
        link: 'https://github.com/Karrtik12/Fibonacci-Heap-CPP'
    },
    {
        id: 'risc-alu',
        title: '32-bit Single-Cycle RISC ALU',
        subtitle: 'Processor Core & Arithmetic Unit',
        category: 'Hardware & Architecture',
        description: 'Designed and integrated a single-cycle 32-bit RISC CPU core and high-speed ALU in Verilog featuring a 32-bit Kogge-Stone Parallel-Prefix Adder (2.19ns critical path delay) and a Radix-4 Booth-Dadda 32x32 multiplier.',
        highlights: ['2.19ns Kogge-Stone Adder', 'Radix-4 Booth-Dadda Multiplier', '100% Pass on 35+ CPU Tests'],
        stack: ['Verilog', 'Icarus Verilog', 'Python', 'Makefile', 'Xilinx Vivado', 'GTKWave'],
        link: 'https://github.com/Karrtik12/32bit_ALU_Single_Cycle_RISC'
    },
    {
        id: 'fletnix',
        title: 'FletNix',
        subtitle: 'Media Streaming Catalogue',
        category: 'Full-Stack Web',
        description: 'Architected a full-stack media catalogue application serving 1,000+ movie and TV show titles with sub-100ms API response times, Node.js REST APIs with indexed MongoDB multi-field search, and JWT role-based access control.',
        highlights: ['1,000+ Titles Served', '<100ms API Response Time', 'JWT Role-Based Auth'],
        stack: ['Angular', 'Node.js', 'Express.js', 'MongoDB', 'Material UI', 'JWT'],
        link: 'https://github.com/Karrtik12/FletNix'
    },
    {
        id: 'youtube-lite',
        title: 'YouTube Lite',
        subtitle: 'Real-Time Video Client',
        category: 'Frontend & Web',
        description: 'High-performance YouTube web client leveraging RapidAPI for real-time video streaming, metadata extraction, debounced instant search, dynamic category feeds, and custom embedded video playback controls.',
        highlights: ['40% Frontend Speed Gain', 'Debounced Instant Search', 'Responsive Player Controls'],
        stack: ['React.js', 'Tailwind CSS', 'RapidAPI', 'JavaScript', 'HTML5 Video'],
        link: 'https://github.com/Karrtik12/youtube-lite'
    },
    {
        id: 'travel-forecast',
        title: 'TravelForecast',
        subtitle: 'Location Intelligence Platform',
        category: 'Frontend & Web',
        description: 'Interactive location intelligence platform integrating Google Maps API and RapidAPI to query nearby restaurants, hotels, and attractions, rendering 500+ points of interest with real-time ratings and weather telemetry.',
        highlights: ['500+ Points of Interest', 'Google Maps API Telemetry', 'Real-Time Weather Integration'],
        stack: ['React.js', 'Material UI', 'Google Maps API', 'RapidAPI', 'Geolocation'],
        link: 'https://github.com/Karrtik12/travel-forecast'
    },
    {
        id: 'pixello',
        title: 'Pixello',
        subtitle: 'Social Networking App',
        category: 'Mobile App Development',
        description: 'Mobile social networking app built with Flutter SDK for iOS and Android featuring Firebase Cloud Firestore real-time data sync, Firebase Auth for secure login, push notifications, and optimistic state management.',
        highlights: ['Cross-Platform iOS & Android', 'Real-Time Firestore Sync', 'Push Notifications & State Mgmt'],
        stack: ['Flutter', 'Dart', 'Firebase Firestore', 'Firebase Auth', 'Cloud Messaging'],
        link: 'https://github.com/Karrtik12/pixello'
    }
]
