import { NewsletterWelcomeEmail } from "../src/templates/newsletter-welcome";
import { sample } from "./preview-data";

export default () => <NewsletterWelcomeEmail unsubscribeUrl={sample.unsubscribeUrl} />;
