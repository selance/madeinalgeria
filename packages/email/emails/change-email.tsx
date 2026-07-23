import { ChangeEmailEmail } from "../src/templates/change-email";
import { sample } from "./preview-data";

export default () => (
  <ChangeEmailEmail
    username={sample.username}
    oldEmail="moncef@example.com"
    newEmail="moncef@madeinalgeria.dev"
    confirmUrl={sample.confirmEmailUrl}
  />
);
