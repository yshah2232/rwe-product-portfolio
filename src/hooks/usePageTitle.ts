import { useEffect } from 'react';

/**
 * Sets document.title for the current route.
 * Call once per page component, ideally near the top.
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
