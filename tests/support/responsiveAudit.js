const DEFAULT_TARGET_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[data-testid]',
  '[aria-label]',
].join(',');

function toSafeFilePart(value) {
  return String(value || 'unknown')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function collectResponsiveIssues(page, options = {}) {
  const { selector = DEFAULT_TARGET_SELECTOR, maxElements = 220, minTapSize = 32 } = options;

  return page.evaluate(
    ({ selector, maxElements, minTapSize }) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elements = Array.from(document.querySelectorAll(selector)).slice(0, maxElements);
      const issues = [];

      const shortLabel = (el) => {
        const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
        const aria = el.getAttribute('aria-label') || '';
        const testId = el.getAttribute('data-testid') || '';
        const id = el.id || '';
        if (text) return text.slice(0, 80);
        if (aria) return `aria:${aria.slice(0, 60)}`;
        if (testId) return `testid:${testId}`;
        if (id) return `#${id}`;
        return el.tagName.toLowerCase();
      };

      const isVisible = (style, rect) => {
        if (!rect || rect.width <= 0 || rect.height <= 0) return false;
        if (!style) return false;
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (Number(style.opacity) === 0) return false;
        return true;
      };

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const label = shortLabel(el);
        const visible = isVisible(style, rect);

        if (!visible) {
          issues.push({
            type: 'not_visible',
            label,
            selector: el.tagName.toLowerCase(),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            detail: 'Element exists but is not visible (display/visibility/opacity/size).',
          });
          continue;
        }

        const outOfViewport =
          rect.right < 0 ||
          rect.bottom < 0 ||
          rect.left > viewportWidth ||
          rect.top > viewportHeight ||
          rect.left < -1 ||
          rect.right > viewportWidth + 1;

        if (outOfViewport) {
          issues.push({
            type: 'out_of_viewport',
            label,
            selector: el.tagName.toLowerCase(),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            detail: 'Element is partially or fully outside viewport.',
          });
        }

        const isInteractive = el.matches(
          'button, a, input, select, textarea, [role="button"], [role="link"]'
        );

        if (isInteractive && (rect.width < minTapSize || rect.height < minTapSize)) {
          issues.push({
            type: 'tap_target_too_small',
            label,
            selector: el.tagName.toLowerCase(),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            detail: `Tap target smaller than ${minTapSize}px.`,
          });
        }

        const cx = Math.max(0, Math.min(viewportWidth - 1, rect.left + rect.width / 2));
        const cy = Math.max(0, Math.min(viewportHeight - 1, rect.top + rect.height / 2));
        const topEl = document.elementFromPoint(cx, cy);

        if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
          const coveringStyle = window.getComputedStyle(topEl);
          if (coveringStyle.pointerEvents !== 'none') {
            issues.push({
              type: 'possibly_overlapped',
              label,
              selector: el.tagName.toLowerCase(),
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              coveredBy: topEl.tagName.toLowerCase(),
              detail: 'Element center is covered by another element.',
            });
          }
        }
      }

      return {
        viewport: { width: viewportWidth, height: viewportHeight },
        totalElementsChecked: elements.length,
        totalIssues: issues.length,
        issues,
      };
    },
    { selector, maxElements, minTapSize }
  );
}

async function attachResponsiveAudit(page, testInfo, options = {}) {
  const {
    deviceName = 'unknown-device',
    scenario = 'responsive-audit',
    failOnIssues = process.env.RESPONSIVE_AUDIT_FAIL_ON_ISSUES === 'true',
  } = options;

  const report = await collectResponsiveIssues(page, options);
  const safeDevice = toSafeFilePart(deviceName);
  const safeScenario = toSafeFilePart(scenario);

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`responsive-shot-${safeDevice}-${safeScenario}`, {
    body: screenshot,
    contentType: 'image/png',
  });

  await testInfo.attach(`responsive-report-${safeDevice}-${safeScenario}`, {
    body: Buffer.from(JSON.stringify(report, null, 2), 'utf-8'),
    contentType: 'application/json',
  });

  if (report.totalIssues > 0) {
    testInfo.annotations.push({
      type: 'responsive-issues',
      description: `${report.totalIssues} issue(s) found for ${deviceName}`,
    });
  }

  if (failOnIssues && report.totalIssues > 0) {
    throw new Error(
      `Responsive audit found ${report.totalIssues} issue(s) for ${deviceName}. See attached JSON/screenshot in report.`
    );
  }

  return report;
}

module.exports = {
  collectResponsiveIssues,
  attachResponsiveAudit,
};
