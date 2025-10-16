import React, { useEffect } from 'react';
// import Splash from './splash';
import DoctorCredentials from '@/app/(auth)/signup/personalInfo';

export default function Index() {
  // useEffect(() => {
  //   console.log('✅ useEffect started');

  //   const testPlaces = async () => {
  //     console.log('✅ Fetching places...');
  //     const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  //     const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Lagos&key=${key}`;

  //     try {
  //       const res = await fetch(url);
  //       const data = await res.json();
  //       console.log('✅ Places API Response:', data);
  //     } catch (err) {
  //       console.log('❌ Error calling Places API:', err);
  //     }
  //   };

  //   testPlaces();
  // }, []);

  return <DoctorCredentials />;
  // return <Splash />;
}
