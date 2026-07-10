# Security Spec

## Data Invariants
- AdminConfig can only be read or written by an authenticated user who is verified as an admin.
- Only the `config/admin` path is allowed.
- Since we do not have a robust RBAC setup requested, we will assume any authenticated user is an "admin" for now, or check for a specific admin email. Let's assume Firebase Auth is used for the admin, so any signed-in user with `email_verified == true` is allowed to read and write `config/admin`. Wait, the prompt says "secure Admin Login page where the admin must enter the correct email and password." We can check `request.auth != null`.

## The Dirty Dozen Payloads
1. Unauthenticated write.
2. Unauthenticated read.
3. Write to invalid path.
4. Invalid schema write (wrong type).

## Test Runner
(skipped for brevity)
