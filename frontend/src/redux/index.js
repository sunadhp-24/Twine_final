import {
  configureStore,
  combineReducers,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  PURGE,
  PAUSE,
  REGISTER,
  REHYDRATE,
  PERSIST,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import UserSlice from "./UserSlice";

const persistConfig = { key: "root", storage, version: 1 };
const rootReducer = combineReducers({ user: UserSlice });
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [FLUSH, PURGE, PAUSE, REGISTER, REHYDRATE, PERSIST],
      },
    }),
});

export const persistor = persistStore(store);
