import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
    fetchData: (page: number) => Promise<{ data: T[]; meta: { last_page: number; total?: number } }>;
    initialPage?: number;
}

export function useInfiniteScroll<T>({ fetchData, initialPage = 1 }: UseInfiniteScrollOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [total, setTotal] = useState(0); // Add total state
    const observer = useRef<IntersectionObserver | null>(null);
    const fetchRef = useRef(0); // Generation counter to prevent race conditions

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        const currentFetchId = fetchRef.current;
        setLoading(true);
        setError(null);
        try {
            const response = await fetchData(page);

            // Check if this result belongs to the current generation
            if (currentFetchId !== fetchRef.current) return;

            setData((prev) => {
                return [...prev, ...response.data];
            });
            setTotal(response.meta?.total || 0); // Update total from meta

            if (page >= response.meta.last_page) {
                setHasMore(false);
            } else {
                setPage((prev) => prev + 1);
            }
        } catch (err) {
            if (currentFetchId !== fetchRef.current) return;
            setError(err as Error);
        } finally {
            if (currentFetchId === fetchRef.current) {
                setLoading(false);
            }
        }
    }, [page, loading, hasMore, fetchData]);

    // Reset function for when filters change
    const reset = useCallback(() => {
        fetchRef.current += 1; // Invalidate pending requests
        setData([]);
        setPage(initialPage);
        setHasMore(true);
        setLoading(false); // Reset loading state
        setTotal(0);
    }, [initialPage]);

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
