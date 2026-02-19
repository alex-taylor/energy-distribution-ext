import * as en from "./languages/en";

//================================================================================================================================================================================//

const LANGUAGES: Record<string, unknown> = {
  en
};

const DEFAULT_LANGUAGE: string = "en";

//================================================================================================================================================================================//

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split(".").reduce((o, i) => (o as Record<string, unknown>)[i], (LANGUAGES[lang] as any).default) as string;
  } catch {
    return undefined;
  }
}

//================================================================================================================================================================================//

export function localize(key: string, fallback: string | undefined = undefined): string {
  const lang: string = (localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE).replace(/['"]+/g, "").replace("-", "_");
  let translated: string | undefined = getTranslatedString(key, lang);

  if (!translated) {
    translated = getTranslatedString(key, DEFAULT_LANGUAGE);
  }

  if (typeof translated !== "string") {
    return fallback ?? key;
  }

  if (lang === "en_GB" && translated.replace) {
    translated = translated.replace("color", "colour");
    translated = translated.replace("Color", "Colour");
    translated = translated.replace("meter", "metre");
    translated = translated.replace("Liter", "Litre");
    translated = translated.replace("Initializing", "Initialising");
  }

  return translated ?? fallback ?? key;
}

//================================================================================================================================================================================//
