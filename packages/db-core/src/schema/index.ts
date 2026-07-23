import { relations } from "drizzle-orm";
import { account, session, user } from "./auth";
import { profiles } from "./profiles";
import {
  categories,
  categoryTranslations,
  countries,
  countryTranslations,
  languages,
  states,
  stateTranslations,
} from "./reference";
import { invoices, paymentMethods, plans, subscriptions } from "./billing";
import { emailCampaigns, emailRecipients, emailTemplates } from "./email";
import { projects } from "./projects";

export * from "./auth";
export * from "./profiles";
export * from "./reference";
export * from "./billing";
export * from "./email";
export * from "./projects";

// Relations are intra-core only. Anything pointing at a catalog table
// (companies, suggestions) is an opaque id here — no cross-DB relations.

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profiles),
  subscriptions: many(subscriptions),
  paymentMethods: many(paymentMethods),
  invoices: many(invoices),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, { fields: [profiles.id], references: [user.id] }),
}));

export const languagesRelations = relations(languages, ({ many }) => ({
  countryTranslations: many(countryTranslations),
  stateTranslations: many(stateTranslations),
  categoryTranslations: many(categoryTranslations),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  translations: many(countryTranslations),
  states: many(states),
}));

export const countryTranslationsRelations = relations(countryTranslations, ({ one }) => ({
  country: one(countries, { fields: [countryTranslations.countryId], references: [countries.id] }),
  language: one(languages, { fields: [countryTranslations.languageId], references: [languages.id] }),
}));

export const statesRelations = relations(states, ({ one, many }) => ({
  country: one(countries, { fields: [states.countryId], references: [countries.id] }),
  translations: many(stateTranslations),
}));

export const stateTranslationsRelations = relations(stateTranslations, ({ one }) => ({
  state: one(states, { fields: [stateTranslations.stateId], references: [states.id] }),
  language: one(languages, { fields: [stateTranslations.languageId], references: [languages.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
}));

export const categoryTranslationsRelations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, { fields: [categoryTranslations.categoryId], references: [categories.id] }),
  language: one(languages, { fields: [categoryTranslations.languageId], references: [languages.id] }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(user, { fields: [subscriptions.userId], references: [user.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
  invoices: many(invoices),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(user, { fields: [paymentMethods.userId], references: [user.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(user, { fields: [invoices.userId], references: [user.id] }),
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ many }) => ({
  campaigns: many(emailCampaigns),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ one, many }) => ({
  template: one(emailTemplates, { fields: [emailCampaigns.templateId], references: [emailTemplates.id] }),
  recipients: many(emailRecipients),
}));

export const emailRecipientsRelations = relations(emailRecipients, ({ one }) => ({
  campaign: one(emailCampaigns, { fields: [emailRecipients.campaignId], references: [emailCampaigns.id] }),
}));
