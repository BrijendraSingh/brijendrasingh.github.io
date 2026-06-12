INSERT OR IGNORE INTO users (id,email,display_name,avatar_url,oauth_provider,oauth_subject,role,session_token) VALUES (1,'bps.brijendra@gmail.com','Brijendra Singh',NULL,'google','seed-admin','admin',NULL);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (1,'art-of-automation','Understanding Automation Test Layers','How to divide tests across the pyramid for faster feedback, lower cost, and fewer flaky UI suites — lessons from 14+ years in software quality.','
> We cannot test everything — and we should not try to test everything on the UI automation layer. Variety of test layers exist where documented tests can be divided. This helps us reduce execution time, increase fast feedback, and shift left as a side effect.

Picture this: your nightly regression suite takes four hours. Half the failures are environment noise. The other half point to a login API change that nobody noticed because the UI test only checked that the dashboard loaded. Sound familiar? The fix is rarely "add more E2E tests." It is choosing the **right layer** for each kind of check.

## The balancing act

Each activity in a project has a cost and should deliver business value. Testing is no exception. Unnecessary testing causes delays and burns budget. Too little testing hands defective products to end users. Software testing should be done **appropriately** — not maximally.

![Triple constraint — cost, quality, and time](/images/blog/art-triple-constraint.png)

The triple constraint — cost, quality, and time — is a balancing act every quality practitioner manages. YOUR job is to keep the scope of quality practices inside the cost and time parameters stakeholders set, without hiding risk.

**Scenario:** A product owner asks for "full regression on every commit." YOU translate that into layer-appropriate checks: unit and API on every PR, a thin UI smoke on merge, full regression twice a week. Same confidence, fraction of the wait.

## Cost of defect

Cost of fixing a defect grows exponentially the later it is discovered. Earlier we find it, lower the cost to fix it. As quality analysts, we need to be shifted left and perform quality checks as early as possible.

![Cost of defect increases over the SDLC](/images/blog/art-cost-of-defect.png)

A typo in a validation rule caught in a **STORY KICKOFF** costs a conversation. The same bug found in production costs a hotfix, a comms plan, and trust you cannot buy back.

## Test pyramid

The test pyramid is the best way to achieve shift left for quality checks. It also shifts our mindset from **defect identification** to **defect prevention** — a theme I explore further in [Keys to become an effective QA](/blog/defect-prevention-mindset/).

![Test pyramid overview](/images/blog/art-test-pyramid.png)

Collaborate with app devs to understand how much coverage YOU can push into lower layers. That reduces tests on higher layers that are costly and usually flaky.

```mermaid
flowchart BT
  ui[UI / E2E — few journeys]
  api[API / Integration — business rules]
  integ[Component / Service — contracts]
  unit[Unit — logic and edge cases]
  ui --> api --> integ --> unit
```

Lets understand what belongs on each layer — and what does **not**.

### Unit tests — the wide base

![Unit test layer](/images/blog/art-unit-layer.png)

- Functional, cross-functional, UI/JS classes (model, controller, view)
- Boundary values and edge cases
- Immediate feedback
- Safety net for refactors
- Lowest cost of implementation

**Put here:** price calculation rounding, date-boundary logic, input sanitization, state machine transitions.

**Do not put here:** full browser flows, cross-service orchestration, "does the pixel look right on iPhone 12."

**Example:** A discount engine with ten tier rules — ten unit tests with table-driven inputs beat one UI test that clicks through a checkout funnel ten times.

### Integration / component tests — the middle

![Integration layer](/images/blog/art-integration-layer.png)

- Integration points between modules
- API contract tests
- API compatibility across versions
- Regressive data validations
- DB interactions
- Service-level feedback on interactions

**Put here:** repository queries return expected aggregates, message handlers persist correctly, cache invalidation fires when data changes.

**Do not put here:** every permutation of a form field — that belongs in unit or API layers closer to the rule.

**Example:** After a schema migration, component tests on the order service catch broken joins before any tester opens the app.

### API tests — business logic without the browser

![API test layer](/images/blog/art-api-layer.png)

- Regressive end-to-end tests at the service boundary
- Functional and cross-functional API scenarios
- Feedback on business rules without UI latency

**Put here:** authorization matrices, negative paths, bulk operations, pagination edge cases.

**Do not put here:** layout, accessibility of buttons, or native mobile gestures.

**Example:** Login — one happy-path UI check; invalid password, locked account, expired token, and role mismatch on the API layer. I dig into this split in [End to End Testing using component strategy](/blog/component-tests/).

### UI / E2E tests — the narrow top

![UI E2E layer](/images/blog/art-ui-layer.png)

- End-to-end user journeys
- UI interactions in real browsers or devices
- Tests from the user''s point of view

**Put here:** critical paths that only make sense when the full stack is wired — checkout, onboarding, publish workflow.

**Do not put here:** exhaustive validation of business rules you already proved downstream. That is how suites become slow, flaky, and ignored.

**Rule of thumb:** If you can delete a UI test and still catch the same bug with a faster layer test, delete it or never write it.

## Features of an effective automation suite

- **Robustness** — failures mean something broke, not that the lab is tired
- **Speed / feedback cycle** — developers run checks before coffee gets cold
- **Debugging** — failures point to a layer and a component
- **Maintainability** — tests read like specs, not archaeology
- **Low proneness to error** — no hard-coded sleeps, shared mutable state, or mystery data

Implementation of the test pyramid helps achieve most of these. The pyramid is not a diagram for slide decks — it is a **budget** for where YOU spend automation effort.

## Quick checklist before you automate

1. Can a unit test prove this?
2. If not, can an API or contract test prove it?
3. Is this journey the only way a user would notice the failure?
4. Will this test still pass if a downstream service is slow but correct?
5. Who updates this test when the UI restyles — and will they?

## What do you think?

How does YOUR team split tests today? Are UI suites doing work that belongs lower? Share what you would move first — I learn as much from readers as from projects.

> Happy Testing :)
','published',1,1,'2021-11-22','2021-11-22',6,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (2,'component-tests','End to End Testing using component strategy','Split E2E coverage across aggregation, API, and UI components for faster feedback, fewer flaky tests, and clearer failure analysis.','
> Component Testing is an approach where we divide automated tests into applicable layers and target specific responsibilities of various components — to reduce interdependencies, execution time, and logic complexity.

If every business rule lives in a single UI journey, one slow warehouse query or one batch job running late turns your "E2E" into a lottery. Component strategy breaks the monolith **in your test design**, not necessarily in your architecture.

This pairs naturally with the [test pyramid](/blog/art-of-automation/). Below is how I apply it on real systems.

![Component testing and the test pyramid](/images/blog/component-tests-pyramid.png)

