import { test, expect } from "@playwright/test";

const routes = [
  "/dashboard", "/characters", "/ships", "/builds", "/inventory",
  "/equipment", "/traits", "/bridge-officers", "/ground-builds",
  "/projects", "/resources", "/ship-database", "/ship-planner",
  "/themes", "/settings",
];

const destructive = /delete|remove|destroy|reset|wipe|logout|sign out|clear all|discard|revoke/i;
const submitLike = /save|submit|create|add character|add ship|assign|claim|purchase|buy|confirm|apply|sync/i;

const authNoise = (message) =>
  /Guest session failed: AuthRetryableFetchError|status of 530|HTTP 530/.test(message);

async function closeTransientUi(page) {
  const dialogs = page.getByRole("dialog");
  if (await dialogs.count()) {
    const close = page.getByRole("button", { name: /^(close|cancel|done|back)$/i }).last();
    if (await close.isVisible().catch(() => false)) {
      await close.click({ timeout: 1500 }).catch(() => {});
    } else {
      await page.keyboard.press("Escape").catch(() => {});
    }
  }
}

test.describe("STO Command Center exhaustive safe interaction audit", () => {
  test.setTimeout(120000);

  for (const route of routes) {
    test(`${route}: interactive controls respond without runtime/network failures`, async ({ page }) => {
      const failures = [];
      const pageErrors = [];
      const consoleErrors = [];

      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (msg) => {
        if (msg.type() === "error" && !authNoise(msg.text())) consoleErrors.push(msg.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 500 && !authNoise(response.statusText())) {
          failures.push(`HTTP ${response.status()} ${response.url()}`);
        }
      });

      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("body")).not.toBeEmpty();

      const buttons = page.getByRole("button");
      const count = await buttons.count();
      const labels = [];

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (!(await button.isVisible().catch(() => false))) continue;

        const label =
          ((await button.innerText().catch(() => "")) ||
            (await button.getAttribute("aria-label").catch(() => "")) ||
            "").trim();

        labels.push(label || `button[${i}]`);
        if (destructive.test(label) || submitLike.test(label)) continue;

        await button.click({ timeout: 3000 }).catch((error) => {
          failures.push(`BUTTON "${label}" on ${route}: ${error.message}`);
        });
        await closeTransientUi(page);
      }

      const links = page.getByRole("link");
      const linkCount = await links.count();
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        if (!(await link.isVisible().catch(() => false))) continue;
        const href = await link.getAttribute("href").catch(() => null);
        if (!href || !href.startsWith("/")) continue;

        await link.click({ timeout: 3000 }).catch((error) => {
          failures.push(`LINK "${href}" on ${route}: ${error.message}`);
        });
        await expect(page.locator("body")).not.toBeEmpty().catch(() => {
          failures.push(`LINK "${href}" on ${route} produced a blank page`);
        });
        await page.goto(route, { waitUntil: "domcontentloaded" }).catch((error) => {
          failures.push(`RETURN TO ${route}: ${error.message}`);
        });
      }

      expect(pageErrors, `runtime errors on ${route}`).toEqual([]);
      expect(consoleErrors, `console errors on ${route}`).toEqual([]);
      expect(failures, `interaction failures on ${route}; controls: ${labels.join(" | ")}`).toEqual([]);
    });
  }

  test("interactive inventory is visible for the whole app", async ({ page }) => {
    const inventory = [];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const items = await page.locator(
        "button, a, input, select, textarea, [role='tab'], [role='switch'], [role='checkbox'], [role='combobox']"
      ).evaluateAll((els) =>
        els.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).map((el) => ({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute("role"),
          text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "")
            .trim()
            .slice(0, 120),
        }))
      );

      inventory.push({ route, count: items.length, items });
    }

    for (const entry of inventory) {
      expect(entry.count, `no interactive controls found on ${entry.route}`).toBeGreaterThan(0);
    }
  });
});
