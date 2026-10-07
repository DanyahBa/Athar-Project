/* =========================================================
   Athar MVP — environmental impact (CO2e) estimates

   Simple, transparent factors per device type (kg CO2e avoided).
   Reuse avoids most of the manufacturing footprint of a new device;
   certified recycling recovers a smaller share.
   These are DEMO values for the MVP — replace them with the
   project's validated emission factors before production.
   ========================================================= */
window.Athar = window.Athar || { pages: {} };

Athar.impact = (function () {
  const REUSE_KG = { laptop: 8.4, smartphone: 4.2, monitor: 6.0, accessory: 0.8, other: 2.0 };
  const RECYCLE_SHARE = 0.15;

  // Condition reduces how much useful life is left.
  const CONDITION_FACTOR = { Good: 1, Fair: 0.8, Poor: 0.5 };

  function estimate(type, condition, route) {
    const base = REUSE_KG[type] != null ? REUSE_KG[type] : REUSE_KG.other;
    if (route === 'dispose') return round(base * RECYCLE_SHARE);
    return round(base * (CONDITION_FACTOR[condition] || 1));
  }

  function round(n) { return Math.round(n * 10) / 10; }

  // Totals for one user's devices (only devices with a final decision count).
  function summary(devices) {
    const done = devices.filter(function (d) { return d.status === 'reuse' || d.status === 'dispose'; });
    return {
      registered: devices.filter(function (d) { return d.status !== 'draft'; }).length,
      processed: done.length,
      reused: done.filter(function (d) { return d.status === 'reuse'; }).length,
      disposed: done.filter(function (d) { return d.status === 'dispose'; }).length,
      inReview: devices.filter(function (d) { return d.status === 'pending_it' || d.status === 'assessing' || d.status === 'returned'; }).length,
      co2: round(done.reduce(function (s, d) { return s + (Number(d.co2Saved) || 0); }, 0))
    };
  }

  return { estimate: estimate, summary: summary, REUSE_KG: REUSE_KG };
})();
