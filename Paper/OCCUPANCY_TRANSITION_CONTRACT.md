# Occupancy Transition Contract — NovaCare

**Status:** design proposal for review; not an approved business policy and not implementation authorization.  
**Scope:** conceptual occupancy lifecycle and the contract for every command that can claim, retain, transfer, release, or consume appointment capacity.  
**Baseline caveat:** the source evidence describes the `develop` working tree recorded by `TECHNICAL_BASELINE_VERIFICATION.md`, including uncommitted changes. Runtime deployment, applied schema, provider behavior, and live database contents have not been verified.

## 1. Purpose and Scope

This contract proposes one vocabulary and transition boundary for booking channels that currently update appointment and slot data through different paths. Its purpose is to make the allowed state changes, atomicity requirements, concurrency conflicts, and approval gaps explicit before implementation.

It covers:

- Normal booking and AI Pre-exam booking.
- Hold, payment success/failure, late/duplicate callbacks, and expiry.
- Patient, hospital-admin, and admin cancellation.
- Reschedule, completion, no-show, and no-show reversal.
- Capacity and schedule changes.
- Multi-slot appointments, legacy records, retries, and reconciliation.

It does **not** add database states, select final business rules, prescribe a migration, or establish that a proposed worker, Redis queue, or multi-instance deployment exists.

Terms used below:

- **Appointment:** the clinical/booking record and its workflow status.
- **Payment:** the financial attempt/result and provider evidence.
- **Reservation:** the conceptual right to consume one or more slots, independent of either status lifecycle.
- **Membership:** the reservation's association with one capacity-bearing slot. A multi-slot reservation has a set of memberships.
- **Claim / release / consume:** occupancy transitions that change whether memberships count against future capacity.
- **Occupancy authority:** the committed PostgreSQL transaction that decides if capacity was claimed or released. Reads of availability are advisory.

## 2. Verified Current-State Constraints

This section records constraints from source, not approved policy.

