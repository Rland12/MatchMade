import { Link, useLocation } from "react-router-dom";

function Categories(props) {
  const location = useLocation();

  return (
    <div className="container">
          <ul className="nav d-flex justify-content-center">
            {props.categories.map((category) => {
              const isActive = location.pathname === `/${category}`;
              const className = isActive ? "category nav-link active" : "category nav-link";
              return (
                <li key={category} className="nav-item">
                <Link to={`/${category}`} className={className}>
                  {category}
                </Link>
              </li>
              );
            })}
          </ul>
    </div>
  );
}


export default Categories;
