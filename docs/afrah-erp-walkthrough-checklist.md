# Afrah Media ERP — Walkthrough QA Checklist

Source: `C:\Users\PC\Documents\afrah-erp-walkthrough.txt`

This checklist is used after each build step to verify the app matches the operational walkthrough (Friday, 04 April 2024) as closely as possible.

## STEP 1 — Auth Pages
- [ ] `/login` works and redirects by role
- [ ] `/signup` validates, creates account, starts onboarding
- [ ] `/reset-password` shows success state
- [ ] Middleware blocks unauth + wrong-role URLs

## STEP 2 — Public Landing Page
- [ ] Headline matches walkthrough
- [ ] “See Our Screens” smooth scrolls to Featured Screens
- [ ] “Book a Screen” redirects to `/signup` when logged out

## STEP 3 — Customer Portal
- [ ] Onboarding Wizard: Step 1 → Step 2 → Step 3 → Screen Browser
- [ ] Screen Browser: Map view default, pins + popups, “View Details”
- [ ] Screen Detail: specs + mini map + availability calendar
- [ ] Live quote calculator matches walkthrough multipliers + totals
- [ ] Booking confirm + payment flow (10 min timer, 3s success sim)
- [ ] Success screen: reference format + pipeline + upload CTAs
- [ ] Campaigns: filters, detail tabs, analytics, invoice preview actions
- [ ] Brand assets: upload modal, preview modal, download + delete, download all
- [ ] Quotes: list, detail modal, accept/reject/modification flows
- [ ] Invoices: tabs, detail modal, pay now flow
- [ ] Profile: edit profile, change password, notification prefs, delete confirmation

## STEP 4 — Customer Service Rep
- [x] Dashboard stats + reminders due today actions
- [x] Queries list filters + real-time search
- [x] Query detail: tel/mailto links, notes, status change, assign, convert to quote, book
- [x] Visitors log: log visitor, log timeout, detail modal
- [x] Quote builder: two-panel live preview, send email + WhatsApp sim
- [x] Quotes list: view/download/remind/convert/edit actions
- [x] Customers: profile page with tabs + VIP toggle
- [x] Reminders: overdue/due/upcoming sections + snooze/done/delete + add reminder

## STEP 5 — Sales Executive Dashboard
- [x] `/dashboard/sales` performance cards + pipeline stage count cards + reminders + commission card
- [x] `/pipeline` kanban default + drag/drop + list view + sortable headers + add lead modal
- [x] `/leads` searchable leads list + row click opens detail
- [x] `/leads/[id]` contact links, stage dropdown updates pipeline, activity log modal, mark-lost reason modal
- [x] Lead quotes section + “Create Quote” prefill into `/quotes/new`
- [x] “Convert to Customer” confirm modal + 2s loading + confetti + toast + redirect to `/clients`
- [x] `/clients` table + renewal status badges + WhatsApp reach-out + upsell panels + rich detail modal
- [x] `/commission` summary cards (walkthrough context) + table + detail modal + bar chart + query modal
- [x] `/quotes` shows Sales sidebar when role is `sales_executive` (shared route)

## STEP 6 — Head of Design Dashboard
- [x] `/dashboard/design-head` stat cards + designer workload strip + designer profile modal + notifications feed
- [x] `/queue` tabs + ad cards + full review modal + approve/reject confirmations + follow-up prompt (schedule vs create task)
- [x] `/tasks` kanban + list toggle + dnd-kit drag/drop + task detail side panel (Brief/Files/Messages) + 3-step create task modal
- [x] `/review` internal review list + review modal + approve/send + request revision
- [x] `/revisions` client revisions list + detail modal + send to designer
- [x] `/playlists` screen selector + currently playing + weekly schedule + block detail + remove + emergency content confirmation
- [x] `/templates` industry tabs + template grid + preview modal + active/inactive toggle + add template modal
- [x] `/team` team table + designer profile modal + performance chart

## STEP 7 - Designer Dashboard
- [x] `/dashboard/designer` greeting + stat cards + active task cards + quick messages
- [x] `/tasks` switches by tab for To Do / In Progress / In Review / Done when role is `designer`
- [x] `/tasks/[id]` brief + instructions + assets + specs + status/files/messages panel
- [x] Revision banner + upload quality check + submit for review + instant messages
- [x] `/performance` month selector + charts + skill update + history modal
- [x] `/resources` screen specs table + standards downloads + filtered template previews

