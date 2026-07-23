import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Render a template to an email-ready HTML string.
 *
 * `react-dom/server` resolves to server.edge.js under the `workerd` condition,
 * which still exports the synchronous `renderToStaticMarkup` — so this runs
 * inside the Worker with no streams and no Node built-ins. (Guarded by
 * apps/api/test/email-render.test.ts, which renders every template in workerd.)
 *
 * We deliberately do NOT use @react-email/render: it pulls in html-to-text and a
 * pretty-printer for a plain-text fallback we already write by hand, in Arabic.
 */

/** Outlook (Word engine) is happiest with the XHTML transitional doctype. */
const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

export function renderEmail(element: ReactElement): string {
  return DOCTYPE + renderToStaticMarkup(element);
}
