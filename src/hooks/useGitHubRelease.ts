import { useState, useEffect } from "react";

export interface GitHubRelease {
    tagName: string;
    name: string;
    body: string;
    publishedAt: string;
    htmlUrl: string;
}

const REPO = "Alios5/RN-Editor";
const API_BASE = `https://api.github.com/repos/${REPO}/releases`;

// In-memory cache
let cache: {
    currentRelease: GitHubRelease | null;
    latestVersion: string | null;
    latestDownloadUrl: string | null;
    updateAvailable: boolean;
} | null = null;

function parseVersion(tag: string): number[] {
    return tag
        .replace(/^v/, "")
        .split(".")
        .map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
    const l = parseVersion(latest);
    const c = parseVersion(current);
    for (let i = 0; i < Math.max(l.length, c.length); i++) {
        const lv = l[i] || 0;
        const cv = c[i] || 0;
        if (lv > cv) return true;
        if (lv < cv) return false;
    }
    return false;
}

function parseRelease(data: Record<string, unknown>): GitHubRelease {
    return {
        tagName: data.tag_name as string,
        name: (data.name as string) || (data.tag_name as string),
        body: (data.body as string) || "",
        publishedAt: data.published_at as string,
        htmlUrl: data.html_url as string,
    };
}

export function useGitHubRelease(appVersion: string) {
    const [currentRelease, setCurrentRelease] = useState<GitHubRelease | null>(
        cache?.currentRelease ?? null
    );
    const [updateAvailable, setUpdateAvailable] = useState(
        cache?.updateAvailable ?? false
    );
    const [latestVersion, setLatestVersion] = useState<string | null>(
        cache?.latestVersion ?? null
    );
    const [latestDownloadUrl, setLatestDownloadUrl] = useState<string | null>(
        cache?.latestDownloadUrl ?? null
    );
    const [loading, setLoading] = useState(!cache);

    useEffect(() => {
        if (cache) {
            setCurrentRelease(cache.currentRelease);
            setUpdateAvailable(cache.updateAvailable);
            setLatestVersion(cache.latestVersion);
            setLatestDownloadUrl(cache.latestDownloadUrl);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const headers = { Accept: "application/vnd.github.v3+json" };
        const opts = { signal: controller.signal, headers };

        // Fetch both: release for current version + latest release
        Promise.allSettled([
            fetch(`${API_BASE}/tags/v${appVersion}`, opts).then((r) =>
                r.ok ? r.json() : null
            ),
            fetch(`${API_BASE}/latest`, opts).then((r) =>
                r.ok ? r.json() : null
            ),
        ])
            .then(([currentResult, latestResult]) => {
                // Current version release notes
                const currentData =
                    currentResult.status === "fulfilled" ? currentResult.value : null;
                const parsedCurrent = currentData ? parseRelease(currentData) : null;

                // Latest release info
                const latestData =
                    latestResult.status === "fulfilled" ? latestResult.value : null;
                const latestTag = latestData?.tag_name as string | undefined;
                const hasUpdate = latestTag
                    ? isNewer(latestTag, appVersion)
                    : false;

                cache = {
                    currentRelease: parsedCurrent,
                    latestVersion: hasUpdate ? latestTag!.replace(/^v/, "") : null,
                    latestDownloadUrl: hasUpdate
                        ? (latestData?.html_url as string)
                        : null,
                    updateAvailable: hasUpdate,
                };

                setCurrentRelease(parsedCurrent);
                setUpdateAvailable(hasUpdate);
                setLatestVersion(cache.latestVersion);
                setLatestDownloadUrl(cache.latestDownloadUrl);
            })
            .catch(() => {
                // Silently fail if offline
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [appVersion]);

    return {
        release: currentRelease,
        loading,
        updateAvailable,
        latestVersion,
        latestDownloadUrl,
    };
}
