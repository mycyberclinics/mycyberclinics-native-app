export interface DemoState {
  defaultField: string;
}

const initialState: DemoState = {
  defaultField: ''
};

export interface UpdateDefaultFieldAction {
  type: 'UPDATE_DEFAULT_FIELD';
  payload: string;
}

type DemoAction = UpdateDefaultFieldAction;

export default function demoReducer(
  state: DemoState = initialState,
  action: DemoAction
): DemoState {
  switch (action.type) {
    case 'UPDATE_DEFAULT_FIELD':
      return { ...state, defaultField: action.payload };
    default:
      return state;
  }
}

// Actions
export const updateDefaultField = (value: string): UpdateDefaultFieldAction => ({
  type: 'UPDATE_DEFAULT_FIELD',
  payload: value
});