| Topic | Source evidence | Design consequence |
|---|---|---|
| Current data model | `Appointment` has a primary `slotId`, appointment status, nullable unique `idempotencyKey`, and `expiresAt`; `AppointmentSlot` has `capacity`, `bookedCount`, `status`, `isAvailable`, and `version`; `AppointmentSlotBooking` is a junction unique by `(appointmentId, slotId)` and has no active/released state. See [schema.prisma](nova-care-backend/prisma/schema.prisma#L312), [schema.prisma](nova-care-backend/prisma/schema.prisma#L352), and [schema.prisma](nova-care-backend/prisma/schema.prisma#L377). | Current appointment status and raw junction rows alone cannot identify the live occupying membership set. Do not prescribe backfill from either alone. |
| Normal create | It uses a transaction, locks a primary slot and candidate slots, checks capacity, creates an `AWAITING_PAYMENT` appointment and membership rows, and increments slot counters. Normal hold TTL is 15 minutes. See [appointments.service.ts](nova-care-backend/src/modules/appointments/appointments.service.ts#L26). | Existing create is a partial basis for a shared command, but needs one lock order and integration with every other writer. |
| AI Pre-exam create | It checks slot capacity before the transaction, then creates an `AWAITING_PAYMENT` appointment with 30-minute expiry and increments the primary slot counter; the inspected method does not create membership rows. See [pre-exam.service.ts](nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L201). | All channels must use the same claim semantics; current persistence differs and cannot be treated as equivalent without verification/classification. |
| Cancel, expiry, reschedule | Patient cancellation, expiry, hospital-admin cancellation, and reschedule use different update paths; several only update primary `slotId` or read counter values before writing. Current baseline reports multi-slot membership/counter mismatch risk. See [appointments.service.ts](nova-care-backend/src/modules/appointments/appointments.service.ts#L546), [appointments.service.ts](nova-care-backend/src/modules/appointments/appointments.service.ts#L662), [appointments.service.ts](nova-care-backend/src/modules/appointments/appointments.service.ts#L770), and [hospital-admin.service.ts](nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527). | These must not remain independent occupancy writers after any future cutover. |
| Payment | VNPay IPN updates payment and appointment; the inspected code does not establish a provider settlement-time policy or re-claim protocol for a released reservation. A public simulator path also exists. See [payments.service.ts](nova-care-backend/src/modules/payments/payments.service.ts#L96) and [payments.controller.ts](nova-care-backend/src/modules/payments/payments.controller.ts#L49). | Payment and occupancy need separate lifecycles and an explicit late-payment decision. |
| Expiry runtime | Expiry service and endpoint exist; a processor class exists, but worker/scheduler runtime wiring was not verified. The current source predicate is `expiresAt < now`. See [appointments.controller.ts](nova-care-backend/src/modules/appointments/appointments.controller.ts#L168) and [TECHNICAL_BASELINE_VERIFICATION.md](TECHNICAL_BASELINE_VERIFICATION.md#L93). | A scheduler is a trigger only. Correctness must live in an idempotent database command; production expiry execution remains unverified. |
| PostgreSQL / Redis | PostgreSQL holds appointment/slot/payment data. Redis/BullMQ declarations exist, but queue/worker runtime wiring and Redis booking locks were not verified. See [queue.module.ts](nova-care-backend/src/queue/queue.module.ts#L1). | PostgreSQL is the proposed authority because it owns the contested records. Redis is not presumed necessary for correctness. |

Further background and limitations are documented in [POLICY_APPROVAL_MATRIX.md](POLICY_APPROVAL_MATRIX.md), [CONSOLIDATED_BUSINESS_POLICY_REVIEW.md](CONSOLIDATED_BUSINESS_POLICY_REVIEW.md), [BASELINE_AND_OCCUPANCY_INVENTORY.md](BASELINE_AND_OCCUPANCY_INVENTORY.md), and [TECHNICAL_BASELINE_VERIFICATION.md](TECHNICAL_BASELINE_VERIFICATION.md).

## 3. Proposed Occupancy State Model

The following are **conceptual states**, not Prisma enums, database columns, or approved business policy:

| Conceptual occupancy state | Consumes future capacity? | Meaning | Entry condition | Exit condition |
|---|---:|---|---|---|
| `NOT_OCCUPYING` | No | No capacity claim currently exists. A draft or failed claim is here. | No committed claim; or a valid transition already ended the claim. | A complete claim transaction succeeds and commits. |
| `OCCUPYING` | Yes | Reservation has claimed all required memberships. It can correspond to a payment hold, a confirmed booking, or another approved active booking state. | Every required slot is validated and claimed in the same committed transaction. | A valid cancel/expiry/compensation transition releases it, or an approved use milestone consumes it. |
| `RELEASED` | No | Capacity has been returned before/without consuming the appointment time. The reason is retained in history. | An occupying reservation atomically transitions to release due to cancel, expiry, or another explicitly permitted reason. | Terminal for that reservation instance. Reclaim, if permitted, is a new guarded claim or explicit reactivation policy, never a status-only resurrection. |
| `CONSUMED` | No future capacity | The reservation's capacity obligation has ended through use or an approved no-show/slot-time rule. This is distinct from release for audit and research. | An occupying reservation reaches the approved consume milestone. | Terminal for that reservation instance. Reversal requires a new explicit compensating transition and capacity check. |

```text
NOT_OCCUPYING --successful atomic claim--> OCCUPYING
OCCUPYING --valid cancellation/expiry--> RELEASED
OCCUPYING --approved completion/no-show/use milestone--> CONSUMED
RELEASED --new guarded claim only, if policy permits--> OCCUPYING (new or explicitly versioned claim)
CONSUMED --no implicit resurrection--> requires an approved compensating command
```

### 3.1 Relationship to other state machines

- `AppointmentStatus` describes the booking/clinical workflow.
- `PaymentStatus` describes a financial transaction.
- `AppointmentSlot.status` and `isAvailable` describe slot publication/operational state.
- Occupancy answers only: **does this reservation currently consume this slot's capacity?**
- A successful payment does not create occupancy. It can affect the appointment/payment states while occupancy remains unchanged.
- A failed payment does not by itself release occupancy if an approved hold is still valid.
- A status update, payment callback, or availability read cannot independently increment/decrement `bookedCount`.
- `HELD` / `BOOKED` may later be useful subtypes, but this contract does not add them or choose a persisted representation.

### 3.2 Multi-slot occupancy representation

Conceptually, a reservation has one complete required set `M = {s1, s2, …, sn}`. While `OCCUPYING`, it consumes one unit on **every** member slot. An incomplete set is not a successful reservation. A transition that releases or consumes the reservation must apply to all its members atomically. What constitutes a valid slot set (base interval, service duration, adjacency, room/service constraints, and whether a single-slot AI flow is compatible) remains subject to D5 approval.

## 4. Unified Transition Contract

The “current state” column describes source behavior where known. All rows labelled `PROPOSED` are candidate contract behavior, not an instruction to implement before approval. `UNRESOLVED` means a decision or evidence is required before a definitive business outcome can be selected.

| Operation | Current state | Preconditions | Occupancy change | Appointment change | Payment change | Slot change | Membership change | Atomicity requirement | Failure behavior |
|---|---|---|---|---|---|---|---|---|---|
| Normal booking | Source: create claims within a transaction, makes multi-slot memberships, sets `AWAITING_PAYMENT`, TTL 15m. | Auth/profile/service valid; canonical candidate set computed; every slot active/eligible and capacity available after locks; patient overlap rule satisfied; request idempotency resolved. | `NOT_OCCUPYING → OCCUPYING` only after all slot claims can commit. | Create appointment in the approved initial workflow state. Exact status mapping is policy-dependent. | Create/associate a pending payment attempt as required; no “paid” inference. | Increment each claimed slot once, guarded by `count < capacity`; derive availability/status consistently. | Create all members for the reservation in the same transaction. | One PostgreSQL transaction for appointment, full membership set, all counters, histories/outbox records that must commit with claim. | Any failed slot, overlap, idempotency mismatch, or write error rolls back all claims and appointment/membership changes. Return a domain conflict or explicit error; never return partial success. |
| AI Pre-exam booking | Source: 30m TTL; prechecks outside transaction; increments primary slot; membership insert not shown. | Same eligibility, capacity, identity, overlap, and idempotency rules as normal booking, plus valid completed Pre-exam session. Whether this flow uses one slot or a service-length set is `UNRESOLVED`. | Same atomic `NOT_OCCUPYING → OCCUPYING`; no separate weaker occupancy semantics by channel. | Create with the approved initial appointment state and provenance recorded. | Same payment lifecycle and TTL policy as other channels unless a policy owner approves a distinction. TTL 15m vs 30m is `UNRESOLVED`. | Guard and increment all required slots. | Persist complete canonical membership set; no primary-only exception unless explicitly approved and capacity semantics prove it equivalent. | Same transaction and lock protocol as normal booking. | Conflict or rollback exactly as normal booking; no appointment without its complete occupancy claim. |
| Hold / awaiting payment | Source: hold is represented through appointment/payment fields; TTLs differ by flow. | Claim has committed; deadline and boundary are set using the approved clock/policy. Payment URL creation or page-open is not a claim. | No change while a valid hold remains active; `OCCUPYING` continues. | Remain in the corresponding awaiting/confirmed business state; exact mapping is `UNRESOLVED`. | Pending/processing status does not independently renew the hold. Whether `PROCESSING` grants grace is `UNRESOLVED`. | None. | Preserve all active memberships. | No occupancy mutation; any deadline change must be an explicit, serialized command and audited. | Replayed checkout/payment URL does not silently extend TTL. Invalid or unsupported extension returns conflict/requires explicit policy. |
| Payment success before hold release | Source: IPN success sets payment and appointment `PAID`; no occupancy transition. | Verify signature/reference/amount/currency and provider event contract; lock/re-read relevant payment, appointment/reservation; reservation is still occupying or a timely success outcome is allowed by approved rules. | Normally no change: remain `OCCUPYING`. Payment itself never claims capacity. | Transition to the approved paid/confirmed state; do not overwrite a terminal/cancelled state blindly. | Record paid event exactly once, including authoritative provider facts. | None. | No change. | Payment event identity and appointment transition must be committed atomically with state/history. External provider calls remain outside the transaction. | Invalid or duplicate event is rejected/no-op under provider ACK rules. If reservation already released, use the late-payment contract, not status-only `PAID`. |
| Payment failure | Source: IPN may record `FAILED`; the inspected path does not itself release hold. | Authenticated/verified failure event and payment reference; idempotency check. | No change while hold is valid; expiry or an explicitly approved early-release command may later release. | Remains in an eligible awaiting-payment state or moves to a policy-approved failure state. This mapping is `UNRESOLVED`. | Record failure once; retry/another payment attempt rules are `UNRESOLVED`. | None. | No change. | Payment event and associated appointment workflow/history commit consistently; no provider/network call in DB transaction. | Duplicate failure is a no-op; event arriving after a later success must not downgrade paid state. |
| Late successful callback after release/expiry/cancel | Source: no verified re-claim/compensation policy; current callback can update state based on its payment lookup. | Provider event authentic and idempotent; use authoritative timestamp if provider contract supplies one; re-read reservation and all target slot capacity under locks. | `UNRESOLVED`: (a) no re-claim; payment enters refund/review, occupancy remains released; or (b) guarded re-claim if the full set remains available and policy permits. Never claim if any required slot is unavailable. | Do not blindly change `EXPIRED`/`CANCELLED` to `PAID`; choose approved booking/exception state. | Record captured funds separately from booking entitlement; refund/manual review outcome is `UNRESOLVED`. | If re-claim selected, claim all memberships with capacity checks; otherwise none. | If re-claim, restore/create the complete membership set as a new claim; otherwise retain released history and do not reactivate old membership by inference. | One transaction for event dedupe, current-state decision, any complete re-claim, appointment/payment/history and outbox intent. | If capacity is insufficient, rollback any partial re-claim and create/retain a financial review/refund case according to approved policy. |
| Duplicate payment callback | Source: checks whether payment is already `PAID` before transaction; event-level idempotency not verified. | Unique event identity or equivalent stable payment event key; validate payload and actor/provider scope. | No change after first successful logical transition. | No duplicate workflow transition. | No duplicate payment capture record, refund, or state downgrade. | None. | None. | Serialize/dedupe inside the database transaction; external side effects use idempotent keys/outbox. | Return stable provider-compatible acknowledgment/no-op; do not create duplicate history/effects. Exact response depends on provider contract. |
| Patient cancellation | Source: status/deadline/encounter checks then transaction; releases junction members if found, otherwise primary slot; no uniform CAS in baseline. | Actor owns appointment; state/time/encounter conditions satisfy approved cancellation policy; reservation currently occupying; payment/refund policy evaluated separately. | `OCCUPYING → RELEASED` once, across all members. Already released is a no-op/conflict with no second decrement. | Transition to `CANCELLED` only if allowed. | Payment/refund status remains independent; initiate separate refund workflow if approved. | Decrement each membership once with `count > 0` guard; recompute derived availability without overriding blocks. | Mark/release every membership according to eventual representation; retain audit/history. | Lock appointment and all members; CAS the occupying transition; commit status, memberships, counters, history, and refund/outbox intent atomically. | If any member/counter invariant fails, rollback the whole release and surface a reconciliation error; do not clamp to zero or partially release. |
| Hospital/Admin cancellation | Source: paths differ; current working tree has a hospital-admin conditional status update and primary-slot decrement, while admin status paths vary. | Authorized actor and auditable reason; policy-specific eligibility/override; same occupancy preconditions as patient cancellation. | Same single `OCCUPYING → RELEASED` transition as patient path. Role changes authorization, not occupancy semantics. | `CANCELLED` if allowed; status changes that are not cancellation must not implicitly release. | Independent refund/manual review contract. | Same full-member guarded decrements. | Same full membership release; no primary-only exception. | Same shared transaction/command as patient cancellation; actor and override audit included. | Unauthorized request no-op/error; stale state conflicts; repeated command does not release again. |
| Expiry | Source: strict `expiresAt < now`; service and processor update status and primary counter; runtime worker not verified. | Re-read under lock; current reservation is occupying, appointment is an expiry-eligible hold, deadline satisfies approved boundary, payment event/state permits expiry. `<=` vs `<` and grace are `UNRESOLVED`. | `OCCUPYING → RELEASED` once across all members. | Set approved expired status only if expiry wins the state transition. | Do not overwrite a verified success; failure/processing behavior follows approved TTL/payment policy. | Decrement all members once; derive slot availability/status. | Release all membership slots atomically; preserve history. | Trigger may be periodic, queue-based, or manual, but command is the same idempotent transaction. Multiple workers serialize on the same state. | Stale candidate becomes no-op. Partial slot release rolls back. Retry is safe. |
| Reschedule | Source: only `CONFIRMED`/`PAID`; prechecks target outside transaction; updates primary count/slot only, not full membership. | State/role/deadline/payment eligibility approved; canonical old and new sets computed; lock appointment and union of old/new slots; target capacity validated using net membership delta. | Keep occupancy continuous. Apply `old \ new` release and `new \ old` claim; `old ∩ new` unchanged. Complete transfer is all-or-nothing. | Update slot/service/time and any workflow fields under approved rules; preserve history. | Whether paid amount, existing payment session, TTL, or refund needs adjustment is `UNRESOLVED`. | Guarded decrement/increment on only set differences; capacity tested against resulting count. | Replace old membership set with new set atomically; shared members retained. | Single transaction with a deterministic lock order over union; any target failure rolls back and preserves old booking. | Return conflict and keep old booking intact; do not leave partial target membership or release old capacity first. |
| Appointment completion | Source: changes appointment to `COMPLETED`; no counter decrement shown. | Appointment eligible and completion confirmed by authorized workflow/HIS; consume milestone and timing approved. | `OCCUPYING → CONSUMED` when policy-defined future capacity obligation ends. Exact time (completion instant vs slot end/grace) is `UNRESOLVED`. | Set `COMPLETED` and timestamps/history. | No automatic payment/refund change. | No future-capacity decrement until the approved consume transition; update derived status if a future slot still exists. | Retain membership/history; mark consumed conceptually if chosen representation supports it. | Atomic consume and status/history transition, idempotent by appointment/version. | Invalid/duplicate completion is no-op or conflict; no second counter decrement. |
| No-show | Source: status can become `NO_SHOW`; no occupancy release shown in inspected admin paths. | Authorized actor; eligibility/grace/contact requirements approved; appointment still occupying. | `UNRESOLVED`: consume/release at no-show decision, at slot start plus grace, or at slot end. No-show must not imply a second decrement if completion/expiry already ended occupancy. | Set `NO_SHOW` and audit evidence. | Payment/refund/forfeit policy is separate and `UNRESOLVED`. | Apply no capacity delta until selected consume/release moment; then update all impacted memberships once. | Preserve membership/history; no deletion as a substitute for state. | Serialized transition with occupancy state and status; duplicate no-show command is idempotent. | If no longer occupying, do not decrement; return current state or require an explicit correction command. |
| Revert no-show | Source: can restore status to `PAID`/`CONFIRMED`; no re-claim was shown. | Authorized correction with reason; inspect current occupancy and capacity across all original slots. | `UNRESOLVED`: if still occupying, keep; if consumed/released, require a new guarded re-claim or record a clinical correction without capacity entitlement. | Restore workflow state only according to approved correction semantics. | Preserve prior payment facts; no automatic financial reversal. | If re-claim permitted, capacity must be available on every needed slot; otherwise do not claim. | Reactivate/create full memberships only through an explicit new transition; no silent revival. | Atomic audited compensation with event/idempotency key and all-member guard. | If any slot is unavailable, preserve current occupancy and route to manual policy resolution; do not oversell. |
| Capacity modification | Source: slot update reads a count then writes capacity/availability; room/session and reconciliation paths differ. | Lock slot; read authoritative occupancy after lock; actor/policy valid. Behavior when requested capacity is below active occupancy is `UNRESOLVED`. | No occupancy changes. Capacity must not silently rewrite reservations. | No appointment state change by default. | None. | Proposed default: reject capacity below committed occupancy. Alternatives: preserve existing claims as over-capacity exception, relocate/cancel through separately authorized commands. | None. | Capacity update and availability/status recalculation in one transaction serialized against claims/transfers. | On conflict or prohibited reduction, leave prior capacity unchanged; explicit override must be audited and cannot partially mutate bookings. |
| Schedule modification / blocking | Source: reconciliation can update existing slot times/capacity/activity; schedule cleanup deactivates some unbooked future slots; status writers are separate. | Lock affected slots and any appointment/reservation state that must be migrated; compute impact from current occupancy; approved closure/force-change policy. | No automatic release. If a commitment must move/cancel, use explicit reschedule/cancel commands. | Existing appointment remains unchanged unless an approved command changes it. | None by default. | Update future slot metadata/status only if it preserves existing commitments or an approved exception is applied. | Do not drop/overwrite occupied membership. | Multi-slot schedule changes that affect claimed appointments require one transaction per reservation or a controlled batch protocol with resumability and audit. | Reject or quarantine conflicting changes; expose affected bookings for staff resolution; never silently invalidate or partially move them. |

## 5. Core Invariants

These are proposed technical invariants; their policy predicates (especially active/consumed time) need approval before they become a test oracle.

| ID | Definition | Scope | Must hold when | Expected enforcement | Example breaker |
|---|---|---|---|---|---|
| I1 Capacity bound | For every slot `s`, committed occupying reservations `O(s)` satisfy `0 ≤ O(s) ≤ capacity(s)`. | All channels, services, admin actions, and all API/worker instances sharing the database. | At every committed state, except for a separately approved and explicitly represented administrative over-capacity exception. | PostgreSQL transaction, ordered row lock, post-lock re-read, guarded increment `bookedCount < capacity`, capacity-change serialization, reconciliation. | Concurrent normal and Pre-exam creates both read one remaining place and increment from stale state. |
| I2 Nonnegative counter | `bookedCount(s) ≥ 0` for all slots. | Every counter writer. | Every commit. | Conditional decrement requiring `bookedCount > 0`; if not satisfied, rollback and report invariant/data inconsistency. Do not clamp to zero. | Duplicate cancel or expiry decrements the same booking twice. |
| I3 Counter projection | If the counter is retained, it equals the count of live occupying reservations whose active membership includes the slot, under the approved occupancy definition. | Every slot, including multi-slot, Pre-exam, and legacy-converted reservations. | After each committed transition and at reconciliation checkpoints. | One authoritative membership/reservation interpretation; atomic projection updates; read-only drift reconciliation before any repair. | Raw junction rows retained after release are counted as occupancy, or AI path lacks membership while counter increments. |
| I4 Single release | A reservation transition from occupying to released/consumed changes each member's counter at most once. | Cancel, expiry, payment compensation, admin and correction commands. | Every duplicate/retry/concurrent execution. | CAS/conditional state transition serialized with counter changes in the same transaction; stable idempotency identity. | Two expiry workers both act on the same previously selected appointment. |
| I5 Multi-slot atomicity | A reservation's required memberships are all claimed, transferred, released, or consumed together; no partial committed subset. | Any service that uses multiple slots, including reschedule and expiry. | Every successful or failed transition. | Lock the complete affected slot set in global order; guarded updates and membership writes in one transaction; rollback on any failed member. | Last target slot is full after earlier target slots have already been incremented outside a transaction. |
| I6 Membership-set consistency | The reservation's canonical active membership set matches its service/interval definition; primary `slotId` is a designated anchor, not a substitute for the full set unless policy says so. | New writes and classified legacy data. | After commit and on reconciliation. | One canonical interval calculator and one command path; validate adjacency/duration; audit membership transitions. | Reschedule updates primary slot but retains old auxiliary junction rows. |
| I7 Independent state machines | Appointment and payment states do not independently create/release occupancy. Occupancy changes only through an explicit claim/release/consume command. | All transitions, including callbacks and admin status changes. | Every event regardless of arrival order. | Command-level contract and no direct counter writes from status/payment handlers. | Callback changes `EXPIRED` appointment to `PAID` after release without a capacity re-claim. |
| I8 Availability is advisory | `isAvailable`/`SlotStatus` and API search results are derived observations, not reservations or a guarantee of later success. | Read paths and all clients. | At read and at command commit. | Claim command rechecks `isActive`, policy-eligible status, capacity, and schedule under locks. Recompute derived state consistently after commit. | UI sees an available slot, another client claims it, and first client assumes its stale response reserves the place. |
| I9 Atomic reschedule | A reschedule either transfers the complete active set to the target, preserving all valid old membership until the target is secured, or leaves the old reservation unchanged. | Reschedule across channels and service durations. | Every successful/failed operation. | Transaction over union(old,new), ordered locks, net-delta capacity checks, one transition/idempotency identity. | Old count decremented before target slot claim fails. |
| I10 Payment/occupancy separation | `PAID` proves a financial event only under provider verification; it does not prove a slot is currently owned. Conversely, an active hold can occupy before payment. | Payment success/failure/late callbacks and refunds. | Every committed payment/booking state. | Payment event dedupe and separate occupancy transition; late-success compensation policy; provider evidence validation. | Duplicate or late callback sets appointment `PAID` while reservation is released and slot sold to another patient. |
| I11 History preservation | Release/consume does not erase the appointment, payment facts, transition history, or actor/reason audit. | Cancel, expiry, no-show, completion, correction, and reschedule. | At and after every transition. | Append-only or equivalently durable history/audit; records committed with state change. | Membership deletion used as the only evidence of cancellation, leaving no transition/actor trace. |
| I12 Capacity and schedule serialization | A capacity reduction, block, deactivation, or schedule edit cannot race a claim into an unapproved invalid committed state. | Slot admin, schedule reconciliation, room/session changes, booking commands. | Every commit affecting slot eligibility/capacity. | Same slot lock order/protocol as booking; reject below-occupancy capacity by default unless an explicit exception workflow is approved. | Admin reads count 0, concurrent create claims, admin sets capacity to 0 from stale snapshot. |
| I13 Idempotent command outcome | Replaying the same logical command returns/reports the same outcome and does not repeat state changes or external side effects. | Create, cancel, expiry, reschedule, callbacks, refund/review, admin overrides. | Any at-least-once delivery or client retry. | Database unique command/event identity with actor/scope/payload semantics; state CAS; outbox and idempotent consumers for side effects. | Two identical callbacks each create history and enqueue duplicate notifications/refund. |
| I14 No implicit resurrection | A released/consumed reservation is not made occupying by changing only appointment/payment status. | Late payment, no-show reversal, manual correction. | Every compensating action. | Explicit re-claim with capacity check for all memberships, or non-occupying financial/clinical correction. | `NO_SHOW → PAID` status restoration after original slot has been sold again. |

## 6. Unified Command Processing Model

### 6.1 Command responsibilities

One in-process booking/occupancy command boundary is proposed; it need not be a separate microservice. Controllers, AI services, payment adapters, expiry triggers, and administrative UI should authenticate/authorize and submit commands, but should not update counters or membership directly.

Conceptual commands:

1. `ClaimReservation` — normal and AI-originated booking.
2. `ConfirmPaymentOutcome` — verified success/failure; delegates late success to an explicit policy path.
3. `ReleaseReservation` — patient/admin/hospital cancellation or other authorized release.
4. `ExpireReservation` — idempotent deadline transition invoked by any sweep/job/endpoint.
5. `TransferReservation` — reschedule/slot-set change.
6. `ConsumeReservation` — completion/no-show/use milestone once approved.
7. `CorrectReservation` — audited no-show reversal, manual exception, or compensating re-claim.
8. `ChangeSlotPolicy` — capacity, active/block state, or schedule change serialized with occupancy.

The names are illustrative responsibilities, not selected class/API names or added source code.

### 6.2 Common execution sequence

1. **Validate outside locks:** authenticate actor; authorize role/scope; validate input shape; verify external callback signature/reference and normalize trusted provider evidence. Do not trust client-supplied payment success or availability.
2. **Resolve idempotency identity:** define command scope, actor/provider, key, and payload fingerprint. A key replay with the same logical request returns the stored outcome; incompatible reuse is rejected. How keys are persisted is a later schema decision.
3. **Start a short PostgreSQL transaction.**
4. **Acquire locks in one documented hierarchy:** for an existing appointment command, lock the idempotency/event identity if needed, then appointment/reservation, then patient-profile row if overlap policy requires serialization, then every affected slot ordered by one global key such as `(startTime, id)`. For create, no appointment row exists, so lock command identity, any patient-profile serialization row, then the complete candidate slot set in that same slot order.
5. **Re-read after locks:** appointment/reservation state, payment event state, membership set, slot capacity/activity/status/schedule, expiry boundary, and any patient overlap facts. Earlier reads are candidate discovery only.
6. **Check the entire transition:** valid before-state and actor, policy eligibility, every slot capacity/availability, complete interval/membership, overlap, and no duplicate logical transition.
7. **Apply guarded changes:** claim via conditional increments; release via conditional state transition and guarded decrements; transfer using `old \ new`, `new \ old`, and `old ∩ new`; update membership set; recalculate derived slot status without overriding block rules.
8. **Write appointment/payment state, durable history/audit, idempotency outcome, and any outbox intent** that must correspond to this transition.
9. **Commit once.** The commit is the linearization point at which the claim/release/transfer becomes authoritative.
10. **After commit:** call payment provider, enqueue notifications, dispatch outbox, or publish realtime updates. These operations must be retryable/idempotent and must never hold database row locks while waiting on the network.

### 6.3 Locking, capacity, and retry

- Use the same global slot ordering for create, cancel, expiry, reschedule, no-show correction, capacity change, and schedule changes that touch occupancy.
- Lock the full candidate or affected set before the final capacity decision. Re-read state after locks; do not base an increment/decrement on an earlier counter snapshot.
- A guarded increment is conceptually allowed only if the slot remains eligible and `bookedCount < capacity`. A guarded decrement is allowed only if `bookedCount > 0` and the reservation transition is still occupying.
- Any failed member of a multi-slot operation aborts the whole transaction.
- Retry only bounded database transient errors (such as deadlock/serialization failures) by rerunning the whole command and rereading state. Do not blindly retry capacity/business conflicts or idempotency mismatches.
- Availability and cache values are advisory. A client must treat the command result, not a prior read, as the final capacity decision.

### 6.4 Duplicate commands and transaction failure

- Concurrent duplicate commands must serialize on a durable identity and/or resource state; a pre-transaction read is not sufficient.
- A transaction rollback leaves no partial counter, membership, appointment/payment transition, history, or outbox intent.
- If commit succeeds but the HTTP response is lost, retry returns the prior logical outcome rather than repeating the transition.
- External effects use after-commit delivery. If outbox persistence is not adopted, a separate recovery design is still needed for “DB commit succeeded, publish failed”; do not call provider/queue inside the lock-holding transaction as a shortcut.
- Expiry jobs may be delivered more than once. The command—not the queue's delivery guarantee—must prevent double release. `FOR UPDATE SKIP LOCKED` may distribute sweep candidates, but does not replace state recheck or transition guards.

## 7. Concurrency Conflict Matrix

The table gives the proposed control and matching test, not a claim that the current source already satisfies it.

| Concurrent pair | Contended data | Race / possible incorrect outcome | Invariant at risk | Expected control | Correctness test |
|---|---|---|---|---|---|
| 1. Create vs Create | Same slot rows, capacity counters, membership, possible patient-overlap key. | Both read last capacity and both insert; overlapping multi-slot windows claim only part of their set. | I1, I3, I5, I8. | Serialize on all candidate slot rows in global order; recheck and guard each increment; one transaction per reservation. | E1/E2 single-slot capacity 1 and C; E3 overlapping windows with forced barriers. |
| 2. Normal Create vs AI Pre-exam Create | Same slot/counter but potentially different write protocol, membership, and TTL. | Normal path locks; Pre-exam path prechecks outside transaction; both increment; raw membership diverges. | I1, I3, I6, I7. | Route both through the same claim command and capacity predicate; only source/provenance may differ if policy approves. | Mixed-channel same-slot contention; assert one capacity winner and complete membership/counter parity. |
| 3. Create vs Cancel | Same slot counter/membership and appointment transition. | Create and cancel read stale counts; lost update or new claim before release is committed; cancellation retries release twice. | I1–I4, I8. | Appointment CAS for cancel plus shared ordered slot locks; commit release before a later claim can use released capacity. | Barrier-controlled cancel/create pair; verify both serial orders and final ledger. |
| 4. Create vs Expiry | Same hold, slots, counters, and newly available capacity. | Stale expiry selection releases a hold while payment/another state change wins; new claim races the decrement. | I1, I3, I4, I7. | Expiry command locks/rechecks hold and complete memberships; state transition and counters atomic; create uses same slot locks. | Force create at expiry boundary while expiry worker repeats; verify exactly one valid order. |
| 5. Payment vs Expiry | Payment event, appointment/reservation state, all slot members. | Expiry releases then callback sets `PAID`; callback wins but expiry also decrements; late captured payment has no place. | I4, I7, I10, I14. | Serialize both on reservation/payment identity; verify authoritative time and current state; choose approved late-payment/re-claim/refund policy. | Callback before/at/after deadline, both lock orders, and after slot rebooking; assert approved truth table. |
| 6. Payment vs Cancel | Payment state/event and appointment/reservation state; refund side effects. | Patient/admin cancel and callback each commit incompatible status; booking released but marked paid, or refund issued twice. | I4, I7, I10, I13. | One command boundary; transaction checks current state; provider refund occurs after commit via idempotent workflow. | Concurrent cancel + success callback, then duplicates; verify one booking transition and financial case. |
| 7. Cancel vs Cancel | Appointment transition, every member counter, histories/audits. | Two actors both pass a stale eligibility read and decrement twice or produce competing reasons. | I2, I4, I11, I13. | CAS from occupying to released under appointment lock; winner writes release; duplicate returns stable outcome without counter mutation. | Patient/admin/hospital-admin cancellations against the same single- and multi-slot booking. |
| 8. Reschedule vs Create | Old/new slot set, appointment membership and counters. | Reschedule checks target stale; concurrent create fills target; old slot released before new secured; appointment primary and membership diverge. | I1, I5, I6, I9. | Lock appointment and union(old,new) in global order; calculate net deltas; preserve old set until entire target claim is guaranteed. | E5 target nearly full; force target failure; assert old reservation remains unchanged. |
| 9. Capacity Reduction vs Create | Capacity, count, status/availability and slot eligibility. | Admin reads old count; create claims; capacity lowers beneath occupancy; or create succeeds after slot is blocked. | I1, I8, I12. | Capacity update and claim share slot lock/guard; reject below occupancy by default pending policy; recompute availability after serialized update. | E14 run both lock orders at count = capacity−1, capacity, and requested reduction below active count. |
| 10. Schedule Modification vs Create | Slot interval/activity/status/capacity, membership intervals, appointment schedule. | Reconciliation edits/deactivates a slot while create claims; a previously reserved slot changes time or disappears logically. | I5, I6, I8, I12. | Schedule writer locks affected slots and checks reservations; preserve commitments or execute explicit move/cancel command; no silent invalidation. | Race reconcile/block/deactivate against claim and multi-slot booking; inspect all before/after memberships. |
| 11. Multi-slot Create vs Multi-slot Create | Overlapping slot sets, multiple counters, memberships. | Different start times lock slots in different order causing deadlock; one request partially claims a window or overbooks shared members. | I1, I5, I6. | Lock every candidate slot using one global sort order; guard all increments; rollback all if any candidate fails. | E3/E4 intersecting windows with inverted request order, deadlock/retry measurement, and forced last-slot conflict. |
| 12. Duplicate Callback vs Duplicate Callback | Payment row, provider event identity, appointment/history/outbox. | Both callbacks pass a pre-read and create duplicate histories/notifications or downgrade/duplicate payment side effects. | I7, I10, I13. | Unique durable event identity plus serialized payment/reservation transition; after-commit idempotent effects. | E11 duplicate same event at 2/10/50 callers and crash around DB commit/outbox dispatch. |

## 8. Architecture Boundaries

| Boundary | Owns | Must not own |
|---|---|---|
| Appointment lifecycle | Clinical booking status, patient-facing details, cancellation/reschedule/attendance history, actor authorization. | Direct counter mutation based on status alone. |
| Occupancy lifecycle | Claim, retain, transfer, release, consume, complete membership set, capacity guard, and occupancy idempotency. | Payment-provider truth or UI availability caching. |
| Payment lifecycle | Payment attempts, verified events, amounts/currency, provider references, failure/refund/review workflow. | Slot claim/release by setting `PAID`/`FAILED` alone. |
| Slot/schedule management | Slot generation, capacity, operating schedule, block/activity/status, service/room constraints. | Silent invalidation of already committed reservations or uncoordinated counter changes. |
| Expiry processing | Find candidate holds and invoke the shared `ExpireReservation` command. Scheduler/queue is a trigger, not authority. | Duplicated expiry business logic or assuming one job delivery. |
| External payment integration | Signature and provider-contract validation, trusted event normalization, provider-facing ACK handling. | Holding DB locks while calling provider or deciding occupancy outside the command transaction. |
| API / channels | Authentication, authorization, validation, consistent response mapping and command submission. | Channel-specific occupancy rules or independent increment/decrement logic. |
| PostgreSQL | Proposed source of truth for appointment/reservation state, membership, counter/capacity guard, idempotency and transactional history/outbox intent. Transaction commit is the claim/release linearization point. | Provider side effects or notification delivery guarantees; actual production topology remains unverified. |
| Redis / queue / realtime | Optional cache, rate limit, fan-out, async side effects, or candidate scheduling after evidence justifies them. | Authority to award capacity. Redis lock alone cannot atomically commit PostgreSQL membership/counter/payment changes. |

This boundary is compatible with a modular monolith/in-process command service. It does not assert that production is multi-instance or distributed. If multiple API/worker processes are later verified, PostgreSQL transaction/locking must remain correct across them; process-local locks are insufficient.

## 9. Legacy Data Compatibility

### 9.1 Evidence-aware interpretation

Current source makes a simple reconstruction unsafe:

- Normal create creates junction memberships; Pre-exam creation increments the primary counter without a membership insert in the inspected method.
- Cancel/expiry may reduce counts while retaining junction rows.
- Reschedule can change the primary `slotId` without synchronizing all memberships.
- `AppointmentSlotBooking` has no active/released marker.
- Appointment/payment states have no approved occupancy truth table.
- The database actually deployed and its migration history were not queried.

Therefore neither `COUNT(AppointmentSlotBooking)`, `Appointment.slotId`, `AppointmentStatus`, `PaymentStatus`, nor `bookedCount` alone should be treated as authoritative legacy occupancy evidence.

### 9.2 Proposed no-migration-first conversion approach

1. **Pin baseline:** identify the exact source/build and applied database schema before interpreting existing records.
2. **Approve a policy oracle:** define active, released, consumed, and multi-slot interval rules for each appointment/payment/actor event.
3. **Read-only shadow inventory:** on an approved isolated snapshot, compare primary slot, all junctions, histories, payment facts, timestamps, and counters. Classify structural mismatches separately from policy ambiguity.
4. **Classify records:** possible categories include unambiguous active claims, unambiguous released/consumed records, missing membership, stale extra membership, counter mismatch, late/uncertain payment, and schedule/capacity conflict. These are investigation categories, not declarations that any actual record is valid/invalid.
5. **Do not auto-repair ambiguous rows:** route cases with conflicting status/history/payment/membership evidence to an owner-approved manual review. Preserve original values and audit provenance in any future correction design.
6. **Shadow recomputation:** if a canonical logical occupancy view is prototyped later, compare it read-only with counters over time; do not let the shadow result mutate production.
7. **Design a separately approved reconciliation/cutover:** define idempotent batches, concurrency controls, rollback/compensation, audit, and old-writer shutdown before any data migration or backfill is proposed.
8. **Compatibility window:** do not run old and new writers concurrently unless both share the same transition protocol or a proven compatibility layer; otherwise every path must be mapped and cut over together.

No SQL is executed by this contract, and it proposes no migration or schema addition.

## 10. Architecture Alternatives Comparison

| Criterion | PostgreSQL transaction + row-level locking | PostgreSQL row-level locking + conditional update/CAS | PostgreSQL + Redis distributed lock |
|---|---|---|---|
| Correctness | Can be correct when every writer locks/rechecks all contested rows and updates all related records in one transaction. Locks alone do not repair inconsistent business paths or stale membership semantics. | Same transactional authority plus guards at write/state-transition points. Better defense against accidental stale updates, but still depends on correct transaction scope and policy. | Does not improve database atomicity by itself. A Redis lease can expire or be lost while a PostgreSQL transaction continues; without fencing and DB-side guards it can admit stale owners. |
| Race resistance | Serializes commands that take the same row locks; all writers must follow a common lock order. | Adds explicit failure of stale/ineligible writes and makes release-once/capacity checks more locally enforceable. | May reduce contention before entering DB but creates another race/failure domain; must still lock/guard PostgreSQL. |
| Atomicity | Strong across appointment, memberships, counters, and database history if all are in one transaction. | Same; CAS failure causes the whole transaction to roll back. | Redis and PostgreSQL cannot ordinarily participate in one atomic transaction; a Redis lock does not make cross-system commit atomic. |
| Failure recovery | Database rollback is straightforward; lock timeout/deadlock handling and full-command retry required. | Rollback plus explicit affected-row checks; easier to detect a violated precondition. | Must handle Redis outage, lease expiry, partition, lock release, process crash, fencing, and DB rollback independently. |
| Idempotency | Must be separately implemented using durable command/event identity and state checks. | Same, with CAS guarding repeated transitions; uniqueness/idempotency still required. | Redis lock is not idempotency; duplicate callback/job can run after lease expiry or from another path. |
| Complexity | Lowest of the three; fits current persistence topology and normal create precedent. Risk: a row lock-only style can be applied inconsistently. | Moderate; transaction + ordered lock + guarded deltas/CAS, with explicit conflict mapping and bounded retries. | Highest: Redis protocol, lease/fencing semantics, operational monitoring and failure tests in addition to DB locking/CAS. |
| Operational dependency | PostgreSQL and correct transaction behavior. No queue/Redis required for capacity correctness. | PostgreSQL only for correctness; same baseline DB dependency. | Adds Redis availability/configuration and operational ownership; booking may need a defined behavior during Redis failure. |
| Testability | Straightforward with PostgreSQL concurrency tests; requires realistic concurrent transactions. | Explicit guards make pass/fail and invariant tests clearer; must measure lock waits and guard conflicts. | Requires fault injection for Redis outage, lease expiry, network partitions and stale fencing, as well as DB tests. |
| Fit for NovaCare evidence | Strong candidate: current appointment/slot/payment data is PostgreSQL-backed and normal create already uses `FOR UPDATE`; other writers need unification. | Strongest initial candidate to evaluate: aligns with current database and proposals in [CONFLICT_RESOLUTION_DESIGN.md](CONFLICT_RESOLUTION_DESIGN.md) and [PROPOSED_ARCHITECTURE.md](PROPOSED_ARCHITECTURE.md). Not yet approved or implemented. | Not justified as correctness dependency by current evidence: runtime queue/Redis use is unverified and no benchmark demonstrates a bottleneck that requires it. Conditional experiment only. |
| Correctness vs performance | Primarily a correctness/serialization design; may increase lock wait under contention. | Primarily correctness hardening; performance effect must be measured and may be neutral or negative. | Could be a contention optimization in a measured workload, not a substitute for correctness. Any benefit must exceed overhead and degraded-failure cost. |

**Candidate evaluation order, not a final decision:** compare V0 baseline, V1 PostgreSQL locks, and V2 locks + CAS/conditional guards under the same approved oracle and workload. Evaluate Redis-assisted V3 only if V1/V2 meet correctness and measurements identify a specific performance problem or operational need. Existing plans use the same V0/V1/V2/V3 framing in [EXPERIMENTAL_TEST_PLAN.md](EXPERIMENTAL_TEST_PLAN.md#L52) and [RESEARCH_CONTRIBUTIONS.md](RESEARCH_CONTRIBUTIONS.md#L44).

## 11. Unresolved Business Decisions

None of the choices below is approved by this document or by the presence of a draft file.

| ID | Decision needed | Options / question to resolve | Depends on | Needed approver(s) |
|---|---|---|---|---|
| D1.1 | Meaning of `bookedCount` and occupancy truth table | Current active occupancy projection vs cumulative statistic vs no stored counter; which exact reservation states consume capacity? | Legacy data classification, D2–D10. | Booking/product owner, research supervisor, database/architecture owner. |
| D1.2 | Reservation state representation | Conceptual states may be derived, separately persisted, or represented through another approved model. Which is sufficient and auditable? | D1.1 and technical schema inventory. | Domain owner + architecture/DB owner. |
| D2 | TTL and expiry | One TTL or source/service/hospital-specific? Start at claim commit? `<` vs `<=`? Grace/renewal? Does processing payment or an open checkout retain capacity? | D1, D5, D6, provider evidence. | Booking/product and payment owner; hospital representatives if policy varies. |
| D3 | Cancellation and release | Keep 2-hour deadline? Staff override? What happens with active encounter and paid bookings? Release immediately or after a separate financial step? | D1, D5, D7, D10. | Booking owner, hospital operations, finance/payment. |
| D4 | Reschedule eligibility and payment | Which states can transfer? Can an unpaid hold be rescheduled? How to handle payment amount/session/fees? | D1–D3, D5–D7. | Booking/product and payment owner. |
| D5 | Multi-slot rule | Official granularity/duration; primary slot meaning; contiguous set; room/service constraints; does every channel use the same set? | Source schedules and service policy. | Scheduling/clinical operations and product owner. |
| D6 | Payment success, late event, duplicate event | Authoritative provider timestamp and ID; timely success definition; re-claim after release; behavior if slot sold; acknowledgment and retries. | Provider contract/runtime evidence, D1/D2/D5. | Payment integration owner, finance, booking owner. |
| D7 | Failure/refund/review | Auto refund vs manual review; amount and SLA; what to do if provider refund fails; payment failure retry rules. | D3/D6 and provider capability. | Finance/payment owner and customer operations. |
| D8 | Patient overlap | Scope by patient profile, account, or both; do unpaid holds block? How to serialize cross-slot concurrent checks? | D5, privacy/identity model. | Booking/product and clinical operations. |
| D9 | Capacity/schedule exception | Reject below occupancy? Preserve claims on closure? Who can force-change and how relocate/cancel/notify? | D1/D5 and hospital operations. | Hospital scheduling owner and booking owner. |
| D10 | Complete/no-show/reversal | Consume at completion, appointment slot end, grace expiry, or other milestone? Does no-show retain capacity? Can reversal re-claim after reallocation? | D1, D3, clinical workflow. | Clinical operations and booking owner. |
| Governance | Approval record | Who owns each decision and what artifact carries version, effective date, scope, and exceptions? | All policy rows. | Project/research supervisor and designated domain owners. |

### 11.1 Proposed principle pending approval

The most coherent candidate is: claim begins at the successful transaction commit; release/consume ends future capacity only at an explicit serialized transition commit; appointment/payment status never changes occupancy by implication. This principle still requires business confirmation, especially for completion, no-show, late payment, and legacy records.

## 12. Technical Assumptions and Evidence Gaps

| Assumption or gap | Evidence status | Why it matters / how to close |
|---|---|---|
| PostgreSQL is the current persistence location for appointment, slot, and payment data. | `VERIFIED_FROM_SOURCE` for repository model/use; deployed topology not verified. | Confirm deployed DB/build before asserting the same locking semantics apply in production. |
| Current source supports row-level locking for normal create. | `VERIFIED_FROM_SOURCE` for that path only. | Other writers must be inventoried and routed through one protocol. |
| Production has multiple API instances or workers. | `NOT_VERIFIED`. | Do not claim distributed deployment. Obtain sanitized deployment/replica metadata; design DB protocol to work across processes regardless. |
| Expiry scheduler/worker actually runs. | `NOT_VERIFIED`; service and endpoint exist, queue wiring not demonstrated. | Identify deployed trigger/logs. Correctness must not depend on a single delivery. |
| Redis/BullMQ is actively connected to booking path. | Configuration/dependencies found; runtime and booking use `NOT_VERIFIED`. | Do not make Redis a prerequisite. Confirm initialized clients/call paths/metrics before considering V3. |
| Database schema/migrations in deployment match repository. | `NOT_VERIFIED`; no database query was run and some migrations are modified. | DBA read-only schema/migration metadata on approved environment. |
| Occupancy data is currently drifting or valid. | `NOT_VERIFIED`; no data inventory executed. | Only read-only diagnostics on an approved clone after policy oracle is approved. |
| VNPay provides a stable event identity and trustworthy settlement timestamp usable for late-payment decisions. | `EXTERNAL_DEPENDENCY` / `NOT_VERIFIED`. | Obtain provider contract and sanitized sandbox payload; never request secrets. |
| AppointmentSlotBooking is currently a complete active occupancy ledger. | False as a source-backed assumption: table has no active/released state and source paths differ. | Must design classification and future canonical membership semantics; do not infer legacy validity. |
| A particular operational policy has been approved. | No evidence in the reviewed documents; proposals remain proposals. | Obtain approval artifact before policy-level tests or implementation. |

## 13. Proposed Correctness Test Scenarios

Policy-level pass/fail requires the approved D1–D10 truth table. Before approval, tests may verify transaction mechanics but must not present an unresolved business outcome as the correct policy.

| Scenario | Setup / interleaving | Expected oracle after approval | Failure signals |
|---|---|---|---|
| Single-slot contention | Two or more independent requests target capacity 1; expand to capacity `C` and `C+1` contenders. | At most capacity claims commit; losers receive a defined conflict response. | Occupancy above capacity, counter mismatch, unexplained 5xx, or inconsistent conflict. |
| Cross-channel create | Normal and Pre-exam commands target the same last place concurrently. | One shared claim rule; one winner at capacity 1; membership/counter policy agrees. | Both succeed, AI path lacks required memberships, or behavior differs by channel without approval. |
| Multi-slot all-or-none | Competing intersecting windows; inject failure/conflict at each slot position, especially the last. | Every successful reservation has the whole approved set; failed operation changes none. | Partial membership/counter, non-contiguous set, or wrong primary anchor. |
| Lock order and retry | Start requests on overlapping windows in inverse scheduling orders; induce database deadlock/serialization failure in a test harness. | Bounded whole-command retry then commit or explicit conflict; never partial commit. | Hang, unbounded retry, partial state, or retry based on stale reads. |
| Cancel vs cancel | Patient and staff roles issue duplicate cancellation concurrently on single- and multi-slot reservations. | One release transition and one decrement per occupied member; other command is a stable no-op/conflict. | Negative counter, double history/effect, partial release. |
| Create vs cancel | Hold barrier around release commit and a competing claim for the freed place. | Result is explainable by transaction order; no lost update or double award. | Lost increment/decrement or inconsistent final occupancy. |
| Expiry vs create | Run expiry command repeatedly while another create targets the same slot; vary around deadline. | One release at the approved boundary; a later claim uses capacity only after release commits. | Double release, premature release, stale expiry after payment/cancel, or oversell. |
| Payment vs expiry | Deliver valid success before, at, and after deadline; run both transaction orders; include slot sold again. | Approved event timestamp/grace/late-payment table determines booking vs refund/review; no status-only reactivation. | `PAID` booking with no entitlement, overbooking, lost funds case, or duplicate release. |
| Duplicate callback | Same event concurrently and serially; inject crash after DB commit before notification dispatch. | One logical payment transition; stable ACK; side effects eventually delivered once logically. | Duplicate payment/history/refund/notification or missing recoverable outbox intent. |
| Payment vs cancel/failure | Interleave success, failure, cancel, and duplicate delivery on one payment/reservation. | Only legal transitions win; failure cannot downgrade success; refund independent and idempotent. | Conflicting terminal state, repeated refund, or occupancy changed by payment status alone. |
| Reschedule vs create | Reschedule to near-full target while create competes; force a target member to fail. | Success transfers complete set; failure preserves complete old set. | Old claim released before target succeeds; membership/counter divergence. |
| Capacity reduction vs create | Run both orders at occupancy below/equal to capacity; request capacity below active occupancy. | Approved reduction rule holds; create and admin result serialize. | Silent capacity below occupancy when prohibited, or claim into blocked slot. |
| Schedule block/reconciliation vs create | Modify time/activity/capacity of a slot while booking a multi-slot window. | Existing commitments preserved or explicitly handled; no hidden membership invalidation. | Slot time changes under a reservation, partial window, or writer bypasses command path. |
| Completion/no-show/revert | Complete/no-show around slot start/end/grace; then attempt revert after slot reallocation. | Approved consume and correction rules determine counter change; no implicit resurrection. | Double decrement, re-claim without capacity, or historical status overwritten silently. |
| Legacy shadow audit | Synthetic fixtures for AI missing junction, retained released junction, stale reschedule membership, counter drift, and ambiguous payment. | Classifier separates structural mismatch from policy ambiguity; no auto-fix in shadow mode. | Raw row count is treated as truth or ambiguous records are silently mutated. |

These align with the existing scenario and variant planning in [EXPERIMENTAL_TEST_PLAN.md](EXPERIMENTAL_TEST_PLAN.md) and the hypotheses in [RESEARCH_CONTRIBUTIONS.md](RESEARCH_CONTRIBUTIONS.md). No benchmark or correctness result is asserted here.

## 14. Readiness Assessment

### Ready for

- Reviewing the conceptual occupancy state model and identifying policy owners.
- Creating a signed/versioned truth table for appointment × payment × occupancy × slot-membership × actor transitions.
- Refining deterministic PostgreSQL correctness tests and legacy classification rules without database changes.
- Verifying provider/deployment/database facts through authorized, sanitized, read-only evidence.

### Not ready for

- Treating any proposed occupancy state or transition as approved.
- Choosing the final persisted schema, migration, API contract, backfill, or cutover.
- Using raw junction counts, appointment status, payment status, or `bookedCount` alone to classify all historical records.
- Claiming production multi-instance behavior, active Redis/BullMQ expiry, live data drift, or measured performance.
- Implementing a behavior change based only on this design.

**Conclusion:** the design direction is coherent enough for policy review: one explicit occupancy lifecycle, one transactional command boundary, all-member atomic transitions, and PostgreSQL as the proposed capacity authority. The contract is not implementation-ready until D1–D10 decisions are approved, source/runtime/schema baselines are pinned, provider semantics are verified, and legacy data can be classified safely. No business policy is marked `APPROVED`.
