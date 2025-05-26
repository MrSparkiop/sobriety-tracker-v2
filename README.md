# Sobriety Tracker App

A web application designed to help users track their sobriety journey, log progress, reflect through journaling, and celebrate milestones.

## Live Demo

You can view the live application here: [https://MrSparkiop.github.io/sobriety-tracker-v2](https://MrSparkiop.github.io/sobriety-tracker-v2)

## Key Features

* **User Authentication:** Secure registration and login using Email/Password or Google Sign-In.
* **Individual User Profiles:** Each user has their own private dashboard and data.
* **Real-Time Sobriety Timer:** Displays sobriety duration counting up in Years, Months, Days, Hours, Minutes, and Seconds.
* **Milestone Celebrations:** Automatic pop-up celebrations for achieving sobriety milestones (e.g., 1 day, 1 week, 30 days, 1 year).
* **Journaling:** Users can write and save journal entries related to their journey.
* **Data Persistence:** All user data is securely stored and managed with Firebase Firestore.
* **Customizable Error Messages:** Specific feedback for events like a disabled user account trying to log in.

## Technologies Used

* **Frontend:** React.js
* **Backend & Database:** Firebase (Authentication, Firestore)
* **Styling:** Tailwind CSS
* **Routing:** React Router
* **Deployment:** GitHub Pages

## Setup for Local Development (Optional)

If you want to run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/MrSparkiop/sobriety-tracker-v2.git](https://github.com/MrSparkiop/sobriety-tracker-v2.git)
    cd sobriety-tracker-v2
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Firebase Configuration:**
    * Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    * Add a Web App to your Firebase project.
    * Enable Email/Password and Google Sign-In in the Authentication section.
    * Set up Firestore Database in Test Mode.
    * Manually add a `milestones` collection with a few documents (e.g., `{days: 1, title: "24 Hours"}, {days: 7, title: "1 Week"}`).
    * Create a file named `firebaseConfig.js` in the `src/` directory.
    * Copy your Firebase project's configuration object into `src/firebaseConfig.js` and export the initialized app:
        ```javascript
        // src/firebaseConfig.js
        import { initializeApp } from "firebase/app";

        const firebaseConfig = {
          apiKey: "YOUR_API_KEY",
          authDomain: "YOUR_AUTH_DOMAIN",
          projectId: "YOUR_PROJECT_ID",
          storageBucket: "YOUR_STORAGE_BUCKET",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID",
          measurementId: "YOUR_MEASUREMENT_ID" // Optional
        };

        const app = initializeApp(firebaseConfig);
        export { app };
        ```
4.  **Start the development server:**
    ```bash
    npm start
    ```
    The app will open at `http://localhost:3000`.