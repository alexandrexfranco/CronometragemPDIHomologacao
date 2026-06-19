# Security Specification for Tempos e Movimentos PDI

## Data Invariants
- A measurement must always be associated with a valid user UID.
- Users can only read and write their own measurements.
- Timestamps must be validated using `request.time`.
- Total time and capacity calculations should be non-negative.

## The "Dirty Dozen" Payloads
1. **Identity Theft**: Creating a measurement with someone else's `userId`.
2. **PII Injection**: Adding unauthorized fields like `personalEmail` or `plainPassword`.
3. **Ghost Field**: Adding `isVerified: true` to bypass hypothetical logic.
4. **State Skip**: Manually setting `totalTime` to a value that doesn't match the activity durations (validation check).
5. **Resource Poisoning**: Injecting 1MB strings into the `model` or `process` fields.
6. **Time Travel**: Setting `createdAt` to a past or future date manually.
7. **Orphaned Write**: Creating a measurement without a `userId`.
8. **Malicious ID**: Creating a measurement with a 2KB string as `measurementId`.
9. **Role Escalation**: Attempting to set `isAdmin: true` on the measurement document.
10. **Unauthorized Read**: Reading a measurement document ID that doesn't belong to the signed-in user.
11. **Bulk Scrape**: Attempting to list all measurements in the collection without a user filter.
12. **Malicious Update**: Modifying `createdAt` or `userId` after the document is created.

## Test Runner (firestore.rules.test.ts)
```typescript
// Tests will verify that these payloads return PERMISSION_DENIED.
// Implementation omitted for brevity in this spec but will be followed in rules design.
```
