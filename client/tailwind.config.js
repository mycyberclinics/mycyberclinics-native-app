/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        button: {
          buttonBG: '#10B981',
          buttonBGLight: '#059669',
          buttonBorderLight: '#047857',
          buttonDisabledBG: '#1F2937',
          buttonLight: '#D1D5DB',
          buttonSecondaryDark: '##D1FAE5',
          buttonSecondaryLight: '#D1FAE5',
          signInButtonBorderDark: '#34D399',
          signInButtonBorderLight: '#047857',
        },
        text: {
          accentDark: '#34D399',
          accentLight: '#047857',
          primaryDark: '#F5F5F5',
          primaryLight: '#111827',
          secondaryDark: '#9CA3AF',
          secondaryLight: '#4B5563',
          textInverse: '#111827',
          buttonSecondaryText: '#047857',
          buttonSecondaryTextLight: '#FFFFFF',
          secondaryTealBGDark: '#0F766E',
          secondaryTextDark: '#FFFFFF',
        },
        image: {
          imageBorder: '#FFFFFF',
          imageBG: '#D1FAE5',
        },
        gradient: {
          imageGradient: '#111827',
        },
        card: {
          cardBG: '#1F2937',
          cardShadow: '#6EE7B71A',
          cardBGLight: '#FFFFFF',
          cardBorder: '#F0F0F0',
        },
        misc: {
          emptyView1: '#6EE7B7',
          emptyView2: '#D1FAE5',
          borderColor: '#6EE7B7',
          arrowBorder: '#374151',
          placeholderTextDark: '#6B7280',
          placeHolderTextLight: '#9CA3AF',
        },
        boxShadow: {
          'green-soft': '0 4px 10px rgba(30, 210, 138, 0.1)',
        },
      },
    },
  },
  plugins: [],
};
