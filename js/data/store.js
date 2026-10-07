/* =========================================================
   Athar MVP — data layer (mock persistence)

   Everything is stored in the browser's localStorage so the full flow
   works without a server. Every page talks ONLY to the functions
   exported here, so replacing this file with calls to a real API
   (e.g. fetch('/api/devices')) is the only change needed later.

   Collections:
     users   { id, role: 'user'|'admin', name, email, universityId, password }
     devices { id, userId, type, brand, model, year, image, conditionAnswers,
               assessment, aiCondition, aiRecommendation, status,
               review, adminDecision, destination, co2Saved,
               history: [{ status, at, by, note }], createdAt, updatedAt }
   NOTE: passwords are stored in plain text ONLY because this is a local
   demo. A real backend must hash them.
   ========================================================= */
window.Athar = window.Athar || { pages: {} };

Athar.store = (function () {
  const DB_KEY = 'athar_mvp_db_v1';
  const SESSION_KEY = { user: 'athar_mvp_session_user', admin: 'athar_mvp_session_admin' };
  let memory = null;      // fallback when localStorage is unavailable
  const listeners = [];

  function now() { return new Date().toISOString(); }
  function daysAgo(n, h) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h || 10, 15, 0, 0); return d.toISOString(); }

  function seed() {
    return {
      version: 1,
      users: [
        { id: 'u_admin', role: 'admin', name: 'Rania Alhazmi', email: 'it@kau.edu.sa', universityId: 'IT-001', password: 'admin123' },
        { id: 'u_maryhan', role: 'user', name: 'Maryhan Abualela', email: 'maryhan@stu.kau.edu.sa', universityId: '2308249', password: 'athar123' },
        { id: 'u_lama', role: 'user', name: 'Lama Alzahrani', email: 'lama@stu.kau.edu.sa', universityId: '2301100', password: 'athar123' },
        { id: 'u_fcit_lab', role: 'user', name: 'FCIT Lab 2', email: 'lab2@kau.edu.sa', universityId: 'DEPT-02', password: 'athar123' }
      ],
      // Demo devices from OTHER users so the IT dashboard is not empty.
      // The main demo account (Maryhan) starts with no devices.
      devices: [
        seedDevice('ATH-26-0201', 'u_lama', 'smartphone', 'Apple', 'iPhone 11', 2019,
          { power: 'yes', battery: 'drains', performance: 'smooth', screen: 'none', other: 'none' },
          'Good', 'Reuse', 0.9, 4.2, 'pending_it', daysAgo(1, 9)),
        seedDevice('ATH-26-0198', 'u_fcit_lab', 'monitor', 'Dell', 'P2419H', 2016,
          { power: 'sometimes', performance: 'freezes', screen: 'major', other: 'yes' },
          'Poor', 'Dispose', 0.88, 1.0, 'pending_it', daysAgo(2, 13)),
        Object.assign(seedDevice('ATH-26-0151', 'u_lama', 'laptop', 'Dell', 'Latitude 5490', 2018,
          { power: 'yes', battery: 'good', performance: 'slow', screen: 'none', other: 'none' },
          'Good', 'Reuse', 0.86, 8.4, 'reuse', daysAgo(9, 11)),
          { adminDecision: 'reuse', destination: 'student', co2Saved: 8.4,
            review: { reviewerId: 'u_admin', reviewerName: 'Rania Alhazmi', action: 'approved', note: 'Battery replaced. Ready for a student.', at: daysAgo(7, 10) } })
      ]
    };
  }

  function seedDevice(id, userId, type, brand, model, year, answers, cond, rec, conf, co2, status, created) {
    const history = [
      { status: 'draft', at: created, by: userId },
      { status: 'assessing', at: created, by: 'ai' },
      { status: 'pending_it', at: created, by: userId }
    ];
    if (status === 'reuse') history.push({ status: 'approved', at: created, by: 'u_admin' }, { status: 'reuse', at: created, by: 'u_admin' });
    return {
      id: id, userId: userId, type: type, brand: brand, model: model, year: year, image: null,
      conditionAnswers: answers,
      assessment: { condition: cond, recommendation: rec, confidence: conf, co2Estimate: co2, reasons: [], model: 'athar-rules-v1 (demo)', at: created },
      aiCondition: cond, aiRecommendation: rec, status: status,
      review: null, adminDecision: null, destination: null, co2Saved: 0,
      history: history, createdAt: created, updatedAt: created
    };
  }

  function read() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall back to memory */ }
    if (!memory) memory = seed();
    return memory;
  }

  function write(db) {
    memory = db;
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) {
      // Most likely the storage quota (large images). Keep working in memory.
      console.warn('Athar: could not save to localStorage', e);
    }
    listeners.forEach(function (fn) { fn(); });
  }

  function init() {
    let has = false;
    try { has = !!localStorage.getItem(DB_KEY); } catch (e) {}
    if (!has) write(seed());
    // Another tab (e.g. the IT portal) changed the data → refresh this tab.
    window.addEventListener('storage', function (e) {
      if (e.key === DB_KEY) { memory = null; listeners.forEach(function (fn) { fn(); }); }
    });
  }

  function onChange(fn) { listeners.push(fn); }

  function resetDemo() {
    try { localStorage.removeItem(SESSION_KEY.user); localStorage.removeItem(SESSION_KEY.admin); } catch (e) {}
    write(seed());
  }

  /* ---------- Users & sessions ---------- */
  function findUserByLogin(login, role) {
    const l = String(login || '').trim().toLowerCase();
    return read().users.find(function (u) {
      return u.role === role && (u.email.toLowerCase() === l || String(u.universityId).toLowerCase() === l);
    }) || null;
  }
  function getUser(id) { return read().users.find(function (u) { return u.id === id; }) || null; }
  function createUser(data) {
    const db = read();
    const email = String(data.email || '').trim().toLowerCase();
    if (db.users.some(function (u) { return u.email.toLowerCase() === email; })) throw new Error('An account with this email already exists.');
    const user = { id: Athar.util.uid('u'), role: 'user', name: data.name.trim(), email: email, universityId: (data.universityId || '').trim(), password: data.password };
    db.users.push(user);
    write(db);
    return user;
  }
  function login(loginId, password, role) {
    const user = findUserByLogin(loginId, role);
    if (!user || user.password !== password) throw new Error('Incorrect email / ID or password.');
    setSession(role, user.id);
    return user;
  }
  function setSession(role, userId) { try { localStorage.setItem(SESSION_KEY[role], userId); } catch (e) { memory = memory || read(); memory['_s_' + role] = userId; } }
  function clearSession(role) { try { localStorage.removeItem(SESSION_KEY[role]); } catch (e) {} if (memory) delete memory['_s_' + role]; }
  function currentUser(role) {
    let id = null;
    try { id = localStorage.getItem(SESSION_KEY[role]); } catch (e) { id = memory && memory['_s_' + role]; }
    const u = id ? getUser(id) : null;
    return u && u.role === role ? u : null;
  }

  /* ---------- Devices ---------- */
  function listDevices(filterFn) {
    const all = read().devices.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    return filterFn ? all.filter(filterFn) : all;
  }
  function devicesOf(userId) { return listDevices(function (d) { return d.userId === userId; }); }
  function getDevice(id) { return read().devices.find(function (d) { return d.id === id; }) || null; }

  function createDevice(userId, type) {
    const db = read();
    const t = now();
    const device = {
      id: 'ATH-' + String(new Date().getFullYear()).slice(2) + '-' + String(1000 + db.devices.length + Math.floor(Math.random() * 900)).slice(-4),
      userId: userId, type: type, brand: '', model: '', year: null, image: null,
      conditionAnswers: {}, assessment: null, aiCondition: null, aiRecommendation: null,
      status: 'draft', review: null, adminDecision: null, destination: null, co2Saved: 0,
      history: [{ status: 'draft', at: t, by: userId }], createdAt: t, updatedAt: t
    };
    db.devices.push(device);
    write(db);
    return device;
  }

  function updateDevice(id, patch) {
    const db = read();
    const d = db.devices.find(function (x) { return x.id === id; });
    if (!d) throw new Error('Device not found');
    Object.assign(d, patch, { updatedAt: now() });
    write(db);
    return d;
  }

  // Changes status AND records it in the device history (used by the status timeline).
  function setStatus(id, status, by, note, patch) {
    const db = read();
    const d = db.devices.find(function (x) { return x.id === id; });
    if (!d) throw new Error('Device not found');
    Object.assign(d, patch || {});
    d.status = status;
    d.updatedAt = now();
    d.history = (d.history || []).concat([{ status: status, at: d.updatedAt, by: by, note: note || '' }]);
    write(db);
    return d;
  }

  function deleteDevice(id) {
    const db = read();
    db.devices = db.devices.filter(function (d) { return d.id !== id; });
    write(db);
  }

  return {
    init: init, onChange: onChange, resetDemo: resetDemo,
    login: login, createUser: createUser, getUser: getUser, currentUser: currentUser, setSession: setSession, clearSession: clearSession,
    listDevices: listDevices, devicesOf: devicesOf, getDevice: getDevice, createDevice: createDevice,
    updateDevice: updateDevice, setStatus: setStatus, deleteDevice: deleteDevice
  };
})();
