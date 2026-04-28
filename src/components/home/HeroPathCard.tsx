"use client";

import { useTranslations } from "next-intl";

export function HeroPathCard() {
  const t = useTranslations("home.heroPathCard");

  const currentIssues = t.raw("currentIssues.items") as string[];

  return (
    <div className="hidden lg:flex flex-col justify-center items-center">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden max-w-sm mx-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {t("label")}
            </span>
          </div>
          <h3 className="text-[15px] font-bold text-foreground">
            {t("title")}
          </h3>
        </div>

        {/* Current Issues */}
        <div className="px-6 pb-4">
          <p className="text-sm font-medium text-slate-600 mb-2">
            {t("currentIssues.title")}
          </p>
          <ul className="space-y-1.5 bg-gray-50 rounded-lg border border-gray-100 px-4 py-3">
            {currentIssues.map((item, i) => (
              <li key={i} className="text-[13px] text-foreground leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Step */}
        <div className="px-6 pb-4">
          <div className="bg-[#EBF3FF] rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              {t("nextStep.title")}
            </p>
            <p className="text-[13px] text-blue-900 leading-relaxed">
              {t("nextStep.content")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-400 text-center border-t border-gray-100 pt-4">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
