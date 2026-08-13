function BookmarkButton({
  item,
  isSaved,
  isWorking,
  onToggle,
  showLabel = false,
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(item);
      }}
      disabled={isWorking}
      aria-label={
        isSaved
          ? `Remove ${item.title} from saved items`
          : `Save ${item.title}`
      }
      title={
        isSaved
          ? "Remove from saved items"
          : "Save item"
      }
      className={`flex items-center justify-center gap-2 border bg-white font-semibold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${
        showLabel
          ? "rounded-xl px-4 py-2.5 text-sm"
          : "h-10 w-10 rounded-full"
      } ${
        isSaved
          ? "border-[#A6192E]/30 text-[#A6192E] hover:bg-[#A6192E]/5"
          : "border-[#E5E0D8] text-[#494541] hover:border-[#A6192E]/30 hover:text-[#A6192E]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={isSaved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z" />
      </svg>

      {showLabel && (
        <span>
          {isSaved ? "Saved" : "Save Item"}
        </span>
      )}
    </button>
  );
}

export default BookmarkButton;