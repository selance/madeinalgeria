import { describe, expect, it } from "vitest";
import { NotificationsService } from "./service";
import { signEmail } from "./token";
import type { NotificationsRepo, SubscriberRow } from "./repo";
import type { Job } from "@mia/contracts";
import type { SendEmailInput } from "@mia/email";

// In-memory fake of the bits of NotificationsRepo the service touches.
function fakeRepo() {
  const templates = new Map<number, { id: number; subject: string; content: string }>();
  const campaigns = new Map<number, { id: number; templateId: number; status: string }>();
  const recipients: { id: number; campaignId: number; email: string; sent: boolean }[] = [];
  let tId = 0;
  let cId = 0;
  let rId = 0;

  const repo = {
    templateById: async (id: number) => templates.get(id),
    campaignById: async (id: number) => campaigns.get(id),
    createCampaign: async (input: { templateId: number; status: string }) => {
      const id = ++cId;
      campaigns.set(id, { id, templateId: input.templateId, status: input.status });
      return id;
    },
    setCampaignStatus: async (id: number, status: string) => {
      const c = campaigns.get(id);
      if (c) c.status = status;
    },
    addRecipients: async (campaignId: number, emails: string[]) => {
      for (const email of emails) recipients.push({ id: ++rId, campaignId, email, sent: false });
      return emails.length;
    },
    pendingBatch: async (campaignId: number, cursor: number, batchSize: number) =>
      recipients
        .filter((r) => r.campaignId === campaignId && !r.sent && r.id > cursor)
        .sort((a, b) => a.id - b.id)
        .slice(0, batchSize) as never,
    markSent: async (recipientId: number) => {
      const r = recipients.find((x) => x.id === recipientId);
      if (r) r.sent = true;
    },
    progress: async (campaignId: number) => {
      const rs = recipients.filter((r) => r.campaignId === campaignId);
      return { total: rs.length, sent: rs.filter((r) => r.sent).length };
    },
    blockedAddresses: async (emails: string[]) => new Set(emails.filter((e) => suppressed.has(e))),
    suppress: async (email: string) => void suppressed.add(email),
  };
  const suppressed = new Set<string>();
  return {
    repo: repo as unknown as NotificationsRepo,
    seedTemplate: (subject: string, content: string) => {
      const id = ++tId;
      templates.set(id, { id, subject, content });
      return id;
    },
    campaigns,
    recipients,
    suppressed,
  };
}

function collector() {
  const jobs: Job[] = [];
  const sent: SendEmailInput[] = [];
  return {
    queue: { enqueue: async (j: Job) => void jobs.push(j) },
    sender: { send: async (m: SendEmailInput) => void sent.push(m) },
    jobs,
    sent,
  };
}

/** Drain the campaign.dispatch chain synchronously (what the consumer does). */
async function drain(service: NotificationsService, jobs: Job[]) {
  let guard = 0;
  while (jobs.length && guard++ < 1000) {
    const job = jobs.shift()!;
    if (job.type === "campaign.dispatch") {
      await service.dispatchBatch(job.payload.campaignId, job.payload.cursor);
    }
  }
}

/** In-memory fake of the newsletter half of the repo. */
function fakeNewsletterRepo() {
  const rows = new Map<number, SubscriberRow>();
  let id = 0;

  const repo = {
    subscriberByEmail: async (email: string) => [...rows.values()].find((r) => r.email === email),
    subscriberByTokenHash: async (tokenHash: string) =>
      [...rows.values()].find((r) => r.tokenHash === tokenHash),
    insertSubscriber: async (input: {
      email: string;
      tokenHash: string;
      tokenExpiresAt: Date;
      source: string;
    }) => {
      const now = new Date();
      const row = {
        id: ++id,
        status: "pending",
        confirmedAt: null,
        unsubscribedAt: null,
        createdAt: now,
        updatedAt: now,
        ...input,
      } as SubscriberRow;
      rows.set(row.id, row);
      return row.id;
    },
    updateSubscriber: async (rowId: number, patch: Partial<SubscriberRow>) => {
      const row = rows.get(rowId);
      if (row) rows.set(rowId, { ...row, ...patch, updatedAt: new Date() });
    },
    suppress: async (email: string) => void suppressed.add(email),
    blockedAddresses: async (emails: string[]) =>
      new Set(
        emails.filter(
          (e) =>
            suppressed.has(e) ||
            [...rows.values()].some((r) => r.email === e && r.status === "unsubscribed"),
        ),
      ),
  };
  const suppressed = new Set<string>();
  return { repo: repo as unknown as NotificationsRepo, rows, suppressed };
}

/** The raw token as the subscriber receives it — pulled out of the emailed link. */
function tokenFromJob(job: Job): string {
  if (job.type !== "email.send") throw new Error(`expected email.send, got ${job.type}`);
  const match = /token=([a-f0-9]+)/.exec(job.payload.html);
  if (!match) throw new Error("no token in email body");
  return match[1]!;
}

