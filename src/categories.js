import { Link, useLocation } from "react-router-dom";

function Categories(props) {
  const location = useLocation();

  return (
    <div className="container">
          <ul className="list-unstyled d-flex justify-content-center">
            {props.categories.map((category) => {
              const isActive = location.pathname === `/${category}`;
              const className = isActive ? "category active" : "category";
              return (
                <li key={category}>
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
