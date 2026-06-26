# Physica AI

> **The Research Partner Built For Physics.**

Physica AI is an AI-powered research platform built specifically for physics researchers, academic institutions, and anyone working with scientific literature. It transforms complex physics papers into interactive, accessible knowledge, enabling users to search, summarize, explore citation networks, and understand equations faster than traditional academic workflows.

---

## 📖 About the Project

Modern researchers face an overwhelming amount of scientific literature. Thousands of new papers are published every month across multiple repositories, making literature reviews, concept understanding, and gap identification incredibly time-consuming.

Rather than functioning as a general-purpose chatbot, **Physica AI** is designed as a specialized, academic-native research partner. 

### Core Philosophy
* **Understanding Over Information:** Researchers do not need more information; they need a better way to digest and navigate what is already there. Every feature in Physica AI is built to help users understand research papers more effectively.
* **Intelligent Navigational Partner:** The AI is not intended to replace human critical thinking or fabricate new theories, but rather to amplify a researcher's workflow by serving as an intelligent research navigator.
* **Accuracy and Rigor:** Physica AI adheres to a strict scientific standard: it is built to search open repositories directly, cite sources accurately, and never invent citations or falsify scientific claims.

---

## 📚 Documentation & Specifications

For deep dives into product vision, layout designs, and guidelines, see the files in the [docs/](docs) directory:
* **[Project Brief](docs/project.md):** Brand voice, philosophy, target audience research, and search principles.
* **[Chat Workspace Layout](docs/chat_page_structure.md):** ASCII grid drawing of the 3-pane chat page interface.

---

## 👥 Who is it For?

Physica AI is structured to support the academic community at all levels:

* **Academic Researchers:** For accelerating literature reviews, tracking active citations, and discovering related works.
* **Professors & Supervisors:** For rapid paper evaluation, topic mapping, and guiding student research directories.
* **PhD & Masters Students:** For breaking down complex math/physics equations, learning new concepts faster, and identifying gaps in existing literature.
* **Research Groups:** For collaborative paper discovery and maintaining shared research logs.

---

## 🚀 Key Features

* **Research Paper Discovery:** Search and discover physics literature based on topics, concepts, authors, and research domains.
* **Paper Understanding:** Generate summaries, explanations, and key concept breakdowns of complex research papers.
* **Question Answering:** Ask contextual questions about retrieved papers to extract precise insights.
* **Equation Understanding:** Breakdown and explain complex mathematical and physical equations found in papers.
* **Citation Exploration:** Map out citation networks, identify foundational works, and trace how research has evolved.
* **Literature Reviews:** Easily explore related research trends and compile reference lists.

---

## 🔍 Data & Search Integration

To ensure academic integrity, Physica AI connects directly to trusted open-access scientific repositories:
* **arXiv** (Cornell University's physics & mathematics archive)
* **INSPIRE** (High-Energy Physics information system)
* **NASA ADS** (Astrophysics Data System)

The platform prioritizes repository-based searching, pulling paper data and metadata directly from these academic portals before falling back to general web searches (which are only utilized when repository-level queries cannot confidently resolve a concept).

---

## 🛠️ Technology Stack

* **Frontend:** React (v19) & TypeScript
* **Build Tool:** Vite
* **Graphics/Shaders:** Three.js / OGL / WebGL (for generative interactive math-based shader artwork)
* **Styling:** Vanilla CSS (curated high-contrast aesthetic with custom animation and dark mode)

---

## 📦 Project Structure

```text
├── docs/
│   ├── chat_page_structure.md     # Layout structure for the main workspace
│   └── project.md                 # Detailed project overview and branding guidelines
├── public/
│   ├── favicon.svg                # Atom-styled SVG favicon with light/dark theme support
│   └── icons.svg                  # SVG icon definitions
├── src/
│   ├── components/                # React UI components and their corresponding stylesheets
│   ├── App.tsx                    # Main app setup and landing page layout
│   ├── index.css                  # Core design system tokens and global styles
│   └── main.tsx                   # React application entrypoint
├── index.html                     # HTML root page
├── vite.config.ts                 # Vite bundler configuration
└── package.json                   # Dependencies and build scripts
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### Installation

Clone the repository and install the project dependencies:

```bash
# Install dependencies
npm install
```

### Development Server

Run the local development server:

```bash
# Start the dev server
npm run dev
```

The application will run locally, usually at `http://localhost:5173`.

### Production Build

To build the static application assets for production:

```bash
# Compile and build the project
npm run build
```

The compiled output will be generated inside the `dist/` directory.
