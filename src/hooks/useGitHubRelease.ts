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
    release: GitHubRelease | null;
    allReleases: GitHubRelease[];
    latestVersion: string | null;
    latestDownloadUrl: string | null;
    updateAvailable: boolean;
} | null = null;

function parseVersion(tag: string): number[] {
    return tag
        .replace(/^v\.?/, "")
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
    const [release, setRelease] = useState<GitHubRelease | null>(
        cache?.release ?? null
    );
    const [allReleases, setAllReleases] = useState<GitHubRelease[]>(
        cache?.allReleases ?? []
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
            setRelease(cache.release);
            setAllReleases(cache.allReleases);
            setUpdateAvailable(cache.updateAvailable);
            setLatestVersion(cache.latestVersion);
            setLatestDownloadUrl(cache.latestDownloadUrl);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const headers = { Accept: "application/vnd.github.v3+json" };
        const opts = { signal: controller.signal, headers };

        // Fetch: release for current version, latest release, and all releases
        Promise.allSettled([
            fetch(`${API_BASE}/tags/v${appVersion}`, opts).then((r) =>
                r.ok ? r.json() : null
            ),
            fetch(`${API_BASE}/latest`, opts).then((r) =>
                r.ok ? r.json() : null
            ),
            fetch(`${API_BASE}?per_page=30`, opts).then((r) =>
                r.ok ? r.json() : null
            ),
        ])
            .then(([currentResult, latestResult, allResult]) => {
                // Latest release info
                const latestData =
                    latestResult.status === "fulfilled" ? latestResult.value : null;
                const latestTag = latestData?.tag_name as string | undefined;

                // Current version release notes
                const currentData =
                    currentResult.status === "fulfilled" ? currentResult.value : null;
                const parsedCurrent = currentData ? parseRelease(currentData) : null;

                // All releases
                const allData =
                    allResult.status === "fulfilled" && Array.isArray(allResult.value)
                        ? allResult.value
                        : [];
                const parsedAll = allData.map((d: Record<string, unknown>) => parseRelease(d));

                const hasUpdate = latestTag
                    ? isNewer(latestTag, appVersion)
                    : false;

                // Show the latest release from GitHub (newest first from API)
                const releaseToShow = parsedAll[0] ?? parsedCurrent;

                cache = {
                    release: releaseToShow,
                    allReleases: parsedAll,
                    latestVersion: hasUpdate ? latestTag!.replace(/^v\.?/, "") : null,
                    latestDownloadUrl: hasUpdate
                        ? (latestData?.html_url as string)
                        : null,
                    updateAvailable: hasUpdate,
                };

                setRelease(releaseToShow);
                setAllReleases(parsedAll);
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
        release,
        allReleases,
        loading,
        updateAvailable,
        latestVersion,
        latestDownloadUrl,
    };
}