## The usual practice — and why it hurts

![UI-only E2E pattern](/images/blog/component-tests-usual-practice.png)

We have observed a pattern: teams write end-to-end automated tests by **only** targeting the GUI to validate complete business logic.

This approach can work when:

- The backend is very simple with little business logic
- Data is a basic repository with small, stable datasets
- Releases are infrequent and the suite stays small

Otherwise, I do not recommend validating complete business logic on the UI layer alone. YOU pay in minutes per run, flaky failures, and RCA sessions that end with "the batch was still running."

**Before / after snapshot**

| UI-only E2E | Component approach |
|-------------|-------------------|
| One 12-minute test per scenario | Aggregation test ~30s, API test ~5s, UI smoke ~90s |
| Failure: "checkout broken" | Failure: "pricing API returned 409" |
| Blocked when warehouse lags | UI tests use mocked API responses |

## Component approach — break down the logic first

Understand application component responsibilities, then break business logic into parts. That helps YOU write more effective E2Es.

Benefits:

- Reduce flaky tests
- Drastically reduce feedback time
- Accurate failure analysis — pinpoint the flawed area

![Business logic split across components](/images/blog/component-tests-breakdown.png)

**Business logic 1:** Data aggregation / batch logic → aggregation component tests

**Business logic 2:** Application service logic → API component tests, UI component tests, then system tests

Lets dig into each layer with examples.

### Data aggregation / batch component tests

If your application involves aggregation or batch processing, test that logic **in this layer only**.

**Why not on UI E2E?**

- Warehouse pulls can take unpredictably long
- Batch schedules add coupling — tests fail when components are out of sync, not when logic is wrong

**Example:** A nightly sales rollup reads 40 tables. A component test feeds a **fixed fixture** of orders and asserts the rollup table — no browser, no cron wait. When the rollup rule changes, YOU know in seconds.

### API component tests

Take login — it is not best practice to test every login combination on the UI.

- Bare minimum happy path on UI E2E
- Invalid credentials, lockout, password expiry, and role-based access on the API layer
- Negative authorization cases without spinning up a browser per variant

**Example scenario:** Ten roles × five protected endpoints = fifty API checks. One UI test confirms a standard user sees the dashboard. The API suite catches a missing 403 before QA spends an afternoon clicking menus.

Cut UI dependency, improve coverage, fewer invalid failures.

### UI component tests — control the data

We may not always control application test data. That creates trouble maintaining datasets for every edge case.

- Mock or stub API responses fed to the GUI
- Validate specific business cases and their reflection in the UI
- Cut backend dependency; make UI tests robust

**Example:** Test "out of stock" banner by returning `{ "stock": 0 }` from a stubbed catalog API — no need to drain inventory in a shared QA database that three other teams use.

### System tests — happy critical paths only

By now YOU have tested at various component levels. System tests prove **integration** — frontend and backend wired together.

Keep the count low. Cover happy critical paths only: place order, register user, submit claim. If a system test fails, component suites should already narrow the blast radius.

```mermaid
flowchart LR
  batch[Batch / aggregation tests]
  api[API component tests]
  ui[UI component tests with mocks]
  system[System E2E — critical paths]
  batch --> api --> ui --> system
```

## Putting it together on one feature

Imagine **refund processing**:

1. **Batch layer** — settlement file produces refundable rows (fixture input, assert output file)
2. **API layer** — POST `/refunds` with valid, invalid, and duplicate IDs
3. **UI layer** — refund button disabled when API returns `ineligible` (mocked)
4. **System** — one journey: user requests refund, sees confirmation email trigger

Four layers, one feature, no twelve-minute UI marathon.

## When microservices enter the picture

Component boundaries often map to services. The same split applies — see [Microservices Test Strategy](/blog/testing-microservices/) for how contract tests and environments fit in.

## Your turn

Pick one flaky UI test on YOUR project. Which layer could own the assertion instead? Start there; do not rewrite the world in a sprint.

> Happy Testing :)
','published',1,1,'2021-12-10','2021-12-10',5,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (3,'defect-prevention-mindset','Keys to become an effective QA','Shift QA from defect detection to prevention — STORY KICKOFF, devbox, bug bash, and the 80-20 split that keeps releases on schedule.','
> Prevention is better than cure!
>
> Lets find out how shifting QA mindset from defect **detection** to defect **prevention** can help YOUR team achieve goals without causing testing bottlenecks.

## Why avoid late defect detection

Finding and fixing defects gives the team confidence to release. But finding defects in later SDLC stages delays production. Teams compromise on quality — defects get deprioritized so the release ships on time.

Recall the SDLC flow:

> - Requirement gathering and analysis
> - Development
> - Testing
> - Deployment

What goes wrong when we only hunt defects **after** deployment to dev/QA?

- RCA points to a requirement gap that should have been caught in refinement
- Unit or integration tests were missing or wrong for that module
- E2E/regression suites need updates for the fix
- Retesting and focused regression around the feature

**Cascade effect:**

- Development re-thinks the feature — analysis and coding rework
- Original devs may be on new stories; context switching costs time
- A new dev needs context sharing
- The same dev–QA cycle starts again

I take those points seriously. Gaps I see repeatedly:

- QAs were not in requirement refinement — requirement defects surface post-development
- [Test pyramid](/blog/art-of-automation/) not followed — edge cases missed at unit/integration layers
- Rework on development and testing that could have been avoided

**Mini scenario — late surprise:** A "simple" export feature ships. QA finds the CSV encoding breaks for European customers. Refinement never discussed locales. Two sprints of rework. A 45-minute **STORY KICKOFF** with a sample file would have surfaced it.

## How to focus on defect prevention

QAs should perform quality checks from the **beginning** of requirement gathering. Wear the **end user** hat. Consult on how the feature should behave — what helps, what confuses, what will not work.

When a feature is well groomed and acceptance criteria are finalized, requirement-related issues in later SDLC stages become rare.

### STORY KICKOFF — before code starts

QAs, BA, and dev clear things and agree on ACs and tech approach **before** dev picks up the story. Call it **STORY KICKOFF** (or three-amigos — name matters less than the habit).

**YOU cover:**

- Happy path and edge cases in plain language
- Test data needs and environment assumptions
- Which checks belong in unit, API, and UI layers ([component strategy](/blog/component-tests/))
- Non-functional expectations: performance, accessibility, security

**Outcome:** Devs build with tests in mind; QAs are not surprised on day five of a five-day story.

### Pair during development — early validation

Stay involved while devs work:

- **Code quality** — clear enough for future change
- **Framework fit** — room for enhancements without rewrite
- **Unit/integration coverage** — not only coverage %; data permutations on the same code path cause real bugs
- **Early validation** — demo a stub, run an API test together, validate a state machine on paper

