import { useState } from "react";
import { Link, useLocation, Routes, Route } from "react-router-dom";

  function Categories(props) {
    const location = useLocation();
  
    return (
      <div className="categories-container">
        {props.categories.map((category) => {
          const isActive = location.pathname === `/${category}`;
          const className = isActive ? "category active" : "category";
          return (
            <Link key={category} to={`/${category}`} className={className}>
              {category}
            </Link>
          );
        })}
      </div>
    );
  }
  

export default Categories;
