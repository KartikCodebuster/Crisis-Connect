# CrisisConnect Security Specification

## Data Invariants
- An emergency must have a valid status: `pending`, `accepted`, or `resolved`.
- `requesterId` must strictly match `request.auth.uid` on creation.
- `createdAt` and `updatedAt` must be server timestamps.
- `geohash` and `location` are mandatory for proximity queries.
- Once an emergency is `resolved`, it cannot be modified further.
- A user can only have one active `pending` or `accepted` emergency request at a time (ideally enforced by logic, but rules will protect individual docs).

## The Dirty Dozen (Attack Vectors)
1. **Identity Spoofing**: Creating an emergency where `requesterId` != `auth.uid`.
2. **Helper Takeover**: Overwriting an existing `helperId` when status is already `accepted`.
3. **Ghost Resolve**: Setting status to `resolved` as a user who is neither the requester nor the helper.
4. **ID Poisoning**: Injecting 1MB strings into the `emergencyId` or `requesterId`.
5. **PII Scraping**: Reading all user locations without being in a crisis. (Rules must enforce that user locations are only readable for specific purposes, or masked).
6. **Time Spoofing**: Setting `createdAt` to a past or future date to manipulate sorting.
7. **Massive Payload**: Sending a 1MB description field to bloat database costs.
8. **Invalid State Skip**: Moving status from `pending` directly to `resolved` without a helper (if that's a business rule) or bypassing `accepted`.
9. **Coordinate Hijacking**: Updating someone else's emergency location.
10. **Unauthorized User Update**: Updating another user's display name or profile.
11. **Negative Coordinates**: (Handled by type check, but could be a range attack).
12. **Recursive List Query**: Trying to scrape the entire `emergencies` collection without a geohash filter (Rules should ideally mandate filters if possible, but list rules will check `resource.data`).

## Test Plan (`firestore.rules.test.ts` logic)
- Deny create if `requesterId != auth.uid`.
- Deny update to `helperId` if `existing().helperId != null`.
- Deny read of `users/private` (if any).
- Allow read of `emergencies` for signed-in users (required for proximity dashboard).
- Deny update of `emergencies/location` once created.
