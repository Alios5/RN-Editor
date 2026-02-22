/**
 * Utility to detect the current platform (Web Browser vs Native Desktop via Tauri)
 */

export const isDesktop = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const isWeb = (): boolean => {
    return !isDesktop();
};

export const getPlatform = (): 'desktop' | 'web' => {
    return isDesktop() ? 'desktop' : 'web';
};
