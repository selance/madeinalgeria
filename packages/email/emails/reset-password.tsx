import { ResetPasswordEmail } from "../src/templates/reset-password";
import { sample } from "./preview-data";

export default () => <ResetPasswordEmail username={sample.username} resetUrl={sample.resetUrl} />;
