# Smart Andon Manufacturing System

A real-time, role-based Andon and manufacturing response system for production environments. Smart Andon connects shop-floor operators, Leader/PIC, supervisors, managers, and system administrators in one workflow for calling support, responding to abnormalities, monitoring line status, recording response history, and reviewing operational performance.

The application is built to be configurable by the customer: production Lines, machines, users, branding, operational data, and the 2D plant layout can be managed without hard-coding a buyer's factory structure into the source.

---

## What the System Does

Smart Andon digitizes the operational flow from the first call until resolution:

**Operator Call → Response → Work in Progress → Resolution → History / Analytics**

The current application provides three primary shop-floor Andon calls:

| Andon Call | Visual Identity | Purpose |
| --- | --- | --- |
| **Machine Problem** | Red | Call for an abnormal machine / equipment condition. |
| **Calling Leader** | Yellow / Amber | Request Leader / PIC support at the Line. |
| **Material Support** | Green | Request material/logistics support. |

The application also retains compatibility with additional historical call categories in the data model, allowing existing records to remain readable while the operator interface focuses on the three primary calls above.

---

## Role-Based Access Control

Smart Andon uses five application roles. **Manager is the highest operational role; Admin is the system-administration role.** These are intentionally separated.

| Role | Operational Scope |
| --- | --- |
| **Operator** | Log in to an assigned Line and raise Andon calls. |
| **Leader / PIC** | Operational responder. Can acknowledge and resolve Andon calls. |
| **Supervisor** | Leader/PIC capabilities plus operational reports and supervisory visibility. |
| **Manager** | Highest operational authority. Can respond to Andon calls and access reports/management visibility, but does **not** manage system configuration or Master Data. |
| **Admin** | System administration: Master Data, users, settings/configuration, reset/cleanup utilities, branding, and other administrative functions. Admin can also perform operational actions when required. |

Permission rules in the application are centralized: Master Data, user management, settings, demo reset, and log cleanup are Admin-only; Andon resolution is available to Leader/PIC, Supervisor, Manager, and Admin; reporting is available to Supervisor, Manager, and Admin; any authenticated plant user can raise an Andon call.

### Line Access

Operational users can be restricted using `lineAccess`:

- `['*']` = access to all Lines.
- A list of Line IDs = access only to those configured Lines.
- The Line selected during login is the user's active working Line for that session.
- Admin is not dependent on a production Line during initial system provisioning, allowing an empty installation to be configured from scratch.

---

## Demo Accounts

The source includes five demo profiles for Demo Mode/testing:

| Role | Badge ID | PIN | Default Line Access |
| --- | --- | --- | --- |
| Operator Demo | `OP-1001` | `1234` | `LINE-1`, `LINE-2` |
| Leader / PIC Demo | `LEADER-2001` | `2345` | All Lines |
| Supervisor Demo | `SPV-3001` | `3456` | All Lines |
| Manager Demo | `MGR-4001` | `4567` | All Lines |
| Admin | `admin01` | `8888` | All Lines |

> Demo credentials are intended for evaluation/local demonstration. Production authentication and authorization should use Firebase Authentication, Firestore user profiles, and the included Firestore Security Rules.

---

## Main Application Modules

### 1. Main Andon Board

Plant-wide operational view of Lines and active Andon calls. The board reflects current call state and Line condition in real time and provides a central view for production monitoring.

### 2. Operator Call Terminal

The shop-floor interface used to select the active Line/workstation and raise Andon calls. Active notifications preserve the category identity used by the call button: Machine Problem is red, Calling Leader is amber/yellow, and Material Support is green.

### 3. Responder Terminal

Operational response workspace for Leader/PIC and higher operational roles. Calls follow the implemented lifecycle:

`calling → acknowledged → in_progress → resolved`

The call record can retain responder identity, acknowledgement/start/resolution timestamps, resolution information, root cause, 5-Why analysis, and escalation information.

### 4. Mapping 2D

A visual production Line map that keeps the existing Smart Andon card design while allowing the factory layout to be configured independently of the UI.

The 2D layout is driven by:

```csv
line_id,row,column,sequence
LINE-1,1,1,1
LINE-2,2,1,2
LINE-3,2,2,3
LINE-4,1,2,4
```

`row` and `column` describe the physical visual position; `sequence` describes process/display order. Live Andon status remains sourced from operational call data rather than being duplicated in the layout file.

Admin can access the **Mapping Layout 2D** tools from **Master Data → Template & Panduan / Templates & Guidelines** to:

- Download the Layout 2D CSV template.
- Upload a customized Layout 2D CSV.

In Firebase mode the layout configuration is stored in system configuration; in Demo Mode it is stored locally in the browser.

### 5. Analytics & Reports

Provides operational visibility based on Andon history, Line data, and activity data. The application includes reporting/analytics views for supervisory and management review, including response/downtime-oriented information and export workflows where available in the UI.

### 6. Activity Logs

Records relevant system and operational activity such as login/logout-related activity, Andon creation and state changes, Master Data changes, and configuration changes. Administrative cleanup remains permission-controlled.

### 7. Admin Dashboard

Administrative/system overview intended for the Admin role. This is separate from the Manager role so operational management does not automatically receive system-administration privileges.

### 8. Master Data Manager

