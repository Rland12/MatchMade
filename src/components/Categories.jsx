// Categories.jsx
import { NavLink } from "react-router-dom";

const slugFor = (label) => {
  const s = label.toLowerCase();
  if (s === "home") return "/";
  return `/${s}`;
};

export default function Categories({ categories }) {
  return (
    <>
      {categories.map((label) => (
        <NavLink
          key={label}
          to={slugFor(label)}
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
