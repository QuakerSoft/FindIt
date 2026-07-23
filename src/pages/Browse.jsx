import ItemList from "../components/ItemList";

function Browse() {
  return (
    <main>
      <p className="text-sm font-semibold text-red-600">
        BROWSE
      </p>
      <h1 className="text-3xl font-semibold">
        Search Lost and Found Items
      </h1>
      
      <p className="my-2 text-sm text-slate-500">
        View items reported by members of the CSUN community.
      </p>

      <ItemList />
    </main>
  );
}

export default Browse;