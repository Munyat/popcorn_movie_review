import { useState, useEffect } from "react";

export function useLocalStorage(initialState, key) {
  const [value, setValue] = useState(function () {
    const selected = localStorage.getItem(key);
    return selected ? JSON.parse(selected) : initialState;
  });

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(value));
    },
    [value, key]
  );
  return [value, setValue];
}
