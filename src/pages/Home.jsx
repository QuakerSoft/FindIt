import { Link } from 'react-router-dom';

function TicketStep({ number, title, description }) {
  return (
    <div className="relative bg-white border border-[#E5E0D8] rounded-lg p-6 pt-8">
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#FAF7F2] rounded-full border border-[#E5E0D8]" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#FAF7F2] rounded-full border border-[#E5E0D8]" />
      <p className="font-[Archivo_Black] text-4xl text-[#A6192E]/20 absolute top-4 right-6">
        {number}
      </p>
      <h3 className="font-[Archivo_Black] text-lg text-[#1C1B19] mb-2">
        {title}
      </h3>
      <p className="text-[#6B6560] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center py-20 px-4">
        <p className="text-[#A6192E] text-sm font-semibold tracking-widest uppercase mb-4">
          CSUN Campus Network
        </p>
        <h1 className="font-[Archivo_Black] text-5xl md:text-6xl text-[#1C1B19] leading-tight mb-6">
          Lost it? Find it.
        </h1>
        <p className="text-[#6B6560] text-lg mb-10 max-w-xl mx-auto">
          Every lost item on campus has someone looking for it. Post what you've lost or found, and we'll match you automatically.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/post"
            className="bg-[#A6192E] text-white px-6 py-3 rounded-sm font-medium hover:bg-[#8a1526] transition-colors"
          >
            Post an Item
          </Link>
          <Link
            to="/browse"
            className="border-2 border-[#1C1B19] text-[#1C1B19] px-6 py-3 rounded-sm font-medium hover:bg-[#1C1B19] hover:text-white transition-colors"
          >
            Browse Items
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-[Archivo_Black] text-2xl text-[#1C1B19] mb-2">
            How it works
          </h2>
          <div className="w-16 h-1 bg-[#A6192E] mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <TicketStep
            number="01"
            title="Post it"
            description="Lost your keys? Found a water bottle? Post the details in under a minute."
          />
          <TicketStep
            number="02"
            title="We match it"
            description="Our system automatically compares your post against opposite listings — lost items get matched to found ones."
          />
          <TicketStep
            number="03"
            title="Get reunited"
            description="Check your matches, message the poster, and get your stuff back."
          />
        </div>
      </div>
    </div>
  );
}
export default Home;