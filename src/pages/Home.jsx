import { Link } from "react-router-dom";

function TicketStep({
  number,
  title,
  description,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#A6192E]/30 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A6192E]/10 text-sm font-bold text-[#A6192E]">
        {number}
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#1C1B19]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#6B6560]">
        {description}
      </p>
    </article>
  );
}

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E5E0D8] bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20">
        <div
          className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#A6192E]/5"
          aria-hidden="true"
        />

        <div
          className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-[#A6192E]/5"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6192E]">
            CSUN Campus Lost & Found
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#1C1B19] sm:text-5xl md:text-6xl">
            Lost it? Find it.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6B6560] sm:text-lg">
            Report something you lost or found on campus,
            discover possible matches, and safely connect
            with the CSUN community.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/post"
              className="rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
            >
              Post an Item
            </Link>

            <Link
              to="/browse"
              className="rounded-xl border border-[#A6192E]/40 bg-white px-6 py-3 text-sm font-semibold text-[#A6192E] transition hover:bg-[#A6192E]/5"
            >
              Browse Reports
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-12 pt-16 sm:pb-16 sm:pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
              Simple and secure
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1B19]">
              How FindIt works
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6B6560] sm:text-base">
              A few details are all it takes to start
              reconnecting an item with its owner.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <TicketStep
              number="01"
              title="Post a report"
              description="Share what you lost or found, including its description, campus location, date, and an optional photo."
            />

            <TicketStep
              number="02"
              title="Review possible matches"
              description="FindIt compares lost reports with found reports and highlights listings with similar details."
            />

            <TicketStep
              number="03"
              title="Reconnect safely"
              description="Submit a request with identifying details. Contact information is shared only after the poster accepts."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;