import { DeleteAccountEmail } from "../src/templates/delete-account";
import { sample } from "./preview-data";

export default () => (
  <DeleteAccountEmail username={sample.username} confirmationUrl={sample.deleteUrl} />
);
