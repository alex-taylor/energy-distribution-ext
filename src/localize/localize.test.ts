/**
 * @jest-environment jsdom
 */

import { AppearanceOptions } from "../config";
import { localize } from "./localize";

const KEY: string = "key";

test("returns fallback string when key not found", () => {
  const fallback: string = "fallback";
  expect(localize(KEY, fallback)).toBe(fallback);
})

test("returns key when no fallback or key found", () => {
  expect(localize(KEY)).toBe(KEY);
})

test("returns translated string", () => {
  localStorage.setItem("selectedLanguage", "en");
  expect(localize("common.unknown")).toBe("Unknown");
})

test("translates US English to UK English", () => {
  localStorage.setItem("selectedLanguage", "en_GB");
  expect(localize("AppearanceOptions." + AppearanceOptions.Use_HASS_Style)).toBe("Use HASS-style layout and colours");
})
