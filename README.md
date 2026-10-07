# أثر Athar — Smart E-Waste Management (MVP)

A simple working MVP of the Athar prototype. It uses the same screens, colours,
fonts, icons and layout as the design prototype. The core journey now works
with real data.

> Register a device → details + internal condition → photo → AI assessment →
> AI result → submit → IT review → approve → Reuse / Dispose → impact.

## How to run

No installation is needed. It's plain HTML, CSS and JavaScript with no libraries.

1. Open the `Athar-MVP` folder.
2. Double-click **`index.html`**. It opens in Chrome, Edge or Safari.

That's it. To serve it locally instead (optional):

```bash
cd Athar-MVP
python -m http.server 8000      # then open http://localhost:8000
```

An internet connection is only used to load the Lexend / Tajawal fonts.

### Demo accounts

| Role | Login | Password |
|---|---|---|
| Donor (mobile app) | `2308249` or `maryhan@stu.kau.edu.sa` | `athar123` |
| IT specialist (admin) | `it@kau.edu.sa` | `admin123` |

You can also create a new donor account with **Sign up**.

## Demo script (the required scenario)

Tip: open **two browser tabs**. Use tab 1 for the donor app (`index.html`) and
tab 2 for the IT portal (`index.html#/admin/login`). Both tabs share the same
data, and the donor tab updates automatically when IT makes a decision.

1. **Tab 1:** Sign In, then **Register Device**, then choose **Laptop**, then **Continue**.
2. Enter brand **Apple**, model **MacBook Pro**, year **2019**. Answer the five
   condition questions: Yes, Drains quickly, Smooth, No issues, No issues. Then **Continue**.
3. **Upload from Gallery** (or **Scan Device** on a phone) and pick a laptop photo,
   then **Start AI Assessment**.
4. Watch the analysis steps, then **View Result**. The result shows *Good → REUSE*
   with an estimated CO₂e.
5. **Submit for IT Verification**. The status becomes *Pending IT Verification*.
6. **Tab 2:** sign in as IT. The device appears in **Pending AI Assessments**. Click **Review**.
7. Check the photo, device info, condition answers and AI result. Then choose **Approve**,
   then **Reuse**, then **University Department**, then **Confirm Decision**, then **Confirm**.
8. **Tab 1:** the device screen switches to *Great news!* with the
   *Reuse → University Department* destination. **Home**, **My Devices** and
   **Impact** now show the CO₂e saved.

Also try **Reject / Request Review**. The donor sees the IT note and can
**Update & Resubmit**. To start the demo again, go to **Profile → Reset demo data**.

## Project structure

```
Athar-MVP/
├── index.html               loads everything in order
├── css/athar.css            design tokens + components (from the prototype)
├── assets/                  Athar logos
└── js/
    ├── core/util.js         helpers: escaping, icons, dates, toast, image compression
    ├── data/model.js        device types, condition questions, statuses, destinations
    ├── data/store.js        DATA LAYER: users, sessions, devices (localStorage)
    ├── services/ai.js       AI ASSESSMENT SERVICE (mock now, real API later)
    ├── services/impact.js   CO₂e estimates and impact totals
    ├── components/ui.js     reusable UI: badges, nav bar, stepper, admin sidebar…
    ├── router.js            tiny hash router (#/home, #/admin/review/:id …)
    ├── pages/user/*.js      donor screens (login, home, register, assessment, device, devices/impact/profile)
    ├── pages/admin/*.js     IT screens (login, dashboard, review lists, review device)
    └── app.js               start-up
```

Each page is a small object: `{ route, role, render(ctx) → HTML, mount(ctx, root) }`.
To add a screen, create a file in `pages/`, register it on `Athar.pages`, and add a
`<script>` tag in `index.html`.

### Data model

```js
Device {
  id, userId, type, brand, model, year, image,
  conditionAnswers: { power, battery, performance, screen, other },
  assessment: { condition, recommendation, confidence, co2Estimate, reasons, model, at },
  aiCondition, aiRecommendation,
  status,            // draft → assessing → pending_it → approved → reuse | dispose  (or returned)
  review: { reviewerId, reviewerName, action, note, at },
  adminDecision,     // 'reuse' | 'dispose'
  destination,       // 'student' | 'department' | 'charity' | 'certified_disposal'
  co2Saved, history: [{ status, at, by, note }], createdAt, updatedAt
}
```

## Replacing the mock parts later

| Part | Now | To make it real |
|---|---|---|
| AI model | `services/ai.js` uses a rule-based model (condition answers + age + photo brightness check). It is labelled `athar-rules-v1 (demo)` in the UI. | Set `PROVIDER = 'api'` and `API_URL`. The endpoint must return the same `Assessment` object. No page changes needed. |
| Database | `data/store.js` saves to the browser's `localStorage`. | Keep the same function names and make them call your backend (e.g. `fetch('/api/devices')`). |
| Passwords | Stored in plain text **for the local demo only**. | Use real authentication on the server and hash passwords. |
| CO₂e factors | Demo values in `services/impact.js`. | Replace with the project's validated emission factors. |

Data lives in the browser you use. Another browser or computer starts with the
demo data again.

## Not in this MVP (still prototype concepts)

Eco Wallet / Eco-Tokens, blockchain and smart contracts, the full tracking
system, the donation marketplace, the AI chatbot, advanced notifications and
payments.
