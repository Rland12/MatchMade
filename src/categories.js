function Categories(props){
    return(
        <div className="categories-container">
            {props.categories.map(category =>{return (<button className="category">{category}</button>)})}
        </div>
    );
}

export default Categories;