const CONFIG = { webBaseUrl: "https://www.madeinalgeria.dev", unsubscribeSecret: "test-secret" };

describe("NotificationsService newsletter", () => {
  it("stores a new address as pending and emails a confirmation link", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    const result = await service.subscribeNewsletter("Reader@Example.com");

    expect(result.status).toBe("pending");
    const row = [...f.rows.values()][0]!;
    // Normalized, and not subscribed until the link is clicked.
    expect(row.email).toBe("reader@example.com");
    expect(row.status).toBe("pending");
    expect(c.jobs).toHaveLength(1);
    expect(c.jobs[0]!.type).toBe("email.send");
    expect(tokenFromJob(c.jobs[0]!)).toMatch(/^[a-f0-9]{64}$/);
    // The raw token is never stored.
    expect(row.tokenHash).not.toBe(tokenFromJob(c.jobs[0]!));
  });

  it("does not re-send a confirmation while the cooldown is open", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await service.subscribeNewsletter("reader@example.com");
    const result = await service.subscribeNewsletter("reader@example.com");

    expect(result.status).toBe("pending");
    expect(c.jobs).toHaveLength(1); // still just the first mail
  });

  it("re-sends with a fresh token once the cooldown has passed", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await service.subscribeNewsletter("reader@example.com");
    const firstToken = tokenFromJob(c.jobs[0]!);
    // Age the pending row past the 5-minute resend cooldown.
    const row = [...f.rows.values()][0]!;
    f.rows.set(row.id, { ...row, updatedAt: new Date(Date.now() - 10 * 60 * 1000) });

    await service.subscribeNewsletter("reader@example.com");

    expect(c.jobs).toHaveLength(2);
    expect(tokenFromJob(c.jobs[1]!)).not.toBe(firstToken);
  });

  it("reports an already-subscribed address without sending anything", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await service.subscribeNewsletter("reader@example.com");
    await service.confirmNewsletter(tokenFromJob(c.jobs[0]!));
    c.jobs.length = 0;

    const result = await service.subscribeNewsletter("READER@example.com");

    expect(result.status).toBe("subscribed");
    expect(c.jobs).toHaveLength(0);
  });

  it("confirms the opt-in and sends the welcome mail, idempotently", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await service.subscribeNewsletter("reader@example.com");
    const token = tokenFromJob(c.jobs[0]!);

    expect(await service.confirmNewsletter(token)).toEqual({ status: "subscribed" });
    const row = [...f.rows.values()][0]!;
    expect(row.status).toBe("subscribed");
    expect(row.confirmedAt).toBeInstanceOf(Date);
    expect(c.jobs).toHaveLength(2); // confirm + welcome

    // A second click (or a mail-client prefetch) is still a success, not an error.
    expect(await service.confirmNewsletter(token)).toEqual({ status: "subscribed" });
    expect(c.jobs).toHaveLength(2); // and does not re-send the welcome
  });

  it("rejects an unknown or expired confirmation token", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await expect(service.confirmNewsletter("deadbeef".repeat(8))).rejects.toThrow();

    await service.subscribeNewsletter("reader@example.com");
    const token = tokenFromJob(c.jobs[0]!);
    const row = [...f.rows.values()][0]!;
    f.rows.set(row.id, { ...row, tokenExpiresAt: new Date(Date.now() - 1000) });

    await expect(service.confirmNewsletter(token)).rejects.toThrow();
  });

  it("unsubscribes with the same token, even after it has expired", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    await service.subscribeNewsletter("reader@example.com");
    const token = tokenFromJob(c.jobs[0]!);
    await service.confirmNewsletter(token);
    // Unsubscribe links live on in delivered mail long past the confirm window.
    const row = [...f.rows.values()][0]!;
    f.rows.set(row.id, { ...row, tokenExpiresAt: new Date(Date.now() - 1000) });

    expect(await service.unsubscribeNewsletter(token)).toEqual({ status: "unsubscribed" });
    expect([...f.rows.values()][0]!.status).toBe("unsubscribed");

    // Coming back re-opens a pending opt-in rather than silently resurrecting.
    const result = await service.subscribeNewsletter("reader@example.com");
    expect(result.status).toBe("pending");
    expect([...f.rows.values()][0]!.status).toBe("pending");
  });

  it("unsubscribes a signed address — the only opt-out a campaign recipient has", async () => {
    const f = fakeNewsletterRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);

    // Nobody ever subscribed this address; an admin pasted it into a blast.
    const signature = await signEmail("cold@example.com", CONFIG.unsubscribeSecret);
    expect(await service.unsubscribeAddress("cold@example.com", signature)).toEqual({
      status: "unsubscribed",
    });
    expect(f.suppressed.has("cold@example.com")).toBe(true);

    // A forged signature must not let anyone opt someone else out.
    await expect(service.unsubscribeAddress("victim@example.com", signature)).rejects.toThrow();
  });
});

