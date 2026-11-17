import { createContext, useContext } from 'react';
// Updating the autosave indicator must not rebuild every screen and player profile.
export const SaveStatusContext = createContext<string | undefined>(undefined);
export const useSaveStatus = (fallback: string) => useContext(SaveStatusContext) ?? fallback;