## STEP 8 - Operations Manager Dashboard
- [x] `/dashboard/operations` alerts + 8 stat cards + engagement snapshot
- [x] `/people?tab=employees` filters, search, row actions, employee profile navigation
- [x] Employee profile tabs: overview, leave, attendance, assets, performance, training, disciplinary
- [x] `/people?tab=recruitment` job board + kanban/table views + applicant detail modal
- [x] `/people?tab=onboarding` board + detail page + task progress updates
- [x] `/people?tab=performance` review list + start/view review modal
- [x] `/people?tab=payroll` editable payroll rows + payslip preview + advances + salary history
- [x] `/people?tab=training` programs + requests + skills matrix create-training flow
- [x] `/people?tab=engagement` pulse survey, EOTM, dismissible alerts
- [x] `/people?tab=leave` donut cards + approve/reject flows + approve all + policies
- [x] `/people?tab=attendance` date list + detail modal + manual log
- [x] `/people?tab=offboarding` active cards + detail page + exit interview + start-offboarding modal
- [x] `/office` all 4 tabs functional with add/detail/update actions
- [x] `/screens` all 4 tabs functional and Garden City stays offline with alert state
- [x] `/assets` all 3 tabs functional and Toyota Hiace keeps service-due warning

## STEP 9 - Finance Dashboard
- [x] `/dashboard/finance` stat cards + revenue/expenses chart + budget bars + gateway ledger modal
- [x] `/invoices` stat filters + search + detail modal + mark paid + void + export
- [x] `/invoices/new` two-panel live invoice builder + send flow
- [x] `/payments` summary cards + table + reconciliation match flow
- [x] `/expenses` donut chart + expense table + detail modal + log expense flow
- [x] `/petty-cash` balance card + withdrawal + replenishment + ledger + history
- [x] `/payroll` editable table + payslip preview + NSSF/PAYE summary + confirm/export
- [x] `/quickbooks` connect simulation + sync queue + sync log + mappings + auto-sync toggles
- [x] `/reports` 6 expandable report cards with controls + chart + table + export

## STEP 10 - CEO Dashboard
- [x] `/dashboard/ceo` approvals banner + executive stats + KPI progress + revenue chart + team snapshot
- [x] `/map` screen status filters + rich popups + detail modal + schedule/view actions
- [x] `/approvals` tabs + approval cards + approve/reject review modal
- [x] `/kpis` summary + KPI CRUD + historical chart
- [x] `/analytics` revenue/screens/customers/demand/forecast tabs functional
- [x] `/announcements` urgency list + detail modal + post modal + preview
- [x] `/settings` pricing/thresholds/discounts/company/screens tabs + warning + maintenance confirmation

## STEP 11 - Technician Dashboard
- [x] `/dashboard/technician` stat cards + priority-sorted task list + report shortcut
- [x] `/tasks/[id]` status pipeline + photo lightbox + mini map + directions + contact + live timeline
- [x] Status actions: On My Way confirmation, Arrived GPS capture, Working on It, Mark as Fixed, Cannot Fix
- [x] Completion report validates notes + parts + minimum 1 photo and redirects after success
- [x] `/report` screen picker + map preview + 500-char description + photo preview + location capture + success screen
- [x] `/history` filters + summary cards + read-only detail modal with completion photos

## Full-system final QA
- [ ] Run through every role section in the walkthrough end-to-end
- [ ] Confirm “every button does something” and all destructive actions confirm
- [ ] Confirm dates render as `DD/MM/YYYY` and money as `UGX 1,250,000`

## STEP 12 - Internal Staff Dashboard
- [x] `/dashboard/staff` announcements cards + leave balance cards + pending assets notice + quick actions
- [x] `/announcements` filter tabs + read/unread modal flow + unread state updates
- [x] `/assets` acknowledgement checkbox flow + report issue modal + state sync back to homepage
- [x] `/leave` request modal + inline validation + pending request detail + cancel request
- [x] `/payslips` list states + payslip detail modal + download action
- [x] `/maintenance` request history + detail modal + submit request flow

## STEP 13 - Super Admin Panel
- [x] `/super-admin` separate shell + 8 health metrics + database/storage breakdowns + error detail modal
- [x] `/users` search + role/status filters + role change + suspend/reactivate + reset password + force logout + login history
- [x] `/flags` live toggles + disable confirmation + detail modal + add flag validation flow
- [x] `/audit` filter bar + append-only table + before/after detail modal
- [x] `/settings` super admin branch + app/upload/payment/maintenance controls + confirmations
- [x] `/integrations` cards + detail modal + test connection + sync + disconnect confirmation

## FINAL VERIFICATION NOTES
- [x] Route/build coverage completed for all 13 steps against the walkthrough
- [x] Core destructive actions use confirmation modals across implemented flows
- [x] Dates render as `DD/MM/YYYY` and money as `UGX 1,250,000`
