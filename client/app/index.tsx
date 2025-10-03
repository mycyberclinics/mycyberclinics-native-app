import React from 'react';
import { Provider } from 'react-redux';
import store from '../src/store';
import Homepage from '../src/pages/Homepage';

const Page: React.FC = () => {
  return (
    <Provider store={store}>
      <Homepage />
    </Provider>
  );
};

export default Page;