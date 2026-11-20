import type { AppGlobalData } from './utils/app-state';

App({
  globalData: {
    searchKeyword: '',
    filterOptionsByCategory: {},
  } satisfies AppGlobalData,
});
