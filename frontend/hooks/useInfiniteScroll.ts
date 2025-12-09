import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
    fetchData: (page: number, signal?: AbortSignal) => Promise<{ data: T[]; meta: { last_page: number; total?: number } }>;
    initialPage?: number;
    /** Key extractor for deduplication. Defaults to 'id' */
    getItemId?: (item: T) => string;
}

export function useInfiniteScroll<T>({
    fetchData,
    initialPage = 1,
    getItemId = (item: T) => (item as any).id
}: UseInfiniteScrollOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [total, setTotal] = useState(0);

    const observer = useRef<IntersectionObserver | null>(null);
    const fetchRef = useRef(0);
    const loadingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Track client-side mount to prevent SSR timing issues
    const isMounted = useRef(false);

    // Set of existing IDs for O(1) lookup deduplication
    const existingIdsRef = useRef<Set<string>>(new Set());

    const loadMore = useCallback(async () => {
        // Synchronous lock check
        if (loadingRef.current || !hasMore) return;

        // Abort any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const currentFetchId = ++fetchRef.current;
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const response = await fetchData(page, abortController.signal);

            // Check if this result belongs to the current generation
            if (currentFetchId !== fetchRef.current) return;

            setData((prev) => {
                // O(n) deduplication using Set
                const newItems: T[] = [];
                for (const item of response.data) {
                    const itemId = getItemId(item);
                    if (!existingIdsRef.current.has(itemId)) {
                        existingIdsRef.current.add(itemId);
                        newItems.push(item);
                    }
                }
                return [...prev, ...newItems];
            });

            setTotal(response.meta?.total || 0);

            if (page >= response.meta.last_page) {
                setHasMore(false);
            } else {
                setPage((prev) => prev + 1);
            }
        } catch (err) {
            // Ignore abort errors
            if ((err as Error).name === 'AbortError') return;
            if (currentFetchId !== fetchRef.current) return;
            setError(err as Error);
        } finally {
            if (currentFetchId === fetchRef.current) {
                setLoading(false);
                loadingRef.current = false;
            }
        }
    }, [page, hasMore, fetchData, getItemId]);

    // Track mount state (runs first)
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Initial load - only after mounted on client
    useEffect(() => {
        if (isMounted.current && initialPage === 1 && data.length === 0 && !loading && hasMore) {
            loadMore();
        }
    }, [initialPage, data.length, hasMore, loadMore]);

    // Reset function for when filters change
    const reset = useCallback(() => {
        // Abort pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        fetchRef.current += 1; // Invalidate pending requests
        existingIdsRef.current.clear(); // Clear deduplication set
        setData([]);
        setPage(initialPage);
        setHasMore(true);
        setLoading(true); // Show loading immediately on reset
        loadingRef.current = false;
        setTotal(0);
        // The useEffect above will trigger load after data becomes []
    }, [initialPage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

    const lastElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, hasMore, loadMore]
    );

    return { data, loading, error, hasMore, lastElementRef, reset, loadMore, setData, total };
}
