/* =========================================================
   Athar MVP — AI assessment service

   ONE public function:  Athar.ai.assess(device, onStep) → Promise<Assessment>

     Assessment = {
       condition:      'Good' | 'Fair' | 'Poor',
       recommendation: 'Reuse' | 'Dispose',
       confidence:     0..1,
       co2Estimate:    number (kg CO2e),
       reasons:        string[],      // shown to the user and the IT reviewer
       model:          string,
       at:             ISO date
     }

   PROVIDER = 'mock'  → a transparent rule-based model that runs in the
                        browser (uses the condition answers, device age
                        and a basic photo-quality check).
   PROVIDER = 'api'   → sends the same data to a real model endpoint.
                        Fill in API_URL and return the same shape.

   The pages never know which provider is used, so switching to the
   real AI model later only touches this file.
   ========================================================= */
window.Athar = window.Athar || { pages: {} };

Athar.ai = (function () {
  const PROVIDER = 'mock';
  const API_URL = '/api/assess'; // used only when PROVIDER === 'api'

  const STEPS = ['Analyzing your device...', 'Checking device condition...', 'Estimating reuse potential...'];

  // Points per answer: higher = worse.
  const POINTS = {
    power: { yes: 0, sometimes: 2, no: 6 },
    battery: { good: 0, drains: 1, dead: 2 },
    performance: { smooth: 0, slow: 1, freezes: 3 },
    screen: { none: 0, minor: 1, major: 3 },
    other: { none: 0, yes: 1 }
  };
  const REASON_TEXT = {
    'power:sometimes': 'Powers on inconsistently', 'power:no': 'Does not power on',
    'battery:drains': 'Battery drains quickly', 'battery:dead': 'Battery not working',
    'performance:slow': 'Slow performance', 'performance:freezes': 'Freezes during use',
    'screen:minor': 'Minor screen issues', 'screen:major': 'Major screen damage',
    'other:yes': 'Other issues reported'
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Basic photo-quality signal: average brightness and contrast of the image.
  function analyzePhoto(dataUrl) {
    return new Promise(function (resolve) {
      if (!dataUrl) { resolve(null); return; }
      const img = new Image();
      img.onload = function () {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        const px = ctx.getImageData(0, 0, 64, 64).data;
        let sum = 0, sumSq = 0, n = px.length / 4;
        for (let i = 0; i < px.length; i += 4) {
          const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          sum += l; sumSq += l * l;
        }
        const mean = sum / n;
        resolve({ brightness: mean, contrast: Math.sqrt(Math.max(0, sumSq / n - mean * mean)) });
      };
      img.onerror = function () { resolve(null); };
      img.src = dataUrl;
    });
  }

  function mockModel(device, photo) {
    const answers = device.conditionAnswers || {};
    let score = 0;
    const reasons = [];
    Object.keys(POINTS).forEach(function (k) {
      const v = answers[k];
      if (v == null) return;
      score += POINTS[k][v] || 0;
      if (REASON_TEXT[k + ':' + v]) reasons.push(REASON_TEXT[k + ':' + v]);
    });
    const age = device.year ? new Date().getFullYear() - device.year : 4;
    if (age > 7) { score += 2; reasons.push('Older than 7 years'); }
    else if (age > 4) { score += 1; reasons.push(age + ' years old'); }

    const condition = score <= 2 ? 'Good' : score <= 5 ? 'Fair' : 'Poor';
    const recommendation = (condition === 'Poor' || answers.power === 'no') ? 'Dispose' : 'Reuse';

    // Confidence: lower when the score sits near a boundary or the photo is unclear.
    let confidence = 0.92;
    if ([2, 3, 5, 6].includes(score)) confidence -= 0.1;
    if (photo && (photo.brightness < 45 || photo.contrast < 12)) {
      confidence -= 0.12;
      reasons.push('Photo is dark or unclear — IT will check visually');
    }
    if (!photo) { confidence -= 0.15; reasons.push('No photo provided'); }
    if (!reasons.length) reasons.push('No problems reported');

    return {
      condition: condition,
      recommendation: recommendation,
      confidence: Math.max(0.5, Math.round(confidence * 100) / 100),
      co2Estimate: Athar.impact.estimate(device.type, condition, recommendation === 'Dispose' ? 'dispose' : 'reuse'),
      reasons: reasons,
      model: 'athar-rules-v1 (demo)',
      at: new Date().toISOString()
    };
  }

  async function apiModel(device) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: device.type, brand: device.brand, model: device.model, year: device.year, answers: device.conditionAnswers, image: device.image })
    });
    if (!res.ok) throw new Error('AI service error (' + res.status + ')');
    return res.json(); // must return the Assessment shape documented above
  }

  // onStep(index, label) is called as each visible step starts; index === STEPS.length means done.
  async function assess(device, onStep) {
    const step = function (i) { if (onStep) onStep(i, STEPS[i] || 'Assessment complete'); };
    step(0);
    const photo = await analyzePhoto(device.image);
    await wait(1100);
    step(1);
    await wait(1100);
    step(2);
    const result = PROVIDER === 'api' ? await apiModel(device) : mockModel(device, photo);
    await wait(1000);
    step(STEPS.length);
    return result;
  }

  return { assess: assess, STEPS: STEPS };
})();
