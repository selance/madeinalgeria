import { CampaignEmail } from "../src/templates/campaign-layout";
import { sample } from "./preview-data";

export default () => (
  <CampaignEmail
    contentHtml="<p>مرحباً {{name}}،</p><p>أضفنا هذا الأسبوع أكثر من 400 شركة جديدة إلى دليل صُنع في الجزائر، وحسّنّا البحث بالولاية والنشاط.</p>"
    unsubscribeUrl={sample.unsubscribeUrl}
    preview="أكثر من 400 شركة جديدة على صُنع في الجزائر هذا الأسبوع"
  />
);
