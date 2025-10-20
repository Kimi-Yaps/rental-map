# Rental Map

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white" alt="Ionic">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

A cross-platform property rental app built with React, Ionic, and Supabase. Users can search, list, and manage rental properties with a modern UI and real-time database.

---

## ✨ Features

- **Property Search:** Search for properties with autocomplete and recommendations.
- **Interactive Map:** View properties on an interactive map and select locations.
- **Landlord Dashboard:** A dedicated dashboard for landlords to manage their properties.
- **Multi-Step Property Creation:** A guided, multi-step process for listing new properties.
- **Supabase Backend:** Real-time data storage and authentication powered by Supabase.
- **Responsive UI:** A mobile-friendly and responsive user interface built with Ionic.

---

## 🚀 Tech Stack

- **Frontend:** React, Ionic, TypeScript
- **Backend:** Supabase
- **Testing:** Cypress, Vitest
- **Build Tool:** Vite

---

## 🛠️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm
- A Supabase account and project

### Installation

1.  **Clone the repo:**

    ```sh
    git clone https://github.com/your_username/rental-map.git
    ```

2.  **Install NPM packages:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` & `.env.development` file in the root of the project and add your Supabase project credentials:

    ```env
    # Your Supabase project URL
    VITE_SUPABASE_URL=your-supabase-url
    # Your Supabase project anonymous key
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

### Running the App

-   **To run in the browser:**

    ```sh
    npm run dev
    ```

    or

    ```sh
    npx vite
    ```

-   **To run on a mobile device or emulator:**

    Use the Ionic CLI to build and run the app on your desired platform:

    ```sh
    ionic capacitor run android
    ionic capacitor run ios
    ```

---

## 📂 Project Structure

```
src/
  ├── App.tsx                # Main app router and Ionic setup
  ├── main.tsx               # React entry point
  ├── pages/                 # Application pages
  │   ├── Home.tsx             # Main search and recommendations page
  │   ├── LocationStepPage.tsx # Step 1 of property creation (Location)
  │   ├── AmenitiesStepPage.tsx# Step 2 of property creation (Amenities)
  │   └── FinalReviewPage.tsx  # Final step of property creation (Review)
  ├── components/            # Reusable components
  │   ├── DataConvertion.tsx   # Data conversion logic for Supabase
  │   ├── DbCrud.tsx           # Database CRUD operations
  │   ├── PublishPropertyButton.tsx # Button to publish a property
  │   └── SearchbarWithSuggestions.tsx # Searchbar with autocomplete
  ├── theme/                 # Styling and theme variables
  │   └── variables.css        # Ionic theme variables
  └── supabaseConfig.ts      # Centralized Supabase client
```

---

## 📜 Available Scripts

In the project directory, you can run:

| Script | Description |
| :--- | :--- |
| `npm run dev` or `npx vite` | Runs the app in development mode. |
| `npm run build` | Builds the app for production. |
| `npm run test.e2e` | Runs end-to-end tests with Cypress. |
| `npm run test.unit` | Runs unit tests with Vitest. |
| `npm run lint` | Lints the code with ESLint. |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
