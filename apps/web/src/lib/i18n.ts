/**
 * Site i18n: English default (LTR) at the root, Arabic (RTL) under /ar.
 * Pages receive `locale` as an explicit prop from their route wrapper and pull
 * strings from these dictionaries, no runtime detection.
 */

export type Locale = "en" | "ar";

export const dirFor = (locale: Locale): "ltr" | "rtl" => (locale === "ar" ? "rtl" : "ltr");

/** Prefix a site-relative path for the locale ("/projects" → "/ar/projects"). */
export function localizePath(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  // `/ar${clean}` is "/ar" itself when clean is "", no fallback needed.
  return locale === "ar" ? `/ar${clean}` : clean || "/";
}

/** The same path in the other locale, powers the header language switcher. */
export function alternatePath(pathname: string, locale: Locale): string {
  const clean = pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  if (locale === "ar") {
    const stripped = clean.replace(/^\/ar(?=\/|$)/, "") || "/";
    return stripped;
  }
  return localizePath(clean, "ar");
}

export const ui = {
  en: {
    dir: "ltr",
    siteName: "Made in Algeria",
    tagline: "Open-source software by Algerian developers",
    nav: { projects: "Projects", about: "About", submit: "Submit a project", star: "Star" },
    switcher: { label: "العربية", aria: "التبديل إلى العربية" },
    home: {
      title: "Made in Algeria, open source by Algerian developers",
      description:
        "A curated directory of open-source projects built by Algerian developers. Discover, star, and contribute, or submit your own.",
      badge: "A curated open-source directory",
      heroTitle: "Open source,",
      heroTitleAccent: "made in Algeria",
      heroBody:
        "A living directory of open-source projects built by Algerian developers, from libraries and tools to full products. Discover them, use them, contribute to them.",
      howTitle: "How it works",
      howBody: "From a GitHub repo to the directory in three steps.",
      howSteps: [
        {
          title: "Discovered or submitted",
          body: "We scan GitHub for popular repos by Algerian developers, and anyone can submit one with a link.",
        },
        {
          title: "Reviewed by a human",
          body: "Every project is checked before it appears. Quality over quantity, no empty repos, no noise.",
        },
        {
          title: "Listed and kept fresh",
          body: "Stars, language, and activity sync from GitHub, so the directory reflects reality.",
        },
      ],
      browseCta: "Browse projects",
      submitCta: "Submit a project",
      featuredTitle: "Featured projects",
      featuredBody: "Hand-picked from the directory.",
      topTitle: "Most starred",
      topBody: "The community's most popular projects right now.",
      viewAll: "View all projects",
      statsProjects: "open-source projects",
      statsLanguages: "languages",
      statsStars: "GitHub stars combined",
      submitBandTitle: "Built something?",
      submitBandBody:
        "If you're an Algerian developer with a public repo you're proud of, add it to the directory, it takes a minute.",
      contribEyebrow: "Open source",
      contribTitle: "Built by the community, for the community",
      contribBody:
        "Made in Algeria is open source. Star the repo, open an issue, or send a pull request — help build the home of Algerian open source.",
      starCta: "Star on GitHub",
      contributorsWord: "contributors",
    },
    projects: {
      title: "Projects",
      description: "Browse open-source projects built by Algerian developers.",
      heading: "Projects",
      searchPlaceholder: "Search projects…",
      language: "Language",
      category: "Category",
      sort: "Sort",
      sortStars: "Most stars",
      sortRecent: "Recently active",
      sortName: "Name",
      allLanguages: "All languages",
      allCategories: "All categories",
      empty: "No projects match your filters.",
      resultCount: (n: number) => `${n.toLocaleString("en")} project${n === 1 ? "" : "s"}`,
      pagePrev: "Previous",
      pageNext: "Next",
      pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
      active: "Active",
      archived: "Archived",
      stars: "stars",
    },
    detail: {
      stars: "Stars",
      forks: "Forks",
      language: "Language",
      license: "License",
      topics: "Topics",
      website: "Website",
      viewOnGitHub: "View on GitHub",
      by: "by",
      backToProjects: "← All projects",
      lastPush: "Last push",
    },
    about: {
      title: "About",
      description: "What Made in Algeria is and how the directory works.",
      heading: "About Made in Algeria",
      missionTitle: "Why this exists",
      mission:
        "Algerian developers build great software, but it's scattered across GitHub with no single place to find it. Made in Algeria is a curated, open directory that puts that work in one place: to celebrate it, make it discoverable, and help contributors find projects from their own community.",
      howTitle: "How listing works",
      how: "Projects arrive in two ways: we actively discover popular public repositories by Algerian developers on GitHub, and anyone can submit a repo through the submit form. Every entry is reviewed by a human before it appears in the directory. Metadata (stars, language, activity) is synced from GitHub.",
      criteriaTitle: "What gets listed",
      criteria:
        "Public, non-fork repositories with real content, built by Algerian developers or teams, libraries, tools, apps, games, learning resources. Quality over quantity: profile READMEs, empty repos, and config dumps don't make the cut.",
      contactTitle: "Get in touch",
      contact: "Something wrong or missing? Reach us at",
    },
    submit: {
      title: "Submit a project",
      description: "Add an open-source project by an Algerian developer to the directory.",
      heading: "Submit a project",
      intro:
        "Know an open-source project built by an Algerian developer, yours or someone else's? Drop the GitHub link below. We'll fetch the details and review it before it goes live.",
      repoUrlLabel: "GitHub repository URL",
      repoUrlPlaceholder: "https://github.com/owner/repo",
      emailLabel: "Your email (optional)",
      emailHelp: "Only used if we need to ask about the submission.",
      notesLabel: "Notes (optional)",
      notesPlaceholder: "Anything the reviewers should know…",
      submit: "Submit for review",
      submitting: "Submitting…",
      successTitle: "Submitted!",
      successBody: "Thanks, the project is in the review queue and will appear once approved.",
      submitAnother: "Submit another project",
      errRequired: "The repository URL is required",
      errFormat: "Must be a GitHub repository URL (https://github.com/owner/repo)",
      errEmail: "Invalid email address",
      errConflict: "This repository is already in the directory or awaiting review.",
      errNotFound: "That repository was not found on GitHub (or it's private or a fork).",
      errRate: "Too many submissions, please try again in a minute.",
      errGeneric: "Something went wrong. Please try again.",
    },
    footer: {
      blurb:
        "A curated directory of open-source software built by Algerian developers.",
      linksTitle: "Explore",
      home: "Home",
      contactTitle: "Contact",
      newsletterTitle: "Newsletter",
      newsletterBody: "New projects in your inbox, occasionally.",
      rights: "All rights reserved.",
      builtBy: "Built by",
      privacy: "Privacy policy",
      terms: "Terms of use",
    },
    newsletter: {
      placeholder: "Your email address",
      button: "Subscribe",
      errRequired: "Email is required",
      errFormat: "Invalid email address",
      success: "Check your inbox to confirm your subscription.",
      already: "You're already subscribed.",
      error: "Subscription failed. Please try again.",
      errRate: "Too many attempts, try again shortly.",
    },
    notFound: {
      title: "Page not found",
      body: "The page you're looking for doesn't exist.",
      back: "Back to home",
    },
  },
  ar: {
    dir: "rtl",
    siteName: "صُنع في الجزائر",
    tagline: "برمجيات مفتوحة المصدر من مطوّرين جزائريين",
    nav: { projects: "المشاريع", about: "حول", submit: "أضف مشروعاً", star: "نجمة" },
    switcher: { label: "English", aria: "Switch to English" },
    home: {
      title: "صُنع في الجزائر، مصادر مفتوحة من مطوّرين جزائريين",
      description:
        "دليل منسّق لمشاريع مفتوحة المصدر بناها مطوّرون جزائريون. اكتشفها وساهم فيها، أو أضف مشروعك.",
      badge: "دليل منسّق للمصادر المفتوحة",
      heroTitle: "مصادر مفتوحة،",
      heroTitleAccent: "صُنعت في الجزائر",
      heroBody:
        "دليل حيّ لمشاريع مفتوحة المصدر بناها مطوّرون جزائريون، من المكتبات والأدوات إلى منتجات كاملة. اكتشفها، استعملها، وساهم فيها.",
      howTitle: "كيف يعمل الدليل؟",
      howBody: "من مستودع GitHub إلى الدليل في ثلاث خطوات.",
      howSteps: [
        {
          title: "اكتشاف أو إرسال",
          body: "نمسح GitHub بحثاً عن مستودعات شائعة لمطوّرين جزائريين، ويمكن لأي شخص إرسال مشروع برابط واحد.",
        },
        {
          title: "مراجعة بشرية",
          body: "كل مشروع يُفحص قبل ظهوره. الجودة قبل الكمية، لا مستودعات فارغة ولا ضجيج.",
        },
        {
          title: "إدراج وتحديث مستمر",
          body: "النجوم واللغة والنشاط تُزامن من GitHub، ليعكس الدليل الواقع دائماً.",
        },
      ],
      browseCta: "تصفّح المشاريع",
      submitCta: "أضف مشروعاً",
      featuredTitle: "مشاريع مختارة",
      featuredBody: "منتقاة يدوياً من الدليل.",
      topTitle: "الأكثر نجوماً",
      topBody: "أشهر مشاريع المجتمع حالياً.",
      viewAll: "عرض كل المشاريع",
      statsProjects: "مشروع مفتوح المصدر",
      statsLanguages: "لغة برمجة",
      statsStars: "نجمة GitHub مجتمعة",
      submitBandTitle: "بنيت شيئاً؟",
      submitBandBody:
        "إن كنت مطوّراً جزائرياً ولديك مستودع عام تفخر به، أضفه إلى الدليل، الأمر لا يستغرق دقيقة.",
      contribEyebrow: "مفتوح المصدر",
      contribTitle: "من المجتمع، ولأجل المجتمع",
      contribBody:
        "«صُنع في الجزائر» مفتوح المصدر. ضع نجمة على المستودع، أو افتح مشكلة، أو أرسل مساهمة — ساعدنا في بناء بيت المصادر المفتوحة الجزائرية.",
      starCta: "ضع نجمة على GitHub",
      contributorsWord: "مساهمون",
    },
    projects: {
      title: "المشاريع",
      description: "تصفّح مشاريع مفتوحة المصدر بناها مطوّرون جزائريون.",
      heading: "المشاريع",
      searchPlaceholder: "ابحث عن مشروع…",
      language: "اللغة",
      category: "التصنيف",
      sort: "الترتيب",
      sortStars: "الأكثر نجوماً",
      sortRecent: "الأحدث نشاطاً",
      sortName: "الاسم",
      allLanguages: "كل اللغات",
      allCategories: "كل التصنيفات",
      empty: "لا توجد مشاريع تطابق بحثك.",
      resultCount: (n: number) => `${n.toLocaleString("ar-DZ")} مشروع`,
      pagePrev: "السابق",
      pageNext: "التالي",
      pageOf: (page: number, total: number) => `صفحة ${page} من ${total}`,
      active: "نشِط",
      archived: "مؤرشف",
      stars: "نجمة",
    },
    detail: {
      stars: "النجوم",
      forks: "التفريعات",
      language: "اللغة",
      license: "الرخصة",
      topics: "المواضيع",
      website: "الموقع",
      viewOnGitHub: "عرض على GitHub",
      by: "بواسطة",
      backToProjects: "→ كل المشاريع",
      lastPush: "آخر تحديث",
    },
    about: {
      title: "حول",
      description: "ما هو «صُنع في الجزائر» وكيف يعمل الدليل.",
      heading: "حول «صُنع في الجزائر»",
      missionTitle: "لماذا هذا الدليل؟",
      mission:
        "يبني المطوّرون الجزائريون برمجيات رائعة، لكنها مبعثرة على GitHub دون مكان واحد يجمعها. «صُنع في الجزائر» دليل مفتوح ومنسّق يجمع هذا العمل في مكان واحد: للاحتفاء به، وتسهيل اكتشافه، ومساعدة المساهمين على إيجاد مشاريع من مجتمعهم.",
      howTitle: "كيف تُدرج المشاريع",
      how: "تصل المشاريع بطريقتين: نكتشف بأنفسنا المستودعات العامة الشائعة لمطوّرين جزائريين على GitHub، ويمكن لأي شخص إرسال مستودع عبر نموذج الإضافة. تُراجع كل إضافة بشرياً قبل ظهورها في الدليل، وتُزامن البيانات (النجوم، اللغة، النشاط) من GitHub.",
      criteriaTitle: "ما الذي يُقبل؟",
      criteria:
        "مستودعات عامة غير متفرّعة ذات محتوى حقيقي، بناها مطوّرون أو فرق جزائرية، مكتبات، أدوات، تطبيقات، ألعاب، وموارد تعليمية. الجودة قبل الكمية: ملفات التعريف والمستودعات الفارغة لا تُدرج.",
      contactTitle: "تواصل معنا",
      contact: "شيء خاطئ أو ناقص؟ راسلنا على",
    },
    submit: {
      title: "أضف مشروعاً",
      description: "أضف مشروعاً مفتوح المصدر لمطوّر جزائري إلى الدليل.",
      heading: "أضف مشروعاً",
      intro:
        "تعرف مشروعاً مفتوح المصدر بناه مطوّر جزائري، لك أو لغيرك؟ ضع رابط GitHub أدناه. سنجلب التفاصيل ونراجعه قبل نشره.",
      repoUrlLabel: "رابط المستودع على GitHub",
      repoUrlPlaceholder: "https://github.com/owner/repo",
      emailLabel: "بريدك الإلكتروني (اختياري)",
      emailHelp: "يُستعمل فقط إن احتجنا سؤالك عن الإضافة.",
      notesLabel: "ملاحظات (اختياري)",
      notesPlaceholder: "أي شيء يجب أن يعرفه المراجعون…",
      submit: "أرسل للمراجعة",
      submitting: "جارٍ الإرسال…",
      successTitle: "تم الإرسال!",
      successBody: "شكراً، المشروع في قائمة المراجعة وسيظهر بعد القبول.",
      submitAnother: "أضف مشروعاً آخر",
      errRequired: "رابط المستودع مطلوب",
      errFormat: "يجب أن يكون رابط مستودع GitHub‏ (https://github.com/owner/repo)",
      errEmail: "البريد الإلكتروني غير صحيح",
      errConflict: "هذا المستودع موجود في الدليل أو قيد المراجعة.",
      errNotFound: "لم يُعثر على المستودع في GitHub (أو أنه خاص أو متفرّع).",
      errRate: "محاولات كثيرة، أعد المحاولة بعد دقيقة.",
      errGeneric: "حدث خطأ ما. أعد المحاولة.",
    },
    footer: {
      blurb: "دليل منسّق لبرمجيات مفتوحة المصدر بناها مطوّرون جزائريون.",
      linksTitle: "استكشف",
      home: "الرئيسية",
      contactTitle: "تواصل معنا",
      newsletterTitle: "النشرة الإخبارية",
      newsletterBody: "مشاريع جديدة في بريدك، من حين لآخر.",
      rights: "جميع الحقوق محفوظة.",
      builtBy: "تطوير",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
    },
    newsletter: {
      placeholder: "بريدك الإلكتروني",
      button: "اشترك",
      errRequired: "البريد الإلكتروني مطلوب",
      errFormat: "البريد الإلكتروني غير صحيح",
      success: "تحقق من بريدك لتأكيد الاشتراك.",
      already: "أنت مشترك بالفعل.",
      error: "فشل الاشتراك. أعد المحاولة.",
      errRate: "محاولات كثيرة، حاول بعد قليل.",
    },
    notFound: {
      title: "الصفحة غير موجودة",
      body: "الصفحة التي تبحث عنها غير موجودة.",
      back: "العودة للرئيسية",
    },
  },
} as const;

export type Dict = (typeof ui)[Locale];
