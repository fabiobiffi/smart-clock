# PROJECT BRIEF — AMOLED Smart Clock & Service Monitor

## 1. Role and goal

Act as a Senior Frontend Engineer specialized in Vue 3, TypeScript, Progressive Web Apps, touch interfaces and optimization for older Android devices.

You must design and implement a personal web application that turns a Samsung Galaxy A5 (2015), running a custom Android 13 ROM, into a smart display used in landscape.

The application must have exclusively two main dashboards:

1. Clock & Weather
2. Service Health Monitor

The dashboards are **read-only** during normal use. They must not be administration interfaces, CRUD panels or applications with superfluous action buttons.

The goal is an application that is elegant, fast, stable, readable from a distance and suited to staying on screen for long periods.

Do not limit yourself to producing an architectural proposal or a mockup: analyze the repository, plan the work and implement a working solution.

---

## 2. Reference hardware: fundamental requirement

The target device is:

* Samsung Galaxy A5 (2015).
* Super AMOLED display.
* Native reference resolution: 1280 × 720 pixels in landscape.
* Current operating system: custom Android 13 ROM.
* Main use: dedicated device, placed on a stand, possibly connected to power.
* Interaction: occasional taps and swipes.
* Orientation: landscape only for the main layout.

**ALL DESIGN CHOICES MUST START FROM THIS DEVICE.**

Do not first design a desktop dashboard and then shrink it for smartphones. Design directly for a compact 5-inch landscape screen, taking into account viewing distance, proportions and the space actually available.

Do not use the normal responsive design of a website as the only criterion. The result must feel like a dedicated product, not a squeezed website.

### Orientation handling

* Design the layout primarily for landscape.
* Correctly handle the real viewport dimensions and any changes caused by system bars.
* Configure the PWA manifest with landscape orientation, where supported.
* Do not assume the manifest can always force the orientation on every browser.
* If necessary, document how to lock the orientation from the Android settings or through a future native solution.

---

## 3. Design system: AMOLED-first

The visual priority is to take advantage of the Super AMOLED display.

### Main rule: true black

Use absolute black as the main background:

* Main background: `#000000`.
* Avoid large white or light gray surfaces.
* Avoid extensive bright gradients.
* Avoid background images.
* Prefer black surfaces and, only when necessary, very dark grays.

Absolute black lets AMOLED pixels turn off in the black areas, reducing emitted light and potentially power consumption.

This does not mean every element must be black: information and states must keep high contrast.

### Suggested palette

* Background: `#000000`.
* Secondary surface: `#101010`.
* Tertiary surface: `#181818`.
* Borders: `#282828`.
* Primary text: `#FFFFFF`.
* Secondary text: `#A3A3A3`.
* Discreet accent: muted blue or cool light blue.
* Positive state: readable green, not fluorescent.
* Warning state: amber.
* Error state: red.
* Unknown state: gray.

Define colors through CSS custom properties. Avoid values scattered across components.

### Aesthetic direction

The interface must be inspired by Apple's visual language, but adapted to an AMOLED device and an always-on display.

Characteristics:

* Premium minimalism.
* Clean, modern typography.
* Very clear visual hierarchy.
* Large, readable numbers.
* Intentional spacing.
* Simple, consistent icons.
* Discreet, short animations.
* Cards only when they genuinely help separate information.
* No decoration for its own sake.
* No glassmorphism effects.
* No glowing or neon shadows.
* No blinking elements.
* No unnecessary continuous animations.

Do not literally copy proprietary Apple screens. Create an original interface that shares the same principles of cleanliness and quality.

### Burn-in prevention

The device may show the same interface for many hours.

Implement or plan for:

* Small, periodic, almost imperceptible shifts of some static elements, without compromising readability.
* No high-contrast line or element always in the same position throughout the day, when avoidable.
* No brightness forced to maximum.
* A night mode with reduced visual brightness.
* The ability to lower contrast further during night hours.
* No unnecessary fixed decorative elements.

Do not implement animations that force the entire layout to move frequently. Burn-in prevention must be discreet and must not compromise the experience.

---

## 4. Technology stack

Before choosing libraries, inspect the existing repository.

If the repository is empty or does not contain an already defined stack, use:

* Vue 3.
* TypeScript.
* Vite.
* Composition API with `<script setup lang="ts">`.
* CSS custom properties.
* CSS Grid and Flexbox.
* IndexedDB or localStorage for local preferences, choosing the simplest suitable solution.
* PWA with manifest and service worker.
* HTTPS for distribution and installation on Android.

Do not add a backend unless necessary.

Do not introduce heavy dependencies for features easily implemented with native browser APIs.

Avoid generic UI frameworks if they prevent achieving a precise, lightweight layout.

Use up-to-date libraries only after verifying that they are compatible with the browser available on the target device.

Do not assume that all modern APIs are supported just because the ROM is based on Android 13.

---

## 5. Application architecture

The application must have two dashboards and essential navigation.

### Dashboard A — Clock & Weather

This is the main screen.

