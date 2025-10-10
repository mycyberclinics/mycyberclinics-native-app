import  i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const resources = {
  en: {
    common: {
      continue: "Continue",
      signIn: "Sign In",
      headline: "Get Healthcare,\nWherever You Are",
      subtitle:
        "Licensed doctors and specialists are just a tap away, from the comfort of your home.",
    },
  },
  fr: {
    common: {
      continue: "Continuer",
      signIn: "Se connecter",
      headline: "Accédez aux soins,\noù que vous soyez",
      subtitle:
        "Des médecins et spécialistes agréés sont à portée de main, depuis chez vous.",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.getLocales()[0]?.languageTag ?? "en",
  fallbackLng: "en",
  ns: ["common"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