### Devbox — desk check before QA env

When dev work is ready, QAs, BAs, and devs meet. Walk ACs together. Validate the outcome. Feedback is cheap here.

Call it **devbox**, desk check, or volleyball — the pattern is the same: short, focused, on the developer machine or feature branch.

**Mini scenario — devbox win:** Payment story shows success toast but ledger entry is wrong. Caught in devbox in ten minutes. Without it, the bug waits for env deploy, test data setup, and a formal QA pass — same fix, 10× the calendar cost.

### Exploratory testing — with a lighter automation load

After deploy to QA:

- Filter what truly belongs in automated UI E2E — not everything
- Use API tests for business use cases ([pyramid guidance](/blog/art-of-automation/))
- Spend exploratory time on edge cases automation missed

Confidence goes up; effort on repetitive checking goes down.

### Bug bash — before regression

Before full regression, bring the team to **break the app together**. Bug bash finds issues no scripted path would hit — odd device settings, chaotic navigation, "what if I click this twice."

Trust me, it works.

![Defect prevention mindset across the SDLC](/images/blog/defect-prevention-flow.jpg)

## The 80-20 split

Defect detection is not bad — YOU should not stop doing it. Focus more on **prevention** than detection.

I follow an **80-20 split**: ~80% of effort on prevention (refinement, kickoff, devbox, lower-layer tests), ~20% on detection (exploratory testing, bug bash).

That ratio helped my teams avoid testing bottlenecks and rework. We stuck to timelines and shipped on schedule more often.

```mermaid
flowchart LR
  prevent[Prevention 80% — kickoff devbox pyramid]
  detect[Detection 20% — explore bash]
  prevent --> release[On-time release with confidence]
  detect --> release
```

## Checklist for YOUR next story

- [ ] QA attended refinement or kickoff
- [ ] ACs testable and agreed in writing
- [ ] Layer ownership clear (unit / API / UI)
- [ ] Devbox done before formal QA handoff
- [ ] UI E2E list trimmed to critical journeys
- [ ] Bug bash scheduled before regression crunch

## What do you think?

Did this change how YOU see testing — hunter vs guardrail builder? Which ritual would help your team most this sprint?

> Happy Testing :)
','published',1,1,'2022-05-25','2022-05-25',5,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (4,'detox-e2e','Shift left in Mobile App Automation Testing','Detox gray-box E2E for React Native — sync with the app, one locator set for iOS and Android, and tests that run beside unit tests.','
> Tired of maintaining two locator sets for iOS and Android? Still inspecting mobile objects like it is 2015? **Detox** is a gray-box E2E solution that helps YOU shift left — run tests soon after a developer changes a feature, close to unit and integration tests.

Detox will not fix a bad [mobile test strategy](/blog/mobile-test-strategy/). It **does** fix a class of pain: flaky "wait 5 seconds then tap" scripts that break when animation timing changes.

## Detox design principles

**Not**

- WebDriver-style black box
- Tester process guessing when the app is "ready"

**It is**

- **Gray box** — instrumentation inside the app
- **Synchronization** with the app''s activity — no arbitrary sleeps
- **First-class React Native support**
- **Expectations run on the app**, not only in the Node test process

That last point matters: the app tells the test when it is idle enough to interact. Fewer false reds, faster diagnosis when reds are real.

## Lineage — Espresso and Earl Grey

Detox builds on ideas from Google''s mobile-native stacks:

**Espresso (Android)**

- Native Android UI testing
- Automatic synchronization with the UI thread
- Lightweight API
- Tests compile into a separate APK beside the app

**Earl Grey (iOS)**

- Synchronizes with UI, network, and queues
- Often more stable than naive XCUITest scripts when apps are async-heavy

Detox brings similar **sync-first** thinking to React Native cross-platform suites — one test file, two platforms.

## Detox vs Appium / WebDriver

| | Detox | Appium / WebDriver |
|---|-------|-------------------|
| Model | Gray box, RN-aware | Black box, driver bridge |
| Sync | Built-in | Manual waits / wrappers |
| Locators | `testID` shared on iOS + Android | Often separate accessibility ids |
| Best fit | React Native | Broadest stack coverage |
| Trade-off | RN-centric | More setup, more flexibility |

**Scenario:** YOUR team ships RN features weekly. Appium suite runs 90 minutes with 12% flake. Detox on PR runs eight critical flows in twelve minutes with failures tied to `testID` and component state. YOU still need manual exploratory passes — but merge confidence moves left.

## When Detox fits — and when it does not

**Good fit**

- React Native app with stable `testID` discipline
- Devs willing to run E2E locally before push
- Pipelines that already run unit tests on every commit

**Poor fit**

- Pure native Swift/Kotlin apps with no RN
- Heavy WebView-only screens without test hooks
- Teams that will not maintain testIDs alongside features

For strategy and device matrix, see [How to build Test Strategy for Mobile Applications](/blog/mobile-test-strategy/). For pyramid placement, see [Understanding Automation Test Layers](/blog/art-of-automation/).

## Prerequisites — simulators and emulators

**iOS — list and boot simulator**

```bash
xcrun simctl list
open -a Simulator --args -CurrentDeviceUDID <UDID>
```

**Android — create and start AVD**

```bash
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_API_30 -d pixel --package "system-images;android-30;google_apis;x86_64"
$ANDROID_HOME/emulator/emulator -verbose @Pixel_API_30
```

Match API levels to what YOUR app supports — not only the newest image.

## First green test checklist

1. Install Detox CLI and project dependencies per [official docs](https://wix.github.io/Detox/)
2. Add `testID` to one stable button and one input on a login screen
3. Configure `.detoxrc.js` with ios.simulator and android.emu profiles
4. Build debug binaries for test — `detox build`
5. Run one test — `detox test`
6. Wire into CI after local green — same job as unit tests if runtime allows

## Minimal example

**Component (React Native)**

```jsx
<Button testID="loginButton" title="Sign in" onPress={handleLogin} />
```

**Test (Detox / Jest)**

```javascript
describe(''Login'', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it(''shows dashboard after valid login'', async () => {
    await element(by.id(''email'')).typeText(''user@example.com'');
    await element(by.id(''password'')).typeText(''valid-password'');
    await element(by.id(''loginButton'')).tap();
    await expect(element(by.id(''dashboard''))).toBeVisible();
  });
});
```

No `sleep(3000)` — Detox waits for the app to settle. When this fails, YOU ask "did login break or did the testID move?" — a small search space.

## Shift left in practice

- Devs run Detox on feature branches before QA handoff ([devbox](/blog/defect-prevention-mindset/) friendly)
- Keep the suite **thin** — happy paths and one or two edge cases per feature
- Push data permutations to unit and API layers where possible
- Treat flaky Detox tests like any flaky test — [who tests your test?](/blog/who-tests-your-test/)

## Common pitfalls

- Missing `testID` on animated screens — use stable containers
- Testing through keyboard without dismissing — platform-specific quirks
- Huge suites on every commit — tag `@smoke` vs full regression
- Ignoring release builds until store submission — add one release-config smoke

Detox is a defect **prevention** tool when it lives next to dev workflows, not a Friday-night only ritual.

Are YOU on React Native today — what blocks you from running one E2E on every PR?

> Happy Testing :)
','published',1,1,'2022-04-27','2022-04-27',4,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (5,'engineered-test-data','Software Quality with Engineered test data','Engineer test data instead of cloning production — how we cut 500 GB to under 20 MB and batch runs from 8 hours to 15 minutes.','
> What is one important factor in a project''s success? If you are a QA, your answer might be testing — but what makes testing **good**? Answers vary, yet one thing most of us relate to is **good test data**.

