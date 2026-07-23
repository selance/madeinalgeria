import { Link } from "react-router";
import { Card } from "@mia/ui/components/card";
import TwoPeopleIcon from "@mia/ui/icons/TwoPeopleIcon";
import SubscriptionIcon from "@mia/ui/icons/SubscriptionIcon";
import EmailIcon from "@mia/ui/icons/EmailIcon";
import ThreadIcon from "@mia/ui/icons/ThreadIcon";
import DatabaseIcon from "@mia/ui/icons/DatabaseIcon";

interface QuickLink {
  title: string;
  description: string;
  url: string;
  renderIcon: () => React.ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: "المستخدمون",
    description: "إدارة الحسابات والصلاحيات والحظر",
    url: "/users",
    renderIcon: () => <TwoPeopleIcon className="size-5 fill-primary-500" />,
  },
  {
    title: "الفوترة",
    description: "الخطط والاشتراكات والفواتير",
    url: "/billing",
    renderIcon: () => <SubscriptionIcon className="size-5 fill-primary-500" />,
  },
  {
    title: "النشرة البريدية",
    description: "متابعة المشتركين وحالات التأكيد",
    url: "/newsletter",
    renderIcon: () => <EmailIcon className="size-5 fill-primary-500" />,
  },
  {
    title: "الحملات",
    description: "إنشاء القوالب وإرسال الحملات البريدية",
    url: "/campaigns",
    renderIcon: () => <ThreadIcon className="size-5 fill-primary-500" />,
  },
  {
    title: "البيانات المرجعية",
    description: "اللغات والدول والولايات والفئات",
    url: "/reference",
    renderIcon: () => <DatabaseIcon className="size-5 fill-primary-500" />,
  },
];

const DashboardPage = () => {
  return (
    <section dir="rtl" className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Card className="flex flex-col gap-2 p-6">
        <h2 className="text-2xl font-semibold text-neutral-700">مرحباً بك في لوحة إدارة صُنع في الجزائر</h2>
        <p className="text-neutral-500">
          من هنا يمكنك إدارة المستخدمين والفوترة والنشرة البريدية والحملات والبيانات المرجعية.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.url} to={link.url}>
            <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <span className="bg-primary-50 flex size-10 items-center justify-center rounded-lg">
                  {link.renderIcon()}
                </span>
                <h3 className="font-semibold text-neutral-700">{link.title}</h3>
              </div>
              <p className="text-sm text-neutral-500">{link.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DashboardPage;
