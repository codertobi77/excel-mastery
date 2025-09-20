# Excel Mastery AI

Excel Mastery AI is an innovative e-learning platform designed to help users of all levels master Microsoft Excel through a personalized, AI-powered learning experience.

## About The Project

This platform provides a comprehensive and interactive way to learn Excel. It combines structured courses, practical exercises, and an intelligent AI tutor to create a unique and effective learning environment. Whether you're a beginner looking to understand the basics or an advanced user aiming to perfect your skills, Excel Mastery AI adapts to your needs.

### Key Features

*   **🤖 AI Personal Tutor:** Get your Excel questions answered 24/7 by an intelligent AI assistant.
*   **📚 Adaptive Courses:** Personalized training that adapts to your skill level and progress.
*   **✍️ Practical Exercises:** Reinforce your knowledge with hands-on exercises that are automatically corrected.
*   **👥 Active Community:** Connect with other learners, share tips, and collaborate.
*   **🏆 Progress Tracking:** Visualize your learning journey and identify areas for improvement.
*   **✨ Always Up-to-Date:** Access content that is constantly updated with the latest Excel features.
*   **📊 Mini-Excel:** Practice your skills directly in the browser with an integrated spreadsheet tool.

## Tech Stack

This project is built with a modern, robust, and scalable tech stack:

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database:** [Convex](https://www.convex.dev/)
*   **Authentication:** [Clerk](https://clerk.com/)
*   **Payments:** [Moneroo](https://moneroo.io/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and npm (or yarn/pnpm) installed on your machine.

*   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/excel-mastery-ai.git
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up environment variables**

    You will need to create a `.env.local` file in the root of the project and add the necessary environment variables. The following services require API keys/secrets:

    *   `CONVEX_DEPLOYMENT`
    *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    *   `CLERK_SECRET_KEY`
    *   `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
    *   `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
    *   `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
    *   `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
    *   `MONEROO_SECRET_KEY`

4.  **Run the development server**
    ```sh
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**
