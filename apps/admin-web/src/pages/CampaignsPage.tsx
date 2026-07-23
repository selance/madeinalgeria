import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateAr } from "@mia/core";
import { useToast } from "@mia/ui/components/toast";
import { Badge } from "@mia/ui/components/badge";
import { Button } from "@mia/ui/components/button";
import { Card } from "@mia/ui/components/card";
import { Input } from "@mia/ui/components/input";
import { Textarea } from "@mia/ui/components/textarea";
import { FieldRoot, Label } from "@mia/ui/components/label";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@mia/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@mia/ui/components/tabs";
import { PaginationControls } from "@mia/ui/components/pagination";
import { cn, buttonVariants } from "@mia/ui";
import { SearchBar } from "@/components/SearchBar";
import { paginateClientSide } from "@/lib/paginate";
import { useCampaignProgress, useNotifications, type CampaignRow } from "@/lib/hooks";

type Tab = "campaigns" | "templates";

const templateSchema = z.object({
  name: z.string().trim().min(1, "اسم القالب مطلوب"),
  subject: z.string().trim().min(1, "عنوان الرسالة مطلوب"),
  content: z.string().trim().min(1, "محتوى الرسالة مطلوب"),
});
type TemplateFormValues = z.infer<typeof templateSchema>;

const campaignSchema = z.object({
  name: z.string().trim().min(1, "اسم الحملة مطلوب"),
  templateId: z.string().min(1, "يجب اختيار القالب"),
  recipients: z.string().trim().min(1, "قائمة المستلمين مطلوبة"),
});
type CampaignFormValues = z.infer<typeof campaignSchema>;

/** List placeholder mirroring the campaign/template rows. */
function CampaignsListSkeleton() {
  return (
    <Card className="animate-pulse divide-y divide-neutral-100 p-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-neutral-200" />
            <div className="h-3 w-32 rounded bg-neutral-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 rounded-full bg-neutral-200" />
            <div className="h-8 w-16 rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </Card>
  );
}

const STATUS_OPTIONS: { value: CampaignRow["status"]; label: string }[] = [
  { value: "draft", label: "مسودة" },
  { value: "scheduled", label: "مجدولة" },
  { value: "sending", label: "قيد الإرسال" },
  { value: "sent", label: "أُرسلت" },
  { value: "failed", label: "فشلت" },
];

const statusBadge = (status: CampaignRow["status"]) =>
  status === "sent" ? (
    <Badge variant="success">أُرسلت</Badge>
  ) : status === "sending" ? (
    <Badge variant="info">قيد الإرسال</Badge>
  ) : status === "failed" ? (
    <Badge variant="error">فشلت</Badge>
  ) : status === "scheduled" ? (
    <Badge variant="warning">مجدولة</Badge>
  ) : (
    <Badge variant="soft">مسودة</Badge>
  );

function CampaignProgressLine({ campaign }: { campaign: CampaignRow }) {
  const { data: progress } = useCampaignProgress(campaign.id, campaign.status === "sending");
  if (!progress || campaign.status !== "sending") return null;
  return (
    <p className="text-xs text-neutral-500">
      {progress.sent} / {progress.total} أُرسلت · {progress.pending} متبقية
    </p>
  );
}