It must show:

* Local time in 24-hour format.
* Clearly visible minutes, updated without reloading the page.
* Day of the week.
* Full date.
* Current weather conditions.
* Current temperature.
* Daily minimum and maximum temperature, if available.
* A simple weather icon.
* Configurable location.

The layout must take advantage of the screen width:

* Main area dedicated to the clock.
* Secondary area dedicated to date and weather.
* No bulky permanent navigation bar.
* No useless buttons.
* No need to interact to see the essential information.

The clock must work even without an Internet connection.

The weather must be fetched from a configurable provider, with a service isolated from the visual component. Do not put secret credentials in the frontend.

Handle initial loading, errors, absence of connection and the last available data.

Do not invent weather data when the provider does not respond.

### Dashboard B — Service Health Monitor

This dashboard shows the status of a few personal services.

It must be a technical view, readable from a distance and designed to show several services at the same time.

Each service must be able to display:

* Name.
* Status.
* Visual indicator.
* Response time, when available.
* Last check.
* Optional concise error message.
* Optional indication that the data is stale.

Provide at least the following states:

* UP: service reachable and check passed.
* DEGRADED: service reachable but with problems or abnormal performance.
* DOWN: check failed according to the defined rules.
* UNKNOWN: no reliable data available.

Do not use color alone to distinguish states: always show a text label as well.

Do not show UP just because an HTTP request returned a response. The status must derive from the healthcheck rule configured for that service.

For example, a `/health` endpoint could return HTTP 200 and a payload indicating that a critical dependency is unavailable. The check must be able to account for this distinction when so specified.

Organize the services in a responsive grid specifically designed for the 5-inch landscape display.

The most important information must be readable without zooming.

Do not include complex charts, dense tables or extensive histories in the main view.

### Check refresh

* Default interval: 30 seconds.
* Interval configurable in the future.
* Timeout for each check.
* Network error handling.
* Avoid overlapping requests for the same service.
* Use an update strategy that does not generate uncontrolled requests.
* Keep the last known state visible when a new check fails, but clearly mark it as stale or not updated.
* Avoid automatically treating a service as DOWN just because the browser has no network access.

If the checks require access to private networks, Docker, databases or services reachable only through Tailscale, provide a backend or an intermediate monitor.

Do not attempt to access a database directly from the browser.

Do not expose credentials, administrative tokens or sensitive internal endpoints in the frontend bundle.

Do not disable CORS or TLS checks as a solution to connectivity problems.

---

## 6. Read-only dashboards

This is an explicit functional requirement.

During normal use:

* There must be no buttons to edit services.
* There must be no CRUD operations.
* There must be no restart, stop or deploy commands.
* There must be no administrative actions.
* There must be no visible forms on the main screen.
* There must be no buttons to run commands on the server.
* The healthcheck dashboard must be limited to displaying information.

The only ordinary interactions must be:

1. Horizontal swipe to switch dashboards.
2. Optional non-destructive taps to show additional information, only if truly useful.

Settings, if implemented, must be separate from the main view and must not turn the dashboard into an administration panel.

Do not implement a complex visual editor for dragging and resizing widgets in this first version.

The arrangement of the two dashboards may be defined in code or by a simple local configuration.

---

## 7. Navigation and gestures

Navigation must be designed for touch use in landscape.

* Swipe left: go to the next dashboard.
* Swipe right: go back to the previous dashboard.
* Navigation must be either cyclic or clearly handle the limits; choose a consistent behavior and document it.
* Add a discreet page indicator.
* Prevent a normal tap from causing a dashboard change.
* Do not intercept gestures needed to interact with inner elements.
* Avoid dependencies on hover, because the device is touch-based.
* Correctly support both touch and pointer events.

Animations must be short, smooth and light.

Respect `prefers-reduced-motion` where applicable.

Avoid recalculating or remounting all widgets on every swipe unless necessary.

---

## 8. Display mode and continuous operation

The application is meant to stay open for a long time.

Implement a proper PWA, but do not assume that installation alone guarantees kiosk behavior.

Requirements:

* Manifest with name, icons and landscape orientation.
* Service worker for static assets.
* Offline operation of the main structure.
* Screen without browser elements when the app is launched in a supported standalone mode.
* Correct recovery from loss and restoration of the connection.
* Handling of return to the foreground.
* Time updates even after long periods in the background.
* Avoid excessive timers and polling.

Evaluate the Screen Wake Lock API, if supported, to keep the screen on while the page is active.

Handle the case where the Wake Lock is revoked and the possible need to request it again when the page becomes visible.

Do not claim that the Wake Lock guarantees permanent operation in the background.

Document the Android settings needed to keep the device awake while charging.

Do not force the physical display brightness through APIs not available in the browser.

Provide a visual night mode, but do not claim that this change automatically alters the hardware brightness.

---

## 9. Performance

The Galaxy A5 is an older device. Performance is a project requirement.

