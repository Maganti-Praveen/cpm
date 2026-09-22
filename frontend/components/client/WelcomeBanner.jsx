// Displays a greeting header carrying the user's name on portal landing pages.
// Connects with dynamic site welcome texts.


import React from "react";

export default function WelcomeBanner({ clientName = "User", projectName = "your project" }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-primary-light/90 via-primary-light/60 to-primary-light/45 rounded-2xl p-6 md:p-8 border border-indigo-100/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans">
      {/* Decorative background shapes */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-300 opacity-25 rounded-full blur-lg md:blur-2xl transform translate-x-10 -translate-y-10" aria-hidden="true" />
      <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-primary-mid opacity-15 rounded-full blur-lg md:blur-xl transform translate-y-8" aria-hidden="true" />
      
      <div className="relative z-10 flex-1">
        <h1 className="font-display font-bold text-slate-900 text-xl md:text-2xl leading-tight tracking-tight">
          {getGreeting()}, {clientName}
        </h1>
        <p className="text-slate-600 text-sm md:text-body-lg font-normal mt-1 leading-relaxed">
          Here's what's happening with your <span className="font-semibold text-primary truncate inline-block max-w-[240px] md:max-w-[400px] align-bottom" title={projectName}>{projectName}</span> project today.
        </p>
      </div>
    </div>
  );
}

