# Mind Mentor: AI-Powered Study Assistant 

## Table of Contents
- [Overview](#overview)
- [Demo](#demo)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Overview

Mind Mentor is an innovative AI-powered study assistant designed to revolutionize the way students learn and prepare for exams. Leveraging cutting-edge AI technologies, Mind Mentor offers personalized study plans, curates learning resources, and provides intelligent assistance to accelerate your learning journey.

## Demo

https://github.com/user-attachments/assets/7406e7f2-f7bd-472a-90e4-2a82b5465efb

## Key Features

- **Personalized Study Plans**: Generate tailored study schedules based on your subject and exam date.
- **AI-Curated Resources**: Access a wealth of learning materials curated by our advanced AI.
- **Intelligent Q&A**: Get instant answers to your questions as you learn.
- **Interactive UI**: Enjoy a sleek, responsive interface with animated components for an engaging user experience.

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **AI Integration**: 
  - Google's Generative AI (Gemini Pro model) for study plan generation and resource curation
  - Groq AI with CopilotKit for the intelligent chatbot assistant
- **UI Components**: Radix UI, Shadcn UI
- **State Management**: React Hooks
- **API Routes**: Next.js API routes for backend functionality

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KartikLabhshetwar/mind-mentor.git
   cd mind-mentor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your API keys:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Generate Study Plan**:
   - Navigate to the Study Plan section.
   - Enter your subject and exam date.
   - Click "Generate Plan" to receive a personalized study schedule.

2. **Curate Resources**:
   - Go to the Resource Curator section.
   - Input a topic of interest.
   - Click "Curate Resources" to get AI-recommended learning materials.

3. **Ask Questions**:
   - Use the CopilotKit assistant feature for any study-related queries.
   - Get instant, intelligent responses to support your learning.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Google Generative AI](https://ai.google.dev/)
- [Groq AI](https://groq.com/)
- [CopilotKit](https://docs.copilotkit.ai/)
- [Radix UI](https://www.radix-ui.com/)
- [Shadcn UI](https://ui.shadcn.com/)

---

Developed with ❤️ by Kartik
