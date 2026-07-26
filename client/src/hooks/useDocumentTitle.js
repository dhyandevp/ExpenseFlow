import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = title + " — BalanceBoard";
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
