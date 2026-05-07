import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../../pages/PageShell";
import { loadBookmarks, toggleBookmark } from "../utils/gitaBookmarks";
import BookmarkPage from "../components/BookmarkPage";

export default function GitaBookmarksPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());

  const handleRemove = (verse) => {
    setBookmarks((prev) => toggleBookmark(verse, prev));
  };

  return (
    <PageShell title="Gita Bookmarks" transparent>
      <div className="mx-auto w-full max-w-5xl">
        <BookmarkPage
          bookmarks={bookmarks}
          onSelect={() => navigate("/gita")}
          onRemove={handleRemove}
        />
      </div>
    </PageShell>
  );
}
