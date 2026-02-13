# Role Architecture (Canonical)

Source of truth for role dictionary, permission matrix, and transition matrix used by this skill.

Related docs:
- `../SKILL.md`
- `./clerk-rbac-patterns.md`
- `./neon-data-isolation.md`
- `./clerk-neon-sync-contract.md`
- `./stripe-webhook-lifecycle.md`

## 1) Canonical Role Dictionary

- `admin`: global administrator.
- `mentorado`: mentorship user with full clinic access (crm, agenda, pacientes, financeiro, marketing) **plus** mentoria; receives 12-month free billing period and conversion path to `clinica_owner`.
- `clinica_owner`: paid clinic owner; has clinic modules (crm, agenda, pacientes, financeiro, marketing) but **no mentorship**.
- `clinica_staff`: subuser linked to one `clinica_owner`; agenda/pacientes permitted; financeiro blocked.
- `pending`: registered but not approved.

No extra role aliases are permitted.

## 2) Module Dictionary

- `admin_panel`
- `mentoria`
- `crm`
- `agenda`
- `pacientes`
- `financeiro`
- `marketing`

## 3) Permission Matrix (Effective)

| Role | admin_panel | mentoria | crm | agenda | pacientes | financeiro | marketing |
|---|---:|---:|---:|---:|---:|---:|---:|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `mentorado` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `clinica_owner` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `clinica_staff` | ❌ | ❌ | ✅* | ✅* | ✅* | ❌ | ❌ |
| `pending` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Key distinction:** `mentorado` = `clinica_owner` modules + `mentoria`. When a mentorado's billing trial ends and they convert to `clinica_owner`, they **lose** mentoria access but retain all clinic modules.

`clinica_staff` is always constrained by owner tenancy and can be further reduced, never expanded beyond `crm/agenda/pacientes`.

## 4) Transition Matrix (Allowed)

| From \ To | pending | mentorado | clinica_owner | clinica_staff | admin |
|---|---:|---:|---:|---:|---:|
| pending | — | ✅ (admin action) | ✅ (admin action) | ❌ | ✅ (admin action) |
| mentorado | ❌ | — | ✅ (automatic on paid conversion or admin action) | ❌ | ✅ (admin action) |
| clinica_owner | ❌ | ❌ | — | ❌ | ✅ (admin action) |
| clinica_staff | ❌ | ❌ | ❌ | — | ❌ |
| admin | ❌ | ✅ (admin action) | ✅ (admin action) | ❌ | — |

### Transition constraints

- `clinica_staff` must be created by owner/admin invitation and linked to `owner_user_id`.
- `mentorado -> clinica_owner` can be automatic when Stripe transitions to paid active state.
- No automatic escalation to `admin`.

## 5) Route Intents

- `/admin/**`: only `admin`.
- `/mentoria/**`: `mentorado` and `admin` (not `clinica_owner`).
- `/crm/**`, `/agenda/**`, `/pacientes/**`, `/financeiro/**`, `/marketing/**`:
  - `mentorado` + `clinica_owner` + `admin`.
  - `clinica_staff` only where module is allowed by matrix and explicit row-level scope checks.

## 6) Frontend/Backend Parity Contract

- Frontend shows capabilities from `effectivePermissions` served by backend (`me` endpoint).
- Backend always re-validates permissions and scope, never trusts frontend checks.
- Admin panel must mirror Clerk user CRUD outcomes in backend responses and audit logs.

## 7) Validation Checklist

- [ ] Role names are exactly canonical in all docs and code.
- [ ] Permission matrix matches backend middleware.
- [ ] Transition matrix enforced in role-change service.
- [ ] Staff cannot receive `financeiro` or `mentoria`.
- [ ] Mentorado has full clinic access + mentoria.
- [ ] clinica_owner has NO mentoria access.
- [ ] mentorado → clinica_owner transition removes mentoria.
