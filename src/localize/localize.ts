import * as en from "./languages/en.json";

const LANGUAGES: Record<string, unknown> = {
  en
};

const DEFAULT_LANGUAGE = "en";

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split(".").reduce((o, i) => (o as Record<string, unknown>)[i], LANGUAGES[lang]) as string;
  } catch (_) {
    return undefined;
  }
}

export function localize(key: string, fallback: string | undefined = undefined): string {
  const lang: string = (localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE).replace(/['"]+/g, "").replace("-", "_");;
  let translated: string | undefined = getTranslatedString(key, lang);

  if (!translated) {
    translated = getTranslatedString(key, DEFAULT_LANGUAGE);
  }

  if (lang === "en_GB") {
    translated = translated?.replace("color", "colour");
    translated = translated?.replace("Color", "Colour");
    translated = translated?.replace("meter", "metre");
  }

  return translated ?? fallback ?? key;
}
