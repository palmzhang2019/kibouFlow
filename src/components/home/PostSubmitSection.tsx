import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";
import { Card } from "@/components/shared/Card";

const stepIcons = [
  <svg key="0" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>,
  <svg key="1" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>,
  <svg key="2" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.021 12.021 0 0116.5 3.75" />
  </svg>,
  <svg key="3" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
];

export function PostSubmitSection() {
  const t = useTranslations("home.postSubmit");

  const steps = [0, 1, 2, 3].map((i) => ({
    label: t(`steps.${i}.label`),
    desc: t(`steps.${i}.desc`),
  }));

  const cards = [0, 1, 2, 3].map((i) => ({
    title: t(`cards.${i}.title`),
    content: t(`cards.${i}.content`),
  }));

  return (
    <Section bg="muted">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("title")}</h2>
      <p className="mt-4 text-muted text-center max-w-xl mx-auto leading-relaxed">{t("subtitle")}</p>

      {/* Steps */}
      <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-center gap-6 md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4 md:gap-0">
            <div className="flex flex-col items-center text-center min-w-[120px]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                {i + 1}
              </div>
              <p className="mt-3 text-sm font-semibold leading-tight max-w-[140px]">
                {step.label}
              </p>
              <p className="mt-1 text-xs text-muted leading-tight max-w-[140px] hidden sm:block">
                {step.desc}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block text-gray-300 mx-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Example cards */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {cards.map((card, i) => (
          <Card key={i} className="p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{stepIcons[i]}</div>
              <div>
                <h3 className="font-semibold text-sm">{card.title}</h3>
                <p className="mt-2 text-xs text-muted whitespace-pre-line">{card.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
