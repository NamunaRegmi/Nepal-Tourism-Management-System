import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart2, Settings, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'cookie_consent';

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential Cookies',
    icon: Shield,
    color: 'emerald',
    required: true,
    description:
      'Required for the website to function. These cannot be disabled.',
    examples: 'Authentication tokens, session state, security tokens.',
  },
  {
    id: 'preferences',
    label: 'Preference Cookies',
    icon: Settings,
    color: 'blue',
    required: false,
    description:
      'Remember your settings and choices to personalise your experience.',
    examples: 'Travel preferences, wishlist, saved destinations, language.',
  },
  {
    id: 'analytics',
    label: 'Analytics Cookies',
    icon: BarChart2,
    color: 'violet',
    required: false,
    description:
      'Help us understand how visitors interact with the site so we can improve it.',
    examples: 'Page views, session duration, navigation paths.',
  },
];

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, savedAt: Date.now() }));
}

export function getCookieConsent() {
  return loadConsent();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [prefs, setPrefs] = useState({ essential: true, preferences: true, analytics: false });

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (all = false) => {
    const final = all
      ? { essential: true, preferences: true, analytics: true }
      : { essential: true, preferences: false, analytics: false };
    saveConsent(final);
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(prefs);
    setVisible(false);
  };

  const toggle = (id) => {
    if (id === 'essential') return;
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  };

  if (!visible) return null;

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', icon: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', icon: 'text-violet-600' },
  };

  return (
    <>
      {/* Backdrop for manage panel */}
      {showManage && (
        <div
          className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
          onClick={() => setShowManage(false)}
        />
      )}

      {/* Main banner */}
      {!showManage && (
        <div className="fixed bottom-0 left-0 right-0 z-[999] pointer-events-none">
          <div className="w-full pointer-events-auto">
            <div className="border-t border-slate-200 bg-white shadow-[0_-4px_32px_rgba(0,0,0,0.10)] overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                    <Cookie className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h2 className="text-base font-bold text-slate-900">We value your privacy</h2>
                      <button
                        onClick={() => accept(false)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed">
                      Nepal Tourism uses cookies to enhance your browsing experience, personalise content, and
                      analyse site traffic. By clicking <span className="font-medium text-slate-700">"Accept All"</span> you
                      consent to our use of cookies.{' '}
                      <button
                        onClick={() => setShowDetails((s) => !s)}
                        className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                      >
                        {showDetails ? 'Hide details' : 'Learn more'}
                        {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </p>

                    {/* Expanded details */}
                    {showDetails && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {CATEGORIES.map((cat) => {
                          const c = colorMap[cat.color];
                          const Icon = cat.icon;
                          return (
                            <div key={cat.id} className={`rounded-xl border ${c.border} ${c.bg} p-3`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
                                <span className={`text-xs font-semibold ${c.text}`}>{cat.label}</span>
                                {cat.required && (
                                  <span className="ml-auto text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => accept(true)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
                      >
                        Accept All
                      </button>
                      <button
                        onClick={() => accept(false)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                      >
                        Essential Only
                      </button>
                      <button
                        onClick={() => setShowManage(true)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        Manage Preferences
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-400">
                      Nepal Tourism Management System · By continuing you agree to our{' '}
                      <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>
                      {' '}and{' '}
                      <span className="underline cursor-pointer hover:text-slate-600">Cookie Policy</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Preferences panel */}
      {showManage && (
        <div className="fixed bottom-0 left-0 right-0 z-[999] p-3 sm:p-4 md:p-6 pointer-events-none">
          <div className="mx-auto max-w-lg pointer-events-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Cookie className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Cookie Preferences</h2>
                      <p className="text-[11px] text-slate-400">Nepal Tourism Management System</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManage(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Choose which cookies you allow us to use. Essential cookies cannot be disabled as they
                  are required for the website to function properly.
                </p>

                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const c = colorMap[cat.color];
                    const Icon = cat.icon;
                    const isOn = prefs[cat.id];
                    const isExpanded = expanded === cat.id;
                    return (
                      <div key={cat.id} className={`rounded-xl border ${isOn ? c.border : 'border-slate-200'} overflow-hidden transition-colors`}>
                        <div className={`flex items-center gap-3 p-3 ${isOn ? c.bg : 'bg-slate-50'} transition-colors`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isOn ? c.bg : 'bg-white'} border ${isOn ? c.border : 'border-slate-200'}`}>
                            <Icon className={`h-3.5 w-3.5 ${isOn ? c.icon : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                              {cat.required && (
                                <span className="text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setExpanded(isExpanded ? null : cat.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {/* Toggle switch */}
                            <button
                              onClick={() => toggle(cat.id)}
                              disabled={cat.required}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                isOn ? 'bg-blue-600' : 'bg-slate-300'
                              } ${cat.required ? 'opacity-60 cursor-not-allowed' : ''}`}
                              aria-checked={isOn}
                              role="switch"
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                  isOn ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 bg-white border-t border-slate-100">
                            <p className="text-xs text-slate-500 leading-relaxed mb-1">{cat.description}</p>
                            <p className="text-[11px] text-slate-400">
                              <span className="font-medium text-slate-500">Examples: </span>{cat.examples}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={saveCustom}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => accept(true)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                  >
                    Accept All
                  </button>
                </div>

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  You can change these settings at any time in our{' '}
                  <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