* Keep the initial bundle small.
* Avoid heavy dependencies.
* Avoid canvas and complex charts unless necessary.
* Avoid continuous animations.
* Do not update the whole component every second if updating the clock is enough.
* Avoid layout thrashing.
* Avoid large images.
* Prefer lightweight SVG icons or an essential icon library.
* Do not add polling to every component independently.
* Centralize periodic updates.
* Use `requestAnimationFrame` only when appropriate.
* Verify that navigation stays smooth.
* Avoid memory leaks caused by timers or listeners that are not removed.

The application must remain usable even when the device is connected to power for many hours.

---

## 10. Code structure

Maintain a clear separation between:

* Layout and navigation.
* Visual components.
* Clock logic.
* Weather retrieval.
* Service configuration.
* Healthcheck execution.
* Local persistence.
* Connection handling.
* Global styles.

Use TypeScript rigorously.

Define explicit types for:

* Dashboard.
* Service configuration.
* Healthcheck result.
* Service status.
* Weather data.
* Local preferences.

Avoid `any` except in justified exceptional cases.

Avoid monolithic components.

Avoid duplicating logic.

Do not build an overly abstract architecture: the project must remain simple to understand and modify.

---

## 11. Configuration management

Do not invent domains, services, credentials or API keys.

If the services to monitor are not yet known:

* Implement a typed data model.
* Include only examples clearly identified as demos.
* Do not present the examples as real healthchecks.
* Show UNKNOWN or an explicit demo state until real endpoints are configured.
* Centralize the configuration in a single place.
* Document how to add a new service.

Do not add an authentication system or a backend just to make the project look complete.

If a backend is needed to query internal services, propose a well-defined interface and implement only what can be completed without inventing infrastructure.

---

## 12. Accessibility and readability

Even though the device is small, the dashboard must be readable from a distance.

* High contrast.
* Consistent font sizes.
* No essential text that is too small.
* No critical information represented by an icon alone.
* Visually distinct states.
* No blinking animations.
* Respect for reduced-motion preferences.
* No unexpected horizontal overflow.
* No zoom needed to read the main data.

Optimize the typography for the 1280 × 720 landscape display, but use responsive units and measure the real viewport, since the browser may reserve space for system bars.

---

## 13. Testing and acceptance criteria

Before declaring the work complete, verify at least the following.

### Layout

* The layout is designed for landscape.
* Both dashboards are readable on the Galaxy A5.
* There is no horizontal overflow.
* The main content is visible without scrolling.
* The layout remains usable with small viewport variations.

### Clock & Weather

* The time updates correctly.
* The format is 24-hour.
* The date is localized in Italian.
* The clock works offline.
* The weather handles loading, errors and stale data.

### Service Health

* Each service shows an explicit status.
* Requests have timeouts.
* Checks do not overlap uncontrollably.
* Loss of connection is not confused with certainty with a DOWN service.
* Stale states are recognizable.
* No secret credentials are exposed.

### Navigation

* Swiping works in both directions.
* Swipes do not interfere with normal taps.
* Changing page produces no errors.
* Updates continue correctly after returning to the foreground.

### PWA

* The manifest is valid.
* Static assets are served correctly.
* The app shell works offline.
* The app can be installed through a compatible browser.
* The orientation and Wake Lock behavior is documented and verified, not assumed.

### Quality

* TypeScript compiles.
* The production build succeeds.
* Existing tests pass.
* Add tests for critical parts when the stack allows it.
* Do not leave avoidable console errors.
* Do not declare tests as passed if they were not run.

---

## 14. Required way of working

Proceed like a senior engineer who must deliver a truly usable project.

1. Inspect the repository, the dependencies, the structure and any instruction files such as `AGENTS.md` and `README.md`.
2. Briefly summarize the initial state and flag any technical constraints.
3. Define a short, concrete implementation plan.
4. Implement the project directly in the repository.
5. Keep dependencies to a minimum.
6. Run the available build, typecheck, lint and tests.
7. Fix the errors introduced by your work.
8. Update the documentation with installation, configuration and deployment instructions.
9. Explain how to install the PWA on the Galaxy A5.
10. Clearly state which features are real, which require configuration and which still need to be verified on the physical device.

Do not stop after proposing the architecture.

Do not replace the implementation with a simple static mockup.

Do not invent test results.

Do not introduce features that were not requested just to expand the project.

If non-essential information is missing, choose a reasonable default and document it. If, on the other hand, a decision genuinely prevents implementing a feature, identify the blocker and complete all the other independent parts.

## Expected result

A working PWA, in landscape, with an AMOLED-first theme and just two read-only dashboards:

1. Clock and weather.
2. Healthcheck of personal services.

It must be minimal, fast, reliable, easy to maintain and designed to be used for many hours a day on the Samsung Galaxy A5 (2015) with Android 13.

**Absolute priorities, in order:**

1. Compatibility and readability on the real device.
2. Black background and attention to the AMOLED display.
3. Reliability of healthcheck states.
4. Smooth touch navigation.
5. Architectural simplicity.
6. Future extensibility without over-engineering.
