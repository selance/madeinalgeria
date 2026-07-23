import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator } from "@mia/ui/components/tabs";
import { Accordion, AccordionItem, AccordionTrigger, Panel } from "@mia/ui/components/accordion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mia/ui/components/breadcrumb";
import { PaginationControls } from "@mia/ui/components/pagination";
import { SectionShell } from "./SectionShell";

const TOTAL_PAGES = 12;
const LIMIT = 20;

export function NavigationSection() {
  const [page, setPage] = useState(1);

  return (
    <SectionShell
      id="navigation"
      title="التنقل والتبويب — Navigation"
      subtitle="Tabs, Accordion, Breadcrumb & PaginationControls"
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div>
          <code className="mb-3 block text-[11px] text-neutral-400" dir="ltr">
            Breadcrumb
          </code>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="text-neutral-500">
                  الرئيسية
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="text-neutral-500">
                  الحساب
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-neutral-800">الإعدادات</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Tabs */}
        <div>
          <code className="mb-3 block text-[11px] text-neutral-400" dir="ltr">
            Tabs
          </code>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsIndicator />
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="activity">النشاط</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-neutral-600">
              محتوى تبويب النظرة العامة.
            </TabsContent>
            <TabsContent value="activity" className="text-sm text-neutral-600">
              محتوى تبويب النشاط.
            </TabsContent>
            <TabsContent value="settings" className="text-sm text-neutral-600">
              محتوى تبويب الإعدادات.
            </TabsContent>
          </Tabs>
        </div>

        {/* Accordion */}
        <div>
          <code className="mb-3 block text-[11px] text-neutral-400" dir="ltr">
            Accordion
          </code>
          <Accordion.Root className="w-full max-w-lg">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-neutral-700">ما هي هذه القالب؟</AccordionTrigger>
              <Panel className="text-neutral-600">
                قالب SaaS جاهز يشمل نظام تصميم عربي كامل من اليمين إلى اليسار.
              </Panel>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-neutral-700">كيف أغيّر الهوية البصرية؟</AccordionTrigger>
              <Panel className="text-neutral-600">
                عدّل الرموز في ملف config.css ثم راجع هذه الصفحة لرؤية النتيجة.
              </Panel>
            </AccordionItem>
          </Accordion.Root>
        </div>

        {/* Pagination */}
        <div>
          <code className="mb-3 block text-[11px] text-neutral-400" dir="ltr">
            PaginationControls (12 pages)
          </code>
          <PaginationControls
            pagination={{
              page,
              limit: LIMIT,
              total_count: TOTAL_PAGES * LIMIT,
              total_pages: TOTAL_PAGES,
            }}
            onPageChange={setPage}
          />
        </div>
      </div>
    </SectionShell>
  );
}
