# Architecture rules
- Use authenticated server functions and database RLS for support and spreadsheet export; UI visibility is not an authorization boundary.
- Store operator roles separately from editable profiles to prevent privilege escalation.
- Export household records only for their owner; export consented support/newsletter records only for authorized operators.
- Spreadsheet exports append timestamped snapshots to the dedicated app tab; never overwrite other spreadsheet areas.
- Human support is request-based with persisted replies, not an AI agent; do not route these messages through a model.
- Home-screen installation is manifest-only; do not register an app-shell service worker without an offline request.