export type SidePanelLaunchResult =
  { readonly ok: true } | { readonly ok: false; readonly message: string };

export async function openSoftSpokenSidePanel(): Promise<SidePanelLaunchResult> {
  try {
    const activeWindow = await browser.windows.getCurrent({
      populate: false,
      windowTypes: ["normal"],
    });

    if (activeWindow?.id === undefined) {
      return {
        ok: false,
        message: "SoftSpoken could not find a browser window.",
      };
    }

    await browser.sidePanel.open({ windowId: activeWindow.id });
    window.close();
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Chrome could not open the SoftSpoken side panel.",
    };
  }
}