Bad data does not always mean "wrong values." It often means **too much** of the right values, locked in a shared database nobody dares touch.

![Test data as foundation for quality](/images/blog/test-data-importance.png)

Everyone in software agrees test data matters. So why do we ignore it until a batch job fails at 2 a.m. or automation times out on a million-row join?

For production-alike data in test environments, see ThoughtWorks [technology radar blip](https://www.thoughtworks.com/radar/techniques?blipid=202110036) — useful context, not a mandate to copy prod wholesale.

## Common test data problems

![Common test data pain points](/images/blog/test-data-problems.png)

### Data aggregation / batch runs

Prod-equivalent volume in lower environments causes:

- Longer batch and aggregation time
- More storage cost
- Uncertainty on corner and edge cases
- Slow validation queries
- Automated tests that timeout or run unacceptably long

**Sound familiar?** YOUR UI E2E waits on a warehouse sync that prod needs — but QA only needs ten rows to prove the rule.

### Data complexity

Production-equivalent data is rarely simple:

- New terminologies, patterns, and standards to learn
- Data entangled across sources, tables, schemas
- Scenarios impossible in test env without engineered subsets

### Data accessibility

- Multiple teams share environments — YOU cannot freely mutate data
- Time spent learning DB names, relations, columns, and constraints before changing one row

### Inefficient processes

Challenge the current process. Introduce a model where testers get accurate data faster — engineered data in version control, reviewed like code.

## What we faced on one project

![Project challenges overview](/images/blog/test-data-challenges.png)

- Prod-equivalent volume on lower environments
- Data size **> 500 GB** (> 40 interrelated tables, millions of rows)
- Batch processing **> 8 hours** — one failed run cost a full day of feedback
- Cloud storage cost climbing
- Multiple teams on shared envs — ad hoc changes broke each other''s scenarios
- Views and procedures for UI validation — heavy maintenance, multi-minute queries

We could not [test microservices or components](/blog/component-tests/) fast when the data layer was the bottleneck.

## The solution — engineer, do not clone

![Solution approach](/images/blog/test-data-solution.png)

Goals:

- Faster aggregation / batch (faster feedback)
- Faster SQL for manual and automated checks
- Lower cloud storage on Dev, QA, Training

**Iterative approach** made reduction manageable and built confidence in reduced data reliability.

![Iterative data reduction approach](/images/blog/test-data-iterative.png)

```mermaid
flowchart LR
  analyze[1. Analyze]
  prepare[2. Prepare]
  validate[3. Validate]
  pr[4. Data PR]
  deploy[5. Deploy]
  analyze --> prepare --> validate --> pr --> deploy
  deploy -->|next iteration| analyze
```

### Step 1 — Data analysis

Consider a patient health management DB — row counts in the millions. Do we need millions of patient records to validate the system?

![Production-like volume example](/images/blog/test-data-prod-like.png)

- Analyze existing data, types, and application impact
- Map joins and interconnectivity
- Set target reduced size (KB/MB or row counts per table)
- Remember source control limits — e.g. Git [diff limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories#diff-limits) (~1 MB / 20k lines for readable diffs)

### Step 2 — Data preparation

- List data scenarios and corner cases
- **Data skimming chain** — ~10 patients across gender, age, geography may suffice
- Follow the chain for those patients through related tables
- Skim dependent tables consistently

![Data skimming chain](/images/blog/test-data-skimming.png)

Alternatively, [TABLESAMPLE](https://www.mssqltips.com/sqlservertip/1308/retrieving-random-data-from-sql-server-with-tablesample/) can pick random rows — use with care on join keys.

![TABLESAMPLE flow](/images/blog/test-data-tablesample.png)

- Preserve join keys across skimmed tables
- Note duplicate business rows you may collapse or update for edge cases

### Step 3 — Data validation

- Dump to a trial test DB
- Local or Docker app against test DB
- Manual sanity on coverage and edge cases
- Run automation for integrity and compatibility
- **Be patient** — iterative; this step takes time
- Watch Git tracking limits on large SQL dumps

### Step 4 — Data PR

After satisfactory validation:

![SQL dump for review](/images/blog/test-data-sql-dump.png)

- Track changes in Git; keep files reviewable
- Export as `.sql` insert scripts

If files exceed diff limits, batch inserts with `awk` — example pattern:

```bash
awk ''BEGIN{match_count=0;} $0~/^INSERT.*VALUES \(/{match_count++;if (match_count%1000!=1) gsub("INSERT INTO .* VALUES \\(","(", $0); if (match_count%1000!=0) gsub(";$",",", $0); print $0}'' input.sql > output.sql
```

![Before awk batching](/images/blog/test-data-awk-before.png)
![After awk batching](/images/blog/test-data-awk-after1.png)
![Size reduction result](/images/blog/test-data-awk-result.png)

Raise a **Data PR** — stakeholders review data changes like schema changes.

### Step 5 — Data deployment

Deploy via scripts — e.g. `createSchemaAndData.sh`, `DropAndCreateTable.sql`:

![Deploy script](/images/blog/test-data-deploy-script.png)
![Drop and create tables](/images/blog/test-data-drop-create.png)

Repository layout example:

![Data repository structure](/images/blog/test-data-repo-structure.png)

**Major steps summary:**

![Data reduction major steps](/images/blog/test-data-major-steps.png)

**Iteration cycle:**

![Data reduction iteration](/images/blog/test-data-iteration.png)

## Final outcome

![Reduction outcomes](/images/blog/test-data-outcome.png)

- DB size **< 20 MB** vs **500 GB** (~500,000 MB)
- Batch processing **< 15 minutes** vs **8 hours** — multiple feedback cycles per day
- Cloud storage cost down for Dev, QA, Training
- Teams work in parallel with change management and approvals, zero-downtime deploys
- Complex views and procedures run in **under a second** vs minutes

Those numbers unlocked the [test pyramid](/blog/art-of-automation/) we wanted — API and component tests could run without apologizing for data.

## Steps for the future

**Documenting:** Quick fact sheets — glossaries, key queries, procedures — for onboarding without reading the entire wiki.

**Data management:** As teams grow, formalize ownership: who approves data PRs, how often you refresh subsets, how automation seeds fixtures.

Test data preparation is critical to quality assurance. Forethought, creativity, and industry practices beat copying prod and hoping.

## YOUR next move

Pick one table that dominates storage in YOUR lower env. What is the smallest row set that still tells the truth about one business rule?

> Happy Testing :)
','published',1,1,'2021-11-07','2021-11-07',5,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (6,'how-to-choose-tools','The Paradox of choice - Automation tool selection','Choose test automation tools with criteria that fit YOUR team — Pugh matrix, two team tales, and why more options can mean worse decisions.','
> Finding the right tool for automation testing is crucial. Wrong selection causes rework, limits coverage, and burns trust when the suite flakes. Yet the market offers dozens of "best" frameworks — welcome to the **paradox of choice**.

People usually pick the most popular tool in a category or whatever they used last project. That can work. It can also mean **critical compatibility issues** two quarters later when IE support, mobile WebView, or CI budget were never weighted.

Choosing automation tools is critical. Do not treat it as a one-hour meeting with a Google search.

## What should really matter

- **Scalability** — suite growth, parallel runs, CI minutes
- **Browser / OS compatibility** — what YOUR users actually use
- **Ease of creating scripts** — dev participation, not only QA heroes
- **Maintainability** — locators, page objects, versioning
- **Reporting** — debug failures fast; integrate with Jira/CI
- **Price** — licenses, cloud devices, engineer time (often the biggest line)

Add **team skills** and **app stack** — React Native favors different choices than a Java shop on Selenium Grid ([mobile strategy](/blog/mobile-test-strategy/) goes deeper on device side).

## A tale of two teams

Same category of tools. Different winners. That is the point.

### Team A — cost-sensitive, polyglot, wide browser matrix

- Cost-sensitive client
- Team comfortable with many languages
- IE, Chrome, Firefox, Safari support required
- Responsive design
- Strict performance benchmarks
- Asynchronous backend systems

**Pain if they pick wrong:** Cloud browser minutes explode; async waits make flaky suites; IE-specific locators rot when team prefers Chrome-only dev.

**Pugh outcome (simplified):** Baseline = incumbent record-and-play tool. Alternatives scored on cross-browser support, async handling, CI cost. **Winner:** code-first framework with explicit wait helpers + grid — higher upfront skill, lower flake and license cost at scale.

![Pugh matrix for Team A](/images/blog/tools-pugh-team-a.png)

**What happened:** They accepted slower initial script writing. Devs contributed API tests ([pyramid](/blog/art-of-automation/)); UI layer stayed thin. Regression time dropped after month three — not week one.

### Team B — Java shop, Chrome-heavy, vendor support OK

- Client maintains own tech stack preferences
- Team comfortable with Java and JavaScript
- Mostly in-house Chrome users
- End-user training possible after go-live
- Client comfortable with tool support cost

**Pain if they pick wrong:** Over-engineering multi-browser grid nobody needs; team avoids automation because "only QA knows Kotlin."

**Pugh outcome:** Baseline = manual regression. **Winner:** commercial tool with strong recorder, Java bindings, vendor support — faster start, annual license accepted.

![Pugh matrix for Team B](/images/blog/tools-pugh-team-b.png)

**What happened:** Record-and-refine got BA and junior QA contributing. They hit limits on complex async flows later — planned spike to hybrid (API layer in RestAssured, UI in same vendor stack). Tool was not forever; it was **good enough** with upgrade path.

For Pugh steps, see [iSixSigma Pugh matrix](https://www.isixsigma.com/dictionary/pugh-matrix/).

## How to run a decision without analysis paralysis

1. **Criteria workshop** — 30 minutes, max eight weighted factors
2. **Short list** — three tools, not twelve
3. **Spike** — one real user journey, two browsers or two OSes, in CI
4. **Score** — Pugh or simple weighted table
5. **Time box** — decide in two weeks; revisit annually, not every sprint

```mermaid
flowchart LR
  criteria[Weighted criteria]
  spike[2-week spike on real flow]
  score[Pugh or weighted score]
  decide[Decide + document why]
  criteria --> spike --> score --> decide
```

Document the **why** — future hires should not relitigate without new facts.

## The paradox of choice

More options often mean **worse** decisions:

- Open-source democratization → many similar tools, subtle differences
- Team preferences and resume-driven development
- Client mandates vs engineer favorites

![Paradox of choice — too many tools](/images/blog/tools-paradox-of-choice.png)

**Barry Schwartz was right:** after enough alternatives, people delay, second-guess, or buy three tools and use none well.

**Antidote for YOUR team:**

- Satisfice — pick "good enough on weighted criteria," not mythical perfect
- Hybrid consciously — recorder for smoke, code for core ([who maintains tests?](/blog/who-tests-your-test/))
- Revisit when constraints change — new mobile app, microservices split ([strategy shift](/blog/testing-microservices/))

## Red flags during evaluation

- Vendor demo uses apps nothing like yours
- No one ran the spike in **your** CI
- "We will hire contractors to maintain it"
- Ignores [test data](/blog/engineered-test-data/) and env cost
- Picks tool before [strategy](/blog/defect-prevention-mindset/)

## After you choose

- Put ownership in RACI — who fixes broken tests?
- Cap UI count; push logic to API/unit ([component strategy](/blog/component-tests/))
- Schedule 6-month review: flake rate, maintenance hours, dev participation

Tool selection is a **strategy** decision wearing a shopping hat. Team A and Team B both chose rationally — their contexts differed.

Which criterion does YOUR team talk about most — and which one (price, maintainability, skills) actually drives the decision?

> Happy Testing :)
','published',1,1,'2021-10-21','2021-10-21',4,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (7,'mobile-test-strategy','How to build Test Strategy for Mobile Applications','Build a mobile test strategy for YOUR app — stakeholders, device matrix, risk-based priorities, automation pyramid, and path to production.','
> How do we build a mobile test strategy that covers device-specific conditions, device selection, and tool selection — **for this app**, not for a generic slide deck?

Mobile is not "web but smaller." Interruptions, OS fragmentation, store gates, and fat fingers change what YOU test, automate, and ship.

## Why test strategy matters

A test strategy creates shared understanding of targets, approach, tools, and timing. It clarifies major challenges before the testing squeeze arrives the week before launch.

**Anti-pattern:** Copy a template from another project, ask colleagues what they used, search online for "mobile test plan PDF." Those inputs help — they do not replace **your** context.

**Do you see the problem?** Your app has specific users, risks, and architecture. A fintech RN app and a internal warehouse scanner app should not share the same device matrix.

## Start with questions — not tools

Before Appium vs Detox ([shift-left mobile E2E](/blog/detox-e2e/)), answer:

- Who depends on quality — product, support, compliance, stores?
- RACI for critical processes?
- Definition of Done — includes device classes, crash-free rate?
- CI/CD guidelines for shift left?
- Release frequency — weekly store drops vs monthly?
- Testing bottlenecks — real devices, Apple review, data?
- Legal requirements — accessibility, privacy, regional rules?
- Failure points — payments, offline, auth?
- Cost if quality slips — brand, revenue, safety?
- Tech architecture — native, hybrid, RN, PWA?

### RACI matrix

RACI lists stakeholders and involvement per task — reduces confusion and risk.

![RACI matrix example](/images/blog/mobile-raci.png)

- **Responsible** — does the work (QA, dev, architect)
- **Accountable** — owns correct completion (often product or sponsor)
- **Consulted** — two-way input (SMEs, legal)
- **Informed** — one-way updates (support, ops)

**Worked example — device lab budget**

| | QA Lead | Eng Manager | Product | Finance |
|---|:---:|:---:|:---:|:---:|
| Define device matrix | R | A | C | I |
| Approve cloud device spend | C | C | I | A |

Clear **Accountable** for spend avoids "everyone assumed someone else ordered the Pixel."

## Business priorities

- What keeps the client awake at night — crashes, checkout, compliance?
- Implicit users — power users on old OS vs new adopters?
- Risk appetite in production — hotfix tolerance, rollback plan?

**Scenario:** A health app prioritizes data privacy and offline vitals. YOU weight security and interruption testing over cosmetic UI on every skin. Strategy documents that so crunch week does not become random clicking.

## Identify your app type

![Native, web, hybrid, PWA](/images/blog/mobile-app-types.png)

- **Native** — store-distributed, full device APIs, Swift/Kotlin or RN native modules
- **Web mobile** — browser, server-side logic
- **Hybrid** — WebView wrapper with some native bridges
- **PWA** — web with app-shell UX

Strategy diverges here: store submission, background modes, and push differ for native vs PWA.

## Target platform and device selection

Consider brand, OS variants, minimum OS, and version-specific behavior (permissions, biometrics, notch layouts).

![Target platform considerations](/images/blog/mobile-target-platform.png)

![Device selection factors](/images/blog/mobile-device-selection.png)

- Hardware/software matrix — not "all iPhones"
- Virtual vs real vs cloud — balance cost and fidelity
- Fat finger issues — tap targets, gestures, keyboards

### Worked example — device matrix (simplified)

| Tier | Devices | Why |
|------|---------|-----|
| P0 smoke | iPhone 15 / Pixel 8 on latest OS | Majority traffic |
| P1 regression | iPhone 12, SE; Samsung A-series; one tablet | Form factor + mid OS |
| P2 spot | Oldest supported OS on one device each | Upgrade path, legacy APIs |
| Manual only | Foldable, low-RAM budget device | Known fragile areas |

Automate P0 on every commit; P1 nightly; P2 before release. Document in strategy so [automation](/blog/detox-e2e/) does not try to run 40 devices per PR.

## Custom settings and interruptions

**Custom settings** — font scale, dark mode, low power, locale, VPN, date formats — sit outside business logic but break apps daily.

![Custom device settings](/images/blog/mobile-custom-settings.png)

**Interruptions** — calls, SMS, notifications, backgrounding, low battery — must not corrupt state.

![Interruption scenarios](/images/blog/mobile-interruptions.png)

These areas stay **manual-heavy** or scripted on real devices even when unit tests pass.

## Specific conditions checklist

**Device**

- Memory, power, network (2G/3G/offline/flaky)
- Backgrounding and app switching
- Storage pressure, camera, location, downloads

**Application**

- Install, uninstall, update, backward compatibility
- Cold/warm start, persisted data, migrations

Tag each item **automate**, **manual**, or **both** in YOUR strategy doc.

## Testing types

![Testing types for mobile](/images/blog/mobile-testing-types.png)

Prioritize by app and risk — not every type every sprint.

## Path to production

Mobile CI/CD often includes artefact builds, signing, store certification, and staged rollouts — not only `git push`.

![Path to production](/images/blog/mobile-path-to-production.png)

Map quality gates: unit on PR, API in merge, device smoke on nightly, full regression pre-submission, beta channel before prod %.

## Automation — all layers, right proportions

What to automate? **Yes** — across layers, not only UI.

![Automation test layers](/images/blog/mobile-automation-layers.png)

Take advantage of lower-level tests ([pyramid](/blog/art-of-automation/)):

![Mobile test pyramid](/images/blog/mobile-test-pyramid.png)

Decide % per layer — shape stays pyramidal even if exact numbers differ by stack.

## Tool and framework selection

Many tools, similar marketing. Decision framework:

![Tool selection overview](/images/blog/mobile-tool-selection.png)

- List options (Detox, Appium, Maestro, native stacks, cloud runners)
- Cross-platform vs native trade-offs
- Official docs and proof-of-concept on **your** app — one flow, both OSes

![Official documentation matters](/images/blog/mobile-tool-docs.png)

See also [The Paradox of choice — Automation tool selection](/blog/how-to-choose-tools/) for Pugh matrix detail.

### Pugh matrix comparison

![Pugh matrix](/images/blog/mobile-pugh-matrix.png)

Steps:

1. Define evaluation criteria and weights
2. List alternatives; pick a baseline (often current state)
3. Rate each + / s / − vs baseline
4. Total and pick best fit; consider hybrid

Read more: [Pugh matrix (iSixSigma)](https://www.isixsigma.com/dictionary/pugh-matrix/)

## Paradox of choice

Choices explode because of open-source tools, team preferences, and client constraints.

![Paradox of choice](/images/blog/mobile-paradox.png)

**Strategy tip:** Time-box evaluation — two-week spike, one app flow, score with Pugh, decide. Perfect tool does not exist; **good enough with team buy-in** does.

## Risk-based priority — what to test first

![RAID / risk matrix](/images/blog/mobile-raid-matrix.png)

- Business impact × probability of failure = priority
- Highest impact + highest failure probability → automate and test first
- When schedule slips, cut **low** on the matrix — not random scope drops

### Worked example — risk scoring

| Feature | Business impact (1-5) | Failure likelihood (1-5) | Score |
|---------|----------------------|---------------------------|-------|
| Login / SSO | 5 | 3 | 15 |
| Push notifications | 3 | 4 | 12 |
| Profile avatar crop | 2 | 2 | 4 |

Login gets P0 automation and real-device smoke; avatar crop might be manual once per release.

## Manual exploratory testing

Never drop exploratory testing. Automation finds what YOU predicted; exploration finds what users invent.

Pair with [defect prevention](/blog/defect-prevention-mindset/) — bug bash before store submission catches interruption and settings bugs scripts miss.

## Strategy on one page — template for YOUR team

1. App type and min OS
2. RACI for quality decisions
3. Device tiers P0 / P1 / P2
4. Pyramid split (unit / API / device / manual)
5. Tool choice and spike outcome
6. Release path and gate per stage
7. Risk matrix top ten features

Mobile strategy is a living doc — revisit when OS majors ship or you enter a new market.

What is the one device or OS version YOUR users complain about most? That belongs in P0 tomorrow.

> Happy Testing :)
','published',1,1,'2022-05-07','2022-05-07',7,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (8,'testing-microservices','Microservices Test Strategy','A practical microservices test strategy — pyramid, contracts, doubles, and environments when service count and team count both grow.','
> Testing microservices is not easy when the number of services keeps increasing over time. Complexity grows — database errors, network latency, caching issues, service unavailability. Multiple teams building interconnected services add another layer of chaos.
>
> This problem cannot be solved by choosing an API testing tool and writing as many UI E2Es as possible. A proper thought process and test strategy is needed to understand dependencies and complexity in YOUR architecture.

I have seen teams with forty services and four hundred UI tests still get surprised in production. The issue was never "not enough Selenium." It was **not knowing what each layer should prove**.

## Why projects choose microservices

Microservices are independent or loosely coupled services that can be developed and deployed separately. Teams scale parts of the application without scaling everything.

Benefits:

- **Modularity** — scale one function without scaling the whole app
- **Easier to develop, test, deploy, and maintain** — when boundaries are real
- **Technology choice** — services can use different languages and frameworks where it makes sense

The testing catch: independence in **deployment** does not mean independence in **behavior**. Your users still touch one journey. YOUR strategy must connect the dots.

## Failure modes multiply

In a monolith, a bug is often a stack trace away. In microservices:

- **Network** — timeouts, retries, partial failures
- **Cache** — stale reads, thundering herds after invalidation
- **Version skew** — consumer on v2, provider on v1
- **Data** — eventual consistency, duplicate events
- **Ops** — one service down; others keep accepting traffic

**Scenario:** Order service succeeds; payment service times out; inventory never releases. UI shows "something went wrong." Without layer-appropriate tests, YOU debug via log archaeology across five repos.

## Test pyramid for microservices

Same pyramid as [Understanding Automation Test Layers](/blog/art-of-automation/) — applied per service **and** at boundaries.

```mermaid
flowchart TB
  subgraph perService [Per service]
    unit[Unit tests]
    comp[Component tests in-process]
  end
  subgraph boundaries [Between services]
    contract[Contract tests]
    api[API integration tests]
  end
  subgraph journey [User journey]
    e2e[Narrow E2E smoke]
  end
  unit --> comp --> contract --> api --> e2e
```

| Layer | Proves | Typical owner |
|-------|--------|---------------|
| Unit | Business rules, edge cases | Service dev |
| Component | DB, messaging, cache in one deployable | Service dev + QA |
| Contract | Consumer expectations vs provider | Both teams |
| API integration | Real wire-up in test env | QA + platform |
| E2E | Critical user paths | QA — few tests |

Anti-pattern: **100 UI E2Es across 40 services.** Each UI test drags the whole mesh. Prefer [component strategy](/blog/component-tests/) at service edges.

## Contract testing — when teams ship independently

Consumer-driven contracts answer: "What does my service **need** from yours?"

- Consumer publishes expected request/response shapes
- Provider verifies it still satisfies contracts in CI
- Breaking changes fail **before** integration env, not Friday night

**Example:** Order service expects `POST /payments` → `201` with `{ "paymentId": "uuid" }`. Payment team renames field to `id`. Contract test fails on the payment PR. No multi-team war room.

Contracts complement — not replace — broader API tests. They guard **compatibility**; API tests guard **behavior** with real data and auth.

## Test doubles and stubs

When downstream is unavailable, slow, or expensive:

- **Stubs** — return canned responses for consumer tests
- **Fakes** — in-memory payment or inventory for local dev
- **Service virtualization** — shared lab mimicking partners

Use doubles to keep consumer pipelines fast. Periodically run tests against real providers in a dedicated integration window.

**Rule:** If every developer test requires the full mesh running, YOUR "microservices" dev experience is a distributed monolith with extra steps.

## Environment strategy

| Environment | Purpose | What it proves |
|-------------|---------|----------------|
| Local + doubles | Fast dev feedback | Consumer logic, UI with mocks |
| Ephemeral per PR | Isolated change | Service builds with its contracts |
| Shared integration | Cross-team wiring | Real protocols, real latency |
| Pre-prod | Release candidate | Data shape close to prod, full smoke |

Not every test belongs in every environment. Tag suites: `@contract`, `@integration`, `@smoke`. CI runs the right tag per stage.

## Worked example — order, payment, inventory

**Order service**

- Unit: pricing rules, idempotency key generation
- Component: order persisted, outbox event emitted
- Contract: consumes `PaymentCreated` event schema

**Payment service**

- Unit: card validation, decline codes
- Contract: exposes `POST /payments` per consumer pact
- API: refund and partial capture scenarios

**Inventory service**

- Component: reserve and release on event
- Stub in order tests when inventory lab is down

**E2E (one or two tests)**

- Happy path: place order → pay → stock decrements → confirmation UI

Everything else lives lower. When E2E fails, component and contract suites already narrow the fault.

## Data and [engineered test data](/blog/engineered-test-data/)

Microservices amplify data pain — shared QA databases, event replay, large warehouses. Invest in smaller, intentional datasets for lower envs. UI-only validation over prod-like volume is slow and flaky.

## Test ownership and RACI

Clarify who writes and maintains what:

- **Responsible** — service team for unit/component/contract provider side
- **Consulted** — QA on risk-based API and E2E selection
- **Informed** — release managers on contract failure gates

Without RACI, "someone should have an integration test" means no one does.

## Anti-patterns to call out in retros

- UI test proves a calculation that belongs in unit tests
- No contract between fastest-moving pair of services
- Integration env always red; teams merge anyway
- [Flaky suite](/blog/who-tests-your-test/) blamed on "microservices are hard"

## Strategy checklist

1. Map services on one diagram — mark sync vs async edges
2. Assign pyramid ownership per service
3. Add contracts on the noisiest consumer–provider pairs first
4. Cap E2E count; tie each test to a business journey name
5. Review env cost vs feedback — doubles are not cheating

Microservices reward teams that test **boundaries** as seriously as features. Tools help; strategy decides if YOU sleep before release.

What is the messiest dependency on your architecture diagram? Start testing there.

> Happy Testing :)
','published',1,1,'2022-05-11','2022-05-11',6,0);
INSERT INTO posts (id,slug,title,description,body_md,status,author_id,published_by,pub_date,published_at,reading_time,comments_disabled) VALUES (9,'who-tests-your-test','Who tests your test?','Flaky suites, low trust, and who owns test quality — practical signals and habits so your automation prevents defects instead of hiding them.','
> DO YOU FEEL COMFORTABLE UPDATING YOUR TESTS?
>
> HOW IS THE CODE QUALITY OF YOUR TEST SUITE?
>
> DO YOU TRUST YOUR TESTS AND TEST SUITE?

If those questions sting a little, you are not alone. We ask applications to meet high standards — then we treat test code as a second-class script that "just needs to pass." **Who tests your test?** Until YOU answer that, shift-left and [defect prevention](/blog/defect-prevention-mindset/) rest on sand.

## Why we write tests — and why they rot

We write tests to get fast feedback, prevent regressions, and document behavior. Over time, suites rot:

- Copy-paste steps with one character different
- Hard-coded sleeps instead of synchronization
- Shared test accounts and dirty database state
- Tests coupled to today''s DOM, not to user intent
- "Temporary" skips that become permanent

**Scenario:** A login test fails Monday. Someone reruns the job — green. Nobody investigates. Friday it fails in production because the API contract changed and the test was clicking through a cached session. The suite did not protect YOU; it trained the team to ignore red builds.

## Signals you do not trust your suite

Be honest — how many apply on YOUR project?

| Signal | What it usually means |
|--------|------------------------|
| `@flaky` or retry plugins on by default | Tests are liabilities, not assets |
| "Known failure" list in Confluence | Red is normal; alerts are noise |
| Devs merge with "CI is broken again" | Gates are decorative |
| Nobody deletes tests | Fear of unknown coverage |
| QA maintains tests devs never run locally | Feedback loop is too slow |

If green does not mean **safe to merge**, YOU do not have a quality gate — YOU have a mood ring.

## Who tests tests? — owners and habits

Tests are production code with a different user: the team tomorrow.

**1. Authors and reviewers**

- Same PR standards as app code: naming, duplication, clarity
- Review asks: "What defect does this catch? Which layer should own it?"
- Pair on complex flows — same as [STORY KICKOFF](/blog/defect-prevention-mindset/) for features

**2. Linters and static checks**

- Ban `sleep(5000)` without comment
- Enforce page-object or screen-object patterns
- Flag tests with no assertions or only `true === true`

**3. CI analytics — trend, do not just pass**

- Track failure rate per test over 30 days
- Quarantine tests above a flake threshold; fix or delete within a time box
- Fail the build on **new** flakes, not only hard failures

**4. Mutation testing (conceptual)**

- Ask: "If I break the production code slightly, does a test fail?"
- If not, that line is covered but not **protected**
- Full mutation tooling is heavy; spot-check critical modules manually: comment out a validation, run the suite

```mermaid
flowchart TD
  write[Write / change test]
  review[PR review — same bar as app code]
  ci[CI run + flake trends]
  trust{Trust green?}
  merge[Merge with confidence]
  quarantine[Quarantine flaky test]
  write --> review --> ci --> trust
  trust -->|yes| merge
  trust -->|no| quarantine
  quarantine --> write
```

## Flaky test playbook

When a test flakes:

1. **Reproduce** — run in isolation, then in full suite order
2. **Categorize** — timing, data, environment, order dependency, real bug
3. **Fix root cause** — stub data, wait for event not clock, isolate accounts
4. **Delete if redundant** — a flaky duplicate of a solid API test helps nobody
5. **Time box** — quarantine max two sprints, then fix or remove

**Rule:** A quarantined test counts as **missing coverage**. Track it like open risk.

## Test data and environment — silent killers

Flakes often trace to [test data](/blog/engineered-test-data/) — shared QA DB mutated by another team, clock skew, feature flags half-on.

- Prefer fixtures and factories YOU control
- Document which tests need which data shape
- Align with component tests that mock downstream ([component strategy](/blog/component-tests/))

## Culture: tests as product

- Devs run relevant tests before push — not only CI babysitters
- Celebrate deleting brittle tests replaced by faster layers ([pyramid](/blog/art-of-automation/))
- Incident retros ask: "Which test should have caught this? Why didn''t it?"

Prevention mindset applies to **how** we automate, not only **when** we click through the app.

## Quick audit for YOUR suite

1. Pick the ten slowest UI tests — can API or unit layers replace any?
2. List tests skipped or retried last month — fix one this week
3. Ask a dev who does not own QA: "Do you trust CI?" Listen without defending

## Why DO we write tests?

To know we can ship. If the suite lies, we are back to manual panic before release — the bottleneck [defect prevention](/blog/defect-prevention-mindset/) tries to remove.

Who tests your test? **YOU do** — together, with the same seriousness as the feature code.

What is one test on your project you would delete or rewrite first? I would love to hear what stopped you.

> Happy Testing :)
','published',1,1,'2022-02-02','2022-02-02',5,0);
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (1,'test-pyramid','test-pyramid');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (2,'component-test','component-test');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (3,'test-automation','test-automation');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (4,'test-strategy','test-strategy');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (5,'detox','detox');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (6,'mobile-automation','mobile-automation');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (7,'engineered-test-data','engineered-test-data');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (8,'test-data','test-data');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (9,'software-quality','software-quality');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (10,'tools','tools');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (11,'tools-selection','tools-selection');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (12,'mobile-test-strategy','mobile-test-strategy');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (13,'mobile-testing','mobile-testing');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (14,'microservices','microservices');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (15,'api-automation','api-automation');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (16,'contract-test','contract-test');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (17,'flaky-test','flaky-test');
INSERT OR IGNORE INTO tags (id,name,slug) VALUES (18,'quality-culture','quality-culture');
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (1,1);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (1,2);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (1,3);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (2,1);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (2,2);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (2,4);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (3,1);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (3,2);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (3,4);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (4,1);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (4,2);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (4,5);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (4,6);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (5,7);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (5,8);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (5,9);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (6,10);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (6,3);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (6,11);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (7,12);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (7,13);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (7,6);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (8,1);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (8,2);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (8,14);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (8,15);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (8,16);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (9,3);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (9,17);
INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (9,18);
