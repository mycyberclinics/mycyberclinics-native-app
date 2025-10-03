import React from 'react';
import { Provider } from 'react-redux';
import store from '../src/store';
import Dashboard from '../src/pages/Dashboard';
import { useRouter } from 'expo-router';

const Page: React.FC = () => {
  const router = useRouter();
  return (
    <Provider store={store}>
      <Dashboard router={router} />
    </Provider>
  );
};

export default Page;