import { NewsletterConfirmEmail } from "../src/templates/newsletter-confirm";
import { sample } from "./preview-data";

export default () => <NewsletterConfirmEmail confirmUrl={sample.newsletterConfirmUrl} />;
