// Categories.jsx
import { NavLink,useSearchParams } from "react-router-dom";

const slugFor = (label) => {
  const s = label.toLowerCase();
  if (s === "home") return "/";
  return `/${s}`;
};

export default function Categories({ categories }) {
  const [searchParams] = useSearchParams();

  // build a search string that drops the seasonal + page params
  const baseParams = new URLSearchParams(searchParams);
  baseParams.delete("holiday");
  baseParams.delete("page");
  baseParams.delete("p");
  const baseSearch = baseParams.toString();
  const search = baseSearch ? `?${baseSearch}` : "";

  return (
    <>
      {categories.map((label) => (
        <NavLink
          key={label}
          to={slugFor(label) + search}
          end={label.toLowerCase() === "home"}
          className={({ isActive }) =>
            "nav-link category" + (isActive ? " active" : "")
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );
}
