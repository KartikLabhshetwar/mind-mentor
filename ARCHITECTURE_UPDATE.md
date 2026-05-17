# Architecture Update

This document outlines the recent structural changes made to the `mind-mentor` codebase to improve maintainability, separation of concerns, and alignment with modern architecture standards.

**Note: No functionality was altered during this refactor. These changes are strictly organizational.**

## 1. Frontend Component Reorganization
To prevent the `src/components/` root directory from becoming cluttered, components have been grouped into feature-specific and domain-specific subdirectories:
- **Layout**: `Header.tsx` and `Footer.tsx` moved to `src/components/layout/`.
- **Marketing/Sections**: `ReviewMarquee.tsx`, `SocialWall.tsx`, and `Video.tsx` moved to `src/components/sections/`.
- **Study Plan**: `StudyPlanDisplay.tsx` and `StudyPlanForm.tsx` moved to `src/components/study-plan/`.
- **Resources**: `CurateResourcesForm.tsx` and `ResourceCurator.tsx` moved to `src/components/resources/`.
- **PDF & Chat**: `ChatInterface.tsx`, `PdfChat.tsx`, and `PdfViewer.tsx` moved to `src/components/pdf/`.
- **Providers**: `PostHogPageView.tsx` and `posthog-provider.tsx` moved to `src/providers/`.
- **Data**: Static data exports (`data.tsx`) moved and renamed to `src/lib/data.ts`.

All associated imports across the `app/` and `components/` directories have been updated to reflect these new paths.

## 2. Next.js API Routes Consolidation
To maintain a cohesive and intuitive API namespace:
- The `src/app/api/users/stats` endpoint was moved to `src/app/api/user/stats`. 
- This ensures all user-related endpoints live under the unified `/api/user/*` namespace, avoiding confusion between `/user` and `/users`.

## 3. Express Server: Strict Layered Architecture
The Node.js Express server (`/server`) was transitioned to a strictly enforced Layered Architecture pattern (**Routes -> Controllers -> Services -> Repositories -> Models**), perfectly matching the architectural standard used in enterprise projects like `netwin-pms`.

- **Repositories Added**: A new `server/repositories/` directory was created to handle all database interactions. Controllers and Services no longer touch Mongoose Models directly. Instead, they rely on Repositories like `studyPlanRepository.js` to execute queries.
- **Services Added**: Core business logic and AI orchestration were extracted into a unified `server/services/` layer (e.g., `studyPlanService.js`, `curatedResourceService.js`, `pdfDocumentService.js`).
- **Thinned Controllers**: Controllers (`generatePlanController.js`, `curateResourcesController.js`, `pdfChatController.js`) were refactored to serve exclusively as HTTP interfaces. They now solely extract request parameters, call the corresponding Service methods, and return JSON responses.
- **Clean Routes**: The files in `server/routes/` remain completely pure, strictly defining API endpoint paths and mapping them to Controller functions.

## 4. AI Model Cache Separation
Previously, the pre-trained machine learning weights downloaded by the `Transformers.js` library were cached inside the `server/models/Xenova` directory. 
- **Separation of Concerns**: To prevent confusion between Mongoose database schemas and AI model weights, the Transformers cache directory was moved.
- **New Location**: AI models are now cached in a dedicated `server/ai-models/` directory.
- The configuration in `server/services/transformersEmbeddings.js` was updated (`env.cacheDir = './ai-models'`) to reflect this change.
