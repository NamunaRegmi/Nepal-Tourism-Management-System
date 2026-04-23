import {
  ArrowUpRight,
  Compass,
  Mail,
  MapPin,
  MapPinned,
  Phone,
} from 'lucide-react';

const quickLinks = [
  { label: 'Destinations', page: 'destination-results' },
  { label: 'Tour Packages', page: 'tours' },
  { label: 'Tour Guides', page: 'guides' },
  { label: 'About Us', page: 'about' },
];

const services = [
  'Hotel discovery',
  'Guided tours',
  'Package booking',
  'Travel planning',
];

export default function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  const navigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.2),transparent_32%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-3 text-left"
            >
              <img
                src="/assets/nepal-tourism-mark.svg"
                alt="Nepal Tourism logo"
                className="h-14 w-14 rounded-2xl shadow-lg shadow-cyan-950/30"
              />
              <div>
                <p className="text-2xl font-bold tracking-tight">Nepal Tourism</p>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">
                  Explore Book Travel
                </p>
              </div>
            </button>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
              Plan memorable journeys across Nepal with curated destinations, trusted stays,
              guided experiences, and simple booking tools in one place.
            </p>

            <div className="mt-7 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm font-semibold text-white">Explore. Book. Travel.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Built for travelers looking for destinations, packages, guides, and stays
                across Nepal.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Explore
            </h3>
            <div className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <button
                  key={link.page}
                  type="button"
                  onClick={() => navigate(link.page)}
                  className="group flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Services
            </h3>
            <div className="mt-5 space-y-3">
              {services.map((service) => (
                <div key={service} className="flex items-center gap-2 text-sm text-slate-300">
                  <Compass className="h-3.5 w-3.5 text-cyan-300" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Contact
            </h3>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>Kathmandu, Nepal</span>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>Online booking support</span>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>Destination and package guidance</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('destination-results')}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300"
            >
              <MapPinned className="h-4 w-4" />
              Start planning
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>Copyright {year} Nepal Tourism Management System. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <button type="button" onClick={() => navigate('about')} className="transition hover:text-white">
              Privacy Policy
            </button>
            <button type="button" onClick={() => navigate('about')} className="transition hover:text-white">
              Terms of Service
            </button>
            <button type="button" onClick={() => navigate('about')} className="transition hover:text-white">
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