const CampaignsPage = () => {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CampaignRow["status"]>("");
  const [page, setPage] = useState(1);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);
  const campaignDialogRef = useRef<HTMLDivElement>(null);

  const toastManager = useToast();
  const notifications = useNotifications();

  const campaigns = notifications.campaigns.data ?? [];
  const templates = notifications.templates.data ?? [];

  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", subject: "", content: "" },
  });
  const campaignForm = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "", templateId: "", recipients: "" },
  });

  useEffect(() => {
    if (templateOpen) templateForm.reset({ name: "", subject: "", content: "" });
  }, [templateOpen, templateForm]);
  useEffect(() => {
    if (campaignOpen) campaignForm.reset({ name: "", templateId: "", recipients: "" });
  }, [campaignOpen, campaignForm]);

  const activeLoading =
    tab === "campaigns" ? notifications.campaigns.isLoading : notifications.templates.isLoading;

  const filteredCampaigns = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return campaigns.filter(
      (c) => (!q || c.name.toLowerCase().includes(q)) && (!statusFilter || c.status === statusFilter),
    );
  }, [campaigns, filter, statusFilter]);

  const filteredTemplates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q
      ? templates.filter((t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
      : templates;
  }, [templates, filter]);

  const campaignsPage = paginateClientSide(filteredCampaigns, page, 20);
  const templatesPage = paginateClientSide(filteredTemplates, page, 20);
  const activePagination = tab === "campaigns" ? campaignsPage.pagination : templatesPage.pagination;

  const resetTab = (next: Tab) => {
    setTab(next);
    setFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const createTemplate = async (values: TemplateFormValues) => {
    try {
      await notifications.createTemplate.mutateAsync({
        name: values.name.trim(),
        subject: values.subject.trim(),
        content: values.content.trim(),
      });
      toastManager.add({ title: "تم إنشاء القالب", type: "success" });
      setTemplateOpen(false);
    } catch {
      toastManager.add({ title: "فشل الإنشاء", type: "error" });
    }
  };

  const createCampaign = async (values: CampaignFormValues) => {
    const recipients = values.recipients
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      campaignForm.setError("recipients", { message: "قائمة المستلمين مطلوبة" });
      return;
    }
    try {
      await notifications.createCampaign.mutateAsync({
        name: values.name.trim(),
        templateId: Number(values.templateId),
        recipients,
      });
      toastManager.add({ title: "تم إنشاء الحملة كمسودة", type: "success" });
      setCampaignOpen(false);
    } catch {
      toastManager.add({ title: "فشل الإنشاء — تحقق من البريد الإلكتروني للمستلمين", type: "error" });
    }
  };

  const onSend = async () => {
    if (!sendTarget) return;
    try {
      await notifications.sendCampaign.mutateAsync(sendTarget.id);
      toastManager.add({ title: "بدأ الإرسال", type: "success" });
      setSendTarget(null);
    } catch {
      toastManager.add({ title: "فشل بدء الإرسال", type: "error" });
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Tabs value={tab} onValueChange={(value: string | null) => value && resetTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchBar
        value={filter}
        onValueChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        placeholder={tab === "campaigns" ? "ابحث عن حملة..." : "ابحث عن قالب..."}
        filters={
          tab === "campaigns" ? (
            <Select
              value={statusFilter}
              onValueChange={(value: string | null) => {
                setStatusFilter((value ?? "") as "" | CampaignRow["status"]);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "كل الحالات"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل الحالات</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
        actions={
          tab === "templates" ? (
            <Button size="sm" onClick={() => setTemplateOpen(true)}>
              إضافة قالب
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCampaignOpen(true)}>
              إنشاء حملة
            </Button>
          )
        }
      />

      {activeLoading && <CampaignsListSkeleton />}

      {!activeLoading && tab === "templates" && (
        <Card className="divide-y divide-neutral-100 p-0">
          {templatesPage.items.map((template) => (
            <div key={template.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-neutral-700">{template.name}</div>
                <div className="text-xs text-neutral-400">{template.subject}</div>
              </div>
              <Button
                size="sm"
                variant="error-solid"
                onClick={() =>
                  void notifications.deleteTemplate
                    .mutateAsync(template.id)
                    .then(() => toastManager.add({ title: "تم الحذف", type: "success" }))
                    .catch(() =>
                      toastManager.add({ title: "تعذر الحذف (قد يكون مستخدماً في حملة)", type: "error" }),
                    )
                }
              >
                حذف
              </Button>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <p className="p-8 text-center text-neutral-400">لا توجد قوالب — أنشئ قالباً أولاً</p>
          )}
        </Card>
      )}

      {!activeLoading && tab === "campaigns" && (
        <Card className="divide-y divide-neutral-100 p-0">
          {campaignsPage.items.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-neutral-700">{campaign.name}</div>
                <div className="text-xs text-neutral-400">
                  {formatDateAr(campaign.createdAt)} · قالب #{campaign.templateId}
                </div>
                <CampaignProgressLine campaign={campaign} />
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(campaign.status)}
                {campaign.status === "draft" && (
                  <Button size="sm" onClick={() => setSendTarget(campaign)}>
                    إرسال
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filteredCampaigns.length === 0 && (
            <p className="p-8 text-center text-neutral-400">لا توجد حملات</p>
          )}
        </Card>
      )}

      <PaginationControls pagination={activePagination} onPageChange={setPage} />

      {/* Send confirm */}
      <Dialog open={sendTarget !== null} onOpenChange={(open: boolean) => !open && setSendTarget(null)}>
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>إرسال الحملة</DialogTitle>
            <DialogDescription>
              سيتم إرسال "{sendTarget?.name}" لكل المستلمين. لا يمكن إيقافها بعد البدء.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
            <Button size="sm" disabled={notifications.sendCampaign.isPending} onClick={() => void onSend()}>
              {notifications.sendCampaign.isPending ? "جارٍ الإرسال..." : "تأكيد الإرسال"}
            </Button>
          </div>
        </DialogPopup>
      </Dialog>

      {/* Template create */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogPopup dir="rtl" className="sm:max-w-lg">
          <DialogHeader dir="rtl">
            <DialogTitle>إضافة قالب</DialogTitle>
            <DialogDescription>{"يدعم المتغيرين {{name}} و {{email}} لكل مستلم."}</DialogDescription>
          </DialogHeader>
          <form dir="rtl" onSubmit={templateForm.handleSubmit(createTemplate)} className="space-y-4 pt-2">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="tpl-name">اسم القالب *</Label>
              <Input
                id="tpl-name"
                placeholder="اسم القالب"
                data-invalid={templateForm.formState.errors.name}
                {...templateForm.register("name")}
              />
              {templateForm.formState.errors.name && (
                <p className="text-error-600 text-xs">{templateForm.formState.errors.name.message}</p>
              )}
            </FieldRoot>
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="tpl-subject">عنوان الرسالة *</Label>
              <Input
                id="tpl-subject"
                placeholder="عنوان الرسالة"
                data-invalid={templateForm.formState.errors.subject}
                {...templateForm.register("subject")}
              />
              {templateForm.formState.errors.subject && (
                <p className="text-error-600 text-xs">{templateForm.formState.errors.subject.message}</p>
              )}
            </FieldRoot>
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="tpl-content">محتوى HTML *</Label>
              <Textarea
                id="tpl-content"
                placeholder="محتوى HTML"
                className="min-h-[160px]"
                data-invalid={templateForm.formState.errors.content}
                {...templateForm.register("content")}
              />
              {templateForm.formState.errors.content && (
                <p className="text-error-600 text-xs">{templateForm.formState.errors.content.message}</p>
              )}
            </FieldRoot>
            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" disabled={notifications.createTemplate.isPending}>
                {notifications.createTemplate.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>

      {/* Campaign create */}
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogPopup ref={campaignDialogRef} dir="rtl" className="sm:max-w-lg">
          <DialogHeader dir="rtl">
            <DialogTitle>إنشاء حملة</DialogTitle>
          </DialogHeader>
          <form dir="rtl" onSubmit={campaignForm.handleSubmit(createCampaign)} className="space-y-4 pt-2">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="cmp-name">اسم الحملة *</Label>
              <Input
                id="cmp-name"
                placeholder="اسم الحملة"
                data-invalid={campaignForm.formState.errors.name}
                {...campaignForm.register("name")}
              />
              {campaignForm.formState.errors.name && (
                <p className="text-error-600 text-xs">{campaignForm.formState.errors.name.message}</p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label>القالب *</Label>
              <Select
                value={campaignForm.watch("templateId")}
                onValueChange={(value: string | null) => {
                  campaignForm.setValue("templateId", value ?? "");
                  campaignForm.trigger("templateId");
                }}
              >
                <SelectTrigger dir="rtl" data-invalid={campaignForm.formState.errors.templateId}>
                  <SelectValue>
                    {templates.find((t) => String(t.id) === campaignForm.watch("templateId"))?.name ?? "اختر القالب"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent container={campaignDialogRef}>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {campaignForm.formState.errors.templateId && (
                <p className="text-error-600 text-xs">{campaignForm.formState.errors.templateId.message}</p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="cmp-recipients">قائمة المستلمين — بريد في كل سطر *</Label>
              <Textarea
                id="cmp-recipients"
                placeholder="بريد في كل سطر"
                className="min-h-[120px]"
                dir="ltr"
                data-invalid={campaignForm.formState.errors.recipients}
                {...campaignForm.register("recipients")}
              />
              {campaignForm.formState.errors.recipients && (
                <p className="text-error-600 text-xs">{campaignForm.formState.errors.recipients.message}</p>
              )}
            </FieldRoot>

            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" disabled={notifications.createCampaign.isPending}>
                {notifications.createCampaign.isPending ? "جارٍ الإنشاء..." : "إنشاء كمسودة"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </section>
  );
};

export default CampaignsPage;
