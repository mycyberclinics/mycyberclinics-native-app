# Mycyberclinics Mobile App — React Native (Expo) Structure and Findings

## Project Organization & Structure

- **Adopted a Modular Structure Inspired by Vue.js**
  - Organized source code into a `src/` directory containing:
    - `components/` for reusable UI pieces
    - `pages/` for screen components (like Vue's views)
    - `store/` for Redux state management (analogous to Vuex)
    - `assets/` for images and static resources
    - `helpers/`, `apis/`, `hooks/` for utility logic, API calls, and custom hooks

- **Expo Router for Navigation**
  - Implemented navigation using Expo Router, which is similar to Vue Router:
    - All app routes are defined by files inside the `app/` directory (`app/index.js`, `app/dashboard.js`, etc.)
    - Each file in `app/` automatically becomes a route—just like Vue.js pages/views.

- **Redux Integration**
  - Centralized state management using Redux Toolkit, similar to Vuex in Vue.js:
    - Store is initialized in `src/store/index.js`
    - State and actions are accessed from screens/components

## Implementation Highlights

- **Modern, Professional UI**
  - Used `@expo/vector-icons` for icons and enhanced visuals
  - Applied consistent styling (light backgrounds, cards, headers) to match best practices and increase presentation quality

- **Separation of Concerns**
  - Components and logic are separated into appropriate folders for maintainability and scalability

- **Route-Based Screens**
  - Each major page (Homepage, Dashboard, Settings, NotFound) is its own file/component in `src/pages`, imported as needed by routes in `app/`

- **Notifications Component**
  - Added a notification badge with modal dropdown, showcasing interactive elements for real-world usage

## Findings & Rationale

- **Expo Router aligns closely with Vue Router** through file-based routing, allowing scalable navigation and easy extension.
- **Redux Toolkit provides robust state management** and is the most common pattern for scalable React Native apps, much like Vuex for Vue.js.
- **Organizing screens as separate files in `pages/` mirrors Vue.js's best practices** for maintainable code.
- **Expo’s conventions (using `app/` for routes) are well documented and future-proof**, making onboarding and collaboration easier.

## Next Steps

- Continue building more screens and features using this structure.
- Optionally, add more UI polish and animations for an even better user experience.

---

## TL;DR

> The project now uses a modular, Vue.js-inspired folder structure, Expo Router for navigation, Redux for state, and clean UI patterns—making it scalable, maintainable, and ready for collaborative development.