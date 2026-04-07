# Responsive Audit (Centralized)

Use `attachResponsiveAudit(page, testInfo, options)` after your test flow to auto-attach:
- Full page screenshot
- JSON issue report
- Report annotation when issues are found

## What It Detects
- `out_of_viewport`: element is partially/fully outside viewport
- `not_visible`: element exists but is hidden/zero-size
- `tap_target_too_small`: interactive target smaller than configured size
- `possibly_overlapped`: center point is covered by another element

## Usage

```js
const { attachResponsiveAudit } = require('./support/responsiveAudit');

test('my responsive test', async ({ page }, testInfo) => {
  // steps...
  await attachResponsiveAudit(page, testInfo, {
    deviceName: 'iPhone 14',
    scenario: 'checkout',
  });
});
```

## Strict Mode

To fail test when responsive issues are found:

```bash
RESPONSIVE_AUDIT_FAIL_ON_ISSUES=true npx playwright test tests/vdresponsive.spec.js --project=chromium
```
