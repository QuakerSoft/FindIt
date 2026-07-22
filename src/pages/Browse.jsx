import ItemList from "../components/ItemList";

function Browse() {
  return (
    <main>
      <h1 className="text-2x1 font-semibold">
        Browse Lost and Found Items
      </h1>
      
      <p>View items reported by members of the CSUN community.</p>

      <ItemList />
    </main>
  );
}

export default Browse;