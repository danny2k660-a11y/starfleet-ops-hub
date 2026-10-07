import { test, expect } from "@playwright/test";

const routes = [
  "/dashboard",
  "/characters",
  "/ships",
  "/builds",
  "/inventory",
  "/equipment",
  "/traits",
  "/bridge-officers",
  "/ground-builds",
  "/projects",
  "/resources",
  "/ship-database",
  "/ship-planner",
  "/themes",
  "/settings",
];

test.describe("STO Command Center smoke suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (error) => {
      throw new Error("Unhandled page error: " + error.message);
    });
  });

  test("all primary routes render without a blank page or runtime error", async ({ page }) => {
    for (const route of routes) {
      const errors = [];
      const handler = (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        // The app intentionally uses anonymous Supabase auth. CI has no
        // guarantee that the hosted Auth endpoint is reachable, so ignore
        // only that known external-auth failure; all other console errors
        // remain test failures.
        if (/Guest session failed: AuthRetryableFetchError|status of 530|HTTP 530/.test(text)) return;
        errors.push(text);
      };
      page.on("console", handler);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.locator("body")).toContainText(/.+/);
      expect(errors, `console errors on ${route}`).toEqual([]);
      page.off("console", handler);
    }
  });


  test("navigating the primary app is never destructive", async ({ page }) => {
    const deletes = [];
    page.on("request", (request) => {
      if (request.method().toUpperCase() === "DELETE") {
        deletes.push(request.url());
      }
    });

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toBeEmpty();
    }

    expect(deletes, "normal navigation must never issue DELETE requests").toEqual([]);
  });

  test("opening and closing a character is read-only", async ({ page }) => {
    const mutations = [];
    page.on("request", (request) => {
      if (/^(POST|PUT|PATCH|DELETE)$/i.test(request.method())) {
        mutations.push({ method: request.method(), url: request.url() });
      }
    });

    await page.goto("/characters", { waitUntil: "networkidle" });
    const cards = page.locator("button.panel");
    const count = await cards.count();

    test.skip(count === 0, "No character records are available in this environment.");

    const before = mutations.length;
    await cards.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const cancel = page.getByRole("button", { name: "Cancel", exact: true });
    await cancel.click();
    await expect(page.getByRole("dialog")).toBeHidden();

    expect(mutations.slice(before), "opening/closing a character must not write to Supabase").toEqual([]);
  });

  test("mobile viewport does not auto-zoom on character controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/characters", { waitUntil: "networkidle" });

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=device-width");
    expect(viewport).toContain("user-scalable=no");

    const fontSizes = await page.locator("input, select, textarea, button").evaluateAll(
      (els) => els.map((el) => Number.parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite)
    );
    expect(fontSizes.every((size) => size >= 16)).toBeTruthy();
  });
});
