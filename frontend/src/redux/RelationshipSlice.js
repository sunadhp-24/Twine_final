import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  relationships: [],
  relationship: {},
};

const relationshipSlice = createSlice({
  name: "relationshipSlice",
  initialState,
  reducers: {
    setRelationships: (state, action) => {
      state.tasks = [...action.payload];
    },
    setRelationship: (state, action) => {
      state.task = action.payload;
    },
    deleteRelationship: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter((task) => task._id !== taskId);
    },
  },
});

export const { setRelationships, setRelationship, deleteRelationship } =
  relationshipSlice.actions;

export default relationshipSlice.reducer;