Admin-managed factory configuration including production Lines, machines/equipment, and user/staff profiles. Bulk CSV workflows and downloadable templates are provided for supported Master Data categories, together with the configurable 2D mapping CSV.

### 9. System Configuration & Branding

Admin-only configuration includes application settings such as Andon sound behavior and white-label branding. The UI supports light/dark themes and Indonesian/English application language.

---

## Andon Data Model

Each Andon call can contain operational context including:

- Ticket number and Line/workstation.
- Category and severity.
- Line-stop state.
- Operator identity.
- Machine ID and part number when applicable.
- Description and timestamps.
- Acknowledged/responder information.
- Resolution notes and root-cause information.
- 5-Why analysis.
- Escalation state and escalation level.

Escalation levels in the current model are aligned to the operational hierarchy:

1. Leader / PIC
2. Supervisor
3. Manager

---

## Data Modes & Architecture

The application supports two operating modes:

### Demo Mode

Designed for product evaluation and local demonstration. Demo data/configuration can use browser storage so the product can be explored without connecting a buyer's production Firebase project.

### Firebase Mode

Designed for real-time shared operation using Firebase Authentication and Cloud Firestore. Firestore subscriptions update calls, Master Lines, activity logs, layout configuration, and other configured data without requiring manual refreshes.

The local browser session is a UI convenience; production authorization is enforced by Firebase Authentication plus Firestore Security Rules.

### Empty-by-Design Master Data

A clean installation does **not** ship with hard-coded production Lines, machines, or operational call history. Master data is customer-managed. This allows the buyer to build the factory structure for their own plant rather than deleting another company's production data first.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
- **UI / Visualization:** Lucide icons, Framer Motion, Recharts.
- **Cloud:** Firebase Authentication and Cloud Firestore.
- **CSV / Spreadsheet processing:** PapaParse and SheetJS/XLSX where used by the application.
- **Runtime tooling:** Node.js / npm.
- **Deployment:** Vite production build; GitHub Pages workflow is included for the repository demo deployment.

---

## Environment Configuration

Copy `.env.example` to `.env` and configure the required values for your deployment.

Typical configuration includes:

```env
VITE_DATA_PROVIDER=demo

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Use `VITE_DATA_PROVIDER=demo` for local/demo operation. Configure the Firebase variables and the production provider setting when connecting the application to the customer's Firebase project. Refer to `.env.example` for the current supported environment variables rather than relying on old README examples.

> Firebase client configuration identifies the Firebase project; authorization must be enforced with Firebase Authentication and Firestore Security Rules. Do not treat frontend environment variables as server-side secrets.

---

## Quick Start

```bash
npm ci
npm run dev
```

Create a production build with:

```bash
npm run build
```

The repository includes `package-lock.json`, so `npm ci` is recommended for reproducible installations and CI builds.

---

## Initial Setup Flow

For a new customer installation:

1. Configure Demo Mode or the customer's Firebase project.
2. Sign in as Admin/system administrator.
3. Create or import Master Lines.
4. Create/import machines and user profiles as required.
5. Assign operational Line access to users.
6. Download and customize the Mapping Layout 2D CSV if a custom physical Line arrangement is required.
7. Upload the Mapping Layout 2D CSV from Master Data → Templates & Guidelines.
8. Configure branding, language, sound, and other system settings.
9. Test Operator → Leader/PIC → Supervisor/Manager response flow before production use.

Because Master Lines start empty on a clean installation, an operational demo account whose `lineAccess` references `LINE-1`/`LINE-2` will require those Lines to exist (or its access to be adjusted by Admin) before normal Line-based use.

---

## CSV Templates & User Guide

Supporting material is available under:

`assets/instruction_guide/`

Included files currently provide:

- `USER_GUIDE.md`
- `template_lines.csv`
- `template_machines.csv`
- `template_operators.csv`

The application additionally generates/downloads the Mapping Layout 2D CSV template from the Master Data interface.

---

## Security Model

The project uses layered controls rather than relying only on hidden UI elements:

- Firebase Authentication for production identity.
- Firestore Security Rules for database authorization.
- Application-level role guards for navigation and actions.
- Admin-only Master Data and configuration operations.
- Sanitization utilities for stored/user-provided application data.
- Audit/activity logging for relevant operational and administrative events.

For production deployments, review `firestore.rules`, `.env.example`, and `SECURITY_HARDENING_NOTES.md` together with the customer's Firebase configuration before go-live.

---

## Commercial Customization

Smart Andon is designed as a configurable source-code product. A customer can adapt:

- Company identity and branding.
- Production Lines and workstation structure.
- Machines/equipment master data.
- User roles and Line assignments within the supported RBAC model.
- 2D factory/Line arrangement through CSV.
- Sound/voice behavior and language/theme preferences.
- Firebase project and production data ownership.

The buyer's operational database remains separate from the source-code demo configuration when deployed against their own Firebase project.

---

## License

See `LICENSE.md` for the license terms supplied with this repository. Purchasing or receiving the source code does not automatically transfer copyright, resale rights, or exclusive ownership unless a separate written agreement explicitly grants those rights.

---

## Creator

**Ressa Hidayat**  
Industrial Solutions Creator / Developer

Smart Andon was created around practical manufacturing response needs: making abnormalities visible quickly, giving each operational level a clear responsibility, preserving response history, and making the system configurable for different factories rather than locking it to one production Line.
