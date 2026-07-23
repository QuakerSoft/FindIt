import ItemList from "../components/ItemList";

function Browse() {
  return (
    <main>
      <p className="text-sm font-semibold text-[#A6192E]">
        BROWSE
      </p>
      <h1 className="text-3xl font-semibold">
        Search Lost and Found Items
      </h1>
      
      <p className="mt-2 mb-4 text-sm text-slate-500">
        View items reported by members of the CSUN community.
      </p>

      <ItemList />
    </main>
  );
}

export default Browse;