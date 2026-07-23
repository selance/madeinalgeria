import { PasswordChangedEmail } from "../src/templates/password-changed";
import { sample } from "./preview-data";

export default () => (
  <PasswordChangedEmail
    username={sample.username}
    ipAddress="41.102.14.7"
    userAgent="Chrome على Windows"
  />
);
