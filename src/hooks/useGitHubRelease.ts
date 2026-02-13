import { useState, useEffect } from "react";

export interface GitHubRelease {
    tagName: string;
    name: string;
    body: string;
    publishedAt: string;
    htmlUrl: string;
}

const GITHUB_API_URL =
    "https://api.github.com/repos/Alios5/RN-Editor/releases/latest";

// Cache the release in memory so we don't refetch on every navigation
let cachedRelease: GitHubRelease | null = null;
let hasFetched = false;

export function useGitHubRelease() {
    const [release, setRelease] = useState<GitHubRelease | null>(cachedRelease);
    const [loading, setLoading] = useState(!hasFetched);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (hasFetched) {
            setRelease(cachedRelease);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        fetch(GITHUB_API_URL, {
            signal: controller.signal,
            headers: { Accept: "application/vnd.github.v3+json" },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                const parsed: GitHubRelease = {
                    tagName: data.tag_name,
                    name: data.name || data.tag_name,
                    body: data.body || "",
                    publishedAt: data.published_at,
                    htmlUrl: data.html_url,
                };
                cachedRelease = parsed;
                hasFetched = true;
                setRelease(parsed);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    hasFetched = true;
                    setError(true);
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    return { release, loading, error };
}