describe("NotificationsService campaigns", () => {
  it("creates a campaign with de-duplicated recipients and starts as draft", async () => {
    const f = fakeRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);
    const templateId = f.seedTemplate("Hi", "<p>Hello {{name}}</p>");

    const result = await service.createCampaign({
      name: "Launch",
      templateId,
      recipients: ["a@x.com", "b@x.com", "a@x.com"],
    });
    expect(result.recipients).toBe(2);
    expect(f.campaigns.get(result.campaignId)?.status).toBe("draft");
  });

  it("fans out via the queue and marks every recipient sent", async () => {
    const f = fakeRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);
    const templateId = f.seedTemplate("Promo", "<p>Hi {{name}} ({{email}})</p>");
    const emails = Array.from({ length: 45 }, (_, i) => `user${i}@x.com`);
    const { campaignId } = await service.createCampaign({ name: "Big", templateId, recipients: emails });

    await service.send(campaignId);
    await drain(service, c.jobs);

    expect(c.sent).toHaveLength(45);
    // {{name}} substituted from the local-part
    expect(c.sent[0]!.html).toContain("user0");
    const progress = await service.progress(campaignId);
    expect(progress).toMatchObject({ total: 45, sent: 45, pending: 0, status: "sent" });
  });

  it("wraps blasts in the branded shell with a text part and one-click unsubscribe", async () => {
    const f = fakeRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);
    const templateId = f.seedTemplate("عرض جديد", "<p>مرحباً {{name}}</p>");
    const { campaignId } = await service.createCampaign({
      name: "Blast",
      templateId,
      recipients: ["reader@x.com"],
    });

    await service.send(campaignId);
    await drain(service, c.jobs);

    const mail = c.sent[0]!;
    // The admin's HTML survives, but inside our layout — not raw as before.
    expect(mail.html).toContain("مرحباً reader");
    expect(mail.html).toContain("<!DOCTYPE");
    expect(mail.html).toContain("إلغاء الاشتراك");
    // Multipart, and the RFC 8058 headers Gmail/Yahoo demand of bulk senders.
    expect(mail.text).toContain("مرحباً reader");
    expect(mail.headers?.["List-Unsubscribe"]).toMatch(/^<https:\/\/www.madeinalgeria.dev\/newsletter\/unsubscribe\?e=/);
    expect(mail.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(mail.tags).toEqual([{ name: "category", value: "campaign" }]);
  });

  it("never mails an address that opted out, but still completes the campaign", async () => {
    const f = fakeRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);
    f.suppressed.add("gone@x.com");
    const templateId = f.seedTemplate("Promo", "<p>Hi {{name}}</p>");
    const { campaignId } = await service.createCampaign({
      name: "Respectful",
      templateId,
      recipients: ["here@x.com", "gone@x.com"],
    });

    await service.send(campaignId);
    await drain(service, c.jobs);

    expect(c.sent.map((m) => m.to)).toEqual(["here@x.com"]);
    // The suppressed row is marked sent so the run can finish, not left pending.
    const progress = await service.progress(campaignId);
    expect(progress).toMatchObject({ total: 2, sent: 2, status: "sent" });
  });

  it("refuses to send a campaign that is already sending", async () => {
    const f = fakeRepo();
    const c = collector();
    const service = new NotificationsService(f.repo, c.queue, c.sender, CONFIG);
    const templateId = f.seedTemplate("x", "y");
    const { campaignId } = await service.createCampaign({
      name: "Once",
      templateId,
      recipients: ["a@x.com"],
    });
    await service.send(campaignId);
    await expect(service.send(campaignId)).rejects.toThrow();
  });

  it("leaves failed recipients pending but still completes the run", async () => {
    const f = fakeRepo();
    const c = collector();
    let calls = 0;
    const flaky = {
      enqueue: c.queue.enqueue,
      // one send throws
    };
    const service = new NotificationsService(
      f.repo,
      flaky as never,
      {
        send: async () => {
          calls++;
          if (calls === 2) throw new Error("provider down");
        },
      } as never,
      CONFIG,
    );
    const templateId = f.seedTemplate("x", "y");
    const { campaignId } = await service.createCampaign({
      name: "Flaky",
      templateId,
      recipients: ["a@x.com", "b@x.com", "c@x.com"],
    });
    await service.send(campaignId);
    await drain(service, c.jobs);

    const progress = await service.progress(campaignId);
    expect(progress.status).toBe("sent");
    expect(progress.sent).toBe(2);
    expect(progress.pending).toBe(1); // the failed one is visible
  });
});
