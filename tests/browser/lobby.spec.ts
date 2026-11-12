import { expect, test, type Page } from "@playwright/test";

async function createRoom(page: Page, touch: boolean) {
  const create = page.getByRole("button", { name: "Создать комнату" });
  if (touch) await create.tap();
  else await create.click();
  await expect(page.getByText("Локальная комната", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Я готов", exact: true })).toBeVisible();
  await expect(create).toHaveCount(0);
}

test("create room responds on loopback URL and survives reload", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/_next/") && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto("/lobby");
  await createRoom(page, !!isMobile);
  const roomCode = await page.evaluate(() => JSON.parse(localStorage.getItem("nash-rayon.frontend.v1")!).room.code);
  expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
  await expect(page.getByRole("button", { name: "Начать игру", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Я готов", exact: true }).click();
  await expect(page.getByRole("button", { name: "Начать игру", exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByText(roomCode, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Начать игру", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("room remains usable when browser storage is blocked", async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  await page.goto("/lobby");
  await createRoom(page, !!isMobile);
  await expect(page.getByText("Комната создана, но браузер запретил сохранение.", { exact: false })).toBeVisible();
});

test("create button waits for the client before accepting input", async ({ page, isMobile }) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
  await page.route("**/_next/**", async (route) => {
    if (route.request().resourceType() === "script") await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/lobby", { waitUntil: "commit" });
    await expect(page.getByRole("button", { name: "Создать комнату" })).toBeDisabled();
    await expect(page.getByText("Загружаем игру…", { exact: true })).toBeVisible();
  } finally {
    releaseScripts();
  }
  await createRoom(page, !!isMobile);
});
