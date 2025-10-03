import React from 'react';
import { Provider } from 'react-redux';
import store from '../src/store';
import Settings from '../src/pages/Settings';

const Page: React.FC = () => (
  <Provider store={store}>
    <Settings />
  </Provider>
);

export default Page;