import React from "react";
import Header from "./Header";
import Calendar from "../components/Calendar";
import { useParams } from "react-router-dom";
const Journal = () => {
  const { relationshipId } = useParams();
  return (
    <div>
      <Header />
      <Calendar relationshipId={relationshipId} />
    </div>
  );
};
export default Journal;
