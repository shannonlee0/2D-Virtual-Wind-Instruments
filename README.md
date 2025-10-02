# Aerophones: A 2D Virtual Wind Instrument Simulator

Simulating acoustic wave propagation can aid in the exploration of novel musical instrument designs. This project is a 2D wave simulator that, given user-drawn instrument geometry and dynamic source models, visualizes pressure over time and generates realistic audio.

**Live Demo:** [https://shannonlee0.github.io/aerophones/](https://shannonlee0.github.io/aerophones/)

---

*[It is highly recommended to add a screenshot or, even better, a short GIF here of the simulator in action!]*

---

## Tech Stack

* **Core Logic:** JavaScript, HTML5, CSS3
* [cite_start]**Graphics Rendering:** **WebGL** [cite: 15, 17, 31] for real-time visualization of the pressure wave.
* [cite_start]**Simulation Method:** The **Finite-Difference Time-Domain (FDTD)** [cite: 10, 16, 31] method is used to model the wave propagation.

## Features

* **Interactive Instrument Design:** Draw custom 2D instrument geometries and boundaries directly in the browser.
* [cite_start]**Real-time Wave Visualization:** See the acoustic pressure wave propagate through your instrument design with a dynamic color map powered by **WebGL**[cite: 15, 17, 31].
* [cite_start]**Dynamic Audio Synthesis:** Hear the sound your instrument makes in real-time, with audio generated directly from the wave simulation data[cite: 10].
* **Customizable Source Models:** Place and interact with sound sources to simulate blowing into the instrument.

## How to Run Locally

To run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/aerophones.git](https://github.com/your-username/aerophones.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd aerophones
    ```
3.  **Serve the files:**
    For the best results, serve the project using a simple local web server. If you have Python 3 installed, you can run:
    ```bash
    python3 -m http.server
    ```
4.  **Open in browser:**
    Navigate to `http://localhost:8000` in your web browser. Note that the port may be different if 8000 is already in use.
