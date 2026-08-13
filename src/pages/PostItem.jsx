import ItemForm from "../components/ItemForm";

function PostItem() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-7 border-b border-[#E5E0D8] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
          New report
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
          Post a lost or found item
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6560] sm:text-base">
          Add enough detail to give your item the best chance of being recognized.
        </p>
      </header>
      <ItemForm />
    </div>
  );
}
export default PostItem;