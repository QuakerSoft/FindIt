import ItemForm from "../components/ItemForm";

function PostItem() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-sm font-semibold text-red-600">NEW REPORT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Post a lost or found item
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Add enough detail to give your item the best chance of being recognized.
        </p>
      </div>
      <ItemForm />
    </div>
  );
}

export default PostItem;