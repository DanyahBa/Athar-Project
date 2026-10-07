/* Athar MVP — shared constants that describe the domain (types, questions, statuses). */
window.Athar = window.Athar || { pages: {} };

Athar.model = {
  DEVICE_TYPES: [
    { id: 'laptop',     label: 'Laptop',      hint: 'Notebooks, ultrabooks',     icon: 'laptop' },
    { id: 'smartphone', label: 'Smartphone',  hint: 'Phones, tablets',           icon: 'phone' },
    { id: 'monitor',    label: 'Monitor',     hint: 'Screens, displays',         icon: 'monitor' },
    { id: 'accessory',  label: 'Accessories', hint: 'Audio, keyboards, cables',  icon: 'headphones' },
    { id: 'other',      label: 'Other',       hint: 'Printers, routers, more',   icon: 'box' }
  ],

  // Internal-condition questions. `skipFor` hides a question that does not apply to a device type.
  QUESTIONS: [
    { id: 'power',       q: 'Does the device power on normally?', options: [['yes', 'Yes'], ['sometimes', 'Sometimes'], ['no', 'No']] },
    { id: 'battery',     q: 'How is the battery?',                options: [['good', 'Good'], ['drains', 'Drains quickly'], ['dead', 'Not working']], skipFor: ['monitor', 'accessory'] },
    { id: 'performance', q: 'How is the performance?',            options: [['smooth', 'Smooth'], ['slow', 'Slow'], ['freezes', 'Freezes']], skipFor: ['accessory'] },
    { id: 'screen',      q: 'Any screen problems?',               options: [['none', 'No issues'], ['minor', 'Minor issues'], ['major', 'Major issues']], skipFor: ['accessory'] },
    { id: 'other',       q: 'Any other issues?',                  options: [['none', 'No issues'], ['yes', 'Yes']] }
  ],

  // Device lifecycle statuses (in order).
  STATUS: {
    draft:      { label: 'Draft',                   tone: 'neutral' },
    assessing:  { label: 'Under AI Assessment',     tone: 'info' },
    pending_it: { label: 'Pending IT Verification', tone: 'pending' },
    approved:   { label: 'Approved',                tone: 'reuse' },
    reuse:      { label: 'Reuse',                   tone: 'reuse' },
    dispose:    { label: 'Dispose',                 tone: 'dispose' },
    returned:   { label: 'Review Requested',        tone: 'dispose' }
  },

  DESTINATIONS: {
    student:    { label: 'Student',               hint: 'A student who needs a device',     icon: 'student' },
    department: { label: 'University Department', hint: 'A lab, office or teaching space',  icon: 'building' },
    charity:    { label: 'Charity',               hint: 'A verified partner charity',       icon: 'heart' },
    certified_disposal: { label: 'Certified E-Waste Disposal', hint: 'Licensed recycler · materials recovered', icon: 'factory' }
  },

  typeInfo: function (id) {
    return Athar.model.DEVICE_TYPES.find(function (t) { return t.id === id; }) || Athar.model.DEVICE_TYPES[4];
  },
  questionsFor: function (type) {
    return Athar.model.QUESTIONS.filter(function (q) { return !(q.skipFor || []).includes(type); });
  },
  answerLabel: function (qid, value) {
    const q = Athar.model.QUESTIONS.find(function (x) { return x.id === qid; });
    const opt = q && q.options.find(function (o) { return o[0] === value; });
    return opt ? opt[1] : '—';
  },
  deviceName: function (d) {
    const name = [d.brand, d.model].filter(Boolean).join(' ');
    return name || Athar.model.typeInfo(d.type).label;
  }
};
