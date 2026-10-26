# ScholarGate

ScholarGate is an Indonesian institution/school portal and content-management application. Laravel and Inertia serve the React interface from one deployment. Public users read institutional information; staff maintain content and deliver public-information services.

## Existing visual identity

The default theme uses Onest, rounded panels, a warm page background, blue primary actions and supporting pastel accents. Its layout uses bento grids. The classic theme retains a news-portal hierarchy. Administrative screens prioritize readable tables, labelled forms and restrained motion. Existing design tokens in resources/js/index.css are authoritative; this module extends the existing identity.

## PPID

The built-in PPID module serves public applicants and a central staff team. Its public entry points are document search, information applications and application tracking. Its staff priorities are pending service work, document upload/publication and clear deadlines.

Confirmed requirements: manual DIP upload remains available independently of integrations; the shared local/R2/S3 provider stores files, with private storage for personal documents; public tracking requires no account; online and offline submissions share a register; form templates are configurable and versioned; staff permissions are separate from CMS administration. Existing institution-specific e-office/archive systems have not been chosen.

A successful public flow lets a visitor find a document or submit/track a request. A successful staff flow lets an assigned non-admin user carry out authorized tasks without gaining unrelated CMS access. See docs/PPID.md for implementation and operation.
