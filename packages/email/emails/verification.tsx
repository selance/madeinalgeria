import { VerificationEmail } from "../src/templates/verification";
import { sample } from "./preview-data";

export default () => (
  <VerificationEmail username={sample.username} verificationUrl={sample.verificationUrl} />
);
