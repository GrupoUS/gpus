/// <reference types="vite/client" />

/**
 * View Transition API TypeScript declarations
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */
declare global {
	interface ImportMetaEnv {
		readonly VITE_CONVEX_URL: string;
		readonly VITE_CLERK_PUBLISHABLE_KEY: string;
		readonly VITE_DIFY_API_URL: string;
		readonly VITE_DIFY_API_KEY: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}

	interface ViewTransition {
		/**
		 * A Promise that fulfills once the transition animation is finished,
		 * and the new page view is visible and interactive to the user.
		 */
		finished: Promise<void>;
		/**
		 * A Promise that fulfills once the pseudo-element tree is created
		 * and the transition animation is about to start.
		 */
		ready: Promise<void>;
		/**
		 * A Promise that fulfills when the promise returned by the
		 * document.startViewTransition()'s callback fulfills.
		 */
		updateCallbackDone: Promise<void>;
		/**
		 * Skips the animation part of the view transition.
		 */
		skipTransition(): void;
	}

	interface Document {
		/**
		 * Starts a new view transition and returns a ViewTransition object to represent it.
		 * @param callback A callback function typically invoked to update the DOM during the view transition process.
		 */
		startViewTransition(callback: () => void | Promise<void>): ViewTransition;
	}
}

export {};
