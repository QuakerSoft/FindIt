import ItemList from "../components/ItemList";

function Browse() {
  return (
    <main>
      <header className="mb-7 flex flex-col gap-4 border-b border-[#E5E0D8] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
            Campus Lost & Found
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
            Find what you’re looking for
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6560] sm:text-base">
            Search lost and found reports submitted by members of the
            CSUN community.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm text-[#6B6560] shadow-sm">
          <span
            className="h-2 w-2 rounded-full bg-emerald-500"
            aria-hidden="true"
          />

          Community reports
        </div>
      </header>

      <ItemList />
    </main>
  );
}

export default Browse;