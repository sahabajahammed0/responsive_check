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
const OVERLAY_ID = '__responsive_audit_overlay__';

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

function expectedResultByIssueType(type) {
  switch (type) {
    case 'out_of_viewport':
      return 'Expected: Element should be fully visible within the viewport.';
    case 'not_visible':
      return 'Expected: Element should be visible (displayed with non-zero size).';
    case 'tap_target_too_small':
      return 'Expected: Interactive element should be at least minimum tap size.';
    case 'possibly_overlapped':
      return 'Expected: Element should not be covered by another element.';
    default:
      return 'Expected: Element should render clearly and remain usable.';
  }
}

function buildMarkdownSummary(report, contextLabel) {
  const rows = report.issues.map((issue, index) => {
    const x = Number.isFinite(issue.rect?.x) ? issue.rect.x.toFixed(1) : 'n/a';
    const y = Number.isFinite(issue.rect?.y) ? issue.rect.y.toFixed(1) : 'n/a';
    const w = Number.isFinite(issue.rect?.width) ? issue.rect.width.toFixed(1) : 'n/a';
    const h = Number.isFinite(issue.rect?.height) ? issue.rect.height.toFixed(1) : 'n/a';
    return [
      `${index + 1}.`,
      `Type: ${issue.type}`,
      `Element: ${issue.label}`,
      `Rect: (${x}, ${y}, ${w}, ${h})`,
      `Detail: ${issue.detail}`,
      expectedResultByIssueType(issue.type),
    ].join(' ');
  });

  return [
    `# Responsive Audit Summary (${contextLabel})`,
    '',
    `Viewport: ${report.viewport.width}x${report.viewport.height}`,
    `Checked Elements: ${report.totalElementsChecked}`,
    `Total Issues: ${report.totalIssues}`,
    '',
    rows.length > 0 ? rows.join('\n') : 'No responsive issues detected.',
    '',
  ].join('\n');
}

async function renderIssueOverlay(page, issues, options = {}) {
  const { maxAnnotations = 12 } = options;
  const clippedIssues = issues
    .filter((issue) => issue && issue.rect && Number.isFinite(issue.rect.x) && Number.isFinite(issue.rect.y))
    .slice(0, maxAnnotations);

  if (clippedIssues.length === 0) return;

  await page.evaluate(
    ({ clippedIssues, overlayId }) => {
      const existing = document.getElementById(overlayId);
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '2147483647';
      overlay.style.fontFamily = 'Arial, sans-serif';

      const expectedFor = (type) => {
        if (type === 'out_of_viewport') return 'Expected: fully inside viewport';
        if (type === 'not_visible') return 'Expected: clearly visible';
        if (type === 'tap_target_too_small') return 'Expected: tap area >= minimum size';
        if (type === 'possibly_overlapped') return 'Expected: not overlapped';
        return 'Expected: stable and clear';
      };

      for (const issue of clippedIssues) {
        const rect = issue.rect || {};
        const x = Number(rect.x) || 0;
        const y = Number(rect.y) || 0;
        const width = Math.max(24, Number(rect.width) || 0);
        const height = Math.max(24, Number(rect.height) || 0);

        const circle = document.createElement('div');
        circle.style.position = 'absolute';
        circle.style.left = `${Math.max(0, x - 4)}px`;
        circle.style.top = `${Math.max(0, y - 4)}px`;
        circle.style.width = `${width + 8}px`;
        circle.style.height = `${height + 8}px`;
        circle.style.border = '3px solid #ff1f1f';
        circle.style.borderRadius = '999px';
        circle.style.boxSizing = 'border-box';
        circle.style.background = 'rgba(255, 31, 31, 0.08)';

        const label = document.createElement('div');
        label.textContent = `${issue.type}: ${expectedFor(issue.type)}`;
        label.style.position = 'absolute';
        label.style.left = `${Math.max(0, x)}px`;
        label.style.top = `${Math.max(0, y - 24)}px`;
        label.style.maxWidth = '60vw';
        label.style.padding = '2px 6px';
        label.style.background = 'rgba(255, 255, 255, 0.92)';
        label.style.color = '#b80000';
        label.style.fontSize = '11px';
        label.style.fontWeight = '700';
        label.style.border = '1px solid #ff1f1f';
        label.style.borderRadius = '4px';
        label.style.boxSizing = 'border-box';

        overlay.appendChild(circle);
        overlay.appendChild(label);
      }

      document.body.appendChild(overlay);
    },
    { clippedIssues, overlayId: OVERLAY_ID }
  );
}

async function clearIssueOverlay(page) {
  await page.evaluate((overlayId) => {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
  }, OVERLAY_ID);
}

async function attachResponsiveAudit(page, testInfo, options = {}) {
  const {
    deviceName = 'unknown-device',
    scenario = 'responsive-audit',
    failOnIssues = process.env.RESPONSIVE_AUDIT_FAIL_ON_ISSUES === 'true',
    maxAnnotations = 12,
  } = options;

  const report = await collectResponsiveIssues(page, options);
  const safeDevice = toSafeFilePart(deviceName);
  const safeScenario = toSafeFilePart(scenario);

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`responsive-shot-raw-${safeDevice}-${safeScenario}`, {
    body: screenshot,
    contentType: 'image/png',
  });

  if (report.totalIssues > 0) {
    await renderIssueOverlay(page, report.issues, { maxAnnotations });
    const annotatedShot = await page.screenshot({ fullPage: false });
    await clearIssueOverlay(page);

    await testInfo.attach(`responsive-shot-annotated-${safeDevice}-${safeScenario}`, {
      body: annotatedShot,
      contentType: 'image/png',
    });
  }

  await testInfo.attach(`responsive-report-${safeDevice}-${safeScenario}`, {
    body: Buffer.from(JSON.stringify(report, null, 2), 'utf-8'),
    contentType: 'application/json',
  });

  const markdownSummary = buildMarkdownSummary(report, `${deviceName} | ${scenario}`);
  await testInfo.attach(`responsive-summary-${safeDevice}-${safeScenario}`, {
    body: Buffer.from(markdownSummary, 'utf-8'),
    contentType: 'text/markdown',
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
