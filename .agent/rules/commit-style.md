---
trigger: always_on
---

# Commit Message Guidelines

## Format

Follow the Linux kernel commit message style:
```
<subsystem>: <brief description>

<detailed explanation>
```

## Rules

### Subject Line (First Line)
- **Format**: `<subsystem>: <brief description>`
- **Length**: Maximum 60 characters
- **Style**: Imperative mood, lowercase after prefix, no period
- **Examples**:
  - `ui: add dark mode support`
  - `net: fix connection timeout issue`
  - `build: update gradle dependencies`

### Body (Detailed Explanation)
- **Mandatory**: Commit body must NOT be empty
- **Content**: 
  - Explain what and why, not how
  - Wrap at 72 characters per line
  - Describe the problem and rationale for the change

## Examples

### ✅ Good
```
auth: implement biometric authentication

Add fingerprint and face recognition support for user login.
This improves security and provides password-less authentication.
Falls back to password when biometric hardware is unavailable.
```

### ❌ Bad
```
fix bug
```
No subsystem prefix, no body
```
ui: update login screen
```
Missing body explanation

## Validation

Commits will be rejected if:
- Subject line exceeds 60 characters
- Body is empty or whitespace only
- Missing `<subsystem>:` prefix format